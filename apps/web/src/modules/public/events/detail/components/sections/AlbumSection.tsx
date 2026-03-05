"use client";

import { Button } from "@community/ui/ui/button";
import { Dialog, DialogContent } from "@community/ui/ui/dialog";
import { ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { EventPhotoPreview } from "../../hooks/useEventQueries";
import { SectionCard } from "../common/SectionCard";

export function AlbumSection({
	photos,
	isLoading,
	eventId,
	canUpload,
}: {
	photos: EventPhotoPreview[];
	isLoading: boolean;
	eventId: string;
	canUpload?: boolean;
}) {
	const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(
		null,
	);

	return (
		<SectionCard
			id="album"
			title="活动相册"
			ctaLabel="查看完整相册 →"
			ctaHref={`/events/${eventId}/photos`}
		>
			{isLoading ? (
				<div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<span className="ml-2 text-sm text-muted-foreground">
						正在加载相册...
					</span>
				</div>
			) : photos.length > 0 ? (
				<>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{photos.map((photo) => (
							<button
								key={photo.id}
								type="button"
								className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
								data-swipe-ignore="true"
								onClick={() =>
									setSelectedPhotoUrl(photo.imageUrl)
								}
							>
								<Image
									src={photo.thumbnailUrl || photo.imageUrl}
									alt={photo.caption || "活动照片"}
									fill
									sizes="(max-width: 640px) 50vw, 33vw"
									className="object-cover transition-transform duration-200 group-hover:scale-105"
								/>
							</button>
						))}
					</div>
					<div className="mt-4 flex justify-center">
						<Button asChild variant="outline" size="sm">
							<a href={`/events/${eventId}/photos`}>
								查看更多照片
							</a>
						</Button>
					</div>
					<Dialog
						open={Boolean(selectedPhotoUrl)}
						onOpenChange={(open) => {
							if (!open) {
								setSelectedPhotoUrl(null);
							}
						}}
					>
						<DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
							{selectedPhotoUrl ? (
								<img
									src={selectedPhotoUrl}
									alt="活动照片预览"
									className="max-h-[80vh] w-full rounded-lg object-contain"
								/>
							) : null}
						</DialogContent>
					</Dialog>
				</>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
					<ImageIcon className="h-8 w-8 mb-3 opacity-40" />
					<p className="text-sm font-medium mb-1">暂无活动照片</p>
					{canUpload ? (
						<>
							<p className="text-xs text-muted-foreground">
								切换到完整相册页可上传你的现场照片
							</p>
							<Button
								asChild
								variant="outline"
								size="sm"
								className="mt-3"
							>
								<a href={`/events/${eventId}/photos`}>
									去上传照片
								</a>
							</Button>
						</>
					) : (
						<p className="text-xs text-muted-foreground">
							登录并报名后可上传照片
						</p>
					)}
				</div>
			)}
		</SectionCard>
	);
}
