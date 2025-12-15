import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/database/prisma";
import { auth } from "@/lib/auth/auth";
import { HTTPException } from "hono/http-exception";
import {
	HackathonConfigSchema,
	withHackathonConfigDefaults,
} from "@/features/hackathon/config";
import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";

const app = new Hono()
	// 获取黑客松配置
	.get("/events/:eventId/hackathon-config", async (c) => {
		const eventId = c.req.param("eventId");

		try {
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: {
					id: true,
					title: true,
					type: true,
					hackathonConfig: true,
				},
			});

			if (!event) {
				throw new HTTPException(404, {
					message: "Event not found",
				});
			}

			if (event.type !== "HACKATHON") {
				throw new HTTPException(400, {
					message: "Event is not a hackathon",
				});
			}

			return c.json({
				success: true,
				data: withHackathonConfigDefaults(event.hackathonConfig as any),
			});
		} catch (error) {
			console.error("Error fetching hackathon config:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to fetch hackathon configuration",
			});
		}
	})

	// 设置黑客松配置 (仅活动组织者)
	.put(
		"/events/:eventId/hackathon-config",
		zValidator("json", HackathonConfigSchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, {
					message: "Authentication required",
				});
			}

			const eventId = c.req.param("eventId");
			const config = c.req.valid("json");

			try {
				// 检查活动是否存在及权限
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						type: true,
						organizerId: true,
						organizationId: true,
					},
				});

				if (!event) {
					throw new HTTPException(404, {
						message: "Event not found",
					});
				}

				if (event.type !== "HACKATHON") {
					throw new HTTPException(400, {
						message: "Event is not a hackathon",
					});
				}

				// 检查用户权限：活动组织者或组织管理员
				let hasPermission = event.organizerId === session.user.id;

				if (!hasPermission && event.organizationId) {
					const membership = await db.member.findUnique({
						where: {
							organizationId_userId: {
								organizationId: event.organizationId,
								userId: session.user.id,
							},
						},
					});
					hasPermission = Boolean(
						membership &&
							(membership.role === "owner" ||
								membership.role === "admin"),
					);
				}

				if (!hasPermission) {
					throw new HTTPException(403, {
						message:
							"You don't have permission to configure this hackathon",
					});
				}

				// 更新黑客松配置
				const updatedEvent = await db.event.update({
					where: { id: eventId },
					data: {
						hackathonConfig: config,
					},
					select: {
						id: true,
						title: true,
						hackathonConfig: true,
					},
				});

				return c.json({
					success: true,
					data: updatedEvent,
					message: "Hackathon configuration updated successfully",
				});
			} catch (error) {
				console.error("Error updating hackathon config:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to update hackathon configuration",
				});
			}
		},
	)

	// 获取黑客松投票结果
	.get("/events/:eventId/voting-results", async (c) => {
		const eventId = c.req.param("eventId");

		try {
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: {
					id: true,
					type: true,
					hackathonConfig: true,
				},
			});

			if (!event) {
				throw new HTTPException(404, {
					message: "Event not found",
				});
			}

			if (event.type !== "HACKATHON") {
				throw new HTTPException(400, {
					message: "Event is not a hackathon",
				});
			}

			// 获取所有提交的作品及其评分
			const submissions = await db.eventProjectSubmission.findMany({
				where: {
					eventId,
					status: { in: ["APPROVED", "AWARDED"] },
					user: {
						eventRegistrations: {
							some: {
								eventId,
								status: {
									in: ACTIVE_REGISTRATION_STATUSES,
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
							description: true,
							screenshots: true,
						},
					},
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							image: true,
						},
					},
					awards: {
						include: {
							award: {
								select: {
									id: true,
									name: true,
									description: true,
									level: true,
									iconUrl: true,
									badgeUrl: true,
								},
							},
						},
					},
				},
				orderBy: [
					{ finalScore: "desc" },
					{ judgeScore: "desc" },
					{ audienceScore: "desc" },
				],
			});

			// Get voting config
			const normalizedConfig = withHackathonConfigDefaults(
				event.hackathonConfig as any,
			);
			// Note: Results can be viewed anytime, no need to check votingOpen
			const judgeWeight = normalizedConfig.voting.judgeWeight;
			const publicWeight = normalizedConfig.voting.publicWeight;

			const results = submissions.map((submission, index) => ({
				id: submission.id,
				projectId: submission.project.id,
				title: submission.title,
				description: submission.description,
				project: submission.project,
				user: submission.user,
				judgeScore: submission.judgeScore,
				audienceScore: submission.audienceScore,
				finalScore: submission.finalScore,
				// 计算综合评分（如果两个分数都存在）
				weightedScore:
					submission.judgeScore && submission.audienceScore
						? submission.judgeScore * judgeWeight +
							submission.audienceScore * publicWeight
						: submission.finalScore ||
							submission.judgeScore ||
							submission.audienceScore ||
							0,
				rank: index + 1,
				awards: submission.awards,
			}));

			return c.json({
				success: true,
				data: {
					submissions: results,
					config: normalizedConfig.voting,
					lastUpdated: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("Error fetching voting results:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to fetch voting results",
			});
		}
	})

	// 观众投票 API
	.post(
		"/events/:eventId/submissions/:submissionId/vote",
		zValidator(
			"json",
			z.object({
				voteType: z.enum(["AUDIENCE", "JUDGE"]),
				score: z.number().min(1).max(10).optional(), // 评委投票时使用
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, {
					message: "Authentication required",
				});
			}

			const eventId = c.req.param("eventId");
			const submissionId = c.req.param("submissionId");
			const { voteType, score } = c.req.valid("json");

			try {
				// 检查活动和提交是否存在
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						type: true,
						submissionsEnabled: true,
						hackathonConfig: true,
						organizerId: true,
						organizationId: true,
						votingOpen: true,
					},
				});

				if (!event || event.type !== "HACKATHON") {
					throw new HTTPException(404, {
						message: "Hackathon event not found",
					});
				}
				if (!isEventSubmissionsEnabled(event)) {
					throw new HTTPException(404, {
						message: "Hackathon event not found",
					});
				}

				const submission = await db.eventProjectSubmission.findUnique({
					where: { id: submissionId },
					select: {
						id: true,
						eventId: true,
						userId: true,
						status: true,
						projectId: true,
					},
				});

				if (!submission || submission.eventId !== eventId) {
					throw new HTTPException(404, {
						message: "Project submission not found",
					});
				}

				// 检查提交状态
				if (submission.status !== "APPROVED") {
					throw new HTTPException(400, {
						message: "Can only vote on approved submissions",
					});
				}

				// 检查用户是否投自己的项目
				if (submission.userId === session.user.id) {
					throw new HTTPException(400, {
						message: "Cannot vote for your own project",
					});
				}

				// Check if voting is open
				if (!event.votingOpen) {
					throw new HTTPException(403, {
						message: "Voting is closed",
					});
				}

				// Get voting config for permission checks
				const normalizedConfig = withHackathonConfigDefaults(
					event.hackathonConfig as any,
				);
				const votingConfig = normalizedConfig.voting;

				// 权限检查
				if (voteType === "AUDIENCE") {
					if (!votingConfig.allowPublicVoting) {
						throw new HTTPException(403, {
							message:
								"Public voting is not enabled for this hackathon",
						});
					}

					// 检查观众投票范围
					const scope =
						votingConfig.publicVotingScope || "PARTICIPANTS";

					if (scope === "PARTICIPANTS") {
						// 检查用户是否已报名参加活动
						const registration =
							await db.eventRegistration.findUnique({
								where: {
									eventId_userId: {
										eventId,
										userId: session.user.id,
									},
								},
							});

						if (
							!registration ||
							registration.status !== "APPROVED"
						) {
							throw new HTTPException(403, {
								message: "Only approved participants can vote",
							});
						}
					} else if (scope === "REGISTERED") {
						// 只需要是注册用户（已满足，因为有session）
					}
					// scope === "ALL" 允许所有人投票

					// 观众投票：检查是否已经投过票（通过ProjectLike系统）
					if (!submission.projectId) {
						throw new HTTPException(400, {
							message:
								"Submission is missing project information",
						});
					}

					const existingLike = await db.projectLike.findUnique({
						where: {
							projectId_userId: {
								projectId: submission.projectId,
								userId: session.user.id,
							},
						},
					});

					if (existingLike) {
						throw new HTTPException(400, {
							message: "You have already voted for this project",
						});
					}

					// 创建点赞记录
					await db.projectLike.create({
						data: {
							projectId: submission.projectId,
							userId: session.user.id,
						},
					});

					// 更新观众评分（计算该项目的总点赞数）
					const totalLikes = await db.projectLike.count({
						where: { projectId: submission.projectId },
					});

					// 将点赞转换为分数（1-10分制）
					// 这里使用简单的线性映射，可以根据需要调整
					const maxLikesForFullScore = 50; // 假设50个点赞=满分10分
					const audienceScore = Math.min(
						10,
						(totalLikes / maxLikesForFullScore) * 10,
					);

					await db.eventProjectSubmission.update({
						where: { id: submissionId },
						data: { audienceScore },
					});
				} else if (voteType === "JUDGE") {
					if (!votingConfig.enableJudgeVoting) {
						throw new HTTPException(403, {
							message:
								"Judge voting is not enabled for this hackathon",
						});
					}

					if (!score) {
						throw new HTTPException(400, {
							message: "Score is required for judge voting",
						});
					}

					// 检查是否是评委（组织者或管理员）
					let isJudge = event.organizerId === session.user.id;

					if (!isJudge && event.organizationId) {
						const membership = await db.member.findUnique({
							where: {
								organizationId_userId: {
									organizationId: event.organizationId,
									userId: session.user.id,
								},
							},
						});
						isJudge = Boolean(
							membership &&
								(membership.role === "owner" ||
									membership.role === "admin"),
						);
					}

					if (!isJudge) {
						throw new HTTPException(403, {
							message: "Only judges can submit judge scores",
						});
					}

					// 更新评委评分
					await db.eventProjectSubmission.update({
						where: { id: submissionId },
						data: { judgeScore: score },
					});
				}

				// 重新计算最终得分
				const updatedSubmission =
					await db.eventProjectSubmission.findUnique({
						where: { id: submissionId },
						select: {
							judgeScore: true,
							audienceScore: true,
						},
					});

				if (updatedSubmission) {
					const judgeWeight = votingConfig.judgeWeight ?? 0;
					const publicWeight = votingConfig.publicWeight ?? 1;

					let finalScore = null;
					if (
						updatedSubmission.judgeScore &&
						updatedSubmission.audienceScore
					) {
						finalScore =
							updatedSubmission.judgeScore * judgeWeight +
							updatedSubmission.audienceScore * publicWeight;
					} else if (updatedSubmission.judgeScore) {
						finalScore = updatedSubmission.judgeScore;
					} else if (updatedSubmission.audienceScore) {
						finalScore = updatedSubmission.audienceScore;
					}

					if (finalScore !== null) {
						await db.eventProjectSubmission.update({
							where: { id: submissionId },
							data: { finalScore },
						});
					}
				}

				return c.json({
					success: true,
					message: `${voteType.toLowerCase()} vote submitted successfully`,
				});
			} catch (error) {
				console.error("Error submitting vote:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to submit vote",
				});
			}
		},
	)

	// 快速控制黑客松流程状态 (管理员专用) - 切换报名/提交/投票开关
	.put(
		"/events/:eventId/controls",
		zValidator(
			"json",
			z.object({
				registrationOpen: z.boolean().optional(),
				submissionsOpen: z.boolean().optional(),
				votingOpen: z.boolean().optional(),
				// New: toggle whether the public gallery displays vote counts and live standings
				showVotesOnGallery: z.boolean().optional(),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, {
					message: "Authentication required",
				});
			}

			const eventId = c.req.param("eventId");
			const {
				registrationOpen,
				submissionsOpen,
				votingOpen,
				showVotesOnGallery,
			} = c.req.valid("json");

			try {
				// 检查活动是否存在及权限
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						type: true,
						organizerId: true,
						organizationId: true,
					},
				});

				if (!event) {
					throw new HTTPException(404, {
						message: "Event not found",
					});
				}

				if (event.type !== "HACKATHON") {
					throw new HTTPException(400, {
						message: "Event is not a hackathon",
					});
				}

				// 检查用户权限：活动组织者或组织管理员
				let hasPermission = event.organizerId === session.user.id;

				if (!hasPermission && event.organizationId) {
					const membership = await db.member.findUnique({
						where: {
							organizationId_userId: {
								organizationId: event.organizationId,
								userId: session.user.id,
							},
						},
					});
					hasPermission = Boolean(
						membership &&
							(membership.role === "owner" ||
								membership.role === "admin"),
					);
				}

				if (!hasPermission) {
					throw new HTTPException(403, {
						message:
							"You don't have permission to control this hackathon",
					});
				}

				// 只更新提供的字段
				const updateData: any = {};
				if (registrationOpen !== undefined) {
					updateData.registrationOpen = registrationOpen;
				}
				if (submissionsOpen !== undefined) {
					updateData.submissionsOpen = submissionsOpen;
				}
				if (votingOpen !== undefined) {
					updateData.votingOpen = votingOpen;
				}

				if (showVotesOnGallery !== undefined) {
					updateData.showVotesOnGallery = showVotesOnGallery;
				}

				const updatedEvent = await db.event.update({
					where: { id: eventId },
					data: updateData,
					select: {
						id: true,
						title: true,
						registrationOpen: true,
						submissionsOpen: true,
						votingOpen: true,
						showVotesOnGallery: true,
					},
				});

				return c.json({
					success: true,
					data: updatedEvent,
					message: "Hackathon controls updated successfully",
				});
			} catch (error) {
				console.error("Error updating hackathon controls:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to update hackathon controls",
				});
			}
		},
	);

export default app;
