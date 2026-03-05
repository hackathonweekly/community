"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Button } from "@community/ui/ui/button";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { X, UserPlus } from "lucide-react";
import { useState } from "react";
import {
	MemberSearchInput,
	type MemberSearchUser,
} from "@shared/components/MemberSearchInput";

type User = MemberSearchUser;

interface TeamMember {
	user: User;
	role: "LEADER" | "MEMBER";
}

interface TeamMemberSelectorProps {
	selectedMembers: TeamMember[];
	onChange: (members: TeamMember[]) => void;
	currentUserId?: string; // 当前用户ID，避免选择自己
}

export function TeamMemberSelector({
	selectedMembers,
	onChange,
	currentUserId,
}: TeamMemberSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// 添加团队成员
	const handleAddMember = (
		user: User,
		role: "LEADER" | "MEMBER" = "MEMBER",
	) => {
		const newMember: TeamMember = { user, role };
		onChange([...selectedMembers, newMember]);
		setSearchQuery("");
	};

	// 移除团队成员
	const handleRemoveMember = (userId: string) => {
		onChange(selectedMembers.filter((member) => member.user.id !== userId));
	};

	// 更新成员角色
	const handleRoleChange = (userId: string, newRole: "LEADER" | "MEMBER") => {
		onChange(
			selectedMembers.map((member) =>
				member.user.id === userId
					? { ...member, role: newRole }
					: member,
			),
		);
	};

	return (
		<div className="space-y-4">
			<div>
				<Label
					htmlFor="teamMemberSearch"
					className="text-sm font-medium"
				>
					添加团队成员
				</Label>
				<p className="text-xs text-gray-500 mt-1">
					搜索已注册用户并添加为团队成员
				</p>
			</div>

			{/* 搜索框 */}
			<MemberSearchInput
				id="teamMemberSearch"
				value={searchQuery}
				onValueChange={setSearchQuery}
				onSelect={handleAddMember}
				placeholder="输入姓名、用户名或手机号搜索..."
				excludeUserIds={[
					...(currentUserId ? [currentUserId] : []),
					...selectedMembers.map((member) => member.user.id),
				]}
				dropdownClassName="z-20"
			/>

			{/* 已选择的团队成员列表 */}
			{selectedMembers.length > 0 && (
				<div className="space-y-3">
					<div className="text-sm font-medium">
						团队成员 ({selectedMembers.length})
					</div>
					<div className="space-y-2">
						{selectedMembers.map((member) => (
							<div
								key={member.user.id}
								className="sm:flex flex-col relative gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
							>
								{/* 移除按钮 */}
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() =>
										handleRemoveMember(member.user.id)
									}
									className="sm:relative absolute top-2 right-2 sm:top-0 rounded-md border border-transparent text-sm text-gray-500 hover:border-red-100 hover:bg-red-50 hover:text-red-500"
								>
									<X className="h-2 w-2" />
								</Button>
								<div className="flex items-start gap-3 sm:flex-1 sm:items-center">
									<Avatar className="h-10 w-10 sm:h-8 sm:w-8 mb-2">
										<AvatarImage src={member.user.image} />
										<AvatarFallback>
											{member.user.name[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1 space-y-1">
										<div className="text-sm font-medium text-gray-900">
											{member.user.name}
										</div>
										<div className="text-xs text-gray-500">
											{member.user.username &&
												`@${member.user.username}`}
											{member.user.userRoleString && (
												<span
													className={
														member.user.username
															? " • "
															: ""
													}
												>
													{member.user.userRoleString}
												</span>
											)}
										</div>
									</div>
									{/* <Badge
										variant={
											member.role === "LEADER"
												? "default"
												: "secondary"
										}
									>
										{member.role === "LEADER"
											? "团队领导"
											: "团队成员"}
									</Badge> */}
								</div>

								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:pl-4 sm:border-l sm:border-gray-200">
									<div className="flex flex-col gap-1 sm:w-28">
										{/* 角色选择器 */}
										<Select
											value={member.role}
											onValueChange={(
												value: "LEADER" | "MEMBER",
											) =>
												handleRoleChange(
													member.user.id,
													value,
												)
											}
										>
											<SelectTrigger className="h-9 w-full rounded-md sm:h-8">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="MEMBER">
													成员
												</SelectItem>
												<SelectItem value="LEADER">
													领导
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{selectedMembers.length === 0 && (
				<div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
					<UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
					<p className="text-sm">还没有添加团队成员</p>
					<p className="text-xs">
						搜索并添加已注册的用户作为团队成员
					</p>
				</div>
			)}
		</div>
	);
}
