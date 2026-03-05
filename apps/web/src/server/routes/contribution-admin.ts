import { auth } from "@community/lib-server/auth";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";
import {
	getPendingContributions,
	logAdminAction,
} from "@community/lib-server/database/prisma/queries/admin";
import { reviewContribution } from "@community/lib-server/database/prisma/queries/contributions";
import { ContributionStatus } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const reviewContributionSchema = z.object({
	status: z.nativeEnum(ContributionStatus),
	reviewNote: z.string().optional(),
	awardedCp: z.number().min(0).optional(),
});

const batchReviewSchema = z.object({
	contributionIds: z.array(z.string()).min(1).max(20),
	status: z.nativeEnum(ContributionStatus),
	reviewNote: z.string().optional(),
});

export const contributionAdminRouter = new Hono()
	// GET /contributions/pending - 获取待审核贡献列表
	.get("/contributions/pending", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_CONTRIBUTIONS)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const {
				type,
				organizationId,
				limit = "50",
				offset = "0",
			} = c.req.query();

			const contributions = await getPendingContributions({
				type,
				organizationId,
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset),
			});

			return c.json({ contributions });
		} catch (error) {
			console.error("Error fetching pending contributions:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /contributions/:id/review - 审核单个贡献
	.put(
		"/contributions/:id/review",
		zValidator("json", reviewContributionSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (
					!session?.user ||
					!hasPermission(
						session.user,
						AdminPermission.REVIEW_CONTRIBUTIONS,
					)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const contributionId = c.req.param("id");
				const { status, reviewNote, awardedCp } = c.req.valid("json");

				const contribution = await reviewContribution(
					contributionId,
					status,
					session.user.id,
					reviewNote,
				);

				await logAdminAction({
					adminId: session.user.id,
					action: "review_contribution",
					targetType: "contribution",
					targetId: contributionId,
					details: { status, reviewNote, awardedCp },
				});

				return c.json({ contribution });
			} catch (error) {
				console.error("Error reviewing contribution:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// POST /contributions/batch-review - 批量审核贡献
	.post(
		"/contributions/batch-review",
		zValidator("json", batchReviewSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (
					!session?.user ||
					!hasPermission(
						session.user,
						AdminPermission.REVIEW_CONTRIBUTIONS,
					)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const { contributionIds, status, reviewNote } =
					c.req.valid("json");

				const results = [];

				for (const contributionId of contributionIds) {
					try {
						const contribution = await reviewContribution(
							contributionId,
							status,
							session.user.id,
							reviewNote,
						);
						results.push({
							id: contributionId,
							success: true,
							contribution,
						});

						await logAdminAction({
							adminId: session.user.id,
							action: "batch_review_contribution",
							targetType: "contribution",
							targetId: contributionId,
							details: { status, reviewNote },
						});
					} catch (error) {
						console.error(
							`Error reviewing contribution ${contributionId}:`,
							error,
						);
						results.push({
							id: contributionId,
							success: false,
							error: (error as Error).message,
						});
					}
				}

				return c.json({ results });
			} catch (error) {
				console.error("Error batch reviewing contributions:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);

export default contributionAdminRouter;
