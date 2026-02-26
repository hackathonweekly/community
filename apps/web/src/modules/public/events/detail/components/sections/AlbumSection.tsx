import { ImageIcon } from "lucide-react";
import { SectionCard } from "../common/SectionCard";

export function AlbumSection({
	photos,
	locale,
	eventId,
}: {
	photos: string[];
	locale: string;
	eventId: string;
}) {
	return (
		<SectionCard
			id="album"
			title="相册预览"
			ctaLabel="进入现场相册 →"
			ctaHref={`/events/${eventId}/photos`}
		>
			{photos.length > 0 ? (
				<div className="grid gap-3 sm:grid-cols-3">
					{photos.slice(0, 3).map((src, idx) => (
						<div
							key={`${src}-${idx}`}
							className="aspect-[4/3] overflow-hidden rounded-lg border border-border"
						>
							<img
								src={src}
								alt="活动照片"
								className="h-full w-full object-cover"
							/>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
					<ImageIcon className="h-8 w-8 mb-3 opacity-40" />
					<p className="text-sm font-medium mb-1">暂无精彩瞬间</p>
					<p className="text-xs text-muted-foreground">
						活动结束后将更新现场照片，敬请期待
					</p>
				</div>
			)}
		</SectionCard>
	);
}
