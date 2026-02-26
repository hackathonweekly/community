import { formatDate, formatDistance, parseISO } from "date-fns";
import type { ChangelogItem } from "../types";

export function ChangelogSection({ items }: { items: ChangelogItem[] }) {
	return (
		<section id="changelog">
			<div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 text-left">
				{items?.map((item, i) => (
					<article
						key={i}
						className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5"
					>
						<small
							className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
							title={formatDate(
								parseISO(item.date),
								"yyyy-MM-dd",
							)}
						>
							{formatDistance(parseISO(item.date), new Date(), {
								addSuffix: true,
							})}
						</small>
						<ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
							{item.changes.map((change, j) => (
								<li key={j}>{change}</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</section>
	);
}
