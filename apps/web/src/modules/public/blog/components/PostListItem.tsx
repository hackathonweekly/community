"use client";

import type { Post } from "@/modules/public/blog/types";
import Image from "next/image";
import Link from "next/link";

export function PostListItem({ post }: { post: Post }) {
	const { title, excerpt, authorName, image, date, path, authorImage, tags } =
		post;

	return (
		<article className="rounded-lg border border-border bg-card p-4 shadow-subtle">
			{image ? (
				<div className="relative mb-4 aspect-16/9 overflow-hidden rounded-md border border-border bg-muted">
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center"
					/>
					<Link href={`/blog/${path}`} className="absolute inset-0" />
				</div>
			) : null}

			{tags?.length ? (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{tags.map((tag) => (
						<span
							key={tag}
							className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
			) : null}

			<Link
				href={`/blog/${path}`}
				className="font-brand text-xl font-semibold tracking-tight text-foreground hover:underline"
			>
				{title}
			</Link>
			{excerpt ? (
				<p className="mt-2 text-sm text-muted-foreground">{excerpt}</p>
			) : null}

			<div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
				{authorName ? (
					<div className="flex min-w-0 items-center gap-2">
						{authorImage ? (
							<div className="relative size-7 overflow-hidden rounded-full border border-border bg-muted">
								<Image
									src={authorImage}
									alt={authorName}
									fill
									sizes="28px"
									className="object-cover object-center"
								/>
							</div>
						) : null}
						<p className="truncate text-sm text-muted-foreground">
							{authorName}
						</p>
					</div>
				) : (
					<div />
				)}

				<time className="font-mono text-xs text-muted-foreground">
					{Intl.DateTimeFormat("en-US").format(new Date(date))}
				</time>
			</div>
		</article>
	);
}
