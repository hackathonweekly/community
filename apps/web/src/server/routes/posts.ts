import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import {
	buildPostListQuery,
	postDetailSelect,
} from "@community/lib-server/database/prisma/queries/posts";
import { NotificationService } from "@/features/notifications/service";
import { PostChannel } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const createPostSchema = z.object({
	title: z.string().max(200).optional().nullable(),
	content: z.string().min(1, "内容不能为空").max(10000, "内容过长"),
	images: z.array(z.string()).max(9, "最多9张图片").default([]),
	channel: z.nativeEnum(PostChannel),
	linkedProjectId: z.string().optional().nullable(),
	linkedEventId: z.string().optional().nullable(),
});

const updatePostSchema = z.object({
	title: z.string().max(200).optional().nullable(),
	content: z.string().min(1).max(10000).optional(),
	images: z.array(z.string()).max(9).optional(),
	channel: z.nativeEnum(PostChannel).optional(),
	linkedProjectId: z.string().optional().nullable(),
	linkedEventId: z.string().optional().nullable(),
});

export const postsFeedQuerySchema = z.object({
	channel: z.nativeEnum(PostChannel).optional(),
	sort: z.enum(["new", "hot"]).optional(),
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const postsRouter = new Hono()
	// GET /posts/feed - public feed
	.get("/feed", zValidator("query", postsFeedQuerySchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			const { channel, sort, cursor, limit } = c.req.valid("query");

			const query = buildPostListQuery({
				channel,
				sort,
				cursor,
				limit,
				userId: session?.user?.id,
			});

			const posts = await db.post.findMany(query);

			const hasMore = posts.length > limit;
			const items = hasMore ? posts.slice(0, limit) : posts;
			const nextCursor = hasMore
				? items[items.length - 1]?.id
				: undefined;

			return c.json({ items, nextCursor, hasMore });
		} catch (error) {
			console.error("Error fetching posts feed:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// GET /posts/:id - post detail
	.get("/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			const postId = c.req.param("id");
			const post = await db.post.findUnique({
				where: { id: postId },
				select: postDetailSelect(session?.user?.id),
			});

			if (!post) {
				return c.json({ error: "Post not found" }, 404);
			}

			// Increment view count
			await db.post.update({
				where: { id: postId },
				data: { viewCount: { increment: 1 } },
			});

			return c.json(post);
		} catch (error) {
			console.error("Error fetching post:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// POST /posts - create post (auth required)
	.post("/", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const body = await c.req.json();
			const data = createPostSchema.parse(body);

			const post = await db.post.create({
				data: {
					userId: session.user.id,
					title: data.title || null,
					content: data.content,
					images: data.images,
					channel: data.channel,
					linkedProjectId: data.linkedProjectId || null,
					linkedEventId: data.linkedEventId || null,
				},
				select: postDetailSelect(session.user.id),
			});

			return c.json(post);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{ error: "Invalid data", details: error.issues },
					400,
				);
			}
			console.error("Error creating post:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// PUT /posts/:id - update post (author only)
	.put("/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const postId = c.req.param("id");
			const existing = await db.post.findUnique({
				where: { id: postId },
				select: { userId: true },
			});

			if (!existing) {
				return c.json({ error: "Post not found" }, 404);
			}
			if (existing.userId !== session.user.id) {
				return c.json({ error: "Forbidden" }, 403);
			}

			const body = await c.req.json();
			const data = updatePostSchema.parse(body);

			const post = await db.post.update({
				where: { id: postId },
				data: {
					...(data.title !== undefined && {
						title: data.title || null,
					}),
					...(data.content !== undefined && {
						content: data.content,
					}),
					...(data.images !== undefined && { images: data.images }),
					...(data.channel !== undefined && {
						channel: data.channel,
					}),
					...(data.linkedProjectId !== undefined && {
						linkedProjectId: data.linkedProjectId || null,
					}),
					...(data.linkedEventId !== undefined && {
						linkedEventId: data.linkedEventId || null,
					}),
				},
				select: postDetailSelect(session.user.id),
			});

			return c.json(post);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{ error: "Invalid data", details: error.issues },
					400,
				);
			}
			console.error("Error updating post:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// DELETE /posts/:id - delete post (author or admin)
	.delete("/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const postId = c.req.param("id");
			const existing = await db.post.findUnique({
				where: { id: postId },
				select: { userId: true },
			});

			if (!existing) {
				return c.json({ error: "Post not found" }, 404);
			}

			const isAdmin = session.user.role === "admin";
			if (existing.userId !== session.user.id && !isAdmin) {
				return c.json({ error: "Forbidden" }, 403);
			}

			await db.post.delete({ where: { id: postId } });

			return c.json({ success: true });
		} catch (error) {
			console.error("Error deleting post:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// POST /posts/:id/like - toggle like
	.post("/:id/like", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const postId = c.req.param("id");
			const post = await db.post.findUnique({
				where: { id: postId },
				select: { id: true, userId: true, title: true },
			});

			if (!post) {
				return c.json({ error: "Post not found" }, 404);
			}

			const existingLike = await db.postLike.findUnique({
				where: {
					postId_userId: { postId, userId: session.user.id },
				},
			});

			if (existingLike) {
				// Unlike
				await db.$transaction(async (tx) => {
					await tx.postLike.delete({
						where: {
							postId_userId: { postId, userId: session.user.id },
						},
					});
					await tx.post.update({
						where: { id: postId },
						data: { likeCount: { decrement: 1 } },
					});
				});
				return c.json({ liked: false });
			}

			// Like
			await db.$transaction(async (tx) => {
				await tx.postLike.create({
					data: { postId, userId: session.user.id },
				});
				await tx.post.update({
					where: { id: postId },
					data: { likeCount: { increment: 1 } },
				});
			});

			// Notify post author
			try {
				if (post.userId !== session.user.id) {
					await NotificationService.notifyPostLike(
						post.id,
						post.title || "帖子",
						post.userId,
						session.user.id,
						session.user.name,
					);
				}
			} catch (e) {
				console.error("Error creating post like notification:", e);
			}

			return c.json({ liked: true });
		} catch (error) {
			console.error("Error toggling post like:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	// POST /posts/:id/bookmark - toggle bookmark
	.post("/:id/bookmark", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const postId = c.req.param("id");
			const post = await db.post.findUnique({
				where: { id: postId },
				select: { id: true },
			});

			if (!post) {
				return c.json({ error: "Post not found" }, 404);
			}

			const existing = await db.postBookmark.findUnique({
				where: {
					postId_userId: { postId, userId: session.user.id },
				},
			});

			if (existing) {
				await db.postBookmark.delete({
					where: {
						postId_userId: { postId, userId: session.user.id },
					},
				});
				return c.json({ bookmarked: false });
			}

			await db.postBookmark.create({
				data: { postId, userId: session.user.id },
			});

			return c.json({ bookmarked: true });
		} catch (error) {
			console.error("Error toggling post bookmark:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});
