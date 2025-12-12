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
			ctaLabel="进入现场相册"
			ctaHref={`/${locale}/events/${eventId}/photos`}
		>
			{photos.length > 0 ? (
				<div className="grid gap-3 sm:grid-cols-3">
					{photos.slice(0, 3).map((src, idx) => (
						<div
							key={`${src}-${idx}`}
							className="aspect-[4/3] overflow-hidden rounded-xl border bg-white/70"
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
				<p className="text-sm text-muted-foreground">暂无相册照片。</p>
			)}
		</SectionCard>
	);
}
