import { config } from "@community/config";
import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import {
	canCastVote,
	getPublicVotingConfigForEvent,
	getPublicVotingPolicyForEvent,
	getRemainingVotes,
} from "@/features/event-submissions/server/public-voting-policy";
import { normalizeSubmissionFormConfig } from "@/features/event-submissions/utils";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { auth } from "@community/lib-server/auth/auth";
import { db } from "@community/lib-server/database/prisma";
import { zValidator } from "@hono/zod-validator";
import type { Prisma, Project, SubmissionStatus } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

const PUBLIC_SUBMISSION_STATUSES: SubmissionStatus[] = [
	"SUBMITTED",
	"UNDER_REVIEW",
	"APPROVED",
	"AWARDED",
];
const MAX_TEAM_MEMBERS = 10;
const MAX_VOTES_PER_USER = 3;
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE ?? 209_715_200);

const attachmentSchema = z.object({
	id: z.string().optional(),
	fileName: z.string().min(1).max(255),
	fileUrl: z.string().url(),
	fileType: z.string().min(1),
	mimeType: z.string().min(1).max(255).optional(),
	fileSize: z.number().int().min(0).max(MAX_FILE_SIZE),
	order: z.number().int().min(0).optional(),
});

type AttachmentInput = z.infer<typeof attachmentSchema>;

const baseSubmissionSchema = z.object({
	name: z.string().min(1).max(50),
	tagline: z.string().max(100).optional(),
	description: z
		.string()
		.max(5000)
		.optional()
		.or(z.literal(""))
		.transform((value) => sanitizeOptionalString(value)),
	demoUrl: z
		.string()
		.url()
		.optional()
		.or(z.literal(""))
		.transform((value) => sanitizeOptionalString(value)),
	teamLeaderId: z.string().optional(),
	teamMemberIds: z
		.array(z.string())
		.max(MAX_TEAM_MEMBERS)
		.optional()
		.refine((ids) => !ids || new Set(ids).size === ids.length, {
			message: "Duplicate team member ids are not allowed",
		}),
	attachments: z.array(attachmentSchema).optional(),
	communityUseAuthorization: z.boolean(),
	customFields: z.record(z.string(), z.any()).optional(),
});

const createSubmissionSchema = baseSubmissionSchema;
const updateSubmissionSchema = baseSubmissionSchema.partial();

const userSummarySelect = {
	id: true,
	name: true,
	image: true,
	username: true,
	email: true,
	bio: true,
	userRoleString: true,
	phoneNumber: true,
	wechatId: true,
	region: true,
	currentWorkOn: true,
};
type UserSummary = {
	id: string;
	name: string | null;
	image?: string | null;
	username?: string | null;
	email?: string | null;
	bio?: string | null;
	userRoleString?: string | null;
	phoneNumber?: string | null;
	wechatId?: string | null;
	region?: string | null;
	currentWorkOn?: string | null;
};

const submissionInclude = {
	project: {
		include: {
			attachments: {
				orderBy: { order: "asc" as const },
			},
			members: {
				include: {
					user: {
						select: userSummarySelect,
					},
				},
			},
			user: {
				select: userSummarySelect,
			},
			_count: {
				select: {
					votes: true,
					members: true,
				},
			},
		},
	},
	user: {
		select: userSummarySelect,
	},
	event: {
		select: {
			id: true,
			title: true,
			startTime: true,
			endTime: true,
			organizerId: true,
			organizationId: true,
			type: true,
			requireProjectSubmission: true,
			submissionsEnabled: true,
			hackathonConfig: true,
			votingOpen: true,
			projectSubmissionDeadline: true,
			submissionFormConfig: true,
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
} satisfies Prisma.EventProjectSubmissionInclude;

type SubmissionWithRelations = Prisma.EventProjectSubmissionGetPayload<{
	include: typeof submissionInclude;
}>;

const app = new Hono()
	// Public submissions listing
	.get("/events/:eventId/submissions", async (c) => {
		const eventId = c.req.param("eventId");
		const sort = (c.req.query("sort") || "voteCount").toLowerCase();
		const order = c.req.query("order") === "asc" ? "asc" : "desc";
		const includePrivateFieldsRequested =
			c.req.query("includePrivateFields") === "true";
		const session = await getSession(c);

		const event = await db.event.findUnique({
			where: { id: eventId },
			select: {
				id: true,
				type: true,
				requireProjectSubmission: true,
				submissionsEnabled: true,
				hackathonConfig: true,
			},
		});

		if (!event || !isEventSubmissionsEnabled(event)) {
			throw new HTTPException(404, { message: "Event not found" });
		}

		const publicVoting = getPublicVotingConfigForEvent({
			eventType: event.type,
			hackathonConfig: event.hackathonConfig as any,
			defaultQuota: MAX_VOTES_PER_USER,
		});

		const submissions = await db.eventProjectSubmission.findMany({
			where: {
				eventId,
				status: {
					in: PUBLIC_SUBMISSION_STATUSES,
				},
				project: {
					communityUseAuth: true,
				},
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
			include: submissionInclude,
		});

		const sorted = sortSubmissions(submissions, sort, order);
		const map = new Map(
			sorted.map((submission) => [submission.projectId, submission.id]),
		);

		let userVotes: string[] = [];
		let remainingVotes: number | null = null;
		let canAccessPrivateFields = false;

		if (session) {
			const votes = await db.projectVote.findMany({
				where: {
					eventId,
					userId: session.user.id,
				},
				select: {
					projectId: true,
				},
			});
			userVotes = votes
				.map((vote) => map.get(vote.projectId))
				.filter((value): value is string => Boolean(value));
			const policy = getPublicVotingPolicyForEvent({
				eventType: event.type,
				hackathonConfig: event.hackathonConfig as any,
				defaultQuota: MAX_VOTES_PER_USER,
			});
			remainingVotes = getRemainingVotes(policy, votes.length);

			if (includePrivateFieldsRequested && submissions.length > 0) {
				canAccessPrivateFields = await canAdministerEvent(
					submissions[0].event,
					session.user.id,
				);
			}
		}

		const payload = sorted.map((submission, index) =>
			serializeSubmission(submission, {
				rank:
					sort === "votecount"
						? order === "asc"
							? index + 1
							: index + 1
						: undefined,
				includePrivateFields: canAccessPrivateFields,
			}),
		);

		return c.json({
			success: true,
			data: {
				submissions: payload,
				total: payload.length,
				userVotes,
				remainingVotes,
				publicVoting,
			},
		});
	})

	// Public submission detail
	.get("/submissions/:submissionId", async (c) => {
		const submissionId = c.req.param("submissionId");
		const submission = await fetchSubmissionByIdOrThrow(submissionId);
		const session = await getSession(c);
		const includePrivateFields =
			session && (await canManageSubmission(submission, session.user.id));
		if (!submission.project.communityUseAuth && !includePrivateFields) {
			throw new HTTPException(404, { message: "Submission not found" });
		}
		return c.json({
			success: true,
			data: serializeSubmission(submission, {
				includePrivateFields: Boolean(includePrivateFields),
			}),
		});
	})

	// Create submission (new workflow)
	.post(
		"/events/:eventId/submissions",
		zValidator("json", createSubmissionSchema),
		async (c) => {
			try {
				const session = await requireSession(c);
				const eventId = c.req.param("eventId");
				const payload = c.req.valid("json");

				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						type: true,
						organizerId: true,
						organizationId: true,
						requireProjectSubmission: true,
						submissionsEnabled: true,
						submissionFormConfig: true,
						projectSubmissionDeadline: true,
						endTime: true,
						hackathonConfig: true,
						submissionsOpen: true,
					},
				});

				if (!event) {
					throw new HTTPException(404, {
						message: "Event not found",
					});
				}

				await ensureParticipant(eventId, session.user.id);

				const leaderId = payload.teamLeaderId || session.user.id;
				await ensureParticipant(eventId, leaderId);

				if (!isEventSubmissionsEnabled(event)) {
					throw new HTTPException(400, {
						message:
							"Project submissions are disabled for this event",
					});
				}

				// Check if submissions are open
				if (!event.submissionsOpen) {
					throw new HTTPException(400, {
						message: "Project submissions are closed",
					});
				}

				// Optional: Also check deadline if set
				if (
					event.projectSubmissionDeadline &&
					new Date() > event.projectSubmissionDeadline
				) {
					throw new HTTPException(400, {
						message: "Project submission deadline has passed",
					});
				}

				const submissionFormConfig = normalizeSubmissionFormConfig(
					event.submissionFormConfig ?? null,
				);
				const baseFields = submissionFormConfig?.baseFields;
				const taglineConfig = baseFields?.tagline;
				const demoUrlConfig = baseFields?.demoUrl;
				const attachmentsConfig = baseFields?.attachments;

				const taglineEnabled = taglineConfig?.enabled ?? true;
				const taglineRequired =
					(taglineConfig?.required ?? false) && taglineEnabled;
				const taglineLabel = taglineConfig?.label ?? "一句话介绍";

				const demoUrlEnabled = demoUrlConfig?.enabled ?? true;
				const demoUrlRequired =
					(demoUrlConfig?.required ?? false) && demoUrlEnabled;
				const demoUrlLabel = demoUrlConfig?.label ?? "项目链接";

				const attachmentsEnabled =
					attachmentsConfig?.enabled ??
					submissionFormConfig?.settings?.attachmentsEnabled ??
					true;
				const attachmentsRequired =
					(attachmentsConfig?.required ?? false) &&
					attachmentsEnabled;

				const sanitizedMembers = sanitizeMemberIds(
					payload.teamMemberIds || [],
					leaderId,
				);
				await ensureUsersExist(sanitizedMembers);

				const sanitizedTagline = taglineEnabled
					? sanitizeOptionalString(payload.tagline)
					: undefined;
				const sanitizedDemoUrl = demoUrlEnabled
					? payload.demoUrl
					: undefined;

				if (taglineRequired && !sanitizedTagline) {
					throw new HTTPException(400, {
						message: `${taglineLabel}（tagline）为必填`,
					});
				}

				if (demoUrlRequired && !sanitizedDemoUrl) {
					throw new HTTPException(400, {
						message: `${demoUrlLabel}（demoUrl）为必填`,
					});
				}

				if (attachmentsRequired) {
					const attachmentCount = payload.attachments?.length ?? 0;
					if (attachmentCount === 0) {
						throw new HTTPException(400, {
							message: "请至少上传 1 个附件",
						});
					}
				}

				const submissionId = await db.$transaction(async (tx) => {
					const project = await tx.project.create({
						data: {
							userId: leaderId,
							title: payload.name,
							subtitle: sanitizedTagline ?? null,
							tagline: sanitizedTagline ?? null,
							description: payload.description,
							url: sanitizedDemoUrl ?? null,
							communityUseAuth: payload.communityUseAuthorization,
							customFields: payload.customFields,
							isSubmission: true,
							submittedAt: new Date(),
						},
					});

					if (
						attachmentsEnabled &&
						payload.attachments &&
						payload.attachments.length > 0
					) {
						await replaceAttachments(
							tx,
							project.id,
							payload.attachments,
						);
					}

					await syncProjectMembers(tx, {
						projectId: project.id,
						leaderId,
						memberIds: sanitizedMembers,
					});

					const submission = await tx.eventProjectSubmission.create({
						data: {
							eventId,
							projectId: project.id,
							userId: session.user.id,
							submissionType:
								event.type === "HACKATHON"
									? "HACKATHON_PROJECT"
									: "DEMO_PROJECT",
							title: payload.name,
							description: payload.description || "",
							demoUrl: sanitizedDemoUrl ?? null,
							projectSnapshot: buildProjectSnapshot(project),
							status: "SUBMITTED",
						},
					});

					return submission.id;
				});

				const submission =
					await fetchSubmissionByIdOrThrow(submissionId);

				return c.json(
					{
						success: true,
						data: serializeSubmission(submission),
					},
					201,
				);
			} catch (error) {
				console.error(
					"Error creating event submission:",
					error instanceof Error ? error.message : error,
				);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(400, {
					message:
						error instanceof Error
							? error.message
							: "Failed to create submission",
				});
			}
		},
	)

	// Update submission (new workflow)
	.patch(
		"/submissions/:submissionId",
		zValidator("json", updateSubmissionSchema),
		async (c) => {
			const session = await requireSession(c);
			const submissionId = c.req.param("submissionId");
			const payload = c.req.valid("json");

			const submission = await fetchSubmissionByIdOrThrow(submissionId);
			const canManage = await canManageSubmission(
				submission,
				session.user.id,
			);

			if (!canManage) {
				throw new HTTPException(403, {
					message:
						"You don't have permission to update this submission",
				});
			}

			const nextLeaderId =
				payload.teamLeaderId || submission.project.userId;
			if (
				payload.teamLeaderId &&
				payload.teamLeaderId !== submission.project.userId
			) {
				await ensureParticipant(submission.eventId, nextLeaderId);
			}

			const memberIds =
				payload.teamMemberIds !== undefined
					? sanitizeMemberIds(payload.teamMemberIds, nextLeaderId)
					: getExistingMemberIds(submission);
			await ensureUsersExist(memberIds);

			const submissionFormConfig = normalizeSubmissionFormConfig(
				submission.event.submissionFormConfig ?? null,
			);
			const baseFields = submissionFormConfig?.baseFields;
			const taglineConfig = baseFields?.tagline;
			const demoUrlConfig = baseFields?.demoUrl;
			const attachmentsConfig = baseFields?.attachments;

			const taglineEnabled = taglineConfig?.enabled ?? true;
			const taglineRequired =
				(taglineConfig?.required ?? false) && taglineEnabled;
			const taglineLabel = taglineConfig?.label ?? "一句话介绍";

			const demoUrlEnabled = demoUrlConfig?.enabled ?? true;
			const demoUrlRequired =
				(demoUrlConfig?.required ?? false) && demoUrlEnabled;
			const demoUrlLabel = demoUrlConfig?.label ?? "项目链接";

			const attachmentsEnabled =
				attachmentsConfig?.enabled ??
				submissionFormConfig?.settings?.attachmentsEnabled ??
				true;
			const attachmentsRequired =
				(attachmentsConfig?.required ?? false) && attachmentsEnabled;

			const nextTagline = Object.prototype.hasOwnProperty.call(
				payload,
				"tagline",
			)
				? taglineEnabled
					? sanitizeOptionalString(payload.tagline)
					: sanitizeOptionalString(submission.project.tagline)
				: sanitizeOptionalString(submission.project.tagline);

			const nextDemoUrl =
				payload.demoUrl !== undefined
					? demoUrlEnabled
						? payload.demoUrl
						: sanitizeOptionalString(submission.project.url)
					: sanitizeOptionalString(submission.project.url);

			const nextAttachmentCount =
				payload.attachments !== undefined
					? attachmentsEnabled
						? payload.attachments.length
						: submission.project.attachments.length
					: submission.project.attachments.length;

			if (taglineRequired && !nextTagline) {
				throw new HTTPException(400, {
					message: `${taglineLabel}（tagline）为必填`,
				});
			}

			if (demoUrlRequired && !nextDemoUrl) {
				throw new HTTPException(400, {
					message: `${demoUrlLabel}（demoUrl）为必填`,
				});
			}

			if (attachmentsRequired && nextAttachmentCount === 0) {
				throw new HTTPException(400, {
					message: "请至少上传 1 个附件",
				});
			}

			await db.$transaction(async (tx) => {
				const projectData: Record<string, unknown> = {};
				if (payload.name) {
					projectData.title = payload.name;
				}
				if (Object.prototype.hasOwnProperty.call(payload, "tagline")) {
					if (taglineEnabled) {
						const sanitizedTagline = sanitizeOptionalString(
							payload.tagline,
						);
						projectData.tagline = sanitizedTagline ?? null;
						projectData.subtitle = sanitizedTagline ?? null;
					}
				}
				if (payload.description !== undefined) {
					projectData.description = payload.description;
				}
				if (payload.demoUrl !== undefined) {
					if (demoUrlEnabled) {
						projectData.url = payload.demoUrl;
					}
				}
				if (payload.communityUseAuthorization !== undefined) {
					projectData.communityUseAuth =
						payload.communityUseAuthorization;
				}
				if (payload.customFields !== undefined) {
					projectData.customFields = payload.customFields;
				}
				if (payload.teamLeaderId) {
					projectData.user = { connect: { id: nextLeaderId } };
				}

				if (Object.keys(projectData).length > 0) {
					await tx.project.update({
						where: { id: submission.projectId },
						data: projectData as any,
					});
				}

				if (payload.attachments !== undefined) {
					if (attachmentsEnabled) {
						await replaceAttachments(
							tx,
							submission.projectId,
							payload.attachments,
						);
					}
				}

				await syncProjectMembers(tx, {
					projectId: submission.projectId,
					leaderId: nextLeaderId,
					memberIds,
				});

				await tx.eventProjectSubmission.update({
					where: { id: submissionId },
					data: {
						title: payload.name || submission.project.title,
						description:
							payload.description ??
							submission.project.description ??
							"",
						demoUrl: demoUrlEnabled
							? (payload.demoUrl ?? submission.project.url)
							: submission.project.url,
						status: "SUBMITTED",
					},
				});
			});

			const updated = await fetchSubmissionByIdOrThrow(submissionId);
			return c.json({
				success: true,
				data: serializeSubmission(updated),
			});
		},
	)

	// Legacy review endpoint (organizers/admins)
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
			const session = await requireSession(c);
			const submissionId = c.req.param("submissionId");
			const payload = c.req.valid("json");
			const submission = await fetchSubmissionByIdOrThrow(submissionId);

			const hasPermission = await canAdministerEvent(
				submission.event,
				session.user.id,
			);

			if (!hasPermission) {
				throw new HTTPException(403, {
					message:
						"You don't have permission to review this submission",
				});
			}

			const reviewed = await db.eventProjectSubmission.update({
				where: { id: submissionId },
				data: {
					status: payload.status,
					reviewNote: payload.reviewNote,
					judgeScore: payload.judgeScore,
					reviewedAt: new Date(),
					reviewedBy: session.user.id,
				},
				include: submissionInclude,
			});

			return c.json({
				success: true,
				data: serializeSubmission(reviewed),
				message: `Submission ${payload.status.toLowerCase()} successfully`,
			});
		},
	)

	// Admin vote adjustment (organizers/admins)
	.patch(
		"/submissions/:submissionId/vote-adjustment",
		zValidator(
			"json",
			z.object({
				voteCount: z.number().int().min(0).max(1_000_000),
			}),
		),
		async (c) => {
			const session = await requireSession(c);
			const submissionId = c.req.param("submissionId");
			const { voteCount } = c.req.valid("json");
			const submission = await fetchSubmissionByIdOrThrow(submissionId);

			const canAdjust = await canAdministerEvent(
				submission.event,
				session.user.id,
			);

			if (!canAdjust) {
				throw new HTTPException(403, {
					message:
						"You don't have permission to adjust votes for this submission",
				});
			}

			const baseVotes = await db.projectVote.count({
				where: {
					projectId: submission.projectId,
					eventId: submission.eventId,
				},
			});

			const manualVoteAdjustment = Math.max(0, voteCount) - baseVotes;

			const existingCustomFields =
				submission.project.customFields &&
				typeof submission.project.customFields === "object" &&
				!Array.isArray(submission.project.customFields)
					? (submission.project.customFields as Record<
							string,
							unknown
						>)
					: {};

			const nextCustomFields: Record<string, unknown> = {
				...(manualVoteAdjustment === 0
					? Object.fromEntries(
							Object.entries(existingCustomFields).filter(
								([key]) => key !== "manualVoteAdjustment",
							),
						)
					: {
							...existingCustomFields,
							manualVoteAdjustment,
						}),
			};

			await db.project.update({
				where: { id: submission.projectId },
				data: {
					customFields: nextCustomFields as Prisma.InputJsonValue,
				},
			});

			const updated = await fetchSubmissionByIdOrThrow(submissionId);
			return c.json({
				success: true,
				data: serializeSubmission(updated),
				message: "Vote count adjusted successfully",
			});
		},
	)

	// Delete submission
	.delete("/submissions/:submissionId", async (c) => {
		const session = await requireSession(c);
		const submissionId = c.req.param("submissionId");
		const submission = await fetchSubmissionByIdOrThrow(submissionId);
		const canManage = await canManageSubmission(
			submission,
			session.user.id,
		);

		if (!canManage) {
			throw new HTTPException(403, {
				message: "You don't have permission to delete this submission",
			});
		}

		await db.$transaction(async (tx) => {
			await tx.eventProjectSubmission.delete({
				where: { id: submissionId },
			});
			await tx.project.delete({ where: { id: submission.projectId } });
		});

		return c.json({
			success: true,
			message: "Submission deleted successfully",
		});
	})

	// Voting endpoints
	.post("/submissions/:submissionId/vote", async (c) => {
		const session = await requireSession(c);
		const submissionId = c.req.param("submissionId");
		const submission = await fetchSubmissionByIdOrThrow(submissionId);
		if (!submission.project.communityUseAuth) {
			throw new HTTPException(404, { message: "Submission not found" });
		}

		const voteResult = await castVote(submission, session.user.id);
		if (voteResult.error) {
			return c.json(voteResult, {
				status: voteResult.status as ContentfulStatusCode,
			});
		}

		return c.json({
			success: true,
			voteCount: voteResult.voteCount,
			remainingVotes: voteResult.remainingVotes,
		});
	})

	.delete("/submissions/:submissionId/vote", async (c) => {
		const session = await requireSession(c);
		const submissionId = c.req.param("submissionId");
		const submission = await fetchSubmissionByIdOrThrow(submissionId);
		if (!submission.project.communityUseAuth) {
			throw new HTTPException(404, { message: "Submission not found" });
		}

		const revokeResult = await revokeVote(submission, session.user.id);
		if (revokeResult.error) {
			return c.json(revokeResult, {
				status: revokeResult.status as ContentfulStatusCode,
			});
		}

		return c.json({
			success: true,
			voteCount: revokeResult.voteCount,
			remainingVotes: revokeResult.remainingVotes,
		});
	})

	// Voting stats
	.get("/events/:eventId/votes/stats", async (c) => {
		const eventId = c.req.param("eventId");

		const [totalVotes, totalParticipants, voterIds, submissions] =
			await Promise.all([
				db.projectVote.count({ where: { eventId } }),
				db.eventRegistration.count({
					where: {
						eventId,
						status: { in: ACTIVE_REGISTRATION_STATUSES },
					},
				}),
				db.projectVote.findMany({
					where: { eventId },
					select: { userId: true },
					distinct: ["userId"],
				}),
				db.eventProjectSubmission.findMany({
					where: {
						eventId,
						status: { in: PUBLIC_SUBMISSION_STATUSES },
						project: {
							communityUseAuth: true,
						},
					},
					include: submissionInclude,
				}),
			]);

		const sorted = sortSubmissions(submissions, "voteCount", "desc");
		const topSubmissions = sorted.slice(0, 10).map((submission, index) => ({
			id: submission.id,
			projectId: submission.projectId,
			name: submission.project.title,
			voteCount: getVoteStats(submission).voteCount,
			rank: index + 1,
		}));

		return c.json({
			success: true,
			data: {
				totalVotes,
				totalParticipants,
				votedParticipants: voterIds.length,
				topSubmissions,
			},
		});
	})

	// Participant search (team builder)
	.get("/events/:eventId/participants/search", async (c) => {
		const session = await requireSession(c);
		const eventId = c.req.param("eventId");
		const query = (c.req.query("q") || "").trim();
		const scope = (c.req.query("scope") || "event").toLowerCase();
		const exclude = parseExcludeIds(c.req.query("excludeIds"));

		if (!query) {
			return c.json(
				{
					success: true,
					data: { users: [] },
				},
				200,
			);
		}

		let users;
		if (scope === "global") {
			users = await db.user.findMany({
				where: {
					id: { notIn: exclude },
					OR: buildUserSearchFilters(query),
				},
				select: userSummarySelect,
				orderBy: { name: "asc" as const },
				take: 20,
			});
		} else {
			const registrations = (await db.eventRegistration.findMany({
				where: {
					eventId,
					status: { in: ACTIVE_REGISTRATION_STATUSES },
					user: {
						OR: buildUserSearchFilters(query),
						id: { notIn: exclude },
					},
				},
				select: {
					user: {
						select: userSummarySelect,
					},
				},
				orderBy: { registeredAt: "asc" as const },
				take: 20,
			})) as Array<{ user: UserSummary }>;
			users = registrations.map((registration) => registration.user);
		}

		return c.json({
			success: true,
			data: {
				users: users.map((user) => ({
					...user,
					isParticipant: scope !== "global",
				})),
			},
		});
	});

export default app;

function sanitizeOptionalString(value?: string | null) {
	if (!value) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

async function getSession(c: any) {
	try {
		return await auth.api.getSession({
			headers: c.req.raw.headers,
		});
	} catch (error) {
		return null;
	}
}

async function requireSession(c: any) {
	const session = await getSession(c);
	if (!session) {
		throw new HTTPException(401, { message: "Authentication required" });
	}
	return session;
}

async function hasActiveRegistration(eventId: string, userId: string) {
	const registration = await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});

	return Boolean(
		registration &&
			ACTIVE_REGISTRATION_STATUSES.includes(registration.status as any),
	);
}

async function ensureParticipant(eventId: string, userId: string) {
	const registration = await db.eventRegistration.findUnique({
		where: {
			eventId_userId: {
				eventId,
				userId,
			},
		},
	});
	if (
		!registration ||
		!ACTIVE_REGISTRATION_STATUSES.includes(registration.status as any)
	) {
		throw new HTTPException(403, {
			message: "您需要先报名才能投票",
		});
	}
	return registration;
}

function sanitizeMemberIds(ids: string[], leaderId: string) {
	return Array.from(new Set(ids.filter((id) => id !== leaderId)));
}

async function ensureUsersExist(userIds: string[]) {
	if (userIds.length === 0) return;
	const count = await db.user.count({
		where: {
			id: { in: userIds },
		},
	});
	if (count !== userIds.length) {
		throw new HTTPException(400, {
			message: "One or more team members do not exist",
		});
	}
}

async function syncProjectMembers(
	tx: TransactionClient,
	params: { projectId: string; leaderId: string; memberIds: string[] },
) {
	await tx.projectMember.deleteMany({
		where: { projectId: params.projectId },
	});
	const data = [
		{
			projectId: params.projectId,
			userId: params.leaderId,
			role: "LEADER",
		},
		...params.memberIds.map((userId) => ({
			projectId: params.projectId,
			userId,
			role: "MEMBER",
		})),
	];
	if (data.length > 0) {
		await tx.projectMember.createMany({ data, skipDuplicates: true });
	}
}

async function replaceAttachments(
	tx: TransactionClient,
	projectId: string,
	attachments: AttachmentInput[] = [],
) {
	await tx.projectAttachment.deleteMany({ where: { projectId } });
	if (!attachments.length) return;
	await tx.projectAttachment.createMany({
		data: attachments.map((attachment, index) => ({
			projectId,
			fileName: attachment.fileName,
			fileUrl: attachment.fileUrl,
			fileType: attachment.fileType,
			mimeType: attachment.mimeType,
			fileSize: attachment.fileSize,
			order: attachment.order ?? index,
		})),
	});
}

function buildProjectSnapshot(project: Project) {
	return {
		id: project.id,
		title: project.title,
		description: project.description,
		tagline: project.tagline,
		url: project.url,
		stage: project.stage,
		screenshots: project.screenshots,
		submittedAt: project.submittedAt ?? new Date(),
	};
}

async function fetchSubmissionByIdOrThrow(id: string) {
	const submission = await db.eventProjectSubmission.findUnique({
		where: { id },
		include: submissionInclude,
	});
	if (!submission) {
		throw new HTTPException(404, { message: "Submission not found" });
	}
	if (!isEventSubmissionsEnabled(submission.event)) {
		throw new HTTPException(404, { message: "Submission not found" });
	}
	return submission;
}

function getManualVoteAdjustment(submission: SubmissionWithRelations) {
	const customFields = submission.project.customFields;
	if (
		customFields &&
		typeof customFields === "object" &&
		!Array.isArray(customFields)
	) {
		const rawAdjustment = (customFields as Record<string, unknown>)
			.manualVoteAdjustment;
		if (
			typeof rawAdjustment === "number" &&
			Number.isFinite(rawAdjustment)
		) {
			return rawAdjustment;
		}
		if (typeof rawAdjustment === "string" && rawAdjustment.trim()) {
			const parsed = Number(rawAdjustment);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return 0;
}

function getVoteStats(submission: SubmissionWithRelations) {
	const manualVoteAdjustment = getManualVoteAdjustment(submission);
	const baseVoteCount = submission.project._count.votes;
	const voteCount = Math.max(
		0,
		Math.round(baseVoteCount + manualVoteAdjustment),
	);
	return { manualVoteAdjustment, baseVoteCount, voteCount };
}

function sortSubmissions(
	submissions: SubmissionWithRelations[],
	sort: string,
	order: "asc" | "desc",
) {
	return [...submissions].sort((a, b) => {
		switch (sort) {
			case "createdat": {
				const diff =
					new Date(a.submittedAt).getTime() -
					new Date(b.submittedAt).getTime();
				return order === "asc" ? diff : -diff;
			}
			case "name": {
				return order === "asc"
					? a.project.title.localeCompare(b.project.title)
					: b.project.title.localeCompare(a.project.title);
			}
			default: {
				const aVotes = getVoteStats(a).voteCount;
				const bVotes = getVoteStats(b).voteCount;
				const diff = aVotes - bVotes;
				return order === "asc" ? diff : -diff;
			}
		}
	});
}

type SubmissionFieldConfig = {
	key: string;
	label: string;
	type: string;
	required: boolean;
	enabled: boolean;
	publicVisible: boolean;
	order: number;
	description?: string;
	options?: string[];
	placeholder?: string;
};

function normalizeSubmissionFields(config: unknown): SubmissionFieldConfig[] {
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		return [];
	}
	const fields = (config as any).fields;
	if (!Array.isArray(fields)) return [];

	const normalizedFields: SubmissionFieldConfig[] = [];

	fields.forEach((field, index) => {
		if (!field || typeof field !== "object") return;

		const safeField = field as Record<string, unknown>;
		const key = typeof safeField.key === "string" ? safeField.key : "";
		const label =
			typeof safeField.label === "string" ? safeField.label : "";
		if (!key || !label) return;

		const order =
			typeof safeField.order === "number" ? safeField.order : index;
		const options =
			Array.isArray(safeField.options) &&
			(safeField.options as unknown[]).length > 0
				? (safeField.options as unknown[])
						.map((option) =>
							typeof option === "string"
								? option
								: String(option),
						)
						.filter((option) => option.trim() !== "")
				: undefined;

		normalizedFields.push({
			key,
			label,
			type: typeof safeField.type === "string" ? safeField.type : "text",
			required:
				safeField.required === undefined
					? false
					: Boolean(safeField.required),
			description:
				typeof safeField.description === "string"
					? safeField.description
					: undefined,
			enabled:
				safeField.enabled === undefined
					? true
					: Boolean(safeField.enabled),
			publicVisible:
				safeField.publicVisible === undefined
					? true
					: Boolean(safeField.publicVisible),
			placeholder:
				typeof safeField.placeholder === "string"
					? safeField.placeholder
					: undefined,
			options,
			order,
		});
	});

	return normalizedFields.sort((a, b) => a.order - b.order);
}

function serializeSubmission(
	submission: SubmissionWithRelations,
	options: { rank?: number; includePrivateFields?: boolean } = {},
) {
	const leader = submission.project.user;
	const uniqueMembers = new Map(
		submission.project.members.map((member) => [member.userId, member]),
	);
	uniqueMembers.delete(leader.id);
	const includePrivateFields = options.includePrivateFields === true;

	// Ensure attachment URLs are absolute and point to the configured public endpoint
	const resolvePublicUrl = (url: string | null | undefined) => {
		const value = url ?? "";
		if (!value) return value;
		if (value.startsWith("http://") || value.startsWith("https://"))
			return value;
		const base = (config.storage.endpoints.public || "")
			.trim()
			.replace(/\/+$/, "");
		const path = value.replace(/^\/+/, "");
		return base ? `${base}/${path}` : value;
	};

	const attachments = submission.project.attachments.map((attachment) => ({
		id: attachment.id,
		fileName: attachment.fileName,
		fileUrl: resolvePublicUrl(attachment.fileUrl),
		fileType: attachment.fileType,
		mimeType: attachment.mimeType,
		fileSize: attachment.fileSize,
		order: attachment.order,
	}));

	const coverImage =
		attachments.find((attachment) => attachment.fileType === "image")
			?.fileUrl ||
		submission.project.screenshots?.[0] ||
		null;
	const hasCustomFieldsObject =
		submission.project.customFields &&
		typeof submission.project.customFields === "object" &&
		!Array.isArray(submission.project.customFields);
	const rawCustomFields = hasCustomFieldsObject
		? (submission.project.customFields as Record<string, unknown>)
		: null;
	const normalizedFieldConfigs = normalizeSubmissionFields(
		submission.event.submissionFormConfig,
	);
	const enabledFieldConfigs = normalizedFieldConfigs.filter(
		(field) => field.enabled !== false,
	);
	const visibleFieldConfigs = enabledFieldConfigs.filter(
		(field) => includePrivateFields || field.publicVisible !== false,
	);

	const visibleCustomFieldAnswers = rawCustomFields
		? visibleFieldConfigs
				.map((field) => ({
					...field,
					required: Boolean(field.required),
					enabled: field.enabled !== false,
					publicVisible: field.publicVisible !== false,
					value: rawCustomFields[field.key],
				}))
				.filter(
					(answer) =>
						answer.value !== undefined && answer.value !== null,
				)
		: [];

	const customFields =
		includePrivateFields && rawCustomFields
			? rawCustomFields
			: visibleCustomFieldAnswers.length > 0
				? Object.fromEntries(
						visibleCustomFieldAnswers.map((answer) => [
							answer.key,
							answer.value,
						]),
					)
				: null;

	return {
		id: submission.id,
		submissionId: submission.id,
		projectId: submission.projectId,
		eventId: submission.eventId,
		name: submission.project.title,
		tagline: submission.project.tagline,
		description: submission.project.description,
		demoUrl: submission.project.url,
		communityUseAuthorization: submission.project.communityUseAuth,
		status: submission.status,
		customFieldAnswers: visibleCustomFieldAnswers,
		customFields,
		...getVoteStats(submission),
		rank: options.rank ?? null,
		submittedAt: submission.submittedAt,
		updatedAt: submission.updatedAt,
		coverImage,
		attachments,
		teamLeader: leader
			? {
					id: leader.id,
					name: leader.name,
					avatar: leader.image,
					username: leader.username,
					bio: leader.bio,
					...(includePrivateFields && {
						email: leader.email,
						phoneNumber: leader.phoneNumber,
						wechatId: leader.wechatId,
						region: leader.region,
						userRoleString: leader.userRoleString,
						currentWorkOn: leader.currentWorkOn,
					}),
					role: "LEADER",
				}
			: null,
		teamMembers: Array.from(uniqueMembers.values()).map((member) => ({
			id: member.user.id,
			name: member.user.name,
			avatar: member.user.image,
			username: member.user.username,
			bio: member.user.bio,
			...(includePrivateFields && {
				email: member.user.email,
				phoneNumber: member.user.phoneNumber,
				wechatId: member.user.wechatId,
				region: member.user.region,
				userRoleString: member.user.userRoleString,
				currentWorkOn: member.user.currentWorkOn,
			}),
			role: member.role,
		})),
		teamSize: 1 + uniqueMembers.size,
		submitter: {
			id: submission.user.id,
			name: submission.user.name,
			image: submission.user.image,
			username: submission.user.username,
			...(includePrivateFields && {
				email: submission.user.email,
				phoneNumber: submission.user.phoneNumber,
				wechatId: submission.user.wechatId,
				region: submission.user.region,
				userRoleString: submission.user.userRoleString,
				currentWorkOn: submission.user.currentWorkOn,
			}),
		},
		event: {
			id: submission.event.id,
			title: submission.event.title,
			startTime: submission.event.startTime,
			endTime: submission.event.endTime,
		},
		awards: submission.awards?.map((award) => ({
			id: award.id,
			award: award.award,
		})),
	};
}

async function canAdministerEvent(
	event: SubmissionWithRelations["event"],
	userId: string,
) {
	if (event.organizerId === userId) {
		return true;
	}
	if (!event.organizationId) {
		return false;
	}
	const membership = await db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId: event.organizationId,
				userId,
			},
		},
	});
	return Boolean(
		membership &&
			["owner", "admin"].includes((membership.role as string) || ""),
	);
}

async function canManageSubmission(
	submission: SubmissionWithRelations,
	userId: string,
) {
	if (submission.project.userId === userId) {
		return true;
	}
	if (submission.userId === userId) {
		return true;
	}
	return await canAdministerEvent(submission.event, userId);
}

function getExistingMemberIds(submission: SubmissionWithRelations) {
	return submission.project.members
		.filter((member) => member.userId !== submission.project.userId)
		.map((member) => member.userId);
}

type VotingEligibilityError = {
	success: false;
	error: string;
	message: string;
	status: number;
};

async function validateVotingEligibility(
	submission: SubmissionWithRelations,
	userId: string,
): Promise<VotingEligibilityError | null> {
	// Check if user is the project owner
	if (submission.project.userId === userId) {
		return {
			success: false,
			error: "OWN_PROJECT",
			message: "You cannot vote for your own submission",
			status: 400,
		};
	}

	// Prevent team members from voting for their own team's submission
	const memberIds = getExistingMemberIds(submission);
	if (memberIds.includes(userId)) {
		return {
			success: false,
			error: "OWN_PROJECT",
			message: "You cannot vote for your own team's submission",
			status: 400,
		};
	}

	// Check if voting is open
	if (!submission.event.votingOpen) {
		return {
			success: false,
			error: "VOTING_CLOSED",
			message: "Voting is closed for this event",
			status: 403,
		};
	}

	// Check if voting period has ended
	if (isEventVotingClosed(submission.event)) {
		return {
			success: false,
			error: "VOTING_ENDED",
			message: "Voting has ended for this event",
			status: 400,
		};
	}

	// Get public voting configuration
	const publicVoting = getPublicVotingConfigForEvent({
		eventType: submission.event.type,
		hackathonConfig: submission.event.hackathonConfig as any,
		defaultQuota: MAX_VOTES_PER_USER,
	});

	// Check if public voting is allowed
	if (!publicVoting.allowPublicVoting) {
		return {
			success: false,
			error: "PUBLIC_VOTING_DISABLED",
			message: "Public voting is disabled for this event",
			status: 403,
		};
	}

	// Check participant registration if required
	if (publicVoting.scope === "PARTICIPANTS") {
		const eligible = await hasActiveRegistration(
			submission.eventId,
			userId,
		);
		if (!eligible) {
			return {
				success: false,
				error: "NOT_ELIGIBLE",
				message: "You need to register for this event to vote",
				status: 403,
			};
		}
	}

	return null;
}

async function castVote(submission: SubmissionWithRelations, userId: string) {
	// Validate voting eligibility
	const eligibilityError = await validateVotingEligibility(
		submission,
		userId,
	);
	if (eligibilityError) {
		return eligibilityError;
	}

	// Check if user has already voted
	const existingVote = await db.projectVote.findUnique({
		where: {
			projectId_userId_eventId: {
				projectId: submission.projectId,
				userId,
				eventId: submission.eventId,
			},
		},
	});

	if (existingVote) {
		return {
			success: false,
			error: "ALREADY_VOTED",
			message: "You have already voted for this submission",
			status: 400,
		};
	}

	// Check vote quota
	const policy = getPublicVotingPolicyForEvent({
		eventType: submission.event.type,
		hackathonConfig: submission.event.hackathonConfig as any,
		defaultQuota: MAX_VOTES_PER_USER,
	});

	let currentVotes: number | null = null;
	if (policy.quota !== null) {
		currentVotes = await db.projectVote.count({
			where: {
				eventId: submission.eventId,
				userId,
			},
		});

		if (!canCastVote(policy, currentVotes)) {
			return {
				success: false,
				error: "NO_VOTES_LEFT",
				message: "You have used all available votes",
				status: 400,
			};
		}
	}

	// Create the vote
	await db.projectVote.create({
		data: {
			projectId: submission.projectId,
			userId,
			eventId: submission.eventId,
		},
	});

	// Calculate new vote count
	const baseVoteCount = await db.projectVote.count({
		where: {
			projectId: submission.projectId,
		},
	});
	const voteCount = Math.max(
		0,
		Math.round(baseVoteCount + getManualVoteAdjustment(submission)),
	);

	return {
		success: true,
		voteCount,
		remainingVotes:
			policy.quota === null
				? null
				: Math.max(0, policy.quota - ((currentVotes ?? 0) + 1)),
	};
}

async function revokeVote(submission: SubmissionWithRelations, userId: string) {
	// Check if vote exists
	const existingVote = await db.projectVote.findUnique({
		where: {
			projectId_userId_eventId: {
				projectId: submission.projectId,
				userId,
				eventId: submission.eventId,
			},
		},
	});

	if (!existingVote) {
		return {
			success: false,
			error: "NOT_VOTED",
			message: "You have not voted for this submission",
			status: 400,
		};
	}

	// Validate voting eligibility (same checks as castVote)
	const eligibilityError = await validateVotingEligibility(
		submission,
		userId,
	);
	if (eligibilityError) {
		return eligibilityError;
	}

	// Delete the vote
	await db.projectVote.delete({
		where: { id: existingVote.id },
	});

	// Calculate new vote count
	const baseVoteCount = await db.projectVote.count({
		where: { projectId: submission.projectId },
	});
	const voteCount = Math.max(
		0,
		Math.round(baseVoteCount + getManualVoteAdjustment(submission)),
	);

	// Calculate remaining votes
	const policy = getPublicVotingPolicyForEvent({
		eventType: submission.event.type,
		hackathonConfig: submission.event.hackathonConfig as any,
		defaultQuota: MAX_VOTES_PER_USER,
	});
	const votesUsedAfterRevoke =
		policy.quota === null
			? 0
			: await db.projectVote.count({
					where: { eventId: submission.eventId, userId },
				});

	return {
		success: true,
		voteCount,
		remainingVotes:
			policy.quota === null
				? null
				: getRemainingVotes(policy, votesUsedAfterRevoke),
	};
}

function isEventVotingClosed(event: SubmissionWithRelations["event"]) {
	return Boolean(event.endTime && new Date() > new Date(event.endTime));
}

function buildUserSearchFilters(query: string): Array<Record<string, unknown>> {
	return [
		{ name: { contains: query, mode: "insensitive" as const } },
		{ email: { contains: query, mode: "insensitive" as const } },
		{ username: { contains: query, mode: "insensitive" as const } },
	];
}

function parseExcludeIds(raw?: string) {
	if (!raw) return [];
	return raw
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}
type TransactionClient = Parameters<typeof db.$transaction>[0] extends (
	tx: infer T,
) => unknown
	? T
	: never;
