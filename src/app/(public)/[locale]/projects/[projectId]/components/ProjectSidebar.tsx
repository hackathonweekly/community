import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { projectStageColors, projectStageLabels } from "@/lib/project-stage";
import type { ProjectStage } from "@prisma/client";
import { ExternalLinkIcon, HeartIcon, UserIcon } from "lucide-react";
import Link from "next/link";

interface User {
	name: string;
	username: string;
	image?: string | null;
	userRoleString?: string | null;
}

interface RelatedProject {
	id: string;
	title: string;
	subtitle?: string | null;
	description: string;
	stage?: string | null;
	_count: {
		likes: number;
	};
}

interface ProjectSidebarProps {
	project: {
		id: string;
		url?: string | null;
		createdAt: string;
		updatedAt: string;
		user: User;
	};
	relatedProjects?: RelatedProject[];
	isLoadingRelated: boolean;
	relatedError: Error | null;
	getImageUrl: (imageUrl: string | null) => string | null;
}

export function ProjectSidebar({
	project,
	relatedProjects,
	isLoadingRelated,
	relatedError,
	getImageUrl,
}: ProjectSidebarProps) {
	return (
		<div className="space-y-6">
			{/* Creator Info */}
			<Card>
				<CardHeader>
					<CardTitle>作品作者</CardTitle>
				</CardHeader>
				<CardContent>
					<Link
						href={`/u/${project.user.username}`}
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						{project.user.image ? (
							<img
								src={
									getImageUrl(project.user.image) || undefined
								}
								alt={project.user.name}
								className="w-12 h-12 rounded-full border"
							/>
						) : (
							<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border">
								<UserIcon className="h-6 w-6 text-primary" />
							</div>
						)}
						<div>
							<div className="font-medium">
								{project.user.name}
							</div>
							<div className="text-sm text-muted-foreground">
								{project.user.userRoleString || "社区成员"}
							</div>
						</div>
					</Link>
				</CardContent>
			</Card>

			{/* Quick Info */}
			<Card>
				<CardHeader>
					<CardTitle>作品信息</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								创建时间
							</span>
							<span>
								{new Date(project.createdAt).toLocaleDateString(
									"zh-CN",
								)}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								最后更新
							</span>
							<span>
								{new Date(project.updatedAt).toLocaleDateString(
									"zh-CN",
								)}
							</span>
						</div>
						{project.url && (
							<div className="pt-2 border-t">
								<a
									href={project.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
								>
									访问作品网站
									<ExternalLinkIcon className="h-3 w-3" />
								</a>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* More from Creator */}
			<Card>
				<CardHeader>
					<CardTitle>更多来自 {project.user.name}</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingRelated ? (
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="p-3 rounded-lg border">
									<Skeleton className="h-4 w-full mb-2" />
									<Skeleton className="h-3 w-2/3 mb-2" />
									<Skeleton className="h-3 w-1/3" />
								</div>
							))}
						</div>
					) : relatedError ? (
						<div className="text-center py-8">
							<p className="text-sm text-red-500 mb-2">
								加载相关项目时出错
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => window.location.reload()}
							>
								重试
							</Button>
						</div>
					) : relatedProjects && relatedProjects.length > 0 ? (
						<div className="space-y-3">
							{relatedProjects.map((otherProject) => (
								<Link
									key={otherProject.id}
									href={`/projects/${otherProject.id}`}
									className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
								>
									<h4 className="font-medium text-sm line-clamp-1 mb-1 break-words">
										{otherProject.title}
									</h4>
									<p className="text-xs text-muted-foreground line-clamp-2 mb-2 break-words">
										{otherProject.subtitle ||
											otherProject.description}
									</p>
									<div className="flex items-center justify-between">
										{otherProject.stage ? (
											<Badge
												className={`text-xs ${projectStageColors[otherProject.stage as ProjectStage] || "bg-gray-100 text-gray-800 border-gray-200"}`}
											>
												{projectStageLabels[
													otherProject.stage as ProjectStage
												] || otherProject.stage}
											</Badge>
										) : (
											<div />
										)}
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<HeartIcon className="h-3 w-3" />
											{otherProject._count.likes}
										</div>
									</div>
								</Link>
							))}
							<div className="pt-2 border-t">
								<Link
									href={`/u/${project.user.username}`}
									className="text-sm text-primary hover:underline"
								>
									查看所有作品 →
								</Link>
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-sm text-muted-foreground mb-2">
								暂无其他作品
							</p>
							<Link
								href={`/u/${project.user.username}`}
								className="text-sm text-primary hover:underline"
							>
								查看用户主页 →
							</Link>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
