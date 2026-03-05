import { db } from "@community/lib-server/database/prisma/client";
import { Prisma } from "@prisma/client";

const FALLBACK_SLUG = "series";

function toSlug(input: string) {
	const normalized = input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return normalized || FALLBACK_SLUG;
}

function isCuidIdentifier(identifier: string) {
	return identifier.length === 25 && identifier.startsWith("c");
}

export function resolveEventSeriesIdentifier(identifier: string) {
	return isCuidIdentifier(identifier)
		? { id: identifier }
		: { slug: identifier };
}

async function slugExists(slug: string, excludeId?: string) {
	const existing = await db.eventSeries.findFirst({
		where: {
			slug,
			...(excludeId
				? {
						id: {
							not: excludeId,
						},
					}
				: {}),
		},
		select: { id: true },
	});

	return Boolean(existing);
}

export async function ensureUniqueEventSeriesSlug(params: {
	title?: string;
	desiredSlug?: string | null;
	excludeId?: string;
}) {
	const raw =
		params.desiredSlug?.trim() || params.title?.trim() || FALLBACK_SLUG;
	const baseSlug = toSlug(raw);

	if (!(await slugExists(baseSlug, params.excludeId))) {
		return baseSlug;
	}

	let suffix = 2;
	while (suffix < 1000) {
		const candidate = `${baseSlug}-${suffix}`;
		if (!(await slugExists(candidate, params.excludeId))) {
			return candidate;
		}
		suffix += 1;
	}

	throw new Error("Unable to generate a unique series slug");
}

export function normalizeEventSeriesOwner(params: {
	organizerId?: string | null;
	organizationId?: string | null;
}) {
	const organizerId =
		params.organizerId?.trim() && params.organizerId.trim().length > 0
			? params.organizerId.trim()
			: null;
	const organizationId =
		params.organizationId?.trim() && params.organizationId.trim().length > 0
			? params.organizationId.trim()
			: null;
	const hasOrganizer = organizerId !== null;
	const hasOrganization = organizationId !== null;

	if (hasOrganizer === hasOrganization) {
		throw new Error(
			"Exactly one of organizerId or organizationId must be provided for event series ownership.",
		);
	}

	return {
		organizerId,
		organizationId,
	};
}

export type EventSeriesSummary = Prisma.EventSeriesGetPayload<{
	include: {
		organizer: {
			select: {
				id: true;
				name: true;
				image: true;
				username: true;
			};
		};
		organization: {
			select: {
				id: true;
				name: true;
				slug: true;
				logo: true;
			};
		};
		_count: {
			select: {
				events: true;
				subscriptions: true;
			};
		};
	};
}>;

const eventSeriesSummaryInclude = Prisma.validator<Prisma.EventSeriesInclude>()(
	{
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
				events: true,
				subscriptions: true,
			},
		},
	},
);

export async function createEventSeries(data: {
	title: string;
	description?: string;
	richContent?: string;
	coverImage?: string;
	logoImage?: string;
	tags?: string[];
	slug?: string | null;
	organizerId?: string | null;
	organizationId?: string | null;
	isActive?: boolean;
}) {
	const owner = normalizeEventSeriesOwner({
		organizerId: data.organizerId,
		organizationId: data.organizationId,
	});
	const slug = await ensureUniqueEventSeriesSlug({
		title: data.title,
		desiredSlug: data.slug,
	});

	return db.eventSeries.create({
		data: {
			title: data.title,
			description: data.description,
			richContent: data.richContent,
			coverImage: data.coverImage,
			logoImage: data.logoImage,
			tags: data.tags || [],
			slug,
			isActive: data.isActive ?? true,
			organizerId: owner.organizerId,
			organizationId: owner.organizationId,
		},
		include: eventSeriesSummaryInclude,
	});
}

export async function updateEventSeries(
	identifier: string,
	data: Partial<{
		title: string;
		description: string;
		richContent: string;
		coverImage: string;
		logoImage: string;
		tags: string[];
		slug: string | null;
		organizerId: string | null;
		organizationId: string | null;
		isActive: boolean;
	}>,
) {
	const existing = await db.eventSeries.findFirst({
		where: {
			OR: [{ id: identifier }, { slug: identifier }],
		},
		select: {
			id: true,
			title: true,
			organizerId: true,
			organizationId: true,
		},
	});

	if (!existing) {
		throw new Error("Event series not found");
	}

	let slug: string | undefined;
	if (data.slug !== undefined || data.title !== undefined) {
		slug = await ensureUniqueEventSeriesSlug({
			title: data.title ?? existing.title,
			desiredSlug: data.slug,
			excludeId: existing.id,
		});
	}

	let ownerUpdate:
		| { organizerId: string | null; organizationId: string | null }
		| undefined;
	if (data.organizerId !== undefined || data.organizationId !== undefined) {
		ownerUpdate = normalizeEventSeriesOwner({
			organizerId:
				data.organizerId !== undefined
					? data.organizerId
					: existing.organizerId,
			organizationId:
				data.organizationId !== undefined
					? data.organizationId
					: existing.organizationId,
		});
	}

	return db.eventSeries.update({
		where: { id: existing.id },
		data: {
			...(data.title !== undefined && { title: data.title }),
			...(data.description !== undefined && {
				description: data.description,
			}),
			...(data.richContent !== undefined && {
				richContent: data.richContent,
			}),
			...(data.coverImage !== undefined && {
				coverImage: data.coverImage,
			}),
			...(data.logoImage !== undefined && { logoImage: data.logoImage }),
			...(data.tags !== undefined && { tags: data.tags }),
			...(data.isActive !== undefined && { isActive: data.isActive }),
			...(slug !== undefined && { slug }),
			...(ownerUpdate && {
				organizerId: ownerUpdate.organizerId,
				organizationId: ownerUpdate.organizationId,
			}),
		},
		include: eventSeriesSummaryInclude,
	});
}

export async function deactivateEventSeries(identifier: string) {
	const existing = await db.eventSeries.findFirst({
		where: {
			OR: [{ id: identifier }, { slug: identifier }],
		},
		select: { id: true },
	});
	if (!existing) {
		throw new Error("Event series not found");
	}

	return db.eventSeries.update({
		where: { id: existing.id },
		data: { isActive: false },
		include: eventSeriesSummaryInclude,
	});
}

export async function getEventSeriesSummaryByIdentifier(identifier: string) {
	return db.eventSeries.findFirst({
		where: {
			OR: [{ id: identifier }, { slug: identifier }],
		},
		include: eventSeriesSummaryInclude,
	});
}

export async function getEventSeriesDetailByIdentifier(identifier: string) {
	const series = await db.eventSeries.findFirst({
		where: {
			OR: [{ id: identifier }, { slug: identifier }],
		},
		include: {
			...eventSeriesSummaryInclude,
			events: {
				where: {
					status: "PUBLISHED",
				},
				orderBy: {
					startTime: "asc",
				},
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
	});

	return series;
}

export async function listEventSeries(params?: {
	page?: number;
	limit?: number;
	search?: string;
	organizerId?: string;
	organizationIds?: string[];
	organizationId?: string;
	isActive?: boolean;
}) {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 20;
	const skip = (page - 1) * limit;

	const andConditions: Prisma.EventSeriesWhereInput[] = [];

	if (params?.isActive !== undefined) {
		andConditions.push({ isActive: params.isActive });
	}

	if (params?.search) {
		andConditions.push({
			OR: [
				{ title: { contains: params.search, mode: "insensitive" } },
				{
					description: {
						contains: params.search,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (params?.organizationId) {
		andConditions.push({ organizationId: params.organizationId });
	}

	const ownershipConditions: Prisma.EventSeriesWhereInput[] = [];
	if (params?.organizerId) {
		ownershipConditions.push({ organizerId: params.organizerId });
	}
	if (params?.organizationIds && params.organizationIds.length > 0) {
		ownershipConditions.push({
			organizationId: { in: params.organizationIds },
		});
	}
	if (ownershipConditions.length === 1) {
		andConditions.push(ownershipConditions[0]);
	} else if (ownershipConditions.length > 1) {
		andConditions.push({ OR: ownershipConditions });
	}

	const where: Prisma.EventSeriesWhereInput =
		andConditions.length > 0 ? { AND: andConditions } : {};

	const [series, total] = await Promise.all([
		db.eventSeries.findMany({
			where,
			include: eventSeriesSummaryInclude,
			orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
			skip,
			take: limit,
		}),
		db.eventSeries.count({ where }),
	]);

	return {
		series,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function getEventSeriesForEventAssociation(seriesId: string) {
	return db.eventSeries.findUnique({
		where: {
			id: seriesId,
		},
		select: {
			id: true,
			title: true,
			slug: true,
			isActive: true,
			organizerId: true,
			organizationId: true,
		},
	});
}

export async function getEventSeriesByIds(seriesIds: string[]) {
	if (seriesIds.length === 0) {
		return [];
	}

	return db.eventSeries.findMany({
		where: {
			id: {
				in: seriesIds,
			},
		},
		select: {
			id: true,
			title: true,
			slug: true,
			organizationId: true,
			organizerId: true,
			isActive: true,
		},
	});
}
