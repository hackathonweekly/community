"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	CalendarIcon,
	ClockIcon,
	FolderIcon,
	PlusIcon,
	RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const buildingRegistrationSchema = z.object({
	projectId: z.string().min(1, "请选择或创建作品"),
	plan21Days: z.string().min(30, "21天计划至少需要30个字符"),
	visibilityLevel: z.enum(["PUBLIC", "PARTICIPANTS_ONLY"]),
});

type BuildingRegistrationFormData = z.infer<typeof buildingRegistrationSchema>;

interface Project {
	id: string;
	title: string;
	description: string | null; // Made optional to match database schema
	projectTags: string[];
	stage: string;
	screenshots: string[];
}

interface Event {
	id: string;
	title: string;
	richContent: string;
	shortDescription?: string;
	startTime: string;
	endTime: string;
	buildingConfig?: {
		duration: number;
		requiredCheckIns: number;
		depositAmount: number;
		refundRate: number;
		isPublic: boolean;
		allowAnonymous: boolean;
		enableVoting: boolean;
		votingEndTime?: string;
		paymentType?: string;
		paymentUrl?: string;
		paymentQRCode?: string;
		paymentNote?: string;
	};
}

interface BuildingPublicRegistrationProps {
	event: Event;
	onSubmit: (data: BuildingRegistrationFormData) => Promise<void>;
	isLoading?: boolean;
	existingRegistration?: any;
}

function ProjectCard({
	project,
	isSelected,
	onSelect,
}: {
	project: Project;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<Card
			className={`cursor-pointer transition-all hover:shadow-md ${
				isSelected ? "border-primary bg-primary/5" : ""
			}`}
			onClick={onSelect}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					{project.screenshots?.[0] ? (
						<img
							src={project.screenshots[0]}
							alt={project.title}
							className="w-12 h-12 rounded object-cover"
						/>
					) : (
						<div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
							<FolderIcon className="w-6 h-6 text-muted-foreground" />
						</div>
					)}
					<div className="flex-1 min-w-0">
						<h3 className="font-medium truncate">
							{project.title}
						</h3>
						<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
							{project.description || "暂无描述"}
						</p>
						<div className="flex items-center gap-2 mt-2">
							<Badge variant="outline" className="text-xs">
								{project.stage}
							</Badge>
							{project.projectTags?.slice(0, 2).map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="text-xs"
								>
									{tag}
								</Badge>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function BuildingPublicRegistration({
	event,
	onSubmit,
	isLoading = false,
	existingRegistration,
}: BuildingPublicRegistrationProps) {
	const [projects, setProjects] = useState<Project[]>([]);
	const [projectsLoading, setProjectsLoading] = useState(true);
	const [showCreateProject, setShowCreateProject] = useState(false);
	const [showProjectSelector, setShowProjectSelector] = useState(false);
	const [newProjectTitle, setNewProjectTitle] = useState("");
	const [newProjectSubtitle, setNewProjectSubtitle] = useState("");
	const [newProjectDescription, setNewProjectDescription] = useState("");
	const [userProfile, setUserProfile] = useState<any>(null);
	const [showProfileSuggestion, setShowProfileSuggestion] = useState(false);

	const form = useForm<BuildingRegistrationFormData>({
		resolver: zodResolver(buildingRegistrationSchema),
		defaultValues: {
			projectId: existingRegistration?.projectId || "",
			plan21Days: existingRegistration?.plan21Days || "",
			visibilityLevel: existingRegistration?.visibilityLevel || "PUBLIC",
		},
	});

	useEffect(() => {
		fetchUserProjects();
		fetchUserProfile();
	}, []);

	const fetchUserProfile = async () => {
		try {
			const response = await fetch("/api/user/profile");
			if (response.ok) {
				const data = await response.json();
				setUserProfile(data);
				checkProfileCompleteness(data);
			}
		} catch (error) {
			console.error("Error fetching user profile:", error);
		}
	};

	const checkProfileCompleteness = (profile: any) => {
		if (!profile) {
			return;
		}

		const requiredFields = [
			"name",
			"userRoleString",
			"currentWorkOn",
			"bio",
		];
		const missingFields = requiredFields.filter((field) => !profile[field]);
		const hasSkills = profile.skills && profile.skills.length > 0;

		if (missingFields.length > 0 || !hasSkills) {
			setShowProfileSuggestion(true);
		}
	};

	const fetchUserProjects = async () => {
		try {
			const response = await fetch("/api/projects");
			if (response.ok) {
				const data = await response.json();
				setProjects(data.projects || []);
			}
		} catch (error) {
			console.error("Error fetching projects:", error);
			toast.error("获取作品列表失败");
		} finally {
			setProjectsLoading(false);
		}
	};

	const selectedProject = projects.find(
		(p) => p.id === form.watch("projectId"),
	);

	const handleProjectSelect = (project: Project) => {
		form.setValue("projectId", project.id);
	};

	const createNewProject = async () => {
		if (!newProjectTitle.trim() || !newProjectSubtitle.trim()) {
			toast.error("作品名称和一句话介绍是必需的");
			return;
		}

		try {
			const response = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: newProjectTitle.trim(),
					subtitle: newProjectSubtitle.trim(),
					description: newProjectDescription.trim() || null,
					stage: "IDEA",
					projectTags: [],
				}),
			});

			if (response.ok) {
				const result = await response.json();
				const newProject = result.project; // API returns { project }
				setProjects([...projects, newProject]);
				form.setValue("projectId", newProject.id);
				setShowCreateProject(false);
				setNewProjectTitle("");
				setNewProjectSubtitle("");
				setNewProjectDescription("");
				toast.success("作品创建成功！");
			} else {
				throw new Error("创建作品失败");
			}
		} catch (error) {
			console.error("Error creating project:", error);
			toast.error("创建作品失败，请稍后重试");
		}
	};

	const handleFormSubmit = async (data: BuildingRegistrationFormData) => {
		await onSubmit(data);
	};

	const isRegistrationPeriod = new Date() <= new Date(event.endTime); // Allow registration until event ends

	if (!isRegistrationPeriod && !existingRegistration) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<div className="text-muted-foreground mb-4">
						⏰ 挑战设置已关闭
					</div>
					<p className="text-sm text-muted-foreground">
						该 Building Public
						活动的挑战设置已结束，无法再提交打卡计划
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-xl sm:text-2xl font-bold">
					{existingRegistration ? "更新打卡设置" : "完善打卡设置"}
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground px-4">
					为期 {event.buildingConfig?.duration || 21}{" "}
					天的开发挑战，坚持打卡，展示你的开发进度
				</p>
			</div>

			{/* 活动信息卡片 - 移动端优化 */}
			<Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
				<CardHeader className="pb-3 sm:pb-6">
					<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
						<RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
						挑战详情
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
							<CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
							<div>
								<div className="text-xs text-muted-foreground">
									持续时间
								</div>
								<span className="text-sm font-medium">
									{event.buildingConfig?.duration || 21} 天
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
							<ClockIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
							<div>
								<div className="text-xs text-muted-foreground">
									最少打卡
								</div>
								<span className="text-sm font-medium">
									{event.buildingConfig?.requiredCheckIns ||
										7}{" "}
									次
								</span>
							</div>
						</div>
					</div>

					{(event.buildingConfig?.paymentNote ||
						event.buildingConfig?.paymentQRCode) && (
						<div className="p-3 sm:p-4 bg-white/60 rounded-lg space-y-3">
							<div className="font-medium text-sm sm:text-base text-purple-800">
								💡 支付说明
							</div>
							{event.buildingConfig?.paymentNote && (
								<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
									{event.buildingConfig.paymentNote}
								</p>
							)}
							{event.buildingConfig?.paymentQRCode && (
								<div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
									<img
										src={event.buildingConfig.paymentQRCode}
										alt="支付二维码"
										className="w-28 h-28 sm:w-32 sm:h-32 border rounded"
									/>
									<span className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-0">
										请扫码完成活动费用支付，提交后组织者会人工核对。
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* 用户资料完善提示 - 移动端优化 */}
			{showProfileSuggestion && (
				<Card className="bg-blue-50 border-blue-200">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-start gap-3">
							<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
								<span className="text-blue-600 text-sm">
									💡
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
									建议完善个人资料
								</h4>
								<p className="text-xs sm:text-sm text-blue-700 mb-3">
									完善的个人资料能让其他参与者更好地了解您，增加协作和交流的机会。
								</p>
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
										onClick={() => {
											window.open("/profile", "_blank");
										}}
									>
										完善资料
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-blue-600 hover:bg-blue-100 w-full sm:w-auto"
										onClick={() =>
											setShowProfileSuggestion(false)
										}
									>
										稍后再说
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className="space-y-6 sm:space-y-8"
				>
					{/* 作品选择 - 移动端优化 */}
					<div className="space-y-3 sm:space-y-4">
						<div>
							<h3 className="text-base sm:text-lg font-semibold mb-2">
								选择作品
							</h3>
							<p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
								选择您要在这21天中开发的作品
							</p>
						</div>

						{selectedProject ? (
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg bg-green-50 border-green-200">
								<div className="flex items-center gap-3 min-w-0 flex-1">
									{selectedProject.screenshots?.[0] ? (
										<img
											src={selectedProject.screenshots[0]}
											alt={selectedProject.title}
											className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
										/>
									) : (
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
											<FolderIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
										</div>
									)}
									<div className="min-w-0 flex-1">
										<h4 className="font-medium text-sm sm:text-base truncate">
											{selectedProject.title}
										</h4>
										<p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
											{selectedProject.description ||
												"暂无描述"}
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowProjectSelector(true)}
									className="w-full sm:w-auto flex-shrink-0"
								>
									更换作品
								</Button>
							</div>
						) : (
							<div className="flex flex-col gap-2 sm:gap-3">
								<Button
									type="button"
									variant="outline"
									className="w-full justify-center"
									onClick={() => setShowProjectSelector(true)}
									disabled={projectsLoading}
								>
									<FolderIcon className="w-4 h-4 mr-2" />
									{projectsLoading
										? "加载中..."
										: "选择现有作品"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowCreateProject(true)}
									className="w-full justify-center"
								>
									<PlusIcon className="w-4 h-4 mr-2" />
									创建新作品
								</Button>
							</div>
						)}

						{/* Project Selector Modal - 移动端优化 */}
						<Dialog
							open={showProjectSelector}
							onOpenChange={setShowProjectSelector}
						>
							<DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4 sm:mx-auto">
								<DialogHeader className="flex-shrink-0">
									<DialogTitle className="text-base sm:text-lg">
										选择作品
									</DialogTitle>
									<DialogDescription className="text-sm">
										选择您要在这21天中开发的作品
									</DialogDescription>
								</DialogHeader>
								<div className="flex-1 overflow-y-auto">
									{projectsLoading ? (
										<div className="text-center py-8 text-muted-foreground text-sm">
											正在加载作品列表...
										</div>
									) : projects.length === 0 ? (
										<div className="text-center py-8">
											<FolderIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
											<h3 className="text-base sm:text-lg font-medium mb-2">
												还没有作品
											</h3>
											<p className="text-sm text-muted-foreground mb-4 px-4">
												您需要先创建一个作品才能参与Building
												Public挑战
											</p>
											<Button
												onClick={() => {
													setShowProjectSelector(
														false,
													);
													setShowCreateProject(true);
												}}
												className="w-full sm:w-auto"
											>
												<PlusIcon className="w-4 h-4 mr-2" />
												创建新作品
											</Button>
										</div>
									) : (
										<div className="space-y-3">
											{projects.map((project) => (
												<div
													key={project.id}
													className={`cursor-pointer transition-all hover:shadow-md p-3 sm:p-4 border rounded-lg ${
														selectedProject?.id ===
														project.id
															? "border-primary bg-primary/5"
															: ""
													}`}
													onClick={() => {
														handleProjectSelect(
															project,
														);
														setShowProjectSelector(
															false,
														);
													}}
												>
													<div className="flex items-start gap-3">
														{project
															.screenshots?.[0] ? (
															<img
																src={
																	project
																		.screenshots[0]
																}
																alt={
																	project.title
																}
																className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
															/>
														) : (
															<div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
																<FolderIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
															</div>
														)}
														<div className="flex-1 min-w-0">
															<h3 className="font-medium text-sm sm:text-base truncate">
																{project.title}
															</h3>
															<p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
																{project.description ||
																	"暂无描述"}
															</p>
															<div className="flex items-center gap-2 mt-2 overflow-x-auto">
																<Badge
																	variant="outline"
																	className="text-xs flex-shrink-0"
																>
																	{
																		project.stage
																	}
																</Badge>
																{project.projectTags
																	?.slice(
																		0,
																		2,
																	)
																	.map(
																		(
																			tag,
																		) => (
																			<Badge
																				key={
																					tag
																				}
																				variant="secondary"
																				className="text-xs flex-shrink-0"
																			>
																				{
																					tag
																				}
																			</Badge>
																		),
																	)}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</DialogContent>
						</Dialog>

						{/* Create Project Modal - 移动端优化 */}
						<Dialog
							open={showCreateProject}
							onOpenChange={setShowCreateProject}
						>
							<DialogContent className="max-w-md sm:max-w-lg mx-4 sm:mx-auto">
								<DialogHeader>
									<DialogTitle className="text-base sm:text-lg">
										创建新作品
									</DialogTitle>
									<DialogDescription className="text-sm">
										创建一个新作品用于参与Building
										Public挑战
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-3 sm:space-y-4">
									<div>
										<Label
											htmlFor="newProjectTitle"
											className="text-sm"
										>
											作品名称 *
										</Label>
										<Input
											id="newProjectTitle"
											placeholder="输入作品名称..."
											value={newProjectTitle}
											onChange={(e) =>
												setNewProjectTitle(
													e.target.value,
												)
											}
											className="mt-1"
										/>
									</div>
									<div>
										<Label
											htmlFor="newProjectSubtitle"
											className="text-sm"
										>
											一句话介绍 *
										</Label>
										<Input
											id="newProjectSubtitle"
											placeholder="用一句话介绍您的作品..."
											value={newProjectSubtitle}
											onChange={(e) =>
												setNewProjectSubtitle(
													e.target.value,
												)
											}
											className="mt-1"
										/>
									</div>
									<div>
										<Label
											htmlFor="newProjectDescription"
											className="text-sm"
										>
											作品描述 (可选)
										</Label>
										<Textarea
											id="newProjectDescription"
											placeholder="详细描述您的作品，可以稍后补充..."
											value={newProjectDescription}
											onChange={(e) =>
												setNewProjectDescription(
													e.target.value,
												)
											}
											className="min-h-[80px] sm:min-h-[100px] mt-1 resize-none"
										/>
									</div>
									<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
										<Button
											variant="outline"
											onClick={() =>
												setShowCreateProject(false)
											}
											className="w-full sm:w-auto order-2 sm:order-1"
										>
											取消
										</Button>
										<Button
											onClick={createNewProject}
											disabled={
												!newProjectTitle.trim() ||
												!newProjectSubtitle.trim()
											}
											className="w-full sm:w-auto order-1 sm:order-2"
										>
											创建作品并选择
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>

						<FormField
							control={form.control}
							name="projectId"
							render={({ field }) => (
								<FormItem className="hidden">
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{selectedProject && (
						<>
							{/* 21天计划和目标 - 移动端优化 */}
							<div className="space-y-3 sm:space-y-4">
								<div>
									<h3 className="text-base sm:text-lg font-semibold mb-2">
										21天开发计划和目标
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
										详细描述您在这21天中的具体目标和实施计划
									</p>
								</div>
								<FormField
									control={form.control}
									name="plan21Days"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm sm:text-base">
												21天计划和目标 *
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="请详细描述您的21天开发目标和计划，例如：&#10;&#10;🎯 目标：完成用户系统和基础功能开发&#10;&#10;📋 计划：&#10;第1-7天：设计数据库结构，完成用户注册登录&#10;第8-14天：开发核心功能模块&#10;第15-21天：测试优化，部署上线&#10;&#10;💡 预期成果：上线可用的MVP版本"
													className="min-h-[150px] sm:min-h-[200px] resize-none"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-xs sm:text-sm">
												简要描述您的21天开发目标和计划（至少30个字符）
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 参与设置 - 移动端优化 */}
							<div className="space-y-4 sm:space-y-6">
								<div>
									<h3 className="text-base sm:text-lg font-semibold mb-2">
										参与设置
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
										设置打卡内容的可见性
									</p>
								</div>
								<FormField
									control={form.control}
									name="visibilityLevel"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm sm:text-base">
												打卡内容可见性
											</FormLabel>
											<FormControl>
												<div className="space-y-3">
													<div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
														<input
															type="radio"
															id="public"
															value="PUBLIC"
															checked={
																field.value ===
																"PUBLIC"
															}
															onChange={() =>
																field.onChange(
																	"PUBLIC",
																)
															}
															className="mt-1 flex-shrink-0"
														/>
														<Label
															htmlFor="public"
															className="flex-1 cursor-pointer"
														>
															<div className="font-medium text-sm sm:text-base">
																🌍 所有人可见
															</div>
															<div className="text-xs sm:text-sm text-muted-foreground mt-1">
																任何人都可以看到您的打卡内容，获得更多关注和反馈
															</div>
														</Label>
													</div>
													<div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
														<input
															type="radio"
															id="participants"
															value="PARTICIPANTS_ONLY"
															checked={
																field.value ===
																"PARTICIPANTS_ONLY"
															}
															onChange={() =>
																field.onChange(
																	"PARTICIPANTS_ONLY",
																)
															}
															className="mt-1 flex-shrink-0"
														/>
														<Label
															htmlFor="participants"
															className="flex-1 cursor-pointer"
														>
															<div className="font-medium text-sm sm:text-base">
																👥 仅参与者可见
															</div>
															<div className="text-xs sm:text-sm text-muted-foreground mt-1">
																只有参与这次挑战的成员可以看到，更加私密
															</div>
														</Label>
													</div>
												</div>
											</FormControl>
											<FormDescription className="text-xs sm:text-sm">
												注意：提交即表示您同意在选择的范围内公开分享打卡内容
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 提交按钮 - 移动端优化 */}
							<div className="flex justify-center pt-4 sm:pt-6">
								<Button
									type="submit"
									disabled={isLoading}
									size="lg"
									className="w-full sm:w-auto min-w-[200px]"
								>
									{isLoading ? "处理中..." : "保存设置"}
									<RocketLaunchIcon className="w-4 h-4 ml-2" />
								</Button>
							</div>
						</>
					)}
				</form>
			</Form>
		</div>
	);
}
