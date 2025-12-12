import { Card, CardContent } from "@/components/ui/card";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

export function ParticipantsSection({
	event,
	locale,
}: {
	event: EventData;
	locale: string;
}) {
	const participants = event.registrations
		.filter(
			(reg) => reg.status !== "CANCELLED" && reg.status !== "REJECTED",
		)
		.slice(0, 8)
		.map((reg) => ({
			name: reg.user.name,
			role: reg.user.userRoleString || reg.user.username || "参赛者",
			region: reg.user.region,
			highlight: reg.user.currentWorkOn || reg.user.bio,
		}));

	return (
		<SectionCard
			id="participants"
			title="报名者信息"
			ctaLabel="查看全部报名者"
			ctaHref={`/${locale}/events/${event.id}`}
		>
			{participants.length > 0 ? (
				<div className="grid gap-3 sm:grid-cols-2">
					{participants.map((participant, idx) => (
						<Card
							key={`${participant.name}-${idx}`}
							className="shadow-none border-dashed"
						>
							<CardContent className="pt-4 space-y-1">
								<p className="font-medium">
									{participant.name}
								</p>
								<p className="text-sm text-muted-foreground flex flex-wrap gap-2">
									<span>{participant.role}</span>
									{participant.region ? (
										<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600">
											{participant.region}
										</span>
									) : null}
								</p>
								{participant.highlight ? (
									<p className="text-xs text-muted-foreground line-clamp-2">
										{participant.highlight}
									</p>
								) : null}
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					暂无报名者展示。
				</p>
			)}
		</SectionCard>
	);
}
