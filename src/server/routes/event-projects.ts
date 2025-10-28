import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/database/prisma";
import { auth } from "@/lib/auth/auth";
import { HTTPException } from "hono/http-exception";
import { withHackathonConfigDefaults } from "@/features/hackathon/config";
import type { HackathonStage } from "@/features/hackathon/config";

const app = new Hono()
	// 获取活动的作品提交列表
	.get("/events/:eventId/submissions", async (c) => {
		const eventId = c.req.param("eventId");

		try {
			const submissions = await db.eventProjectSubmission.findMany({
				where: { eventId },
				include: {
					project: {
						select: {
							id: true,
							title: true,
							description: true,
							projectTags: true,
							url: true,
							demoVideoUrl: true,
							stage: true,
							screenshots: true,
							// Hackathon specific fields
							githubUrl: true,
							slidesUrl: true,
							inspiration: true,
							challenges: true,
							learnings: true,
							nextSteps: true,
						},
					},
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
					reviewer: {
						select: {
							id: true,
							name: true,
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
									iconUrl: true,
									badgeUrl: true,
									level: true,
									category: true,
								},
							},
						},
					},
				},
				orderBy: [{ submittedAt: "desc" }, { finalScore: "desc" }],
			});

			return c.json({
				success: true,
				data: submissions,
			});
		} catch (error) {
			console.error("Error fetching event submissions:", error);
			throw new HTTPException(500, {
				message: "Failed to fetch event submissions",
			});
		}
	})

	// 获取单个作品提交详情
	.get("/submissions/:submissionId", async (c) => {
		const submissionId = c.req.param("submissionId");

		try {
			const submission = await db.eventProjectSubmission.findUnique({
				where: { id: submissionId },
				include: {
					project: true,
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
							email: true,
						},
					},
					event: {
						select: {
							id: true,
							title: true,
							type: true,
							startTime: true,
							endTime: true,
						},
					},
					reviewer: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
					awards: {
						include: {
							award: true,
						},
					},
				},
			});

			if (!submission) {
				throw new HTTPException(404, {
					message: "Project submission not found",
				});
			}

			return c.json({
				success: true,
				data: submission,
			});
		} catch (error) {
			console.error("Error fetching submission:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to fetch submission",
			});
		}
	})

	// 提交作品到活动
	.post(
		"/events/:eventId/submit-project",
		zValidator(
			"json",
			z.object({
				projectId: z.string().min(1, "Project ID is required"),
				submissionType: z.enum([
					"HACKATHON_PROJECT",
					"DEMO_PROJECT",
					"BUILDING_PROJECT",
				]),
				title: z
					.string()
					.min(1, "Submission title is required")
					.max(255),
				description: z.string().min(1, "Description is required"),
				demoUrl: z.string().url().optional(),
				sourceCode: z.string().url().optional(),
				presentationUrl: z.string().url().optional(),
				// Team members for hackathon projects
				teamMemberIds: z.array(z.string()).optional(),
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
			const data = c.req.valid("json");

			try {
				// 检查活动是否存在
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						title: true,
						type: true,
						startTime: true,
						endTime: true,
						requireProjectSubmission: true,
						projectSubmissionDeadline: true,
						hackathonConfig: true,
					},
				});

				if (!event) {
					throw new HTTPException(404, {
						message: "Event not found",
					});
				}

				if (event.type === "HACKATHON") {
					const hackathonConfig = withHackathonConfigDefaults(
						event.hackathonConfig as any,
					);
					const submissionStages: HackathonStage[] = [
						"DEVELOPMENT",
						"SUBMISSION",
					];
					if (
						!submissionStages.includes(
							hackathonConfig.stage.current,
						)
					) {
						throw new HTTPException(400, {
							message:
								"Project submissions are not open at this stage",
						});
					}
				}

				// 检查是否在提交截止时间内
				if (
					event.projectSubmissionDeadline &&
					new Date() > event.projectSubmissionDeadline
				) {
					throw new HTTPException(400, {
						message: "Project submission deadline has passed",
					});
				}

				// 检查作品是否存在且用户有权限
				const project = await db.project.findUnique({
					where: { id: data.projectId },
				});

				if (!project) {
					throw new HTTPException(404, {
						message: "Project not found",
					});
				}

				// 检查用户是否是作品创建者或团队成员
				const isOwner = project.userId === session.user.id;
				let isTeamMember = false;

				if (!isOwner) {
					const membership = await db.projectMember.findUnique({
						where: {
							projectId_userId: {
								projectId: data.projectId,
								userId: session.user.id,
							},
						},
					});
					isTeamMember = Boolean(membership);
				}

				if (!isOwner && !isTeamMember) {
					throw new HTTPException(403, {
						message:
							"You don't have permission to submit this project",
					});
				}

				// 检查是否已经提交过
				const existingSubmission =
					await db.eventProjectSubmission.findUnique({
						where: {
							eventId_projectId: {
								eventId,
								projectId: data.projectId,
							},
						},
					});

				if (existingSubmission) {
					throw new HTTPException(400, {
						message:
							"Project has already been submitted to this event",
					});
				}

				// 创建作品快照
				const projectSnapshot = {
					id: project.id,
					title: project.title,
					description: project.description,
					techStack: project.projectTags,
					repoUrl: project.url,
					demoUrl: project.demoVideoUrl,
					status: project.stage,
					stage: project.stage,
					coverImage: project.screenshots?.[0],
					createdAt: project.createdAt,
					updatedAt: project.updatedAt,
					submittedAt: new Date(),
				};

				// 创建提交记录
				const submission = await db.eventProjectSubmission.create({
					data: {
						eventId,
						projectId: data.projectId,
						userId: session.user.id,
						submissionType: data.submissionType,
						title: data.title,
						description: data.description,
						demoUrl: data.demoUrl,
						sourceCode: data.sourceCode,
						presentationUrl: data.presentationUrl,
						projectSnapshot,
						status: "SUBMITTED",
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
						event: {
							select: {
								id: true,
								title: true,
								type: true,
							},
						},
					},
				});

				// 如果是黑客松项目且有团队成员，添加团队成员
				if (
					data.submissionType === "HACKATHON_PROJECT" &&
					data.teamMemberIds
				) {
					const validTeamMembers = [];

					for (const memberId of data.teamMemberIds) {
						// 检查用户是否存在
						const member = await db.user.findUnique({
							where: { id: memberId },
							select: { id: true, name: true },
						});

						if (member) {
							// 检查用户是否已经是团队成员
							const existingMember =
								await db.projectMember.findUnique({
									where: {
										projectId_userId: {
											projectId: data.projectId,
											userId: memberId,
										},
									},
								});

							if (!existingMember) {
								await db.projectMember.create({
									data: {
										projectId: data.projectId,
										userId: memberId,
										role: "MEMBER",
									},
								});
								validTeamMembers.push(member);
							}
						}
					}
				}

				return c.json(
					{
						success: true,
						data: submission,
						message: "Project submitted successfully",
					},
					201,
				);
			} catch (error) {
				console.error("Error submitting project:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to submit project",
				});
			}
		},
	)

	// 更新作品提交
	.put(
		"/submissions/:submissionId",
		zValidator(
			"json",
			z.object({
				title: z.string().min(1).max(255).optional(),
				description: z.string().min(1).optional(),
				demoUrl: z.string().url().optional(),
				sourceCode: z.string().url().optional(),
				presentationUrl: z.string().url().optional(),
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

			const submissionId = c.req.param("submissionId");
			const data = c.req.valid("json");

			try {
				// 检查提交记录是否存在
				const existingSubmission =
					await db.eventProjectSubmission.findUnique({
						where: { id: submissionId },
						include: {
							event: {
								select: {
									projectSubmissionDeadline: true,
								},
							},
						},
					});

				if (!existingSubmission) {
					throw new HTTPException(404, {
						message: "Submission not found",
					});
				}

				// 检查用户权限
				if (existingSubmission.userId !== session.user.id) {
					throw new HTTPException(403, {
						message:
							"You don't have permission to update this submission",
					});
				}

				// 检查是否在截止时间内
				if (
					existingSubmission.event.projectSubmissionDeadline &&
					new Date() >
						existingSubmission.event.projectSubmissionDeadline
				) {
					throw new HTTPException(400, {
						message: "Project submission deadline has passed",
					});
				}

				// 检查状态是否允许修改
				if (
					existingSubmission.status === "APPROVED" ||
					existingSubmission.status === "AWARDED"
				) {
					throw new HTTPException(400, {
						message:
							"Cannot update submission that has been approved or awarded",
					});
				}

				// 更新提交记录
				const updatedSubmission =
					await db.eventProjectSubmission.update({
						where: { id: submissionId },
						data: {
							...data,
							status: "SUBMITTED", // 重新提交状态
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
							event: {
								select: {
									id: true,
									title: true,
									type: true,
								},
							},
						},
					});

				return c.json({
					success: true,
					data: updatedSubmission,
					message: "Submission updated successfully",
				});
			} catch (error) {
				console.error("Error updating submission:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to update submission",
				});
			}
		},
	)

	// 审核作品提交 (仅活动组织者或管理员)
	.put(
		"/submissions/:submissionId/review",
		zValidator(
			"json",
			z.object({
				status: z.enum(["APPROVED", "REJECTED"]),
				reviewNote: z.string().optional(),
				judgeScore: z.number().min(0).max(100).optional(),
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

			const submissionId = c.req.param("submissionId");
			const data = c.req.valid("json");

			try {
				// 检查提交记录和权限
				const submission = await db.eventProjectSubmission.findUnique({
					where: { id: submissionId },
					include: {
						event: {
							select: {
								id: true,
								organizerId: true,
								organizationId: true,
							},
						},
					},
				});

				if (!submission) {
					throw new HTTPException(404, {
						message: "Submission not found",
					});
				}

				// 检查用户权限：活动组织者或组织管理员
				let hasPermission =
					submission.event.organizerId === session.user.id;

				if (!hasPermission && submission.event.organizationId) {
					const membership = await db.member.findUnique({
						where: {
							organizationId_userId: {
								organizationId: submission.event.organizationId,
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
							"You don't have permission to review this submission",
					});
				}

				// 更新审核状态
				const reviewedSubmission =
					await db.eventProjectSubmission.update({
						where: { id: submissionId },
						data: {
							status: data.status,
							reviewNote: data.reviewNote,
							judgeScore: data.judgeScore,
							reviewedAt: new Date(),
							reviewedBy: session.user.id,
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
									image: true,
									username: true,
								},
							},
							event: {
								select: {
									id: true,
									title: true,
									type: true,
								},
							},
						},
					});

				return c.json({
					success: true,
					data: reviewedSubmission,
					message: `Submission ${data.status.toLowerCase()} successfully`,
				});
			} catch (error) {
				console.error("Error reviewing submission:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to review submission",
				});
			}
		},
	)

	// 删除作品提交
	.delete("/submissions/:submissionId", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session) {
			throw new HTTPException(401, {
				message: "Authentication required",
			});
		}

		const submissionId = c.req.param("submissionId");

		try {
			// 检查提交记录是否存在
			const submission = await db.eventProjectSubmission.findUnique({
				where: { id: submissionId },
				include: {
					event: {
						select: {
							organizerId: true,
							projectSubmissionDeadline: true,
						},
					},
				},
			});

			if (!submission) {
				throw new HTTPException(404, {
					message: "Submission not found",
				});
			}

			// 检查权限：提交者或活动组织者
			const canDelete =
				submission.userId === session.user.id ||
				submission.event.organizerId === session.user.id;

			if (!canDelete) {
				throw new HTTPException(403, {
					message:
						"You don't have permission to delete this submission",
				});
			}

			// 检查是否已被评分或获奖，如果是则不允许删除
			if (
				submission.status === "AWARDED" ||
				submission.judgeScore ||
				submission.finalScore
			) {
				throw new HTTPException(400, {
					message:
						"Cannot delete submission that has been scored or awarded",
				});
			}

			// 删除提交记录
			await db.eventProjectSubmission.delete({
				where: { id: submissionId },
			});

			return c.json({
				success: true,
				message: "Submission deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting submission:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to delete submission",
			});
		}
	});

export default app;
