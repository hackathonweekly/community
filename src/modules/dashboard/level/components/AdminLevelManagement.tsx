"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
	Search,
	Settings,
	UserCheck,
	Crown,
	Trophy,
	GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { UserLevelBadges } from "./LevelBadge";

interface User {
	id: string;
	name: string;
	username: string | null;
	email: string;
	membershipLevel: string | null;
	creatorLevel: string | null;
	mentorLevel: string | null;
	contributorLevel: string | null;
}

interface AdminLevelManagementProps {
	// 可以传入当前用户角色来控制权限
	isAdmin: boolean;
}

// 等级选项配置
const LEVEL_OPTIONS = {
	MEMBERSHIP: [
		{ value: "NONE", label: "无等级" },
		{ value: "VISITOR", label: "新朋友" },
		{ value: "MEMBER", label: "共创伙伴" },
	],
	CREATOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "C1", label: "创作者 C1" },
		{ value: "C2", label: "创作者 C2" },
		{ value: "C3", label: "创作者 C3" },
	],
	MENTOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "M1", label: "导师 M1" },
		{ value: "M2", label: "导师 M2" },
		{ value: "M3", label: "导师 M3" },
	],
	CONTRIBUTOR: [
		{ value: "NONE", label: "无等级" },
		{ value: "O1", label: "贡献者 O1" },
		{ value: "O2", label: "贡献者 O2" },
		{ value: "O3", label: "贡献者 O3" },
	],
};

const LEVEL_TYPE_OPTIONS = [
	{ value: "MEMBERSHIP", label: "参与层级", icon: UserCheck },
	{ value: "CREATOR", label: "创作者等级", icon: Crown },
	{ value: "MENTOR", label: "导师等级", icon: GraduationCap },
	{ value: "CONTRIBUTOR", label: "贡献者等级", icon: Trophy },
];

interface LevelAdjustDialogProps {
	user: User;
	onAdjust: (
		userId: string,
		levelType: string,
		level: string | null,
		reason: string,
	) => void;
	isLoading: boolean;
}

function LevelAdjustDialog({
	user,
	onAdjust,
	isLoading,
}: LevelAdjustDialogProps) {
	const [open, setOpen] = useState(false);
	const [levelType, setLevelType] = useState<string>("");
	const [level, setLevel] = useState<string>("");
	const [reason, setReason] = useState("");

	const handleSubmit = () => {
		if (!levelType || !reason.trim()) {
			return;
		}

		onAdjust(user.id, levelType, level === "NONE" ? null : level, reason);
		setOpen(false);
		setLevelType("");
		setLevel("");
		setReason("");
	};

	const getCurrentLevel = (type: string) => {
		switch (type) {
			case "MEMBERSHIP":
				return user.membershipLevel;
			case "CREATOR":
				return user.creatorLevel;
			case "MENTOR":
				return user.mentorLevel;
			case "CONTRIBUTOR":
				return user.contributorLevel;
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Settings className="h-4 w-4 mr-2" />
					调整等级
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>调整用户等级</DialogTitle>
					<DialogDescription>
						直接为 {user.name} 设置等级，无需用户申请
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* 用户信息 */}
					<div className="p-4 border rounded-lg bg-muted/50">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="font-medium">用户:</span>{" "}
								{user.name}
							</div>
							<div>
								<span className="font-medium">邮箱:</span>{" "}
								<span className="break-all">{user.email}</span>
							</div>
							{user.username && (
								<div>
									<span className="font-medium">用户名:</span>{" "}
									@{user.username}
								</div>
							)}
						</div>
					</div>

					{/* 当前等级 */}
					<div>
						<Label className="text-base font-medium">
							当前等级
						</Label>
						<div className="mt-2">
							<UserLevelBadges user={user} />
						</div>
					</div>

					{/* 等级类型选择 */}
					<div>
						<Label htmlFor="levelType">等级类型</Label>
						<Select value={levelType} onValueChange={setLevelType}>
							<SelectTrigger>
								<SelectValue placeholder="选择要调整的等级类型" />
							</SelectTrigger>
							<SelectContent>
								{LEVEL_TYPE_OPTIONS.map((option) => {
									const Icon = option.icon;
									return (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											<div className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												{option.label}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>

					{/* 目标等级选择 */}
					{levelType && (
						<div>
							<Label htmlFor="level">
								目标等级
								{getCurrentLevel(levelType) && (
									<span className="text-sm text-muted-foreground ml-2">
										(当前: {getCurrentLevel(levelType)})
									</span>
								)}
							</Label>
							<Select value={level} onValueChange={setLevel}>
								<SelectTrigger>
									<SelectValue placeholder="选择目标等级" />
								</SelectTrigger>
								<SelectContent>
									{LEVEL_OPTIONS[
										levelType as keyof typeof LEVEL_OPTIONS
									]?.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* 调整理由 */}
					<div>
						<Label htmlFor="reason">
							调整理由
							<span className="text-sm text-muted-foreground ml-2">
								(至少5个字符)
							</span>
						</Label>
						<Textarea
							id="reason"
							placeholder="请输入调整理由，至少5个字符..."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
						{reason.length > 0 && reason.length < 5 && (
							<p className="text-sm text-destructive mt-1">
								调整理由至少需要5个字符，当前 {reason.length}{" "}
								个字符
							</p>
						)}
					</div>

					{/* 操作按钮 */}
					<div className="flex gap-3 pt-4">
						<Button
							onClick={handleSubmit}
							disabled={
								isLoading || !levelType || reason.length < 5
							}
							className="flex-1"
						>
							{isLoading ? "处理中..." : "确认调整"}
						</Button>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							取消
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function AdminLevelManagement({ isAdmin }: AdminLevelManagementProps) {
	const { toast } = useToast();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [searching, setSearching] = useState(false);
	const [adjustLoading, setAdjustLoading] = useState(false);

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			toast({
				title: "请输入搜索关键词",
				description: "可以搜索用户名、邮箱或用户ID",
				variant: "destructive",
			});
			return;
		}

		try {
			setSearching(true);
			const response = await fetch(
				`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`,
			);
			const result = await response.json();

			if (result.success) {
				setSearchResults(result.users);
				if (result.users.length === 0) {
					toast({
						title: "未找到用户",
						description: "请尝试其他搜索关键词",
					});
				}
			} else {
				throw new Error(result.error || "搜索失败");
			}
		} catch (error) {
			console.error("搜索用户失败:", error);
			toast({
				title: "搜索失败",
				description:
					error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setSearching(false);
		}
	};

	const handleLevelAdjust = async (
		userId: string,
		levelType: string,
		level: string | null,
		reason: string,
	) => {
		try {
			setAdjustLoading(true);

			const response = await fetch("/api/level/admin/adjust", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId,
					levelType,
					level,
					reason,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "等级调整成功",
					description: "用户等级已更新",
				});

				// 刷新搜索结果
				if (searchQuery.trim()) {
					handleSearch();
				}
			} else {
				throw new Error(result.error || "调整失败");
			}
		} catch (error) {
			console.error("调整用户等级失败:", error);

			let errorMessage = "请稍后重试";

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			// 处理API返回的详细错误信息
			if (
				error instanceof Error &&
				error.message.includes("请求数据格式错误")
			) {
				errorMessage =
					"数据格式错误，请检查用户ID格式和调整理由长度（至少5个字符）";
			}

			toast({
				title: "调整失败",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setAdjustLoading(false);
		}
	};

	// 只有管理员可以使用此功能
	if (!isAdmin) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Settings className="h-5 w-5" />
					管理员等级管理
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* 搜索用户 */}
					<div>
						<Label
							htmlFor="search"
							className="text-base font-medium"
						>
							搜索用户
						</Label>
						<div className="flex gap-3 mt-2">
							<Input
								id="search"
								placeholder="输入用户名、邮箱或用户ID..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSearch();
									}
								}}
							/>
							<Button
								onClick={handleSearch}
								disabled={searching}
								className="min-w-[80px]"
							>
								<Search className="h-4 w-4 mr-2" />
								{searching ? "搜索中..." : "搜索"}
							</Button>
						</div>
					</div>

					{/* 搜索结果 */}
					{searchResults.length > 0 && (
						<div>
							<Label className="text-base font-medium">
								搜索结果 ({searchResults.length})
							</Label>
							<div className="space-y-4 mt-3">
								{searchResults.map((user) => (
									<div
										key={user.id}
										className="p-4 border rounded-lg space-y-3"
									>
										{/* 用户基本信息 */}
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div>
													<p className="font-medium">
														{user.name}
													</p>
													<p className="text-sm text-muted-foreground break-all">
														{user.email}
														{user.username && (
															<span className="ml-2 break-normal">
																@{user.username}
															</span>
														)}
													</p>
												</div>
											</div>
											<LevelAdjustDialog
												user={user}
												onAdjust={handleLevelAdjust}
												isLoading={adjustLoading}
											/>
										</div>

										{/* 用户当前等级 */}
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												当前等级
											</p>
											<UserLevelBadges
												user={user}
												size="sm"
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 使用说明 */}
					<div className="text-sm text-muted-foreground space-y-2">
						<p className="font-medium">功能说明：</p>
						<ul className="list-disc list-inside space-y-1 ml-4">
							<li>
								搜索用户：支持按用户名、邮箱或用户ID精确查找用户
							</li>
							<li>
								直接调整：管理员可以直接为用户设置任何等级，无需用户申请
							</li>
							<li>
								操作记录：所有调整操作都会记录到系统中，便于审计
							</li>
							<li>权限限制：只有超级管理员可以使用此功能</li>
						</ul>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
