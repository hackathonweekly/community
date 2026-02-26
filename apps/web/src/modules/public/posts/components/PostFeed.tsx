"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@community/ui/ui/button";
import { PenSquare, Loader2, MessageCircle } from "lucide-react";
import type { PostChannel } from "@prisma/client";
import { usePostsFeed } from "../hooks/use-posts";
import { PostCard } from "./PostCard";
import { PostChannelFilter } from "./PostChannelFilter";
import { PostCreateForm } from "./PostCreateForm";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";

export function PostFeed() {
	const [channel, setChannel] = useState<PostChannel | undefined>();
	const [sort, setSort] = useState<"new" | "hot">("new");
	const [showCreate, setShowCreate] = useState(false);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		usePostsFeed({ channel, sort });

	const posts = data?.pages.flatMap((p) => p.items) ?? [];

	// Infinite scroll observer
	const observerRef = useRef<IntersectionObserver | null>(null);
	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (observerRef.current) observerRef.current.disconnect();
			if (!node) return;
			observerRef.current = new IntersectionObserver((entries) => {
				if (
					entries[0]?.isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage
				) {
					fetchNextPage();
				}
			});
			observerRef.current.observe(node);
		},
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	return (
		<div className="space-y-4">
			{/* Header - desktop only */}
			<div className="hidden lg:flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div className="flex items-center gap-3">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						动态
					</h1>
					<Button
						onClick={() => setShowCreate(true)}
						size="sm"
						variant="pill"
						className="hidden md:inline-flex"
					>
						<PenSquare className="mr-1 h-3.5 w-3.5" />
						发帖
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				<PostChannelFilter value={channel} onChange={setChannel} />
				<div className="mx-1 h-4 w-px bg-border" />
				<Button
					variant={sort === "new" ? "default" : "outline"}
					size="sm"
					onClick={() => setSort("new")}
					className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
				>
					最新
				</Button>
				<Button
					variant={sort === "hot" ? "default" : "outline"}
					size="sm"
					onClick={() => setSort("hot")}
					className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
				>
					热门
				</Button>
				<Button
					onClick={() => setShowCreate(true)}
					size="sm"
					className="flex-shrink-0 gap-1 lg:hidden"
				>
					<PenSquare className="h-4 w-4" />
					发帖
				</Button>
			</div>

			{/* Posts list */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : posts.length === 0 ? (
				<EmptyState
					icon={<MessageCircle className="h-5 w-5" />}
					title="还没有帖子"
					description="来发第一条吧"
				/>
			) : (
				<div className="space-y-3">
					{posts.map((post: any) => (
						<PostCard key={post.id} post={post} />
					))}
				</div>
			)}

			{/* Load more trigger */}
			{hasNextPage && (
				<div ref={loadMoreRef} className="flex justify-center py-4">
					{isFetchingNextPage && (
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					)}
				</div>
			)}

			{/* Create form dialog */}
			<PostCreateForm open={showCreate} onOpenChange={setShowCreate} />
		</div>
	);
}
