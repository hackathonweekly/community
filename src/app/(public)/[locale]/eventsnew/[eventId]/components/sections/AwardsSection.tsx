import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
					<Card className="shadow-none border-dashed">
						<CardHeader>
							<CardTitle className="text-base">
								奖项设置
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{awards.map((award, idx) => (
								<div
									key={`${award.name}-${idx}`}
									className="rounded-lg border bg-muted/40 p-3"
								>
									<p className="font-medium">{award.name}</p>
									{award.description ? (
										<p className="text-sm text-muted-foreground">
											{award.description}
										</p>
									) : null}
								</div>
							))}
						</CardContent>
					</Card>
				) : null}

				{resourcesGroups.length > 0 ? (
					<Card className="shadow-none border-dashed">
						<CardHeader>
							<CardTitle className="text-base">
								准备资源
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{resourcesGroups.map((group) => (
								<div key={group.title} className="space-y-2">
									<p className="font-medium">{group.title}</p>
									<ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
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
						</CardContent>
					</Card>
				) : null}
			</div>
		</SectionCard>
	);
}
