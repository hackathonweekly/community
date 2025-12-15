"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ParticipantAvatars } from "@/components/ui/participant-avatars";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

type ParticipantsSectionProps = {
	event: EventData;
	currentUserId?: string;
	projectSubmissions?: any[];
	onRequireLogin: () => void;
	isDialogOpen: boolean;
	onDialogChange: (open: boolean) => void;
};

export function ParticipantsSection({
	event,
	currentUserId,
	projectSubmissions = [],
	onRequireLogin,
	isDialogOpen,
	onDialogChange,
}: ParticipantsSectionProps) {
	const confirmedRegs = event.registrations.filter(
		(reg) => reg.status !== "CANCELLED" && reg.status !== "REJECTED",
	);
	const preview = confirmedRegs.slice(0, 6);

	return (
		<SectionCard
			id="participants"
			title="报名者信息"
			ctaLabel="查看全部报名者"
			ctaOnClick={() => {
				if (!currentUserId) {
					onRequireLogin();
					return;
				}
				onDialogChange(true);
			}}
		>
			{preview.length > 0 ? (
				<div className="grid gap-3 sm:grid-cols-2">
					{preview.map((reg) => (
						<Card
							key={reg.id}
							className="shadow-none border-dashed bg-gradient-to-br from-white to-slate-50"
						>
							<CardContent className="pt-4 space-y-1">
								<p className="font-medium">{reg.user.name}</p>
								<p className="text-sm text-muted-foreground flex flex-wrap gap-2">
									<span>
										{reg.user.userRoleString ||
											reg.user.username ||
											"参赛者"}
									</span>
									{reg.user.region ? (
										<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600">
											{reg.user.region}
										</span>
									) : null}
								</p>
								{reg.user.currentWorkOn || reg.user.bio ? (
									<p className="text-xs text-muted-foreground line-clamp-2">
										{reg.user.currentWorkOn || reg.user.bio}
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

			<ParticipantAvatars
				participants={confirmedRegs.map((reg) => ({
					...reg.user,
					status: reg.status,
					registeredAt: reg.registeredAt,
					allowDigitalCardDisplay: (reg as any)
						.allowDigitalCardDisplay,
					user: reg.user,
				}))}
				totalCount={event._count?.registrations ?? confirmedRegs.length}
				eventId={event.id}
				currentUserId={currentUserId}
				showInterestButtons={Boolean(currentUserId)}
				projectSubmissions={projectSubmissions}
				requireAuth
				onRequireAuth={onRequireLogin}
				open={isDialogOpen}
				onOpenChange={onDialogChange}
			/>
		</SectionCard>
	);
}
