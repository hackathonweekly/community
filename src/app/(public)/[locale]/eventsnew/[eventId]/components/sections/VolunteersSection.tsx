import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

type VolunteerRole = NonNullable<EventData["volunteerRoles"]>[number];

export function VolunteersSection({
	event,
	volunteerRoles,
	volunteerStatuses,
	onApply,
}: {
	event: EventData;
	volunteerRoles: VolunteerRole[];
	volunteerStatuses: Record<string, string | null>;
	onApply: (eventVolunteerRoleId: string) => void;
}) {
	return (
		<SectionCard id="volunteers" title="志愿者招募">
			<div className="space-y-3">
				{volunteerRoles.map((role) => {
					const approvedCount =
						role.registrations?.filter(
							(reg) => reg.status === "APPROVED",
						).length ?? 0;
					const recruitTotal = role.recruitCount ?? 0;
					const remaining = Math.max(recruitTotal - approvedCount, 0);
					const userStatus = volunteerStatuses[role.id];

					return (
						<Card
							key={role.id}
							className="shadow-none border-dashed"
						>
							<CardContent className="pt-4 space-y-2">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="font-medium">
											{role.volunteerRole.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{role.description ||
												role.volunteerRole.description}
										</p>
									</div>
									<Badge variant="secondary">
										剩余 {remaining}
									</Badge>
								</div>
								<Button
									variant="outline"
									disabled={
										userStatus === "APPROVED" ||
										userStatus === "APPLIED"
									}
									onClick={() => onApply(role.id)}
								>
									{userStatus === "APPROVED"
										? "已加入"
										: userStatus === "APPLIED"
											? "审核中"
											: "申请成为志愿者"}
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{event.volunteerContactInfo || event.volunteerWechatQrCode ? (
				<div className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
					<p className="font-medium text-slate-700">志愿者联系信息</p>
					{event.volunteerContactInfo ? (
						<p>{event.volunteerContactInfo}</p>
					) : null}
					{event.volunteerWechatQrCode ? (
						<p>微信二维码已在报名页提供</p>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
