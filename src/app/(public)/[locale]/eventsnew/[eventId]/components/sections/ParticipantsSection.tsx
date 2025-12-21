"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users } from "lucide-react";

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
	const approvedRegs = (event.registrations ?? []).filter(
		(reg) => reg.status === "APPROVED",
	);
	// Show more items in the horizontal scroll
	const preview = approvedRegs.slice(0, 10);
	const totalCount = approvedRegs.length;

	const handleViewAll = () => {
		if (!currentUserId) {
			onRequireLogin();
			return;
		}
		onDialogChange(true);
	};

	return (
		<SectionCard id="participants" title={`已报名 (${totalCount})`}>
			{preview.length > 0 ? (
				<div className="relative group">
					{/* Horizontal Scroll Container */}
					<div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
						{preview.map((reg) => (
							<Card
								key={reg.id}
								className="flex-none w-[140px] snap-start border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden cursor-pointer group/card"
								onClick={handleViewAll}
							>
								<div className="p-4 flex flex-col items-center text-center gap-3">
									<Avatar className="h-16 w-16 border-2 border-white shadow-sm group-hover/card:scale-105 transition-transform">
										<AvatarImage
											src={reg.user.image || undefined}
										/>
										<AvatarFallback>
											{reg.user.name?.slice(0, 2)}
										</AvatarFallback>
									</Avatar>
									<div className="space-y-1 w-full">
										<p
											className="font-medium text-sm truncate w-full"
											title={reg.user.name || ""}
										>
											{reg.user.name}
										</p>
										<p className="text-xs text-muted-foreground truncate w-full">
											{reg.user.userRoleString ||
												reg.user.currentWorkOn ||
												reg.user.bio ||
												"参赛者"}
										</p>
									</div>
								</div>
							</Card>
						))}

						{/* "View More" Card at the end */}
						<div
							key="view-more"
							className="flex-none w-[100px] flex items-center justify-center snap-start"
						>
							<Button
								variant="ghost"
								className="flex flex-col gap-2 h-auto py-6"
								onClick={handleViewAll}
							>
								<div className="rounded-full bg-slate-100 p-3 text-slate-500">
									<ArrowRight className="h-5 w-5" />
								</div>
								<span className="text-xs text-muted-foreground">
									查看全部
								</span>
							</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
					<div className="text-center">
						<Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
						<p className="text-sm">暂无公开的报名者</p>
					</div>
				</div>
			)}
		</SectionCard>
	);
}
