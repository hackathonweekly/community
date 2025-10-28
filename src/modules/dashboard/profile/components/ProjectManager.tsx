"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProjectStageLabel, projectStageColors } from "@/lib/project-stage";
import type { PricingType, ProjectStage } from "@prisma/client";
import {
	EditIcon,
	ExternalLinkIcon,
	PlusIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectsQuery } from "@/lib/api/api-hooks";
import { queryKeys } from "@/lib/query-keys";

interface Project {
	id: string;
	title: string;
	description: string;
	url?: string | null;
	stage: ProjectStage;
	featured: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
	// Enhanced fields
	subtitle: string;
	screenshots: string[];
	projectTags: string[];
	pricingType?: PricingType | null;
	milestones: string[];
	demoVideoUrl?: string | null;
	// Team recruitment fields
	teamDescription?: string | null;
	teamSkills: string[];
	teamSize?: number | null;
	contactInfo?: string | null;
	// Analytics
	viewCount: number;
	likeCount: number;
	commentCount: number;
}

export function ProjectManager() {
	const t = useTranslations();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	// 使用 TanStack Query hooks
	const { data: projects = [], isLoading, error } = useProjectsQuery();

	// 删除项目的 mutation
	const deleteProjectMutation = useMutation({
		mutationFn: async (projectId: string) => {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete project");
			}

			return response.json();
		},
		onSuccess: () => {
			// 使用 queryClient 更新缓存
			queryClient.invalidateQueries({
				queryKey: queryKeys.projects(),
			});
			toast({
				title: "Success",
				description: "Project deleted successfully.",
			});
		},
		onError: (error) => {
			console.error("Error deleting project:", error);
			toast({
				title: "Error",
				description: "Failed to delete project. Please try again.",
				variant: "destructive",
			});
		},
	});

	const handleDeleteProject = async (projectId: string) => {
		if (!confirm("Are you sure you want to delete this project?")) {
			return;
		}

		deleteProjectMutation.mutate(projectId);
	};

	// 错误状态
	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Projects</CardTitle>
					<CardDescription className="text-destructive">
						Failed to load projects. Please try again.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={() =>
							queryClient.invalidateQueries({
								queryKey: queryKeys.projects(),
							})
						}
						variant="outline"
						size="sm"
					>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	// 加载状态
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{t("projects.managementTitle")}
							<div className="h-4 w-8 bg-muted animate-pulse rounded" />
						</div>
						<div className="h-8 w-24 bg-muted animate-pulse rounded" />
					</CardTitle>
					<CardDescription>
						{t("projects.managementSubtitle")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="border rounded-lg p-4 animate-pulse"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 space-y-2">
										<div className="h-5 bg-muted rounded w-1/3" />
										<div className="h-4 bg-muted rounded w-2/3" />
										<div className="flex gap-2">
											<div className="h-6 bg-muted rounded-full w-16" />
											<div className="h-6 bg-muted rounded-full w-20" />
										</div>
									</div>
									<div className="flex gap-2">
										<div className="h-8 w-8 bg-muted rounded" />
										<div className="h-8 w-8 bg-muted rounded" />
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card id="projects">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					{t("projects.managementTitle")} ({projects.length})
					<Button asChild size="sm">
						<a href="/app/projects/create">
							<PlusIcon className="h-4 w-4 mr-2" />
							{t("projects.addProject")}
						</a>
					</Button>
				</CardTitle>
				<CardDescription>
					{t("projects.managementSubtitle")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{projects.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>{t("projects.empty.message")}</p>
					</div>
				) : (
					<div className="space-y-4">
						{projects.map((project: Project) => (
							<button
								key={project.id}
								className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
								onClick={() =>
									window.open(
										`/zh/projects/${project.id}`,
										"_blank",
									)
								}
								type="button"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-semibold">
												{project.title}
											</h3>
											{project.featured && (
												<StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
											)}
											<Badge
												variant="secondary"
												className={
													projectStageColors[
														project.stage
													]
												}
											>
												{getProjectStageLabel(
													project.stage,
													t,
												)}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
											{project.subtitle ||
												(project.description.length >
												100
													? `${project.description.substring(
															0,
															100,
														)}...`
													: project.description)}
										</p>
										{project.projectTags.length > 0 && (
											<div className="flex flex-wrap gap-1 mb-3">
												{project.projectTags.map(
													(
														tag: string,
														index: number,
													) => (
														<Badge
															key={index}
															variant="secondary"
															className="text-xs"
														>
															{tag}
														</Badge>
													),
												)}
											</div>
										)}
										{project.url && (
											<div className="flex gap-4">
												<a
													href={project.url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center text-sm text-primary hover:underline"
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													{t("projects.visitProject")}
													<ExternalLinkIcon className="h-3 w-3 ml-1" />
												</a>
											</div>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Button
											asChild
											variant="ghost"
											size="sm"
										>
											<a
												href={`/app/projects/${project.id}/edit`}
												onClick={(e) =>
													e.stopPropagation()
												}
											>
												<EditIcon className="h-4 w-4" />
											</a>
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteProject(project.id);
											}}
											className="text-destructive hover:text-destructive"
											disabled={
												deleteProjectMutation.isPending
											}
										>
											<TrashIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
