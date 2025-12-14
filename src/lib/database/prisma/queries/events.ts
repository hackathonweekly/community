import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import { db } from "@/lib/database";
import type {
	EventStatus,
	EventType,
	RegistrationStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getPublicStorageUrl } from "@/lib/storage";
// Event queries
export async function createEvent(data: {
	title: string;
	richContent: string;
	shortDescription?: string;
	organizerId: string;
	type: EventType;
	startTime: Date;
	endTime: Date;
	isOnline: boolean;
	address?: string;
	organizationId?: string;
	onlineUrl?: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	maxAttendees?: number;
	registrationDeadline?: Date;
	requireApproval: boolean;
	coverImage?: string;
	tags: string[];
	featured?: boolean;
	status?: EventStatus; // 新增 status 参数
	registrationSuccessInfo?: string;
	registrationSuccessImage?: string;
	registrationPendingInfo?: string;
	registrationPendingImage?: string;
	questions?: {
		id?: string;
		question: string;
		description?: string;
		type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "RADIO";
		required: boolean;
		options?: string[];
		order?: number;
	}[];
	ticketTypes?: {
		name: string;
		description?: string;
		price?: number | null;
		maxQuantity?: number | null;
		isActive?: boolean;
		sortOrder?: number;
	}[];
	volunteerRoles?: {
		volunteerRoleId: string;
		recruitCount: number;
		description?: string;
		requireApproval?: boolean;
	}[];
	volunteerContactInfo?: string;
	volunteerWechatQrCode?: string;
	organizerContact?: string;
	// Building Public 特定字段
	minCheckIns?: number;
	depositAmount?: number;
	refundRate?: number;
	paymentType?: string;
	paymentUrl?: string;
	paymentQRCode?: string;
	paymentNote?: string;
	// 作品关联设置
	requireProjectSubmission?: boolean;
	// 数字名片公开确认
	askDigitalCardConsent?: boolean;
	// Hackathon 配置
	hackathonConfig?: Prisma.InputJsonValue;
	// Hackathon 控制开关
	registrationOpen?: boolean;
	submissionsOpen?: boolean;
	votingOpen?: boolean;
	// Registration field config
	registrationFieldConfig?: Prisma.InputJsonValue;
	// Submission form config
	submissionFormConfig?: Prisma.InputJsonValue | null;
}) {
	const {
		questions,
		ticketTypes,
		volunteerRoles,
		status = "PUBLISHED",
		minCheckIns,
		depositAmount,
		refundRate,
		paymentType,
		paymentUrl,
		paymentQRCode,
		paymentNote,
		requireProjectSubmission,
		askDigitalCardConsent,
		registrationSuccessInfo,
		registrationSuccessImage,
		registrationPendingInfo,
		registrationPendingImage,
		hackathonConfig,
		registrationOpen,
		submissionsOpen,
		votingOpen,
		registrationFieldConfig,
		submissionFormConfig,
		...eventData
	} = data; // 默认为 PUBLISHED，但可以被覆盖

	const hackathonControls =
		eventData.type === "HACKATHON"
			? {
					submissionsOpen: submissionsOpen ?? true,
					votingOpen: votingOpen ?? true,
				}
			: {
					submissionsOpen: submissionsOpen ?? false,
					votingOpen: votingOpen ?? false,
				};

	const createdEvent = await db.event.create({
		data: {
			...eventData,
			status,
			requireProjectSubmission,
			askDigitalCardConsent,
			registrationSuccessInfo,
			registrationSuccessImage,
			registrationPendingInfo,
			registrationPendingImage,
			hackathonConfig,
			registrationFieldConfig,
			submissionFormConfig,
			// 默认开启黑客松提交流程与投票（可在管理页关闭）
			registrationOpen: registrationOpen ?? true,
			submissionsOpen: hackathonControls.submissionsOpen,
			votingOpen: hackathonControls.votingOpen,
			questions: questions
				? {
						create: questions.map((q, index) => ({
							question: q.question,
							description: q.description,
							type: q.type,
							required: q.required,
							options: q.options || [],
							order: q.order ?? index,
						})),
					}
				: undefined,
			ticketTypes: ticketTypes
				? {
						create: ticketTypes.map((t, index) => ({
							name: t.name,
							description: t.description,
							price: t.price,
							maxQuantity: t.maxQuantity,
							isActive: t.isActive ?? true,
							sortOrder: t.sortOrder ?? index,
						})),
					}
				: undefined,
			volunteerRoles: volunteerRoles?.length
				? {
						create: volunteerRoles
							// 去重：同一个活动中不能有重复的志愿者角色
							.filter(
								(vr, index, arr) =>
									arr.findIndex(
										(item) =>
											item.volunteerRoleId ===
											vr.volunteerRoleId,
									) === index,
							)
							.map((vr) => ({
								volunteerRoleId: vr.volunteerRoleId,
								recruitCount: vr.recruitCount,
								description: vr.description,
								requireApproval: vr.requireApproval ?? true,
							})),
					}
				: undefined,
			// 如果是 Building Public 类型，创建对应的配置
			buildingConfig:
				eventData.type === "BUILDING_PUBLIC"
					? {
							create: {
								duration: 21, // 固定21天，但实际以活动开始结束时间为准
								requiredCheckIns: minCheckIns || 7,
								depositAmount: depositAmount || 0,
								refundRate: refundRate || 0.8,
								paymentType: paymentType || "NONE",
								paymentUrl: paymentUrl || null,
								paymentQRCode: paymentQRCode || null,
								paymentNote: paymentNote || null,
								isPublic: true,
								allowAnonymous: false,
								enableVoting: true,
							},
						}
					: undefined,
		},
		include: {
			organizer: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logo: true,
				},
			},
			questions: {
				orderBy: {
					order: "asc",
				},
			},
			buildingConfig: true,
		},
	});

	return createdEvent;
}

export async function getEventById(id: string) {
	const event = await db.event.findUnique({
		where: { id },
		include: {
			organizer: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
					bio: true,
					userRoleString: true,
					region: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logo: true,
				},
			},
			// Filter out orphaned registrations with missing user records to prevent Prisma from throwing
			registrations: {
				where: {
					status: {
						in: ["APPROVED", "PENDING"],
					},
					user: {
						is: {},
					},
				},
				select: {
					status: true,
					registeredAt: true,
					allowDigitalCardDisplay: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
							username: true,
							userRoleString: true,
							currentWorkOn: true,
							bio: true,
							skills: true,
							region: true,
							lifeStatus: true,
							whatICanOffer: true,
							whatIAmLookingFor: true,
							showEmail: true,
							showWechat: true,
							githubUrl: true,
							twitterUrl: true,
							websiteUrl: true,
							wechatId: true,
							membershipLevel: true,
							creatorLevel: true,
							mentorLevel: true,
							contributorLevel: true,
						},
					},
				},
				orderBy: {
					registeredAt: "asc",
				},
			},
			questions: {
				orderBy: {
					order: "asc",
				},
			},
			ticketTypes: {
				where: {
					isActive: true,
				},
				include: {
					_count: {
						select: {
							registrations: true,
						},
					},
				},
				orderBy: {
					sortOrder: "asc",
				},
			},
			volunteerRoles: {
				include: {
					volunteerRole: true,
					registrations: {
						where: {
							user: {
								is: {},
							},
						},
						include: {
							user: {
								select: {
									id: true,
									name: true,
									image: true,
									username: true,
									userRoleString: true,
									currentWorkOn: true,
								},
							},
						},
						orderBy: {
							appliedAt: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			},
			feedbacks: {
				where: {
					user: {
						is: {},
					},
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			},
			_count: {
				select: {
					registrations: {
						where: {
							status: {
								in: ["APPROVED", "PENDING"],
							},
							user: {
								is: {},
							},
						},
					},
					checkIns: true,
					feedbacks: true,
				},
			},
			buildingConfig: true,
		},
	});

	// If the event requires project submission, fetch associated project submissions for each registration
	if (event?.requireProjectSubmission && event.registrations.length > 0) {
		const userIds = event.registrations.map((reg) => reg.user.id);

		// Get project submissions for all registered users
		const projectSubmissions = await db.eventProjectSubmission.findMany({
			where: {
				eventId: id,
				userId: {
					in: userIds,
				},
			},
			include: {
				project: {
					select: {
						id: true,
						title: true,
						description: true,
						screenshots: true,
						stage: true,
						projectTags: true,
						url: true,
					},
				},
			},
		});

		// Create a map for easy lookup
		const submissionsByUserId = new Map(
			projectSubmissions.map((sub) => [sub.userId, sub]),
		);

		// Add project submissions to registrations
		event.registrations = event.registrations.map((registration) => ({
			...registration,
			projectSubmission:
				submissionsByUserId.get(registration.user.id) || null,
		}));
	}

	// Convert organization logo path to full URL if organization exists
	if (event?.organization?.logo) {
		event.organization.logo = getPublicStorageUrl(event.organization.logo);
	}

	return event;
}

export async function getEvents(params: {
	page?: number;
	limit?: number;
	type?: EventType;
	organizationId?: string;
	isOnline?: boolean;
	isExternalEvent?: boolean;
	status?: EventStatus;
	search?: string;
	featured?: boolean;
	startDate?: Date;
	endDate?: Date;
	tags?: string[];
	showExpired?: boolean;
	hostType?: "organization" | "individual";
}) {
	const {
		page = 1,
		limit = 20,
		type,
		organizationId,
		isOnline,
		isExternalEvent,
		status,
		search,
		featured,
		startDate,
		endDate,
		tags,
		showExpired = false,
		hostType,
	} = params;

	const skip = (page - 1) * limit;
	const now = new Date();

	const where: Prisma.EventWhereInput = {
		...(type && { type }),
		...(organizationId && { organizationId }),
		...(isOnline !== undefined && { isOnline }),
		...(isExternalEvent !== undefined && { isExternalEvent }),
		...(featured !== undefined && { featured }),
		...(search && {
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				{ richContent: { contains: search, mode: "insensitive" } },
				{ shortDescription: { contains: search, mode: "insensitive" } },
				{ address: { contains: search, mode: "insensitive" } },
			],
		}),
		...(startDate && {
			startTime: { gte: startDate },
		}),
		...(endDate && {
			endTime: { lte: endDate },
		}),
		...(tags &&
			tags.length > 0 && {
				tags: {
					hasSome: tags,
				},
			}),
	};

	if (!organizationId) {
		if (hostType === "organization") {
			where.organizationId = { not: null };
		} else if (hostType === "individual") {
			where.organizationId = null;
		}
	}

	// 根据状态和时间处理筛选逻辑
	if (status) {
		if (status === "ONGOING") {
			// 进行中：活动已开始但未结束
			where.startTime = { lte: now };
			where.endTime = { gte: now };
			where.status = "PUBLISHED"; // 只显示已发布的活动
		} else if (status === "COMPLETED") {
			// 已结束：活动已结束
			where.endTime = { lt: now };
			where.status = "PUBLISHED"; // 只显示已发布的活动
		} else {
			// 其他状态直接筛选
			where.status = status;
			// 只有在非 PUBLISHED 状态或明确要求显示过期活动时才不过滤时间
			if (status === "PUBLISHED") {
				// PUBLISHED 状态：根据 showExpired 决定是否显示过期活动
				if (!showExpired) {
					where.endTime = { gte: now };
				}
			}
		}
	} else {
		// 没有指定状态时的默认行为
		where.status = "PUBLISHED";
		if (!showExpired) {
			where.endTime = { gte: now };
		}
	}

	// 根据不同状态使用不同的排序策略
	const orderBy: Prisma.EventOrderByWithRelationInput[] = [
		{ featured: "desc" },
	];

	if (status === "COMPLETED") {
		// 已完成的活动：最近结束的在前面
		orderBy.push({ endTime: "desc" });
	} else if (status === "ONGOING") {
		// 进行中的活动：最近开始的在前面
		orderBy.push({ startTime: "desc" });
	} else if (status === "PUBLISHED" && !showExpired) {
		// 明确的未来活动（PUBLISHED且不显示过期）：最近即将开始的在前面（升序）
		orderBy.push({ startTime: "asc" });
	} else if (!status && !showExpired) {
		// 默认状态的未来活动：最近即将开始的在前面（升序）
		orderBy.push({ startTime: "asc" });
	} else {
		// 混合显示所有活动：最近的活动在前面（降序）
		orderBy.push({ startTime: "desc" });
	}

	const [events, total] = await Promise.all([
		db.event.findMany({
			where,
			include: {
				organizer: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
				photos: {
					select: {
						id: true,
						imageUrl: true,
						caption: true,
					},
					orderBy: {
						createdAt: "asc",
					},
				},
				_count: {
					select: {
						registrations: {
							where: {
								status: {
									in: ["APPROVED", "PENDING"],
								},
							},
						},
					},
				},
			},
			orderBy,
			skip,
			take: limit,
		}),
		db.event.count({ where }),
	]);

	// Convert organization logo paths to full URLs
	const eventsWithUrls = events.map((event) => ({
		...event,
		organization: event.organization
			? {
					...event.organization,
					logo: getPublicStorageUrl(event.organization.logo),
				}
			: null,
	}));

	return {
		events: eventsWithUrls,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function updateEvent(
	id: string,
	data: Partial<{
		title: string;
		richContent: string;
		shortDescription: string;
		type: EventType;
		status: EventStatus;
		startTime: Date;
		endTime: Date;
		isOnline: boolean;
		address: string;
		organizationId: string | null;
		onlineUrl: string;
		isExternalEvent: boolean;
		externalUrl: string;
		maxAttendees: number;
		registrationDeadline: Date;
		requireApproval: boolean;
		coverImage: string;
		tags: string[];
		featured: boolean;
		requireProjectSubmission: boolean;
		askDigitalCardConsent: boolean;
		registrationSuccessInfo: string;
		registrationSuccessImage: string;
		registrationPendingInfo: string;
		registrationPendingImage: string;
		volunteerContactInfo: string;
		volunteerWechatQrCode: string;
		organizerContact: string;
		// Building Public 特定字段
		minCheckIns: number;
		depositAmount: number;
		refundRate: number;
		paymentType: string;
		paymentUrl: string;
		paymentQRCode: string;
		paymentNote: string;
		hackathonConfig: Prisma.InputJsonValue | null;
		ticketTypes: {
			id?: string;
			name: string;
			description?: string;
			price?: number | null;
			maxQuantity?: number | null;
			isActive?: boolean;
			sortOrder?: number;
		}[];
		volunteerRoles: {
			volunteerRoleId: string;
			recruitCount: number;
			description?: string;
			requireApproval?: boolean;
		}[];
		// Hackathon control switches
		registrationOpen: boolean;
		submissionsOpen: boolean;
		votingOpen: boolean;
		showVotesOnGallery: boolean;
		questions: {
			id?: string;
			question: string;
			description?: string;
			type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "RADIO";
			required: boolean;
			options?: string[];
			order?: number;
		}[];
		registrationFieldConfig: Prisma.InputJsonValue;
		submissionFormConfig: Prisma.InputJsonValue | null;
	}>,
) {
	const {
		ticketTypes,
		volunteerRoles,
		questions,
		organizationId,
		minCheckIns,
		depositAmount,
		refundRate,
		paymentType,
		paymentUrl,
		paymentQRCode,
		paymentNote,
		hackathonConfig,
		registrationFieldConfig,
		submissionFormConfig,
		...eventData
	} = data;

	// Prepare the update data with proper organization handling
	const updateData = {
		...eventData,
		...(organizationId !== undefined && {
			organizationId,
		}),
		...(hackathonConfig !== undefined && { hackathonConfig }),
		...(registrationFieldConfig !== undefined && {
			registrationFieldConfig,
		}),
		...(submissionFormConfig !== undefined && {
			submissionFormConfig,
		}),
	};

	// Prepare Building Public config data
	const buildingConfigData = {
		...(minCheckIns !== undefined && { requiredCheckIns: minCheckIns }),
		...(depositAmount !== undefined && { depositAmount }),
		...(refundRate !== undefined && { refundRate }),
		...(paymentType !== undefined && { paymentType }),
		...(paymentUrl !== undefined && { paymentUrl }),
		...(paymentQRCode !== undefined && { paymentQRCode }),
		...(paymentNote !== undefined && { paymentNote }),
	};

	// Check if we need to use a transaction
	const needsTransaction =
		ticketTypes !== undefined ||
		volunteerRoles !== undefined ||
		questions !== undefined ||
		Object.keys(buildingConfigData).length > 0;

	if (needsTransaction) {
		// Use a transaction to ensure consistency
		return await db.$transaction(async (tx) => {
			// Handle ticket types if provided
			if (ticketTypes !== undefined) {
				// 获取现有票种
				const existingTickets = await tx.eventTicketType.findMany({
					where: { eventId: id },
				});

				// 创建票种 ID 映射（基于名称匹配）
				const existingTicketMap = new Map(
					existingTickets.map((t) => [t.name, t]),
				);

				// 处理每个票种
				for (const [index, ticketData] of ticketTypes.entries()) {
					const existingTicket = existingTicketMap.get(
						ticketData.name,
					);

					if (existingTicket) {
						// 更新现有票种（保留 ID）
						await tx.eventTicketType.update({
							where: { id: existingTicket.id },
							data: {
								description: ticketData.description,
								price: ticketData.price,
								maxQuantity: ticketData.maxQuantity,
								isActive: ticketData.isActive ?? true,
								sortOrder: ticketData.sortOrder ?? index,
							},
						});
						existingTicketMap.delete(ticketData.name); // 标记为已处理
					} else {
						// 创建新票种
						await tx.eventTicketType.create({
							data: {
								eventId: id,
								name: ticketData.name,
								description: ticketData.description,
								price: ticketData.price,
								maxQuantity: ticketData.maxQuantity,
								isActive: ticketData.isActive ?? true,
								sortOrder: ticketData.sortOrder ?? index,
							},
						});
					}
				}

				// 删除不再需要的票种（但要检查是否有报名）
				for (const [_, oldTicket] of existingTicketMap) {
					// 检查是否有用户使用该票种
					const registrationCount = await tx.eventRegistration.count({
						where: { ticketTypeId: oldTicket.id },
					});

					if (registrationCount > 0) {
						// 有报名，标记为不活跃而不是删除
						await tx.eventTicketType.update({
							where: { id: oldTicket.id },
							data: { isActive: false },
						});
					} else {
						// 没有报名，可以安全删除
						await tx.eventTicketType.delete({
							where: { id: oldTicket.id },
						});
					}
				}
			}

			// Handle volunteer roles if provided
			if (volunteerRoles !== undefined) {
				// First, delete all existing volunteer roles for this event
				await tx.eventVolunteerRole.deleteMany({
					where: { eventId: id },
				});

				// Create new volunteer roles
				if (volunteerRoles.length > 0) {
					await tx.eventVolunteerRole.createMany({
						data: volunteerRoles
							// Filter out duplicates
							.filter(
								(vr, index, arr) =>
									arr.findIndex(
										(item) =>
											item.volunteerRoleId ===
											vr.volunteerRoleId,
									) === index,
							)
							.map((vr) => ({
								eventId: id,
								volunteerRoleId: vr.volunteerRoleId,
								recruitCount: vr.recruitCount,
								description: vr.description,
								requireApproval: vr.requireApproval ?? true,
							})),
					});
				}
			}

			// Handle questions if provided
			if (questions !== undefined) {
				const existingQuestions = await tx.eventQuestion.findMany({
					where: { eventId: id },
					select: { id: true },
				});
				const hasExistingQuestions = existingQuestions.length > 0;
				const incomingHasIds = questions.some(
					(q) => typeof q.id === "string" && q.id.trim() !== "",
				);
				const shouldSkipSync =
					hasExistingQuestions &&
					questions.length > 0 &&
					!incomingHasIds;

				if (shouldSkipSync) {
					console.warn(
						"Skipping event question sync due to missing identifiers",
						{ eventId: id },
					);
				} else {
					const existingQuestionMap = new Map(
						existingQuestions.map((question) => [
							question.id,
							true,
						]),
					);
					const processedQuestionIds = new Set<string>();

					for (const [index, questionData] of questions.entries()) {
						const incomingQuestionId =
							typeof questionData.id === "string"
								? questionData.id.trim()
								: undefined;
						const normalizedData = {
							question: questionData.question,
							description: questionData.description,
							type: questionData.type,
							required: questionData.required ?? false,
							options: questionData.options || [],
							order: questionData.order ?? index,
						};

						if (
							incomingQuestionId &&
							existingQuestionMap.has(incomingQuestionId)
						) {
							await tx.eventQuestion.update({
								where: { id: incomingQuestionId },
								data: normalizedData,
							});
							processedQuestionIds.add(incomingQuestionId);
						} else {
							await tx.eventQuestion.create({
								data: {
									eventId: id,
									...normalizedData,
								},
							});
						}
					}

					const idsToDelete = existingQuestions
						.filter(
							(question) =>
								!processedQuestionIds.has(question.id),
						)
						.map((question) => question.id);

					if (idsToDelete.length > 0) {
						await tx.eventQuestion.deleteMany({
							where: {
								id: {
									in: idsToDelete,
								},
							},
						});
					}
				}
			}

			// Update Building Public config if data is provided
			if (Object.keys(buildingConfigData).length > 0) {
				await tx.buildingActivityConfig.upsert({
					where: { eventId: id },
					update: buildingConfigData,
					create: {
						eventId: id,
						duration: 21,
						requiredCheckIns: minCheckIns || 7,
						depositAmount: depositAmount || 0,
						refundRate: refundRate || 0.8,
						paymentType: paymentType || "NONE",
						paymentUrl: paymentUrl || null,
						paymentQRCode: paymentQRCode || null,
						paymentNote: paymentNote || null,
						isPublic: true,
						allowAnonymous: false,
						enableVoting: true,
					},
				});
			}

			// Update the event
			const updatedEvent = await tx.event.update({
				where: { id },
				data: updateData,
				include: {
					organizer: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
							username: true,
						},
					},
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
							logo: true,
						},
					},
					ticketTypes: true,
					volunteerRoles: {
						include: {
							volunteerRole: true,
						},
					},
					questions: {
						orderBy: {
							order: "asc",
						},
					},
					buildingConfig: true,
				},
			});

			return updatedEvent;
		});
	}

	// If no ticket types or volunteer roles, just update the event normally
	return await db.event.update({
		where: { id },
		data: updateData,
		include: {
			organizer: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logo: true,
				},
			},
			ticketTypes: true,
			volunteerRoles: {
				include: {
					volunteerRole: true,
				},
			},
			questions: {
				orderBy: {
					order: "asc",
				},
			},
			buildingConfig: true,
		},
	});
}

export async function deleteEvent(id: string) {
	return await db.event.delete({
		where: { id },
	});
}

export async function incrementEventViewCount(id: string) {
	return await db.event.update({
		where: { id },
		data: {
			viewCount: {
				increment: 1,
			},
		},
	});
}

export async function getEventsByOrganizerId(
	organizerId: string,
	params: {
		page?: number;
		limit?: number;
		status?: "all" | EventStatus;
	} = {},
) {
	const { page = 1, limit = 20, status = "all" } = params;
	const skip = (page - 1) * limit;

	const where: Prisma.EventWhereInput = {
		OR: [
			// 用户直接创建的活动
			{ organizerId },
			// 用户作为管理员的活动（状态为ACCEPTED且有管理权限）
			{
				admins: {
					some: {
						userId: organizerId,
						status: "ACCEPTED",
						OR: [
							{ canEditEvent: true },
							{ canManageRegistrations: true },
							{ canManageAdmins: true },
						],
					},
				},
			},
		],
		...(status !== "all" && { status }),
	};

	const [events, total] = await Promise.all([
		db.event.findMany({
			where,
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
				_count: {
					select: {
						registrations: {
							where: {
								status: {
									in: ["APPROVED", "PENDING"],
								},
							},
						},
						checkIns: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		db.event.count({ where }),
	]);

	return {
		events,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function getEventsByOrganizationId(
	organizationId: string,
	params: {
		page?: number;
		limit?: number;
		status?: EventStatus;
	} = {},
) {
	const { page = 1, limit = 20, status = "PUBLISHED" } = params;
	const skip = (page - 1) * limit;

	const where: Prisma.EventWhereInput = {
		organizationId,
		status,
	};

	const [events, total] = await Promise.all([
		db.event.findMany({
			where,
			include: {
				organizer: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				_count: {
					select: {
						registrations: {
							where: {
								status: {
									in: ["APPROVED", "PENDING"],
								},
							},
						},
					},
				},
			},
			orderBy: {
				startTime: "asc",
			},
			skip,
			take: limit,
		}),
		db.event.count({ where }),
	]);

	return {
		events,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// Event Registration queries
export async function createEventRegistration(data: {
	eventId: string;
	userId: string;
	note?: string;
}) {
	return await db.eventRegistration.create({
		data: {
			...data,
			status: "PENDING" as RegistrationStatus,
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
					requireApproval: true,
				},
			},
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

export async function getEventRegistration(eventId: string, userId: string) {
	return await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
					startTime: true,
					endTime: true,
					address: true,
					isOnline: true,
					onlineUrl: true,
				},
			},
		},
	});
}

export async function updateEventRegistration(
	eventId: string,
	userId: string,
	data: {
		status?: RegistrationStatus;
		reviewedBy?: string;
		reviewNote?: string;
	},
) {
	return await db.eventRegistration.update({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		data: {
			...data,
			...(data.reviewedBy && { reviewedAt: new Date() }),
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
					phoneNumber: true,
				},
			},
			event: {
				select: {
					id: true,
					title: true,
					startTime: true,
					endTime: true,
				},
			},
		},
	});
}

export async function deleteEventRegistration(eventId: string, userId: string) {
	return await db.eventRegistration.delete({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});
}

export async function getEventRegistrations(
	eventId: string,
	params: {
		status?: RegistrationStatus;
		page?: number;
		limit?: number;
	} = {},
) {
	const { status, page = 1, limit = 50 } = params;
	const skip = (page - 1) * limit;

	const where: Prisma.EventRegistrationWhereInput = {
		eventId,
		...(status && { status }),
	};

	const [registrations, total] = await Promise.all([
		db.eventRegistration.findMany({
			where,
			select: {
				id: true,
				status: true,
				registeredAt: true,
				note: true,
				reviewedAt: true,
				reviewNote: true,
				allowDigitalCardDisplay: true,
				userId: true,
				eventId: true,
				ticketTypeId: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
						username: true,
						userRoleString: true,
						currentWorkOn: true,
						lifeStatus: true,
						region: true,
						bio: true,
						phoneNumber: true,
						wechatId: true,
					},
				},
				reviewer: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
				ticketType: {
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
					},
				},
				answers: {
					include: {
						question: {
							select: {
								id: true,
								question: true,
								type: true,
								required: true,
								options: true,
							},
						},
					},
				},
			},
			orderBy: {
				registeredAt: "asc",
			},
			skip,
			take: limit,
		}),
		db.eventRegistration.count({ where }),
	]);

	// Get the event to check if it requires project submission
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: { requireProjectSubmission: true },
	});

	// If the event requires project submission, fetch project submissions for each registration
	let registrationsWithProjects = registrations;
	if (event?.requireProjectSubmission && registrations.length > 0) {
		const userIds = registrations.map((reg) => reg.userId);

		// Get project submissions for all registered users
		const projectSubmissions = await db.eventProjectSubmission.findMany({
			where: {
				eventId,
				userId: {
					in: userIds,
				},
			},
			include: {
				project: {
					select: {
						id: true,
						title: true,
						description: true,
						screenshots: true,
						stage: true,
						projectTags: true,
						url: true,
					},
				},
			},
		});

		// Create a map for easy lookup
		const submissionsByUserId = new Map(
			projectSubmissions.map((sub) => [sub.userId, sub]),
		);

		// Add project submissions to registrations
		registrationsWithProjects = registrations.map((registration) => ({
			...registration,
			projectSubmission:
				submissionsByUserId.get(registration.userId) || null,
		}));
	}

	return {
		registrations: registrationsWithProjects,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function getUserEventRegistrations(
	userId: string,
	params: {
		status?: RegistrationStatus;
		upcoming?: boolean;
		page?: number;
		limit?: number;
	} = {},
) {
	const { status, upcoming, page = 1, limit = 20 } = params;
	const skip = (page - 1) * limit;

	const where: Prisma.EventRegistrationWhereInput = {
		userId,
		...(status && { status }),
		...(upcoming && {
			event: {
				startTime: {
					gte: new Date(),
				},
			},
		}),
	};

	const [registrations, total] = await Promise.all([
		db.eventRegistration.findMany({
			where,
			include: {
				event: {
					include: {
						organizer: {
							select: {
								id: true,
								name: true,
								image: true,
								username: true,
							},
						},
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
								logo: true,
							},
						},
						_count: {
							select: {
								registrations: {
									where: {
										status: {
											in: ["APPROVED", "PENDING"],
										},
									},
								},
							},
						},
					},
				},
			},
			orderBy: {
				registeredAt: "desc",
			},
			skip,
			take: limit,
		}),
		db.eventRegistration.count({ where }),
	]);

	return {
		registrations,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// Registration functions
export async function registerForEvent(data: {
	eventId: string;
	userId: string;
	status?: RegistrationStatus;
	ticketTypeId?: string;
	inviteId?: string;
	allowDigitalCardDisplay?: boolean;
	answers?: Array<{
		questionId: string;
		answer: string;
	}>;
}) {
	const {
		eventId,
		userId,
		status = "APPROVED",
		ticketTypeId,
		inviteId,
		allowDigitalCardDisplay,
		answers = [],
	} = data;

	// Check if user is already registered (only allow re-registration if cancelled by user)
	const existingRegistration = await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});

	if (existingRegistration && existingRegistration.status !== "CANCELLED") {
		if (existingRegistration.status === "REJECTED") {
			throw new Error(
				"Your registration was rejected by the organizer. You cannot register again for this event.",
			);
		}
		throw new Error("User is already registered for this event");
	}

	// If user had a cancelled registration, delete it before creating new one
	if (existingRegistration && existingRegistration.status === "CANCELLED") {
		await db.eventRegistration.delete({
			where: {
				id: existingRegistration.id,
			},
		});
		// Also delete any associated answers
		await db.eventAnswer.deleteMany({
			where: {
				registrationId: existingRegistration.id,
			},
		});
	}

	// Check if event exists and get approval requirement
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: {
			requireApproval: true,
			maxAttendees: true,
			ticketTypes: {
				where: {
					isActive: true,
				},
				select: {
					id: true,
					name: true,
					maxQuantity: true,
					_count: {
						select: {
							registrations: true,
						},
					},
				},
			},
			_count: {
				select: {
					registrations: {
						where: {
							status: {
								in: ["APPROVED", "PENDING"],
							},
						},
					},
				},
			},
		},
	});

	if (!event) {
		throw new Error("Event not found");
	}

	// Handle ticket type validation
	let validTicketTypeId = ticketTypeId;

	if (event.ticketTypes.length > 0) {
		// If ticketTypeId is provided, validate it
		if (ticketTypeId) {
			const selectedTicket = event.ticketTypes.find(
				(t) => t.id === ticketTypeId,
			);
			if (!selectedTicket) {
				throw new Error("Invalid ticket type selected");
			}

			// Check if ticket type is available
			if (
				selectedTicket.maxQuantity &&
				selectedTicket._count.registrations >=
					selectedTicket.maxQuantity
			) {
				throw new Error(
					`Ticket type "${selectedTicket.name}" is sold out`,
				);
			}
		} else {
			// If no ticketTypeId provided but event has ticket types, use the first available one
			const availableTicket = event.ticketTypes.find(
				(t) => !t.maxQuantity || t._count.registrations < t.maxQuantity,
			);

			if (!availableTicket) {
				throw new Error("All ticket types are sold out");
			}

			validTicketTypeId = availableTicket.id;
		}
	} else {
		// Event has no ticket types, ticketTypeId should be null
		validTicketTypeId = undefined;
	}

	// Check if event is full
	if (
		event.maxAttendees &&
		event._count.registrations >= event.maxAttendees
	) {
		throw new Error("Event is full");
	}

	// Set status based on approval requirement
	const registrationStatus = event.requireApproval ? "PENDING" : "APPROVED";

	return await db.eventRegistration
		.create({
			data: {
				eventId,
				userId,
				status: registrationStatus,
				ticketTypeId: validTicketTypeId,
				inviteId,
				allowDigitalCardDisplay,
			},
			include: {
				event: {
					select: {
						id: true,
						title: true,
						startTime: true,
						endTime: true,
						isOnline: true,
						address: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
						username: true,
					},
				},
				answers: {
					include: {
						question: true,
					},
				},
			},
		})
		.then(async (registration) => {
			let result = registration;

			// Create answers after registration is created
			if (answers.length > 0) {
				await db.eventAnswer.createMany({
					data: answers.map((answer) => ({
						questionId: answer.questionId,
						answer: answer.answer,
						userId,
						eventId,
						registrationId: registration.id,
					})),
				});

				// Refetch with answers to return hydrated payload
				const refreshed = await db.eventRegistration.findUnique({
					where: { id: registration.id },
					include: {
						event: {
							select: {
								id: true,
								title: true,
								startTime: true,
								endTime: true,
								isOnline: true,
								address: true,
							},
						},
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
								username: true,
							},
						},
						answers: {
							include: {
								question: true,
							},
						},
					},
				});

				if (refreshed) {
					result = refreshed;
				}
			}

			// Update invite usage timestamp if applicable
			if (inviteId) {
				await db.eventInvite.update({
					where: { id: inviteId },
					data: { lastUsedAt: new Date() },
				});
			}

			return result;
		});
}

export async function getRegistrationByUserAndEvent(
	userId: string,
	eventId: string,
) {
	return await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			answers: {
				include: {
					question: true,
				},
			},
		},
	});
}

export async function updateRegistrationStatus(
	registrationId: string,
	status: RegistrationStatus,
) {
	return await db.eventRegistration.update({
		where: { id: registrationId },
		data: { status },
		include: {
			event: {
				select: {
					id: true,
					title: true,
					startTime: true,
					endTime: true,
					isOnline: true,
					onlineUrl: true,
					address: true,
				},
			},
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

// Check-in functions
export async function checkIntoEvent(data: {
	eventId: string;
	userId: string;
	checkedInBy?: string;
}) {
	const { eventId, userId, checkedInBy } = data;

	// Check if user is already checked in
	const existingCheckIn = await db.eventCheckIn.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});

	if (existingCheckIn) {
		throw new Error("User is already checked in to this event");
	}

	return await db.eventCheckIn.create({
		data: {
			eventId,
			userId,
			checkedInBy,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			operator: checkedInBy
				? {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					}
				: undefined,
		},
	});
}

export async function getEventCheckIns(eventId: string) {
	return await db.eventCheckIn.findMany({
		where: {
			eventId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			operator: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
		orderBy: {
			checkedInAt: "desc",
		},
	});
}

export async function getEventCheckIn(eventId: string, userId: string) {
	return await db.eventCheckIn.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			operator: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

export async function cancelEventCheckIn(eventId: string, userId: string) {
	// Check if user is checked in
	const existingCheckIn = await db.eventCheckIn.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});

	if (!existingCheckIn) {
		throw new Error("User is not checked in to this event");
	}

	// Delete the check-in record
	await db.eventCheckIn.delete({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});

	return existingCheckIn;
}

// Feedback functions
export async function createEventFeedback(data: {
	eventId: string;
	userId: string;
	rating: number;
	comment?: string | null;
	suggestions?: string | null;
	wouldRecommend: boolean;
	customAnswers?: Record<string, unknown> | null;
}) {
	// Check if user already submitted feedback
	const existingFeedback = await db.eventFeedback.findUnique({
		where: {
			eventId_userId: {
				eventId: data.eventId,
				userId: data.userId,
			},
		},
	});

	if (existingFeedback) {
		throw new Error("User has already submitted feedback for this event");
	}

	return await db.eventFeedback.create({
		data,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

export async function updateEventFeedback(
	eventId: string,
	userId: string,
	data: {
		rating: number;
		comment?: string | null;
		suggestions?: string | null;
		wouldRecommend: boolean;
		customAnswers?: Record<string, unknown> | null;
	},
) {
	// Check if feedback exists
	const existingFeedback = await db.eventFeedback.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});

	if (!existingFeedback) {
		throw new Error("Feedback not found for this user and event");
	}

	return await db.eventFeedback.update({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		data,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

export async function getEventFeedback(eventId: string) {
	return await db.eventFeedback.findMany({
		where: {
			eventId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

// Helper functions for getUserRegistration and getUserCheckIn
export async function getUserRegistration(eventId: string, userId: string) {
	return await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
					startTime: true,
					endTime: true,
					address: true,
					isOnline: true,
					onlineUrl: true,
				},
			},
		},
	});
}

export async function getEventProjectSubmissions(eventId: string) {
	return await db.eventProjectSubmission.findMany({
		where: {
			eventId,
			// Show all submissions except rejected ones
			status: {
				in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "AWARDED"],
			},
			// Only show submissions from users with active registrations
			user: {
				eventRegistrations: {
					some: {
						eventId,
						status: {
							in: ACTIVE_REGISTRATION_STATUSES, // Active registration statuses
						},
					},
				},
			},
		},
		include: {
			project: {
				select: {
					id: true,
					title: true,
					subtitle: true,
					description: true,
					screenshots: true,
					stage: true,
					projectTags: true,
					url: true,
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
							userRoleString: true,
						},
					},
					_count: {
						select: {
							likes: true,
							bookmarks: true,
							members: true,
						},
					},
				},
			},
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
					userRoleString: true,
				},
			},
		},
		orderBy: {
			submittedAt: "desc",
		},
	});
}

export async function getUserCheckIn(eventId: string, userId: string) {
	return await db.eventCheckIn.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			operator: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}
