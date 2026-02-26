import { auth } from "@community/lib-server/auth";
import {
	buildOrderExpiration,
	cancelEventOrder,
	generateEventOrderNo,
	generateOrderInviteCode,
	resolveTicketPricing,
	redeemOrderInvite,
	listOrderInvites,
	markEventOrderPaid,
} from "@community/lib-server/events/event-orders";
import { db } from "@community/lib-server/database/prisma/client";
import { canManageEvent } from "@/features/permissions/events";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
	createWechatJsapiOrder,
	createWechatNativeOrder,
	buildWechatJsapiParams,
	requestWechatRefund,
	queryWechatOrderStatus,
} from "@community/lib-server/payments/provider/wechatpay";

const isWechatBrowser = (userAgent?: string | null) =>
	!!userAgent && /MicroMessenger/i.test(userAgent);

const registerAnswersSchema = z
	.array(
		z.object({
			questionId: z.string(),
			answer: z.string(),
		}),
	)
	.default([]);

const createOrderSchema = z.object({
	ticketTypeId: z.string(),
	quantity: z.number().int().min(1).default(1),
	inviteCode: z.string().optional(),
	projectId: z.string().optional(),
	allowDigitalCardDisplay: z.boolean().optional(),
	answers: registerAnswersSchema,
});

const redeemInviteSchema = z.object({
	projectId: z.string().optional(),
	allowDigitalCardDisplay: z.boolean().optional(),
	answers: registerAnswersSchema,
});

const refundSchema = z.object({
	reason: z.string().min(1, "退款原因不能为空"),
	amount: z.number().min(0).optional(),
});

const app = new Hono();

const buildOrderResponse = (
	order: {
		id: string;
		orderNo: string;
		totalAmount: number;
		expiredAt: Date;
		codeUrl: string | null;
		prepayId: string | null;
		paymentMethod: string | null;
		quantity: number;
	},
	isExisting = false,
) => {
	const jsapiParams =
		order.paymentMethod === "WECHAT_JSAPI" && order.prepayId
			? buildWechatJsapiParams(order.prepayId)
			: undefined;

	return {
		orderId: order.id,
		orderNo: order.orderNo,
		totalAmount: order.totalAmount,
		expiredAt: order.expiredAt.toISOString(),
		codeUrl: order.codeUrl ?? undefined,
		jsapiParams,
		quantity: order.quantity,
		...(isExisting ? { isExisting: true } : {}),
	};
};

const ensureEventAvailableForRegistration = async (eventId: string) => {
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: {
			id: true,
			title: true,
			status: true,
			type: true,
			registrationOpen: true,
			registrationDeadline: true,
			isExternalEvent: true,
			requireApproval: true,
			requireProjectSubmission: true,
			maxAttendees: true,
		},
	});

	if (!event) {
		throw new Error("活动不存在");
	}

	if (event.status !== "PUBLISHED") {
		throw new Error("活动暂未开放报名");
	}

	if (event.type === "HACKATHON" && !event.registrationOpen) {
		throw new Error("报名已截止");
	}

	if (event.registrationDeadline && new Date() > event.registrationDeadline) {
		throw new Error("报名已截止");
	}

	if (event.isExternalEvent) {
		throw new Error("外部活动请前往官方平台报名");
	}

	return event;
};

app.get("/:eventId/orders/pending", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const now = new Date();

		// 先清理过期订单
		const expiredOrders = await db.eventOrder.findMany({
			where: {
				eventId,
				userId: session.user.id,
				status: "PENDING",
				expiredAt: { lte: now },
			},
			select: { id: true },
		});

		for (const expiredOrder of expiredOrders) {
			await cancelEventOrder(expiredOrder.id, "EXPIRED");
		}

		// 查询未过期的待支付订单
		const pendingOrder = await db.eventOrder.findFirst({
			where: {
				eventId,
				userId: session.user.id,
				status: "PENDING",
				expiredAt: { gt: now },
			},
			select: {
				id: true,
				orderNo: true,
				totalAmount: true,
				expiredAt: true,
				codeUrl: true,
				prepayId: true,
				paymentMethod: true,
				quantity: true,
			},
			orderBy: { createdAt: "desc" },
		});

		if (!pendingOrder) {
			return c.json({ success: true, data: null });
		}

		return c.json({
			success: true,
			data: buildOrderResponse(pendingOrder, true),
		});
	} catch (error) {
		console.error("Error fetching pending order:", error);
		return c.json({ success: false, error: "获取待支付订单失败" }, 500);
	}
});

app.post(
	"/:eventId/orders",
	zValidator("json", createOrderSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{ success: false, error: "Authentication required" },
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const {
				ticketTypeId,
				quantity,
				inviteCode,
				projectId,
				allowDigitalCardDisplay,
				answers,
			} = c.req.valid("json");

			const now = new Date();
			const existingPendingOrder = await db.eventOrder.findFirst({
				where: {
					eventId,
					userId: session.user.id,
					status: "PENDING",
					expiredAt: { gt: now },
				},
				select: {
					id: true,
					orderNo: true,
					totalAmount: true,
					expiredAt: true,
					codeUrl: true,
					prepayId: true,
					paymentMethod: true,
					quantity: true,
				},
				orderBy: { createdAt: "desc" },
			});

			if (existingPendingOrder) {
				return c.json({
					success: true,
					data: buildOrderResponse(existingPendingOrder, true),
				});
			}

			const expiredPendingOrder = await db.eventOrder.findFirst({
				where: {
					eventId,
					userId: session.user.id,
					status: "PENDING",
					expiredAt: { lte: now },
				},
				select: { id: true },
				orderBy: { createdAt: "desc" },
			});

			if (expiredPendingOrder) {
				await cancelEventOrder(expiredPendingOrder.id, "EXPIRED");
			}

			const event = await ensureEventAvailableForRegistration(eventId);

			if (projectId) {
				const project = await db.project.findUnique({
					where: {
						id: projectId,
						userId: session.user.id,
					},
				});

				if (!project) {
					return c.json(
						{
							success: false,
							error: "Project not found or you don't have permission",
						},
						400,
					);
				}
			}

			const inviteCodeCandidate = inviteCode?.trim();
			let inviteId: string | undefined;
			if (inviteCodeCandidate) {
				const invite = await db.eventInvite.findFirst({
					where: {
						eventId,
						code: inviteCodeCandidate,
					},
				});
				if (invite) {
					inviteId = invite.id;
				}
			}

			const userAgent = c.req.header("user-agent");
			const useJsapi = isWechatBrowser(userAgent);

			const user = await db.user.findUnique({
				where: { id: session.user.id },
				select: {
					id: true,
					name: true,
					email: true,
					wechatOpenId: true,
				},
			});

			if (!user) {
				return c.json({ success: false, error: "用户不存在" }, 404);
			}

			if (useJsapi && !user.wechatOpenId) {
				return c.json(
					{
						success: false,
						error: "未绑定微信 OpenID，无法使用 JSAPI 支付",
						code: "WECHAT_OPENID_REQUIRED",
					},
					400,
				);
			}

			const orderNo = generateEventOrderNo();
			const expiredAt = buildOrderExpiration();

			const { order, registration, pricing } = await db.$transaction(
				async (tx) => {
					const ticketType = await tx.eventTicketType.findFirst({
						where: {
							id: ticketTypeId,
							eventId,
							isActive: true,
						},
						include: {
							priceTiers: {
								where: { isActive: true },
								orderBy: { quantity: "asc" },
							},
						},
					});

					if (!ticketType) {
						throw new Error("票种不存在或已下架");
					}

					const existingRegistration =
						await tx.eventRegistration.findUnique({
							where: {
								eventId_userId: {
									eventId,
									userId: user.id,
								},
							},
							select: { id: true, status: true },
						});

					if (
						existingRegistration &&
						existingRegistration.status !== "CANCELLED"
					) {
						throw new Error("你已报名该活动。");
					}

					const pricing = resolveTicketPricing({
						basePrice: ticketType.price,
						priceTiers: ticketType.priceTiers,
						quantity,
					});

					if (pricing.totalAmount <= 0) {
						throw new Error("免费票无需支付，请直接报名");
					}

					const hasTicketLimit =
						typeof ticketType.maxQuantity === "number";
					if (
						hasTicketLimit &&
						ticketType.currentQuantity + quantity >
							ticketType.maxQuantity!
					) {
						throw new Error("库存不足");
					}

					if (event.maxAttendees) {
						const totalQuantity =
							await tx.eventTicketType.aggregate({
								where: { eventId },
								_sum: { currentQuantity: true },
							});

						const currentTotal =
							totalQuantity._sum.currentQuantity ?? 0;
						if (currentTotal + quantity > event.maxAttendees) {
							throw new Error("活动报名名额已满");
						}
					}

					if (hasTicketLimit) {
						const updated = await tx.eventTicketType.updateMany({
							where: {
								id: ticketType.id,
								currentQuantity: {
									lte: ticketType.maxQuantity! - quantity,
								},
							},
							data: {
								currentQuantity: { increment: quantity },
							},
						});

						if (updated.count === 0) {
							throw new Error("库存不足");
						}
					} else {
						await tx.eventTicketType.update({
							where: { id: ticketType.id },
							data: {
								currentQuantity: { increment: quantity },
							},
						});
					}

					const order = await tx.eventOrder.create({
						data: {
							orderNo,
							eventId,
							userId: user.id,
							ticketTypeId: ticketType.id,
							quantity,
							unitPrice: pricing.unitPrice,
							totalAmount: pricing.totalAmount,
							currency: pricing.currency,
							expiredAt,
							paymentMethod: useJsapi
								? "WECHAT_JSAPI"
								: "WECHAT_NATIVE",
						},
					});

					let registration;
					if (existingRegistration) {
						await tx.eventAnswer.deleteMany({
							where: { registrationId: existingRegistration.id },
						});

						registration = await tx.eventRegistration.update({
							where: { id: existingRegistration.id },
							data: {
								eventId,
								userId: user.id,
								status: "PENDING_PAYMENT",
								ticketTypeId: ticketType.id,
								orderId: order.id,
								orderInviteId: null,
								inviteId,
								allowDigitalCardDisplay,
								reviewedAt: null,
								reviewedBy: null,
								reviewNote: null,
								registeredAt: new Date(),
							},
						});
					} else {
						registration = await tx.eventRegistration.create({
							data: {
								eventId,
								userId: user.id,
								status: "PENDING_PAYMENT",
								ticketTypeId: ticketType.id,
								orderId: order.id,
								inviteId,
								allowDigitalCardDisplay,
							},
						});
					}

					if (answers.length > 0) {
						await tx.eventAnswer.createMany({
							data: answers.map((answer) => ({
								questionId: answer.questionId,
								answer: answer.answer,
								userId: user.id,
								eventId,
								registrationId: registration.id,
							})),
						});
					}

					if (quantity > 1) {
						await tx.eventOrderInvite.createMany({
							data: Array.from({ length: quantity - 1 }, () => ({
								orderId: order.id,
								code: generateOrderInviteCode(),
							})),
						});
					}

					if (inviteId) {
						await tx.eventInvite.update({
							where: { id: inviteId },
							data: { lastUsedAt: new Date() },
						});
					}

					return { order, registration, pricing };
				},
			);

			const amountInCents = Math.round(pricing.totalAmount * 100);
			const description = `${event.title} 门票`;

			const paymentResult = useJsapi
				? await createWechatJsapiOrder({
						outTradeNo: order.orderNo,
						description,
						amount: amountInCents,
						payerOpenId: user.wechatOpenId!,
					})
				: await createWechatNativeOrder({
						outTradeNo: order.orderNo,
						description,
						amount: amountInCents,
					});

			if (!paymentResult) {
				await cancelEventOrder(order.id);
				return c.json(
					{
						success: false,
						error: "微信支付订单创建失败",
					},
					500,
				);
			}

			const codeUrl =
				"codeUrl" in paymentResult ? paymentResult.codeUrl : null;
			const updatedOrder = await db.eventOrder.update({
				where: { id: order.id },
				data: {
					prepayId: paymentResult.prepayId,
					codeUrl,
				},
				select: {
					id: true,
					orderNo: true,
					totalAmount: true,
					expiredAt: true,
					codeUrl: true,
					prepayId: true,
					paymentMethod: true,
					quantity: true,
				},
			});

			return c.json({
				success: true,
				data: buildOrderResponse(updatedOrder),
			});
		} catch (error: any) {
			console.error("Error creating event order:", error);
			return c.json(
				{
					success: false,
					error: error.message || "创建订单失败",
				},
				500,
			);
		}
	},
);

app.get("/:eventId/orders/:orderId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const orderId = c.req.param("orderId");

		const order = await db.eventOrder.findFirst({
			where: { id: orderId, eventId },
			include: {
				registrations: true,
			},
		});

		if (!order || order.userId !== session.user.id) {
			return c.json({ success: false, error: "订单不存在" }, 404);
		}

		const registration = order.registrations.find(
			(item) => item.userId === session.user.id,
		);

		return c.json({
			success: true,
			data: {
				id: order.id,
				orderNo: order.orderNo,
				status: order.status,
				totalAmount: order.totalAmount,
				paidAt: order.paidAt?.toISOString(),
				expiredAt: order.expiredAt.toISOString(),
				registration,
			},
		});
	} catch (error) {
		console.error("Error fetching order status:", error);
		return c.json({ success: false, error: "查询订单失败" }, 500);
	}
});

app.post("/:eventId/orders/:orderId/query", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const { eventId, orderId } = c.req.param();

		const order = await db.eventOrder.findFirst({
			where: { id: orderId, eventId, userId: session.user.id },
			select: {
				id: true,
				status: true,
				orderNo: true,
				transactionId: true,
			},
		});

		if (!order) {
			return c.json({ success: false, error: "订单不存在" }, 404);
		}

		if (order.status !== "PENDING") {
			return c.json({
				success: true,
				data: { status: order.status, alreadyProcessed: true },
			});
		}

		const wechatStatus = await queryWechatOrderStatus(order.orderNo);

		if (wechatStatus.tradeState === "SUCCESS") {
			const updated = await markEventOrderPaid({
				orderNo: order.orderNo,
				transactionId:
					wechatStatus.transactionId ||
					order.transactionId ||
					`MANUAL-${Date.now()}`,
				paidAt: wechatStatus.successTime
					? new Date(wechatStatus.successTime)
					: new Date(),
			});
			const registrationStatus =
				updated && "registrationStatus" in updated
					? (updated as any).registrationStatus
					: undefined;

			return c.json({
				success: true,
				data: {
					status: "PAID",
					registrationStatus,
				},
			});
		}

		return c.json({
			success: true,
			data: {
				status: order.status,
				wechatStatus: wechatStatus.tradeState,
				wechatStatusDesc: wechatStatus.tradeStateDesc,
			},
		});
	} catch (error) {
		console.error("Error querying order status:", error);
		return c.json({ success: false, error: "查询订单失败" }, 500);
	}
});

app.get("/:eventId/orders", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");

		const orders = await db.eventOrder.findMany({
			where: { eventId, userId: session.user.id },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				orderNo: true,
				status: true,
				totalAmount: true,
				createdAt: true,
				paidAt: true,
				expiredAt: true,
				quantity: true,
			},
		});

		return c.json({ success: true, data: orders });
	} catch (error) {
		console.error("Error fetching orders:", error);
		return c.json({ success: false, error: "获取订单失败" }, 500);
	}
});

app.post("/:eventId/orders/:orderId/cancel", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const orderId = c.req.param("orderId");

		const order = await db.eventOrder.findFirst({
			where: { id: orderId, eventId },
			select: { id: true, userId: true, status: true },
		});

		if (!order || order.userId !== session.user.id) {
			return c.json({ success: false, error: "订单不存在" }, 404);
		}

		if (order.status !== "PENDING") {
			return c.json({ success: false, error: "订单状态无法取消" }, 400);
		}

		await cancelEventOrder(order.id, "USER_CANCELLED");

		return c.json({ success: true });
	} catch (error) {
		console.error("Error cancelling order:", error);
		return c.json({ success: false, error: "取消订单失败" }, 500);
	}
});

app.post("/:eventId/orders/:orderId/mark-paid", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const orderId = c.req.param("orderId");

		const hasPermission = await canManageEvent(eventId, session.user.id);
		if (!hasPermission) {
			return c.json({ success: false, error: "没有权限" }, 403);
		}

		const order = await db.eventOrder.findFirst({
			where: { id: orderId, eventId },
			select: { id: true, status: true, orderNo: true },
		});

		if (!order) {
			return c.json({ success: false, error: "订单不存在" }, 404);
		}

		if (order.status !== "PENDING") {
			return c.json({
				success: true,
				data: { status: order.status, alreadyProcessed: true },
			});
		}

		const updated = await markEventOrderPaid({
			orderNo: order.orderNo,
			transactionId: `MANUAL-${nanoid(12)}`,
			paidAt: new Date(),
		});
		const registrationStatus =
			updated && "registrationStatus" in updated
				? (updated as any).registrationStatus
				: undefined;

		return c.json({
			success: true,
			data: {
				status: "PAID",
				registrationStatus,
			},
		});
	} catch (error) {
		console.error("Error marking order paid:", error);
		return c.json({ success: false, error: "标记订单失败" }, 500);
	}
});

app.post(
	"/:eventId/orders/:orderId/refund",
	zValidator("json", refundSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{ success: false, error: "Authentication required" },
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const orderId = c.req.param("orderId");
			const { reason, amount } = c.req.valid("json");

			const hasPermission = await canManageEvent(
				eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json({ success: false, error: "没有权限" }, 403);
			}

			const order = await db.eventOrder.findFirst({
				where: { id: orderId, eventId },
			});

			if (!order) {
				return c.json({ success: false, error: "订单不存在" }, 404);
			}

			if (order.status !== "PAID") {
				return c.json(
					{ success: false, error: "订单状态不允许退款" },
					400,
				);
			}

			const refundAmount = amount ?? order.totalAmount;
			if (refundAmount <= 0 || refundAmount > order.totalAmount) {
				return c.json({ success: false, error: "退款金额无效" }, 400);
			}

			const refundResult = await requestWechatRefund({
				outTradeNo: order.orderNo,
				refundAmount: Math.round(refundAmount * 100),
				totalAmount: Math.round(order.totalAmount * 100),
				reason,
			});

			await db.eventOrder.update({
				where: { id: order.id },
				data: {
					status: "REFUND_PENDING",
					refundAmount,
					refundReason: reason,
					refundedBy: session.user.id,
					refundId: refundResult.refundId,
				},
			});

			return c.json({ success: true });
		} catch (error: any) {
			console.error("Error refunding order:", error);
			return c.json(
				{ success: false, error: error.message || "退款失败" },
				500,
			);
		}
	},
);

app.get("/:eventId/orders/:orderId/invites", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, error: "Authentication required" },
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const orderId = c.req.param("orderId");

		const order = await db.eventOrder.findFirst({
			where: { id: orderId, eventId },
			select: { id: true, userId: true },
		});

		if (!order || order.userId !== session.user.id) {
			return c.json({ success: false, error: "订单不存在" }, 404);
		}

		const invites = await listOrderInvites(order.id);

		return c.json({ success: true, data: invites });
	} catch (error) {
		console.error("Error fetching order invites:", error);
		return c.json({ success: false, error: "获取邀请链接失败" }, 500);
	}
});

app.post(
	"/:eventId/orders/invites/:code/redeem",
	zValidator("json", redeemInviteSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{ success: false, error: "Authentication required" },
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const code = c.req.param("code");
			const { projectId, allowDigitalCardDisplay, answers } =
				c.req.valid("json");

			const event = await db.event.findUnique({
				where: { id: eventId },
				select: {
					id: true,
					requireProjectSubmission: true,
				},
			});

			if (!event) {
				return c.json({ success: false, error: "活动不存在" }, 404);
			}

			if (projectId) {
				const project = await db.project.findUnique({
					where: {
						id: projectId,
						userId: session.user.id,
					},
				});

				if (!project) {
					return c.json(
						{
							success: false,
							error: "Project not found or you don't have permission",
						},
						400,
					);
				}
			}

			const registration = await redeemOrderInvite({
				eventId,
				code,
				userId: session.user.id,
				allowDigitalCardDisplay,
				answers,
			});

			if (projectId && event.requireProjectSubmission) {
				const existingSubmission =
					await db.eventProjectSubmission.findUnique({
						where: {
							eventId_projectId: {
								eventId,
								projectId,
							},
						},
					});

				if (!existingSubmission) {
					const project = await db.project.findUnique({
						where: { id: projectId },
						select: { title: true, description: true },
					});

					if (project) {
						await db.eventProjectSubmission.create({
							data: {
								eventId,
								projectId,
								userId: session.user.id,
								submissionType: "DEMO_PROJECT",
								title: project.title,
								description:
									project.description || "作品注册提交",
								status: "SUBMITTED",
								projectSnapshot: {},
							},
						});
					}
				}
			}

			return c.json({ success: true, data: registration });
		} catch (error: any) {
			console.error("Error redeeming invite:", error);
			return c.json(
				{ success: false, error: error.message || "兑换失败" },
				500,
			);
		}
	},
);

export default app;
