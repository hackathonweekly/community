import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/database/prisma";
import { withHackathonConfigDefaults } from "@/features/hackathon/config";
import { config } from "@/config";
import type { HackathonStage } from "@/features/hackathon/config";

const ACTIVE_REGISTRATION_STATUSES = ["APPROVED", "PENDING"] as const;
const PUBLIC_SUBMISSION_STATUSES = [
	"SUBMITTED",
	"UNDER_REVIEW",
	"APPROVED",
	"AWARDED",
] as const;
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
	tagline: z.string().min(10).max(100),
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
	customFields: z.record(z.any()).optional(),
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
};

const submissionInclude = {
	project: {
		include: {
			attachments: {
				orderBy: { order: "asc" },
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
			startTime: true,
			endTime: true,
			organizerId: true,
			organizationId: true,
			type: true,
			hackathonConfig: true,
			projectSubmissionDeadline: true,
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
};

type SubmissionWithRelations = Prisma.EventProjectSubmissionGetPayload<{
	include: typeof submissionInclude;
}>;

const app = new Hono()
	// Public submissions listing
	.get("/events/:eventId/submissions", async (c) => {
		const eventId = c.req.param("eventId");
		const sort = (c.req.query("sort") || "voteCount").toLowerCase();
		const order = c.req.query("order") === "asc" ? "asc" : "desc";
		const session = await getSession(c);

		const submissions = await db.eventProjectSubmission.findMany({
			where: {
				eventId,
				status: {
					in: PUBLIC_SUBMISSION_STATUSES,
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
			remainingVotes = Math.max(0, MAX_VOTES_PER_USER - votes.length);
		}

		const payload = sorted.map((submission, index) =>
			serializeSubmission(submission, {
				rank:
					sort === "votecount"
						? order === "asc"
							? index + 1
							: index + 1
						: undefined,
			}),
		);

		return c.json({
			success: true,
			data: {
				submissions: payload,
				total: payload.length,
				userVotes,
				remainingVotes,
			},
		});
	})

	// Public submission detail
	.get("/submissions/:submissionId", async (c) => {
		const submissionId = c.req.param("submissionId");
		const submission = await fetchSubmissionByIdOrThrow(submissionId);
		return c.json({
			success: true,
			data: serializeSubmission(submission),
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

				// Check if submissions are open (for hackathon events)
				if (event.type === "HACKATHON" && !event.submissionsOpen) {
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

				const sanitizedMembers = sanitizeMemberIds(
					payload.teamMemberIds || [],
					leaderId,
				);
				await ensureUsersExist(sanitizedMembers);

				const submissionId = await db.$transaction(async (tx) => {
					const project = await tx.project.create({
						data: {
							userId: leaderId,
							title: payload.name,
							subtitle: payload.tagline,
							tagline: payload.tagline,
							description: payload.description,
							url: payload.demoUrl,
							communityUseAuth: payload.communityUseAuthorization,
							customFields: payload.customFields,
							isSubmission: true,
							submittedAt: new Date(),
						},
					});

					if (payload.attachments && payload.attachments.length > 0) {
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
							demoUrl: payload.demoUrl,
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

			await db.$transaction(async (tx) => {
				const projectData: Prisma.ProjectUpdateInput = {};
				if (payload.name) {
					projectData.title = payload.name;
				}
				if (payload.tagline) {
					projectData.tagline = payload.tagline;
					projectData.subtitle = payload.tagline;
				}
				if (payload.description !== undefined) {
					projectData.description = payload.description;
				}
				if (payload.demoUrl !== undefined) {
					projectData.url = payload.demoUrl;
				}
				if (payload.communityUseAuthorization !== undefined) {
					projectData.communityUseAuth =
						payload.communityUseAuthorization;
				}
				if (payload.customFields !== undefined) {
					projectData.customFields = payload.customFields;
				}
				if (payload.teamLeaderId) {
					projectData.userId = nextLeaderId;
				}

				if (Object.keys(projectData).length > 0) {
					await tx.project.update({
						where: { id: submission.projectId },
						data: projectData,
					});
				}

				if (payload.attachments !== undefined) {
					await replaceAttachments(
						tx,
						submission.projectId,
						payload.attachments,
					);
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
						demoUrl: payload.demoUrl ?? submission.project.url,
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

		const voteResult = await castVote(submission, session.user.id);
		if (voteResult.error) {
			return c.json(voteResult, voteResult.status);
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

		const revokeResult = await revokeVote(submission, session.user.id);
		if (revokeResult.error) {
			return c.json(revokeResult, revokeResult.status);
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
					},
					include: submissionInclude,
				}),
			]);

		const sorted = sortSubmissions(submissions, "voteCount", "desc");
		const topSubmissions = sorted.slice(0, 10).map((submission, index) => ({
			id: submission.id,
			projectId: submission.projectId,
			name: submission.project.title,
			voteCount: submission.project._count.votes,
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
				orderBy: { name: "asc" },
				ake: 20,
			});
		} else {
			const registrations = await db.eventRegistration.findMany({
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
				orderBy: { registeredAt: "asc" },
				take: 20,
			});
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
			message: "You must register for this event before submitting",
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
	tx: Prisma.TransactionClient,
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
	tx: Prisma.TransactionClient,
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

function buildProjectSnapshot(project: Prisma.Project) {
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
	return submission;
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
				const diff = a.project._count.votes - b.project._count.votes;
				return order === "asc" ? diff : -diff;
			}
		}
	});
}

function serializeSubmission(
	submission: SubmissionWithRelations,
	options: { rank?: number } = {},
) {
	const leader = submission.project.user;
	const uniqueMembers = new Map(
		submission.project.members.map((member) => [member.userId, member]),
	);
	uniqueMembers.delete(leader.id);

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
		voteCount: submission.project._count.votes,
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
					role: "LEADER",
				}
			: null,
		teamMembers: Array.from(uniqueMembers.values()).map((member) => ({
			id: member.user.id,
			name: member.user.name,
			avatar: member.user.image,
			username: member.user.username,
			bio: member.user.bio,
			role: member.role,
		})),
		teamSize: 1 + uniqueMembers.size,
		submitter: submission.user,
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

async function castVote(submission: SubmissionWithRelations, userId: string) {
	if (submission.project.userId === userId) {
		return {
			success: false,
			error: "OWN_PROJECT",
			message: "You cannot vote for your own submission",
			status: 400,
		};
	}

	// Prevent team members from voting for their own team's submission
	// Note: project.userId (leader) is handled above; here we check other members
	const memberIds = getExistingMemberIds(submission);
	if (memberIds.includes(userId)) {
		return {
			success: false,
			error: "OWN_PROJECT",
			message: "You cannot vote for your own team's submission",
			status: 400,
		};
	}

	await ensureParticipant(submission.eventId, userId);

	if (isEventVotingClosed(submission.event)) {
		return {
			success: false,
			error: "VOTING_ENDED",
			message: "Voting has ended for this event",
			status: 400,
		};
	}

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

	const currentVotes = await db.projectVote.count({
		where: {
			eventId: submission.eventId,
			userId,
		},
	});

	if (currentVotes >= MAX_VOTES_PER_USER) {
		return {
			success: false,
			error: "NO_VOTES_LEFT",
			message: "You have used all available votes",
			status: 400,
		};
	}

	await db.projectVote.create({
		data: {
			projectId: submission.projectId,
			userId,
			eventId: submission.eventId,
		},
	});

	const voteCount = await db.projectVote.count({
		where: {
			projectId: submission.projectId,
		},
	});

	return {
		success: true,
		voteCount,
		remainingVotes: Math.max(0, MAX_VOTES_PER_USER - (currentVotes + 1)),
	};
}

async function revokeVote(submission: SubmissionWithRelations, userId: string) {
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

	if (isEventVotingClosed(submission.event)) {
		return {
			success: false,
			error: "VOTING_ENDED",
			message: "Voting has ended for this event",
			status: 400,
		};
	}

	await db.projectVote.delete({
		where: { id: existingVote.id },
	});

	const voteCount = await db.projectVote.count({
		where: { projectId: submission.projectId },
	});

	const remainingVotes = await db.projectVote.count({
		where: { eventId: submission.eventId, userId },
	});

	return {
		success: true,
		voteCount,
		remainingVotes: Math.max(0, MAX_VOTES_PER_USER - remainingVotes),
	};
}

function isEventVotingClosed(event: SubmissionWithRelations["event"]) {
	return Boolean(event.endTime && new Date() > new Date(event.endTime));
}

function buildUserSearchFilters(query: string) {
	return [
		{ name: { contains: query, mode: "insensitive" } },
		{ email: { contains: query, mode: "insensitive" } },
		{ username: { contains: query, mode: "insensitive" } },
	];
}

function parseExcludeIds(raw?: string) {
	if (!raw) return [];
	return raw
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}
