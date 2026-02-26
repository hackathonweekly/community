"use client";

import { useState, useEffect } from "react";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Switch } from "@community/ui/ui/switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Coins, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@community/lib-client/auth/client";

const TASK_CATEGORIES = {
	COMMUNITY_SERVICE: {
		label: "社区服务",
		description: "志愿者服务、新人引导、问答支持等",
	},
	CONTENT_CREATION: {
		label: "内容创作",
		description: "文章撰写、翻译、教程制作等",
	},
	PRODUCT_TECH: {
		label: "产品技术",
		description: "功能开发、Bug修复、代码审查等",
	},
	OPERATION_PROMOTION: {
		label: "运营推广",
		description: "合作对接、嘉宾邀请、数据分析等",
	},
	OTHER: { label: "其他", description: "其他类型的贡献任务" },
};

const TASK_PRIORITY = {
	LOW: { label: "低优先级", description: "不紧急的任务" },
	NORMAL: { label: "普通", description: "常规优先级任务" },
	HIGH: { label: "高优先级", description: "重要且紧急的任务" },
	URGENT: { label: "紧急", description: "需要立即处理的任务" },
};

interface UserInfo {
	cpValue: number;
	role: string;
}

export function CreateTask() {
	const { data: session } = useSession();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// 表单状态
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "",
		cpReward: 10,
		deadline: "",
		tags: [] as string[],
		priority: "NORMAL",
		featured: false,
	});

	const [tagInput, setTagInput] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	// 获取用户信息
	const fetchUserInfo = async () => {
		if (!session?.user) {
			return;
		}

		try {
			const response = await fetch("/api/profile");
			if (response.ok) {
				const data = await response.json();
				setUserInfo({
					cpValue: data.user.cpValue || 0,
					role: data.user.role || "user",
				});
			}
		} catch (error) {
			console.error("获取用户信息失败:", error);
		}
	};

	useEffect(() => {
		if (session?.user) {
			fetchUserInfo();
		}
	}, [session]);

	// 验证表单
	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.title.trim()) {
			newErrors.title = "任务标题不能为空";
		} else if (formData.title.length > 100) {
			newErrors.title = "标题长度不能超过100字符";
		}

		if (!formData.description.trim()) {
			newErrors.description = "任务描述不能为空";
		} else if (formData.description.length < 10) {
			newErrors.description = "任务描述至少需要10个字符";
		} else if (formData.description.length > 2000) {
			newErrors.description = "描述长度不能超过2000字符";
		}

		if (!formData.category) {
			newErrors.category = "请选择任务分类";
		}

		if (formData.cpReward < 1) {
			newErrors.cpReward = "CP奖励必须大于0";
		} else if (formData.cpReward > 1000) {
			newErrors.cpReward = "单个任务CP奖励不能超过1000";
		}

		// 检查用户CP余额（非管理员）
		if (
			userInfo?.role !== "admin" &&
			userInfo &&
			formData.cpReward > userInfo.cpValue
		) {
			newErrors.cpReward = `CP余额不足，当前余额：${userInfo.cpValue}`;
		}

		if (formData.deadline) {
			const deadlineDate = new Date(formData.deadline);
			const now = new Date();
			if (deadlineDate <= now) {
				newErrors.deadline = "截止时间必须晚于当前时间";
			}
		}

		if (formData.tags.length > 10) {
			newErrors.tags = "标签数量不能超过10个";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// 添加标签
	const addTag = () => {
		if (
			tagInput.trim() &&
			!formData.tags.includes(tagInput.trim()) &&
			formData.tags.length < 10
		) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, tagInput.trim()],
			}));
			setTagInput("");
		}
	};

	// 移除标签
	const removeTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	// 处理标签输入
	const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag();
		}
	};

	// 提交表单
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setShowConfirmDialog(true);
	};

	// 确认创建任务
	const confirmCreate = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					deadline: formData.deadline
						? new Date(formData.deadline).toISOString()
						: undefined,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				toast.success("任务创建成功！");
				router.push(`/tasks/${data.task.id}`);
			} else {
				const error = await response.json();
				toast.error(error.error || "创建任务失败");
			}
		} catch (error) {
			console.error("创建任务失败:", error);
			toast.error("创建任务失败");
		} finally {
			setLoading(false);
			setShowConfirmDialog(false);
		}
	};

	if (!session?.user) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="mb-1 font-brand text-lg font-bold text-foreground">
					请先登录
				</h1>
				<p className="mb-4 max-w-sm text-sm text-muted-foreground">
					您需要登录后才能发布任务
				</p>
				<Button asChild>
					<Link href="/auth/signin">立即登录</Link>
				</Button>
			</div>
		);
	}

	const isAdmin = userInfo?.role === "admin";
	const canAfford =
		!userInfo || isAdmin || formData.cpReward <= userInfo.cpValue;

	return (
		<div>
			{/* 返回按钮 - 桌面端显示 */}
			<Button
				variant="ghost"
				className="mb-4 hidden h-8 rounded-full px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground lg:inline-flex"
				asChild
			>
				<Link href="/tasks">
					<ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
					返回任务大厅
				</Link>
			</Button>

			{/* 面包屑导航 */}
			<nav className="mb-4 flex text-sm text-muted-foreground">
				<Link
					href="/tasks"
					className="transition-colors hover:text-foreground"
				>
					任务大厅
				</Link>
				<span className="mx-2">/</span>
				<span className="text-foreground">发布任务</span>
			</nav>

			{/* 页面标题 */}
			<div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						发布任务
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						创建社区贡献任务，邀请其他成员参与
					</p>
				</div>
			</div>

			<div className="max-w-4xl">
				{/* 用户CP信息 */}
				{userInfo && (
					<div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-subtle">
						<div className="flex items-center gap-2">
							<Coins className="h-4 w-4 text-foreground" />
							<span className="text-sm font-medium text-foreground">
								当前CP余额：{userInfo.cpValue}
							</span>
							{isAdmin && (
								<Badge variant="secondary">
									管理员（无需消耗CP）
								</Badge>
							)}
						</div>
						<div className="text-xs text-muted-foreground">
							{isAdmin
								? "管理员发布官方任务"
								: "发布任务将消耗对应的CP"}
						</div>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
						{/* 主要表单区域 */}
						<div className="space-y-4 lg:col-span-2">
							<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-sm font-bold text-foreground">
										基本信息
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground">
										填写任务的基本信息
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 p-4 pt-2">
									{/* 任务标题 */}
									<div className="space-y-1.5">
										<Label htmlFor="title">
											任务标题 *
										</Label>
										<Input
											id="title"
											placeholder="请输入任务标题（简洁明确）"
											value={formData.title}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													title: e.target.value,
												}))
											}
											className={
												errors.title
													? "border-red-500"
													: ""
											}
										/>
										{errors.title && (
											<p className="text-sm text-red-500">
												{errors.title}
											</p>
										)}
										<p className="mt-1 text-xs text-muted-foreground">
											{formData.title.length}/100 字符
										</p>
									</div>

									{/* 任务描述 */}
									<div className="space-y-1.5">
										<Label htmlFor="description">
											任务描述 *
										</Label>
										<Textarea
											id="description"
											placeholder="详细描述任务内容、要求、交付标准等..."
											value={formData.description}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													description: e.target.value,
												}))
											}
											rows={8}
											className={
												errors.description
													? "border-red-500"
													: ""
											}
										/>
										{errors.description && (
											<p className="text-sm text-red-500">
												{errors.description}
											</p>
										)}
										<p className="mt-1 text-xs text-muted-foreground">
											{formData.description.length}/2000
											字符，支持Markdown格式
										</p>
									</div>

									{/* 任务分类 */}
									<div className="space-y-1.5">
										<Label>任务分类 *</Label>
										<Select
											value={formData.category}
											onValueChange={(value) =>
												setFormData((prev) => ({
													...prev,
													category: value,
												}))
											}
										>
											<SelectTrigger
												className={
													errors.category
														? "border-red-500"
														: ""
												}
											>
												<SelectValue placeholder="选择任务分类" />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(
													TASK_CATEGORIES,
												).map(([key, value]) => (
													<SelectItem
														key={key}
														value={key}
													>
														<div>
															<div className="font-medium">
																{value.label}
															</div>
															<div className="text-xs text-muted-foreground">
																{
																	value.description
																}
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.category && (
											<p className="text-sm text-red-500">
												{errors.category}
											</p>
										)}
									</div>
								</CardContent>
							</Card>

							<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-sm font-bold text-foreground">
										任务设置
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground">
										设置任务的奖励、优先级等
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 p-4 pt-2">
									{/* CP奖励 */}
									<div className="space-y-1.5">
										<Label htmlFor="cpReward">
											CP奖励 *
										</Label>
										<div className="flex items-center gap-2">
											<Input
												id="cpReward"
												type="number"
												min="1"
												max="1000"
												value={formData.cpReward}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														cpReward:
															Number.parseInt(
																e.target.value,
															) || 1,
													}))
												}
												className={
													errors.cpReward
														? "border-red-500"
														: ""
												}
											/>
											<span className="text-xs text-muted-foreground">
												积分
											</span>
										</div>
										{errors.cpReward && (
											<p className="text-sm text-red-500">
												{errors.cpReward}
											</p>
										)}
										{!canAfford && (
											<p className="mt-1 text-sm text-orange-600">
												<AlertCircle className="w-4 h-4 inline mr-1" />
												CP余额可能不足，请降低奖励或充值
											</p>
										)}
									</div>

									{/* 任务优先级 */}
									<div className="space-y-1.5">
										<Label>任务优先级</Label>
										<Select
											value={formData.priority}
											onValueChange={(value) =>
												setFormData((prev) => ({
													...prev,
													priority: value,
												}))
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="选择优先级" />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(
													TASK_PRIORITY,
												).map(([key, value]) => (
													<SelectItem
														key={key}
														value={key}
													>
														<div>
															<div className="font-medium">
																{value.label}
															</div>
															<div className="text-xs text-muted-foreground">
																{
																	value.description
																}
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* 截止时间 */}
									<div className="space-y-1.5">
										<Label htmlFor="deadline">
											截止时间（可选）
										</Label>
										<Input
											id="deadline"
											type="datetime-local"
											value={formData.deadline}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													deadline: e.target.value,
												}))
											}
											className={
												errors.deadline
													? "border-red-500"
													: ""
											}
											min={format(
												new Date(),
												"yyyy-MM-dd'T'HH:mm",
											)}
										/>
										{errors.deadline && (
											<p className="text-sm text-red-500">
												{errors.deadline}
											</p>
										)}
									</div>

									{/* 精选任务（仅管理员） */}
									{isAdmin && (
										<div className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3">
											<div>
												<Label
													htmlFor="featured"
													className="font-medium"
												>
													精选任务
												</Label>
												<p className="text-xs text-muted-foreground">
													在任务大厅中优先展示
												</p>
											</div>
											<Switch
												id="featured"
												checked={formData.featured}
												onCheckedChange={(checked) =>
													setFormData((prev) => ({
														...prev,
														featured: checked,
													}))
												}
											/>
										</div>
									)}
								</CardContent>
							</Card>

							{/* 标签 */}
							<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-sm font-bold text-foreground">
										任务标签
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground">
										添加标签帮助其他人更好地找到这个任务
									</CardDescription>
								</CardHeader>
								<CardContent className="p-4 pt-2">
									<div className="space-y-3">
										<div className="flex gap-2">
											<Input
												placeholder="输入标签，按回车或逗号添加"
												value={tagInput}
												onChange={(e) =>
													setTagInput(e.target.value)
												}
												onKeyDown={handleTagInput}
												className="flex-1"
											/>
											<Button
												type="button"
												onClick={addTag}
												variant="outline"
											>
												添加
											</Button>
										</div>
										{formData.tags.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{formData.tags.map((tag) => (
													<Badge
														key={tag}
														variant="secondary"
														className="cursor-pointer"
														onClick={() =>
															removeTag(tag)
														}
													>
														{tag} ×
													</Badge>
												))}
											</div>
										)}
										{errors.tags && (
											<p className="text-sm text-red-500">
												{errors.tags}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											{formData.tags.length}/10 个标签
										</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* 侧边栏预览 */}
						<div className="space-y-4">
							<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
								<CardHeader className="p-3 pb-2">
									<CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										任务预览
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 p-3 pt-0">
									<div>
										<h3 className="mb-1 font-brand text-sm font-bold text-foreground">
											{formData.title || "任务标题"}
										</h3>
										<div className="mb-2 flex items-center gap-2">
											{formData.category && (
												<Badge variant="secondary">
													{
														TASK_CATEGORIES[
															formData.category as keyof typeof TASK_CATEGORIES
														]?.label
													}
												</Badge>
											)}
											<Badge variant="outline">
												{
													TASK_PRIORITY[
														formData.priority as keyof typeof TASK_PRIORITY
													]?.label
												}
											</Badge>
										</div>
										<div className="text-xs text-muted-foreground line-clamp-3">
											{formData.description ||
												"任务描述将在这里显示..."}
										</div>
									</div>
									<div className="flex items-center justify-between border-t border-border/50 pt-2">
										<div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
											<Coins className="w-4 h-4" />
											<span>{formData.cpReward}积分</span>
										</div>
										{formData.deadline && (
											<div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
												<Calendar className="w-3 h-3" />
												截止时间
											</div>
										)}
									</div>
									{formData.tags.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{formData.tags
												.slice(0, 3)
												.map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
											{formData.tags.length > 3 && (
												<Badge
													variant="outline"
													className="text-xs"
												>
													+{formData.tags.length - 3}
												</Badge>
											)}
										</div>
									)}
								</CardContent>
							</Card>

							{/* 提示信息 */}
							<Card className="rounded-lg border border-border bg-muted/50 p-0 shadow-subtle">
								<CardHeader className="p-3 pb-2">
									<CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										<Info className="h-3.5 w-3.5" />
										发布提示
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1.5 p-3 pt-0 text-xs text-muted-foreground">
									<p>• 任务发布后，其他用户可以认领并完成</p>
									<p>
										•{" "}
										{isAdmin
											? "管理员任务无需消耗CP"
											: "用户任务需要预先消耗CP作为奖励"}
									</p>
									<p>
										• 任务完成并审核通过后，CP将发放给认领者
									</p>
									<p>
										• 建议设置合理的CP奖励以吸引更多参与者
									</p>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* 提交按钮 */}
					<div className="flex justify-end gap-3 border-t border-border pt-4">
						<Button
							variant="outline"
							className="rounded-full"
							asChild
						>
							<Link href="/tasks">取消</Link>
						</Button>
						<Button
							type="submit"
							disabled={!canAfford}
							className="min-w-32 rounded-full"
						>
							发布任务
						</Button>
					</div>
				</form>
			</div>

			{/* 确认对话框 */}
			<AlertDialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认发布任务</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2">
							<p>您即将发布以下任务：</p>
							<div className="rounded-md bg-muted p-3 text-sm">
								<p>
									<strong>标题：</strong>
									{formData.title}
								</p>
								<p>
									<strong>分类：</strong>
									{
										TASK_CATEGORIES[
											formData.category as keyof typeof TASK_CATEGORIES
										]?.label
									}
								</p>
								<p>
									<strong>CP奖励：</strong>
									{formData.cpReward}
								</p>
								{!isAdmin && (
									<p className="text-orange-600">
										<strong>将消耗：</strong>
										{formData.cpReward}积分（当前余额：
										{userInfo?.cpValue}）
									</p>
								)}
							</div>
							<p className="text-sm text-muted-foreground">
								任务发布后，其他用户可以认领并完成。请确保任务信息准确无误。
							</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loading}>
							取消
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmCreate}
							disabled={loading}
						>
							{loading ? "发布中..." : "确认发布"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
