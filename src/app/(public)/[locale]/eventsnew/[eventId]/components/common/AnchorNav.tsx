import { cn } from "@/lib/utils";

export function AnchorNav({
	anchors,
}: {
	anchors: Array<{ id: string; label: string }>;
}) {
	return (
		<div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
			<div className="container max-w-6xl flex items-center gap-2 overflow-x-auto py-2 md:py-3 text-sm text-muted-foreground flex-nowrap">
				{anchors.map((anchor) => (
					<a
						key={anchor.id}
						href={`#${anchor.id}`}
						className={cn(
							"rounded-full px-3 py-1 transition hover:bg-slate-100 whitespace-nowrap",
							anchor.id === "feedback" && "hidden md:inline-flex",
						)}
					>
						{anchor.label}
					</a>
				))}
			</div>
		</div>
	);
}
