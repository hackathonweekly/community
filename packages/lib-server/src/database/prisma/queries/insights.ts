import "server-only";

import { db } from "@community/lib-server/database";
import { EventStatus, RegistrationStatus } from "@prisma/client";
import { unstable_cache, unstable_noStore } from "next/cache";

export type InsightsBucket = {
	key: string;
	count: number;
	percent: number;
};

export type TopUserStat = {
	userId: string;
	name: string;
	username: string | null;
	image: string | null;
	count: number;
};

export type KeywordStat = {
	keyword: string;
	count: number;
};

export type PublicInsights = {
	generatedAt: string;
	events: {
		ongoing: number;
		upcoming14d: number;
		completed: number;
		totalNonDraft: number;
	};
	participation: {
		approvedRegistrations: number;
		uniqueParticipants: number;
		checkIns: number;
	};
	feedback: {
		ratingsCount: number;
		averageRating: number | null;
		recommendRate: number | null;
	};
	topTags90d: Array<{ tag: string; count: number }>;
};

export type AdminInsights = PublicInsights & {
	users: {
		total: number;
		newToday: number;
		newThisWeek: number;
		active7d: number;
		active30d: number;
		onboardingComplete: number;
		profilePublic: number;
	};
	segments: {
		gender: InsightsBucket[];
		regionTop10: InsightsBucket[];
		membershipLevel: InsightsBucket[];
		topSkills: InsightsBucket[];
	};
	fun: {
		topAttendeesByRegistrationsAllTime: TopUserStat[];
		topAttendeesByRegistrations90d: TopUserStat[];
		topAttendeesByCheckInsAllTime: TopUserStat[];
		topAttendeesByCheckIns90d: TopUserStat[];
	};
	keywords?: {
		usersAnalyzed: number;
		tokensAnalyzed: number;
		topKeywords: KeywordStat[];
	};
};

function startOfToday() {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
}

function startOfThisWeek() {
	const date = new Date();
	const day = date.getDay();
	date.setDate(date.getDate() - day);
	date.setHours(0, 0, 0, 0);
	return date;
}

function daysAgo(days: number) {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
	return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function normalizeText(text: string) {
	return text
		.replace(/https?:\/\/\S+/g, " ")
		.replace(/[A-Za-z0-9_./-]{25,}/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function isCjk(text: string) {
	return /[\p{Script=Han}]/u.test(text);
}

const STOPWORDS = new Set(
	[
		// English
		"a",
		"an",
		"and",
		"are",
		"as",
		"at",
		"be",
		"but",
		"by",
		"for",
		"from",
		"i",
		"in",
		"is",
		"it",
		"of",
		"on",
		"or",
		"our",
		"the",
		"to",
		"we",
		"with",
		"you",
		"your",

		// 中文常见虚词
		"的",
		"了",
		"和",
		"是",
		"在",
		"我",
		"你",
		"他",
		"她",
		"我们",
		"他们",
		"以及",
		"一个",
		"一些",
		"目前",
		"可以",
		"正在",
		"需要",
		"希望",
		"喜欢",

		// 社区语境高频但信息量低的词
		"社区",
		"黑客松",
		"周周黑客松",
		"hackathon",
	].map((word) => word.toLowerCase()),
);

const WORD_SEGMENTER = new Intl.Segmenter("zh-CN", { granularity: "word" });

function extractKeywordsFromText(text: string) {
	const normalized = normalizeText(text);
	if (!normalized) return [];

	const keywords: string[] = [];

	for (const segment of WORD_SEGMENTER.segment(normalized)) {
		if (!segment.isWordLike) continue;
		const keyword = segment.segment.trim().toLowerCase();
		if (!keyword) continue;

		const minLength = isCjk(keyword) ? 2 : 3;
		if (keyword.length < minLength) continue;
		if (STOPWORDS.has(keyword)) continue;
		keywords.push(keyword);
	}

	return keywords;
}

function toBuckets(
	rows: Array<{ key: string; count: number }>,
	total: number,
): InsightsBucket[] {
	if (total <= 0) {
		return rows.map((row) => ({ ...row, percent: 0 }));
	}

	return rows
		.map((row) => ({
			...row,
			percent: Number(((row.count / total) * 100).toFixed(1)),
		}))
		.sort((a, b) => b.count - a.count);
}

function toDisplayKey(value: unknown, emptyLabel: string) {
	if (value === null || value === undefined || value === "") {
		return emptyLabel;
	}
	return String(value);
}

async function hydrateTopUsers(
	groups: Array<{ userId: string; count: number }>,
): Promise<TopUserStat[]> {
	if (groups.length === 0) return [];

	const users = await db.user.findMany({
		where: { id: { in: groups.map((group) => group.userId) } },
		select: {
			id: true,
			name: true,
			username: true,
			image: true,
			banned: true,
		},
	});

	const userMap = new Map(users.map((user) => [user.id, user]));

	return groups
		.map((group) => {
			const user = userMap.get(group.userId);
			if (!user || user.banned) return null;
			return {
				userId: user.id,
				name: user.name,
				username: user.username ?? null,
				image: user.image ?? null,
				count: group.count,
			} satisfies TopUserStat;
		})
		.filter((row): row is TopUserStat => row !== null);
}

async function computeTopAttendeesByRegistrations(options: {
	limit: number;
	since?: Date;
}) {
	const groups = await db.eventRegistration.groupBy({
		by: ["userId"],
		where: {
			status: RegistrationStatus.APPROVED,
			...(options.since ? { registeredAt: { gte: options.since } } : {}),
		},
		_count: { userId: true },
		orderBy: {
			_count: { userId: "desc" },
		},
		take: options.limit,
	});

	return hydrateTopUsers(
		groups.map((group) => ({
			userId: group.userId,
			count: group._count.userId,
		})),
	);
}

async function computeTopAttendeesByCheckIns(options: {
	limit: number;
	since?: Date;
}) {
	const groups = await db.eventCheckIn.groupBy({
		by: ["userId"],
		where: {
			...(options.since ? { checkedInAt: { gte: options.since } } : {}),
		},
		_count: { userId: true },
		orderBy: {
			_count: { userId: "desc" },
		},
		take: options.limit,
	});

	return hydrateTopUsers(
		groups.map((group) => ({
			userId: group.userId,
			count: group._count.userId,
		})),
	);
}

async function computeKeywordStats(): Promise<{
	usersAnalyzed: number;
	tokensAnalyzed: number;
	topKeywords: KeywordStat[];
}> {
	const users = await db.user.findMany({
		where: {
			profilePublic: true,
			banned: { not: true },
			OR: [
				{ bio: { not: null } },
				{ currentWorkOn: { not: null } },
				{ whatICanOffer: { not: null } },
				{ whatIAmLookingFor: { not: null } },
				{ lifeStatus: { not: null } },
			],
		},
		select: {
			bio: true,
			currentWorkOn: true,
			whatICanOffer: true,
			whatIAmLookingFor: true,
			lifeStatus: true,
		},
	});

	const keywordCountMap = new Map<string, number>();
	let tokensAnalyzed = 0;

	for (const user of users) {
		const combinedText = [
			user.bio,
			user.currentWorkOn,
			user.whatICanOffer,
			user.whatIAmLookingFor,
			user.lifeStatus,
		]
			.filter(
				(value) => typeof value === "string" && value.trim().length > 0,
			)
			.join(" ");

		const keywords = extractKeywordsFromText(combinedText);
		tokensAnalyzed += keywords.length;

		for (const keyword of keywords) {
			keywordCountMap.set(
				keyword,
				(keywordCountMap.get(keyword) ?? 0) + 1,
			);
		}
	}

	const topKeywords = Array.from(keywordCountMap.entries())
		.map(([keyword, count]) => ({ keyword, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 60);

	return {
		usersAnalyzed: users.length,
		tokensAnalyzed,
		topKeywords,
	};
}

async function computePublicInsights(): Promise<PublicInsights> {
	const now = new Date();
	const tagSince = daysAgo(90);

	const [
		totalNonDraft,
		ongoing,
		upcoming14d,
		completed,
		approvedRegistrations,
		uniqueParticipantGroups,
		checkIns,
		feedbackAgg,
		recommendCount,
		eventTagsRows,
	] = await Promise.all([
		db.event.count({
			where: {
				status: { not: EventStatus.DRAFT },
			},
		}),
		db.event.count({
			where: {
				status: { not: EventStatus.DRAFT },
				OR: [
					{ status: EventStatus.ONGOING },
					{
						status: {
							in: [
								EventStatus.PUBLISHED,
								EventStatus.REGISTRATION_CLOSED,
							],
						},
						startTime: { lte: now },
						endTime: { gte: now },
					},
				],
			},
		}),
		db.event.count({
			where: {
				status: {
					in: [
						EventStatus.PUBLISHED,
						EventStatus.REGISTRATION_CLOSED,
					],
				},
				startTime: { gt: now, lte: daysFromNow(14) },
			},
		}),
		db.event.count({
			where: {
				status: { not: EventStatus.DRAFT },
				OR: [
					{ status: EventStatus.COMPLETED },
					{
						status: {
							in: [
								EventStatus.PUBLISHED,
								EventStatus.REGISTRATION_CLOSED,
								EventStatus.ONGOING,
							],
						},
						endTime: { lt: now },
					},
				],
			},
		}),
		db.eventRegistration.count({
			where: { status: RegistrationStatus.APPROVED },
		}),
		db.eventRegistration.groupBy({
			by: ["userId"],
			where: { status: RegistrationStatus.APPROVED },
			_count: { _all: true },
		}),
		db.eventCheckIn.count(),
		db.eventFeedback.aggregate({
			_count: { _all: true },
			_avg: { rating: true },
		}),
		db.eventFeedback.count({
			where: { wouldRecommend: true },
		}),
		db.event.findMany({
			where: {
				createdAt: { gte: tagSince },
				status: { not: EventStatus.DRAFT },
			},
			select: { tags: true },
		}),
	]);

	const ratingsCount = feedbackAgg._count._all;
	const averageRating =
		feedbackAgg._avg.rating === null
			? null
			: Number(feedbackAgg._avg.rating.toFixed(2));
	const recommendRate =
		ratingsCount > 0
			? Number(((recommendCount / ratingsCount) * 100).toFixed(1))
			: null;

	const tagCountMap = new Map<string, number>();
	for (const row of eventTagsRows) {
		for (const tag of row.tags || []) {
			const normalized = tag.trim();
			if (!normalized) continue;
			tagCountMap.set(normalized, (tagCountMap.get(normalized) ?? 0) + 1);
		}
	}

	const topTags90d = Array.from(tagCountMap.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	return {
		generatedAt: now.toISOString(),
		events: {
			ongoing,
			upcoming14d,
			completed,
			totalNonDraft,
		},
		participation: {
			approvedRegistrations,
			uniqueParticipants: uniqueParticipantGroups.length,
			checkIns,
		},
		feedback: {
			ratingsCount,
			averageRating,
			recommendRate,
		},
		topTags90d,
	};
}

async function computeAdminInsightsLight(): Promise<AdminInsights> {
	const base = await computePublicInsights();

	const today = startOfToday();
	const weekStart = startOfThisWeek();
	const sevenDays = daysAgo(7);
	const thirtyDays = daysAgo(30);
	const ninetyDays = daysAgo(90);

	const [
		totalUsers,
		newToday,
		newThisWeek,
		active7dGroups,
		active30dGroups,
		onboardingComplete,
		profilePublic,
		genderGroup,
		regionGroup,
		membershipLevelGroup,
		skillsRows,
		topRegistrationsAllTime,
		topRegistrations90d,
		topCheckInsAllTime,
		topCheckIns90d,
	] = await Promise.all([
		db.user.count(),
		db.user.count({ where: { createdAt: { gte: today } } }),
		db.user.count({ where: { createdAt: { gte: weekStart } } }),
		db.session.groupBy({
			by: ["userId"],
			where: { updatedAt: { gte: sevenDays } },
			_count: { _all: true },
		}),
		db.session.groupBy({
			by: ["userId"],
			where: { updatedAt: { gte: thirtyDays } },
			_count: { _all: true },
		}),
		db.user.count({ where: { onboardingComplete: true } }),
		db.user.count({ where: { profilePublic: true } }),
		db.user.groupBy({
			by: ["gender"],
			_count: { _all: true },
		}),
		db.user.groupBy({
			by: ["region"],
			_count: { _all: true },
		}),
		db.user.groupBy({
			by: ["membershipLevel"],
			_count: { _all: true },
		}),
		db.user.findMany({
			select: { skills: true },
		}),
		computeTopAttendeesByRegistrations({ limit: 12 }),
		computeTopAttendeesByRegistrations({ limit: 12, since: ninetyDays }),
		computeTopAttendeesByCheckIns({ limit: 12 }),
		computeTopAttendeesByCheckIns({ limit: 12, since: ninetyDays }),
	]);

	const gender = toBuckets(
		genderGroup.map((row) => ({
			key: toDisplayKey(row.gender, "未填写"),
			count: row._count._all,
		})),
		totalUsers,
	);

	const regionBuckets = toBuckets(
		regionGroup.map((row) => ({
			key: toDisplayKey(row.region, "未填写"),
			count: row._count._all,
		})),
		totalUsers,
	);
	const regionTop10 = regionBuckets.slice(0, 10);

	const membershipLevel = toBuckets(
		membershipLevelGroup.map((row) => ({
			key: toDisplayKey(row.membershipLevel, "未设置"),
			count: row._count._all,
		})),
		totalUsers,
	);

	const skillCountMap = new Map<string, number>();
	for (const row of skillsRows) {
		for (const skill of row.skills || []) {
			const normalized = skill.trim();
			if (!normalized) continue;
			skillCountMap.set(
				normalized,
				(skillCountMap.get(normalized) ?? 0) + 1,
			);
		}
	}

	const topSkills = toBuckets(
		Array.from(skillCountMap.entries())
			.map(([key, count]) => ({ key, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 12),
		totalUsers,
	);

	return {
		...base,
		users: {
			total: totalUsers,
			newToday,
			newThisWeek,
			active7d: active7dGroups.length,
			active30d: active30dGroups.length,
			onboardingComplete,
			profilePublic,
		},
		segments: {
			gender,
			regionTop10,
			membershipLevel,
			topSkills,
		},
		fun: {
			topAttendeesByRegistrationsAllTime: topRegistrationsAllTime,
			topAttendeesByRegistrations90d: topRegistrations90d,
			topAttendeesByCheckInsAllTime: topCheckInsAllTime,
			topAttendeesByCheckIns90d: topCheckIns90d,
		},
	};
}

const getPublicInsightsCached = unstable_cache(
	async () => computePublicInsights(),
	["insights-public-v3"],
	{ revalidate: 300 },
);

export async function getPublicInsights(options?: { refresh?: boolean }) {
	if (options?.refresh) {
		unstable_noStore();
		return computePublicInsights();
	}
	return getPublicInsightsCached();
}

const getAdminInsightsLightCached = unstable_cache(
	async () => computeAdminInsightsLight(),
	["insights-admin-light-v3"],
	{ revalidate: 600 },
);

const getAdminInsightsHeavyCached = unstable_cache(
	async () => computeKeywordStats(),
	["insights-admin-heavy-v3"],
	{ revalidate: 60 * 60 * 6 },
);

export async function getAdminInsights(options?: {
	includeHeavy?: boolean;
	refresh?: boolean;
}) {
	const includeHeavy = options?.includeHeavy ?? false;

	if (options?.refresh) {
		unstable_noStore();
		const light = await computeAdminInsightsLight();
		if (!includeHeavy) return light;
		return { ...light, keywords: await computeKeywordStats() };
	}

	const light = await getAdminInsightsLightCached();
	if (!includeHeavy) return light;
	return { ...light, keywords: await getAdminInsightsHeavyCached() };
}
