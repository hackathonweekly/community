import type { PostChannel, Prisma } from "@prisma/client";

export interface ListPostsParams {
	channel?: PostChannel;
	sort?: "new" | "hot";
	cursor?: string;
	limit?: number;
	userId?: string; // current user for interaction status
}

export function buildPostListQuery(params: ListPostsParams) {
	const { channel, sort = "new", cursor, limit = 20, userId } = params;

	const where: Prisma.PostWhereInput = {};
	if (channel) {
		where.channel = channel;
	}

	const orderBy: Prisma.PostOrderByWithRelationInput[] = [{ pinned: "desc" }];
	if (sort === "hot") {
		orderBy.push({ likeCount: "desc" }, { createdAt: "desc" });
	} else {
		orderBy.push({ createdAt: "desc" });
	}

	const take = Math.min(limit, 50);

	return {
		where,
		orderBy,
		take: take + 1, // fetch one extra to determine hasMore
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		select: {
			id: true,
			title: true,
			content: true,
			images: true,
			channel: true,
			likeCount: true,
			commentCount: true,
			viewCount: true,
			pinned: true,
			createdAt: true,
			updatedAt: true,
			linkedProjectId: true,
			linkedEventId: true,
			user: {
				select: {
					id: true,
					name: true,
					username: true,
					image: true,
				},
			},
			linkedProject: {
				select: { id: true, title: true, shortId: true },
			},
			linkedEvent: {
				select: { id: true, title: true, shortId: true },
			},
			...(userId
				? {
						likes: {
							where: { userId },
							select: { id: true },
						},
						bookmarks: {
							where: { userId },
							select: { id: true },
						},
					}
				: {}),
		},
	} satisfies Prisma.PostFindManyArgs;
}

export const postDetailSelect = (userId?: string) =>
	({
		id: true,
		title: true,
		content: true,
		images: true,
		channel: true,
		likeCount: true,
		commentCount: true,
		viewCount: true,
		pinned: true,
		createdAt: true,
		updatedAt: true,
		userId: true,
		linkedProjectId: true,
		linkedEventId: true,
		user: {
			select: {
				id: true,
				name: true,
				username: true,
				image: true,
			},
		},
		linkedProject: {
			select: { id: true, title: true, shortId: true },
		},
		linkedEvent: {
			select: { id: true, title: true, shortId: true },
		},
		...(userId
			? {
					likes: {
						where: { userId },
						select: { id: true },
					},
					bookmarks: {
						where: { userId },
						select: { id: true },
					},
				}
			: {}),
	}) satisfies Prisma.PostSelect;
