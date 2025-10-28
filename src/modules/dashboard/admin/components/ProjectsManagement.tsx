"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	Code,
	ExternalLink,
	Eye,
	FolderOpen,
	Heart,
	Search,
	Star,
	StarOff,
	Trash2,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AdminProject {
	id: string;
	title: string;
	description: string;
	subtitle: string;
	stage: string;
	url?: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	featured: boolean;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	screenshots: string[];
	projectTags: string[];
	pricingType?: string;
	isRecruiting: boolean;
	createdAt: string;
	updatedAt: string;
}

interface ProjectStats {
	total: number;
	featured: number;
	recruiting: number;
	byStage: {
		[key: string]: number;
	};
	totalViews: number;
	totalLikes: number;
}

const STAGE_MAP = {
	IDEA_VALIDATION: {
		label: "💡 想法验证",
		color: "bg-yellow-100 text-yellow-800",
	},
	DEVELOPMENT: { label: "🔧 产品开发", color: "bg-blue-100 text-blue-800" },
	LAUNCH: { label: "🚀 产品发布", color: "bg-green-100 text-green-800" },
	GROWTH: { label: "📈 用户增长", color: "bg-purple-100 text-purple-800" },
	MONETIZATION: {
		label: "💰 商业变现",
		color: "bg-orange-100 text-orange-800",
	},
	FUNDING: { label: "💼 融资扩张", color: "bg-indigo-100 text-indigo-800" },
	COMPLETED: { label: "🎯 作品完结", color: "bg-gray-100 text-gray-800" },
};

const PRICING_TYPE_MAP = {
	FREE: { label: "免费", color: "bg-green-100 text-green-800" },
	PAID: { label: "付费", color: "bg-blue-100 text-blue-800" },
	FREEMIUM: { label: "免费增值", color: "bg-purple-100 text-purple-800" },
};

export function ProjectsManagement() {
	const [projects, setProjects] = useState<AdminProject[]>([]);
	const [stats, setStats] = useState<ProjectStats>({
		total: 0,
		featured: 0,
		recruiting: 0,
		byStage: {},
		totalViews: 0,
		totalLikes: 0,
	});
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(
		null,
	);

	useEffect(() => {
		fetchProjects();
		fetchStats();
	}, []);

	const fetchProjects = async () => {
		try {
			const response = await fetch("/api/super-admin/projects");
			if (response.ok) {
				const data = await response.json();
				setProjects(data);
			}
		} catch (error) {
			console.error("获取作品列表失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await fetch("/api/super-admin/projects/stats");
			if (response.ok) {
				const data = await response.json();
				setStats(data);
			}
		} catch (error) {
			console.error("获取作品统计失败:", error);
		}
	};

	const handleDeleteProject = async (project: AdminProject) => {
		setProjectToDelete(project);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!projectToDelete) {
			return;
		}

		try {
			const response = await fetch(
				`/api/super-admin/projects/${projectToDelete.id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				setProjects(
					projects.filter((p) => p.id !== projectToDelete.id),
				);
				fetchStats();
			} else {
				alert("删除失败，请重试");
			}
		} catch (error) {
			console.error("删除作品失败:", error);
			alert("删除失败，请重试");
		} finally {
			setDeleteDialogOpen(false);
			setProjectToDelete(null);
		}
	};

	const toggleFeatured = async (project: AdminProject) => {
		try {
			const response = await fetch(
				`/api/super-admin/projects/${project.id}/featured`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						featured: !project.featured,
					}),
				},
			);

			if (response.ok) {
				setProjects(
					projects.map((p) =>
						p.id === project.id
							? { ...p, featured: !p.featured }
							: p,
					),
				);
			} else {
				alert("更新精选状态失败，请重试");
			}
		} catch (error) {
			console.error("更新精选状态失败:", error);
			alert("更新精选状态失败，请重试");
		}
	};

	const filteredProjects = projects.filter(
		(project) =>
			project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			project.description
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			project.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			project.projectTags.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase()),
			),
	);

	const getStageBadge = (stage: string) => {
		const stageInfo = STAGE_MAP[stage as keyof typeof STAGE_MAP] || {
			label: stage,
			color: "bg-gray-100 text-gray-800",
		};
		return (
			<Badge className={stageInfo.color} variant="secondary">
				{stageInfo.label}
			</Badge>
		);
	};

	const getPricingBadge = (pricingType?: string) => {
		if (!pricingType) return null;
		const pricingInfo =
			PRICING_TYPE_MAP[pricingType as keyof typeof PRICING_TYPE_MAP];
		if (!pricingInfo) return null;
		return (
			<Badge className={pricingInfo.color} variant="secondary">
				{pricingInfo.label}
			</Badge>
		);
	};

	if (loading) {
		return (
			<div className="p-4 sm:p-6">
				<Card>
					<CardContent className="flex items-center justify-center p-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
							<p className="text-muted-foreground">加载中...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
			{/* 统计卡片 */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									总作品数
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									{stats.total}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Star className="h-4 w-4 text-yellow-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									精选作品
								</p>
								<p className="text-xl sm:text-2xl font-bold text-yellow-600">
									{stats.featured}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									招募中
								</p>
								<p className="text-xl sm:text-2xl font-bold text-blue-600">
									{stats.recruiting}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Eye className="h-4 w-4 text-green-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									总浏览量
								</p>
								<p className="text-xl sm:text-2xl font-bold text-green-600">
									{stats.totalViews}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Heart className="h-4 w-4 text-red-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									总点赞数
								</p>
								<p className="text-xl sm:text-2xl font-bold text-red-600">
									{stats.totalLikes}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-2 sm:col-span-1">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Code className="h-4 w-4 text-purple-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									开发中
								</p>
								<p className="text-xl sm:text-2xl font-bold text-purple-600">
									{stats.byStage.DEVELOPMENT || 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 搜索和操作 */}
			<Card>
				<CardHeader>
					<CardTitle>作品管理</CardTitle>
					<CardDescription>
						管理所有社区作品，包括查看、精选、删除等操作
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-2 mb-4">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="搜索作品名称、描述、创建者或标签..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="flex-1"
						/>
					</div>

					{/* 作品列表 */}
					<div className="space-y-4">
						{filteredProjects.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								{searchTerm ? "未找到匹配的作品" : "暂无作品"}
							</div>
						) : (
							filteredProjects.map((project) => (
								<Card key={project.id}>
									<CardContent className="p-4">
										<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
											<div className="flex-1 space-y-3">
												<div className="flex flex-col sm:flex-row sm:items-center gap-2">
													<h3 className="font-semibold text-lg break-all">
														{project.title}
													</h3>
													<div className="flex flex-wrap gap-2">
														{getStageBadge(
															project.stage,
														)}
														{getPricingBadge(
															project.pricingType,
														)}
														{project.featured && (
															<Badge
																variant="secondary"
																className="bg-yellow-100 text-yellow-800 border-yellow-200"
															>
																<Star className="w-3 h-3 mr-1" />
																精选
															</Badge>
														)}
														{project.isRecruiting && (
															<Badge
																variant="secondary"
																className="bg-blue-100 text-blue-800 border-blue-200"
															>
																<Users className="w-3 h-3 mr-1" />
																招募中
															</Badge>
														)}
													</div>
												</div>

												{project.subtitle && (
													<p className="text-sm font-medium text-muted-foreground">
														{project.subtitle}
													</p>
												)}

												{project.description && (
													<p className="text-sm text-muted-foreground line-clamp-2">
														{project.description}
													</p>
												)}

												{project.projectTags.length >
													0 && (
													<div className="flex flex-wrap gap-1">
														{project.projectTags
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
														{project.projectTags
															.length > 3 && (
															<Badge
																variant="outline"
																className="text-xs"
															>
																+
																{project
																	.projectTags
																	.length - 3}
															</Badge>
														)}
													</div>
												)}

												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
													<div className="flex items-center space-x-1">
														<Eye className="h-4 w-4 flex-shrink-0" />
														<span>
															{project.viewCount}{" "}
															次浏览
														</span>
													</div>

													<div className="flex items-center space-x-1">
														<Heart className="h-4 w-4 flex-shrink-0" />
														<span>
															{project.likeCount}{" "}
															点赞
														</span>
													</div>

													<div className="flex items-center space-x-1">
														<TrendingUp className="h-4 w-4 flex-shrink-0" />
														<span>
															{
																project.commentCount
															}{" "}
															评论
														</span>
													</div>
												</div>

												<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
													<span className="break-all">
														创建者:{" "}
														<strong>
															{project.userName}
														</strong>
													</span>
													<span className="text-muted-foreground">
														创建于{" "}
														{formatDistanceToNow(
															new Date(
																project.createdAt,
															),
															{
																addSuffix: true,
																locale: zhCN,
															},
														)}
													</span>
													<span className="text-muted-foreground">
														更新于{" "}
														{formatDistanceToNow(
															new Date(
																project.updatedAt,
															),
															{
																addSuffix: true,
																locale: zhCN,
															},
														)}
													</span>
												</div>
											</div>

											<div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
												<Button
													variant="outline"
													size="sm"
													asChild
													className="w-full sm:w-auto"
												>
													<Link
														href={`/projects/${project.id}`}
														target="_blank"
													>
														<Eye className="h-4 w-4 mr-1" />
														<span className="sm:inline">
															查看
														</span>
													</Link>
												</Button>

												{project.url && (
													<Button
														variant="outline"
														size="sm"
														asChild
														className="w-full sm:w-auto"
													>
														<Link
															href={project.url}
															target="_blank"
														>
															<ExternalLink className="h-4 w-4 mr-1" />
															<span className="sm:inline">
																访问
															</span>
														</Link>
													</Button>
												)}

												<Button
													variant={
														project.featured
															? "default"
															: "outline"
													}
													size="sm"
													onClick={() =>
														toggleFeatured(project)
													}
													className={`w-full sm:w-auto ${
														project.featured
															? "bg-yellow-500 hover:bg-yellow-600 text-white"
															: ""
													}`}
												>
													{project.featured ? (
														<>
															<Star className="h-4 w-4 mr-1 fill-current" />
															<span className="sm:inline">
																取消精选
															</span>
														</>
													) : (
														<>
															<StarOff className="h-4 w-4 mr-1" />
															<span className="sm:inline">
																设为精选
															</span>
														</>
													)}
												</Button>

												<Button
													variant="destructive"
													size="sm"
													onClick={() =>
														handleDeleteProject(
															project,
														)
													}
													className="w-full sm:w-auto"
												>
													<Trash2 className="h-4 w-4 mr-1" />
													<span className="sm:inline">
														删除
													</span>
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* 删除确认对话框 */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认删除作品</AlertDialogTitle>
						<AlertDialogDescription>
							您确定要删除作品 "{projectToDelete?.title}" 吗？
							<br />
							<strong className="text-red-600">
								此操作不可撤销，将删除所有相关数据包括点赞、评论、收藏等。
							</strong>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							确认删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
