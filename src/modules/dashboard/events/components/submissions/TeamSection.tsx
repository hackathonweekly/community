"use client";

import { Crown, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { UserSearchResult } from "@/features/event-submissions/types";
import { UserSearchCombobox } from "./UserSearchCombobox";

interface TeamSectionProps {
	eventId: string;
	leader: UserSearchResult | null;
	onLeaderChange: (user: UserSearchResult) => void;
	members: UserSearchResult[];
	onMembersChange: (members: UserSearchResult[]) => void;
	maxMembers?: number;
	leaderLocked?: boolean;
	currentUserId?: string;
}

const DEFAULT_MAX = 10;

export function TeamSection({
	eventId,
	leader,
	onLeaderChange,
	members,
	onMembersChange,
	maxMembers = DEFAULT_MAX,
	leaderLocked = false,
	currentUserId,
}: TeamSectionProps) {
	const [memberScope, setMemberScope] = useState<"event" | "global">(
		"global",
	);

	const handleAddMember = (user: UserSearchResult) => {
		if (members.find((member) => member.id === user.id)) {
			toast.info("该成员已在团队中");
			return;
		}
		if (user.id === leader?.id) {
			toast.info("队长无需重复添加");
			return;
		}
		if (members.length >= maxMembers) {
			toast.error(`最多添加 ${maxMembers} 位队员`);
			return;
		}
		onMembersChange([...members, user]);
	};

	const handleRemoveMember = (userId: string) => {
		onMembersChange(members.filter((member) => member.id !== userId));
	};

	const leaderAvatarFallback = leader?.name?.slice(0, 2) ?? "?";

	return (
		<div className="space-y-4">
			<div className="rounded-lg border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/30">
				<div className="flex items-center gap-3">
					<div className="rounded-full bg-primary/10 p-2">
						<Crown className="h-4 w-4 text-primary" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
							队长
						</p>
						<div className="flex items-center gap-2 mt-1">
							<Avatar className="h-8 w-8">
								<AvatarImage src={leader?.image ?? undefined} />
								<AvatarFallback>
									{leaderAvatarFallback}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-medium">
									{leader?.name ?? "未选择"}
								</p>
								{leader?.username && (
									<p className="text-xs text-muted-foreground">
										@{leader.username}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<UserSearchCombobox
						eventId={eventId}
						scope="event"
						excludeIds={[
							leader?.id ?? "",
							...members.map((m) => m.id),
						]}
						onSelect={onLeaderChange}
						triggerLabel={leaderLocked ? "队长已锁定" : "更换队长"}
						disabled={leaderLocked}
					/>
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-muted-foreground" />
						<p className="text-sm font-medium">团队成员</p>
						<Badge variant="secondary">
							{members.length} / {maxMembers}
						</Badge>
					</div>
					<div className="flex gap-2">
						<Button
							variant={
								memberScope === "event" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setMemberScope("event")}
						>
							活动报名者
						</Button>
						<Button
							variant={
								memberScope === "global" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setMemberScope("global")}
						>
							全站用户
						</Button>
					</div>
				</div>
				<UserSearchCombobox
					eventId={eventId}
					scope={memberScope}
					excludeIds={[leader?.id ?? "", ...members.map((m) => m.id)]}
					onSelect={handleAddMember}
					triggerLabel="添加队员"
				/>

				<div className="flex flex-wrap gap-2">
					{members.length === 0 && (
						<p className="text-sm text-muted-foreground">
							尚未添加队员，最多可添加 {maxMembers} 人
						</p>
					)}
					{members.map((member) => (
						<div
							key={member.id}
							className="flex items-center gap-2 rounded-full border px-3 py-1"
						>
							<Avatar className="h-6 w-6">
								<AvatarImage src={member.image ?? undefined} />
								<AvatarFallback>
									{member.name?.slice(0, 2) ?? "?"}
								</AvatarFallback>
							</Avatar>
							<div className="text-sm">
								<p className="font-medium leading-none">
									{member.name}
								</p>
								{member.username && (
									<p className="text-xs text-muted-foreground">
										@{member.username}
									</p>
								)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleRemoveMember(member.id)}
							>
								移除
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
