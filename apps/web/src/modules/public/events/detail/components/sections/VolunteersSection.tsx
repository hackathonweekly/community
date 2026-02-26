import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";

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
		<div id="volunteers">
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-muted-foreground">
					志愿者招募
				</h3>
				<div className="h-px bg-border flex-1" />
			</div>
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
						<div
							key={role.id}
							className="rounded-lg border border-dashed border-border p-4 space-y-2"
						>
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-medium text-sm">
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
								size="sm"
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
						</div>
					);
				})}
			</div>

			{event.volunteerContactInfo || event.volunteerWechatQrCode ? (
				<div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
					<p className="font-medium text-foreground text-xs">
						志愿者联系信息
					</p>
					{event.volunteerContactInfo ? (
						<p className="text-xs mt-1">
							{event.volunteerContactInfo}
						</p>
					) : null}
					{event.volunteerWechatQrCode ? (
						<p className="text-xs mt-1">微信二维码已在报名页提供</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
