import { auth } from "@community/lib-server/auth";
import {
	createEventSeries,
	deactivateEventSeries,
	getEventSeriesDetailByIdentifier,
	getEventSeriesSubscription,
	getEventSeriesSummaryByIdentifier,
	listEventSeries,
	updateEventSeries,
	upsertEventSeriesSubscription,
	removeEventSeriesSubscription,
} from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const listEventSeriesSchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	search: z.string().optional(),
	mine: z
		.string()
		.transform((value) => value === "true")
		.optional(),
	includeInactive: z
		.string()
		.transform((value) => value === "true")
		.optional(),
	organizationId: z.string().optional(),
});

const createEventSeriesSchema = z
	.object({
		title: z.string().min(1).max(120),
		slug: z.string().optional(),
		description: z.string().max(1000).optional(),
		richContent: z.string().optional(),
		coverImage: z.string().optional(),
		logoImage: z.string().optional(),
		tags: z.array(z.string()).default([]),
		organizationId: z.string().optional().nullable(),
		isActive: z.boolean().optional(),
	})
	.transform((value) => ({
		...value,
		organizationId: value.organizationId ?? null,
	}));

const updateEventSeriesSchema = z.object({
	title: z.string().min(1).max(120).optional(),
	slug: z.string().optional(),
	description: z.string().max(1000).optional(),
	richContent: z.string().optional(),
	coverImage: z.string().optional(),
	logoImage: z.string().optional(),
	tags: z.array(z.string()).optional(),
	organizationId: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
});

const subscriptionBodySchema = z.object({
	notifyEmail: z.boolean().optional(),
	notifyInApp: z.boolean().optional(),
});

async function getSessionOrNull(headers: Headers) {
	return auth.api.getSession({ headers });
}

async function assertSeriesManagePermission(params: {
	identifier: string;
	userId: string;
}) {
	const series = await getEventSeriesSummaryByIdentifier(params.identifier);
	if (!series) {
		return {
			ok: false as const,
			code: 404 as const,
			error: "Series not found",
		};
	}

	if (series.organizerId && series.organizerId === params.userId) {
		return { ok: true as const, series };
	}

	if (series.organizationId) {
		const membership = await db.member.findUnique({
			where: {
				organizationId_userId: {
					organizationId: series.organizationId,
					userId: params.userId,
				},
			},
			select: {
				role: true,
			},
		});

		if (membership && ["owner", "admin"].includes(membership.role)) {
			return { ok: true as const, series };
		}
	}

	return {
		ok: false as const,
		code: 403 as const,
		error: "Not authorized to manage this series",
	};
}

export const eventSeriesRouter = new Hono()
	.get("/", zValidator("query", listEventSeriesSchema), async (c) => {
		try {
			const query = c.req.valid("query");
			const session = await getSessionOrNull(c.req.raw.headers);

			if (query.mine && !session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			let organizerId: string | undefined;
			let organizationIds: string[] | undefined;
			if (query.mine && session) {
				organizerId = session.user.id;
				const memberships = await db.member.findMany({
					where: {
						userId: session.user.id,
						role: {
							in: ["owner", "admin"],
						},
					},
					select: {
						organizationId: true,
					},
				});
				organizationIds = memberships.map(
					(membership) => membership.organizationId,
				);
			}

			const result = await listEventSeries({
				page: query.page,
				limit: query.limit,
				search: query.search,
				organizerId,
				organizationIds,
				organizationId: query.organizationId,
				isActive: query.includeInactive ? undefined : true,
			});

			return c.json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Error listing event series:", error);
			return c.json(
				{
					success: false,
					error: "Failed to fetch event series",
				},
				500,
			);
		}
	})
	.get("/:identifier/subscription", async (c) => {
		const session = await getSessionOrNull(c.req.raw.headers);
		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const identifier = c.req.param("identifier");
		const series = await getEventSeriesSummaryByIdentifier(identifier);
		if (!series) {
			return c.json(
				{
					success: false,
					error: "Series not found",
				},
				404,
			);
		}

		const subscription = await getEventSeriesSubscription({
			seriesId: series.id,
			userId: session.user.id,
		});

		return c.json({
			success: true,
			data: {
				subscribed: Boolean(subscription),
				subscription,
			},
		});
	})
	.post(
		"/:identifier/subscription",
		zValidator("json", subscriptionBodySchema),
		async (c) => {
			const session = await getSessionOrNull(c.req.raw.headers);
			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const identifier = c.req.param("identifier");
			const series = await getEventSeriesSummaryByIdentifier(identifier);
			if (!series || !series.isActive) {
				return c.json(
					{
						success: false,
						error: "Series not found",
					},
					404,
				);
			}

			const body = c.req.valid("json");
			const subscription = await upsertEventSeriesSubscription({
				seriesId: series.id,
				userId: session.user.id,
				notifyEmail: body.notifyEmail,
				notifyInApp: body.notifyInApp,
			});

			return c.json({
				success: true,
				data: {
					subscribed: true,
					subscription,
				},
			});
		},
	)
	.delete("/:identifier/subscription", async (c) => {
		const session = await getSessionOrNull(c.req.raw.headers);
		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const identifier = c.req.param("identifier");
		const series = await getEventSeriesSummaryByIdentifier(identifier);
		if (!series) {
			return c.json(
				{
					success: false,
					error: "Series not found",
				},
				404,
			);
		}

		await removeEventSeriesSubscription({
			seriesId: series.id,
			userId: session.user.id,
		});

		return c.json({
			success: true,
			data: {
				subscribed: false,
			},
		});
	})
	.get("/:identifier", async (c) => {
		try {
			const identifier = c.req.param("identifier");
			const session = await getSessionOrNull(c.req.raw.headers);
			const detail = await getEventSeriesDetailByIdentifier(identifier);
			if (!detail) {
				return c.json(
					{
						success: false,
						error: "Series not found",
					},
					404,
				);
			}

			if (!detail.isActive) {
				const canManage =
					session?.user?.id &&
					((detail.organizerId &&
						detail.organizerId === session.user.id) ||
						(detail.organizationId
							? await db.member.findFirst({
									where: {
										organizationId: detail.organizationId,
										userId: session.user.id,
										role: {
											in: ["owner", "admin"],
										},
									},
									select: {
										id: true,
									},
								})
							: null));

				if (!canManage) {
					return c.json(
						{
							success: false,
							error: "Series not found",
						},
						404,
					);
				}
			}

			return c.json({
				success: true,
				data: detail,
			});
		} catch (error) {
			console.error("Error fetching event series detail:", error);
			return c.json(
				{
					success: false,
					error: "Failed to fetch event series",
				},
				500,
			);
		}
	})
	.post("/", zValidator("json", createEventSeriesSchema), async (c) => {
		const session = await getSessionOrNull(c.req.raw.headers);
		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		try {
			const data = c.req.valid("json");

			if (data.organizationId) {
				const membership = await db.member.findUnique({
					where: {
						organizationId_userId: {
							organizationId: data.organizationId,
							userId: session.user.id,
						},
					},
					select: {
						role: true,
					},
				});

				if (
					!membership ||
					!["owner", "admin"].includes(membership.role)
				) {
					return c.json(
						{
							success: false,
							error: "Not authorized to create series for this organization",
						},
						403,
					);
				}
			}

			const series = await createEventSeries({
				title: data.title,
				slug: data.slug,
				description: data.description,
				richContent: data.richContent,
				coverImage: data.coverImage,
				logoImage: data.logoImage,
				tags: data.tags,
				isActive: data.isActive,
				organizerId: data.organizationId ? null : session.user.id,
				organizationId: data.organizationId,
			});

			return c.json({
				success: true,
				data: series,
			});
		} catch (error) {
			console.error("Error creating event series:", error);
			return c.json(
				{
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Failed to create event series",
				},
				500,
			);
		}
	})
	.put(
		"/:identifier",
		zValidator("json", updateEventSeriesSchema),
		async (c) => {
			const session = await getSessionOrNull(c.req.raw.headers);
			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const identifier = c.req.param("identifier");
			const permission = await assertSeriesManagePermission({
				identifier,
				userId: session.user.id,
			});
			if (!permission.ok) {
				return c.json(
					{
						success: false,
						error: permission.error,
					},
					permission.code,
				);
			}

			const data = c.req.valid("json");

			if (data.organizationId) {
				const membership = await db.member.findUnique({
					where: {
						organizationId_userId: {
							organizationId: data.organizationId,
							userId: session.user.id,
						},
					},
					select: {
						role: true,
					},
				});

				if (
					!membership ||
					!["owner", "admin"].includes(membership.role)
				) {
					return c.json(
						{
							success: false,
							error: "Not authorized to move series to this organization",
						},
						403,
					);
				}
			}

			const updatedSeries = await updateEventSeries(identifier, {
				title: data.title,
				slug: data.slug,
				description: data.description,
				richContent: data.richContent,
				coverImage: data.coverImage,
				logoImage: data.logoImage,
				tags: data.tags,
				isActive: data.isActive,
				organizationId: data.organizationId,
				organizerId:
					data.organizationId !== undefined
						? data.organizationId
							? null
							: session.user.id
						: undefined,
			});

			return c.json({
				success: true,
				data: updatedSeries,
			});
		},
	)
	.delete("/:identifier", async (c) => {
		const session = await getSessionOrNull(c.req.raw.headers);
		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const identifier = c.req.param("identifier");
		const permission = await assertSeriesManagePermission({
			identifier,
			userId: session.user.id,
		});
		if (!permission.ok) {
			return c.json(
				{
					success: false,
					error: permission.error,
				},
				permission.code,
			);
		}

		const result = await deactivateEventSeries(identifier);

		return c.json({
			success: true,
			data: result,
		});
	});
