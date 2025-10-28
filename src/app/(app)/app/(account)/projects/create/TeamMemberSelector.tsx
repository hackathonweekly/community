"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, X, UserPlus } from "lucide-react";
import { useState } from "react";

interface User {
	id: string;
	name: string;
	username?: string;
	image?: string;
	userRoleString?: string;
	currentWorkOn?: string;
}

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
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// 搜索用户
	const searchUsers = async (query: string) => {
		if (query.length < 2) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch(
				`/api/users/search?query=${encodeURIComponent(query)}`,
			);
			if (response.ok) {
				const data = await response.json();
				// 过滤掉当前用户和已选择的成员
				const filteredResults = (data.data || []).filter(
					(user: User) => {
						return (
							user.id !== currentUserId &&
							!selectedMembers.some(
								(member) => member.user.id === user.id,
							)
						);
					},
				);
				setSearchResults(filteredResults);
			} else {
				console.error("Failed to search users:", response.status);
				setSearchResults([]);
			}
		} catch (error) {
			console.error("Error searching users:", error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// 添加团队成员
	const handleAddMember = (
		user: User,
		role: "LEADER" | "MEMBER" = "MEMBER",
	) => {
		const newMember: TeamMember = { user, role };
		onChange([...selectedMembers, newMember]);
		setSearchQuery("");
		setSearchResults([]);
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
			<div className="relative">
				<div className="relative w-full">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<Input
						id="teamMemberSearch"
						value={searchQuery}
						onChange={(e) => {
							const query = e.target.value;
							setSearchQuery(query);
							searchUsers(query);
						}}
						placeholder="输入用户名或姓名搜索..."
						className="pl-10"
						autoComplete="off"
					/>
					{isSearching && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
						</div>
					)}
				</div>

				{/* 搜索结果下拉列表 */}
				{searchResults.length > 0 && (
					<div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
						{searchResults.map((user) => (
							<button
								key={user.id}
								type="button"
								onClick={() => handleAddMember(user)}
								className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 border-b last:border-b-0"
							>
								<Avatar className="h-8 w-8">
									<AvatarImage src={user.image} />
									<AvatarFallback>
										{user.name[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">
										{user.name}
									</div>
									<div className="text-xs text-gray-500">
										{user.username && `@${user.username}`}
										{user.userRoleString && (
											<span
												className={
													user.username ? " • " : ""
												}
											>
												{user.userRoleString}
											</span>
										)}
									</div>
									{user.currentWorkOn && (
										<div className="text-xs text-gray-400 mt-1">
											当前在做: {user.currentWorkOn}
										</div>
									)}
								</div>
								<UserPlus className="w-4 h-4 text-gray-400" />
							</button>
						))}
					</div>
				)}
			</div>

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
