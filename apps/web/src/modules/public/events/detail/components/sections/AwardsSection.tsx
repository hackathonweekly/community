import { SectionCard } from "../common/SectionCard";

type ResourceGroup = {
	title: string;
	items: any[];
};

export function AwardsSection({
	awards,
	resourcesGroups,
}: {
	awards: any[];
	resourcesGroups: ResourceGroup[];
}) {
	return (
		<SectionCard id="awards" title="奖项 & 资源">
			<div className="grid gap-4 md:grid-cols-2">
				{awards.length > 0 ? (
					<div className="rounded-lg border border-border bg-card p-4">
						<p className="font-bold text-sm mb-3">奖项设置</p>
						<div className="space-y-3">
							{awards.map((award, idx) => (
								<div
									key={`${award.name}-${idx}`}
									className="rounded-md border border-border/50 bg-muted/40 p-3"
								>
									<p className="font-medium text-sm">
										{award.name}
									</p>
									{award.description ? (
										<p className="text-xs text-muted-foreground mt-0.5">
											{award.description}
										</p>
									) : null}
								</div>
							))}
						</div>
					</div>
				) : null}

				{resourcesGroups.length > 0 ? (
					<div className="rounded-lg border border-border bg-card p-4">
						<p className="font-bold text-sm mb-3">准备资源</p>
						<div className="space-y-4">
							{resourcesGroups.map((group) => (
								<div key={group.title} className="space-y-2">
									<p className="font-medium text-sm">
										{group.title}
									</p>
									<ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
										{group.items.map(
											(item: any, idx: number) => (
												<li key={idx}>
													{item.title ||
														item.name ||
														item}
												</li>
											),
										)}
									</ul>
								</div>
							))}
						</div>
					</div>
				) : null}
			</div>
		</SectionCard>
	);
}
