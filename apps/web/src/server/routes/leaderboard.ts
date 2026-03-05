import { db } from "@community/lib-server/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { startOfMonth, startOfWeek } from "date-fns";
import { ContributionStatus } from "@prisma/client";
import { optionalAuthMiddleware } from "../middleware/auth";

const leaderboardRouter = new Hono().use(optionalAuthMiddleware).get(
	"/",
	validator(
		"query",
		z.object({
			period: z.enum(["all", "monthly", "weekly"]).default("all"),
			limit: z
				.string()
				.default("50")
				.transform(Number)
				.pipe(z.number().min(1).max(100)),
			offset: z
				.string()
				.default("0")
				.transform(Number)
				.pipe(z.number().min(0)),
		}),
	),
	describeRoute({
		summary: "Get leaderboard rankings",
		description: "Get community member rankings by积分 value",
		tags: ["Leaderboard"],
	}),
	async (c) => {
		const { period, limit, offset } = c.req.valid("query");
		const user = c.get("user");

		try {
			if (period === "all") {
				// 总榜：直接按 cpValue 排序
				const [rankings, total] = await Promise.all([
					db.user.findMany({
						where: { cpValue: { gt: 0 } },
						select: {
							id: true,
							name: true,
							username: true,
							image: true,
							membershipLevel: true,
							cpValue: true,
						},
						orderBy: { cpValue: "desc" },
						take: limit,
						skip: offset,
					}),
					db.user.count({ where: { cpValue: { gt: 0 } } }),
				]);

				// 添加排名
				const rankedData = rankings.map((u, idx) => ({
					rank: offset + idx + 1,
					user: {
						id: u.id,
						name: u.name,
						username: u.username,
						image: u.image,
						membershipLevel: u.membershipLevel,
					},
					cpValue: u.cpValue,
				}));

				// 获取当前用户排名（如果已登录）
				let currentUserRank = null;
				if (user) {
					const currentUser = await db.user.findUnique({
						where: { id: user.id },
						select: { cpValue: true },
					});

					if (currentUser && currentUser.cpValue > 0) {
						const rank = await db.user.count({
							where: {
								cpValue: { gt: currentUser.cpValue },
							},
						});

						const percentile =
							total > 0
								? Math.round(
										((total - rank) / total) * 100 * 10,
									) / 10
								: 0;

						currentUserRank = {
							rank: rank + 1,
							cpValue: currentUser.cpValue,
							percentile,
						};
					}
				}

				return c.json({
					success: true,
					data: {
						rankings: rankedData,
						total,
						currentUser: currentUserRank,
					},
				});
			}
			// 周榜/月榜：按 Contribution 表计算周期内的积分
			const startDate =
				period === "monthly"
					? startOfMonth(new Date())
					: startOfWeek(new Date(), { weekStartsOn: 1 });

			const contributions = await db.contribution.groupBy({
				by: ["userId"],
				where: {
					status: ContributionStatus.APPROVED,
					createdAt: { gte: startDate },
				},
				_sum: { cpValue: true },
				orderBy: { _sum: { cpValue: "desc" } },
				take: limit,
				skip: offset,
			});

			const total = await db.contribution.groupBy({
				by: ["userId"],
				where: {
					status: ContributionStatus.APPROVED,
					createdAt: { gte: startDate },
				},
				_sum: { cpValue: true },
			});

			// 获取用户信息
			const userIds = contributions.map((c) => c.userId);
			const users = await db.user.findMany({
				where: { id: { in: userIds } },
				select: {
					id: true,
					name: true,
					username: true,
					image: true,
					membershipLevel: true,
					cpValue: true,
				},
			});

			const userMap = new Map(users.map((u) => [u.id, u]));

			const rankedData = contributions
				.map((c, idx) => {
					const u = userMap.get(c.userId);
					if (!u) return null;
					return {
						rank: offset + idx + 1,
						user: {
							id: u.id,
							name: u.name,
							username: u.username,
							image: u.image,
							membershipLevel: u.membershipLevel,
						},
						cpValue: u.cpValue,
						periodCp: c._sum.cpValue || 0,
					};
				})
				.filter(
					(item): item is NonNullable<typeof item> => item !== null,
				);

			// 获取当前用户排名（如果已登录）
			let currentUserRank = null;
			if (user) {
				const userContribution = await db.contribution.aggregate({
					where: {
						userId: user.id,
						status: ContributionStatus.APPROVED,
						createdAt: { gte: startDate },
					},
					_sum: { cpValue: true },
				});

				const periodCp = userContribution._sum.cpValue || 0;

				if (periodCp > 0) {
					const rank = await db.contribution.groupBy({
						by: ["userId"],
						where: {
							status: ContributionStatus.APPROVED,
							createdAt: { gte: startDate },
						},
						_sum: { cpValue: true },
						having: {
							cpValue: { _sum: { gt: periodCp } },
						},
					});

					const percentile =
						total.length > 0
							? Math.round(
									((total.length - rank.length) /
										total.length) *
										100 *
										10,
								) / 10
							: 0;

					currentUserRank = {
						rank: rank.length + 1,
						cpValue: periodCp,
						percentile,
					};
				}
			}

			return c.json({
				success: true,
				data: {
					rankings: rankedData,
					total: total.length,
					currentUser: currentUserRank,
				},
			});
		} catch (error) {
			console.error("Leaderboard error:", error);
			return c.json(
				{
					success: false,
					error: "Failed to fetch leaderboard",
				},
				500,
			);
		}
	},
);

export default leaderboardRouter;
