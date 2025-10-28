import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectStageColors, projectStageLabels } from "@/lib/project-stage";
import { ProjectStage } from "@prisma/client";
import {
	ExternalLinkIcon,
	EyeIcon,
	HeartIcon,
	MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "../types";

interface ProjectsSectionProps {
	user: UserProfile;
	currentUserId?: string;
	t: any;
}

function getSafeProjectStage(stage: any): ProjectStage {
	const validStages = [
		"IDEA_VALIDATION",
		"DEVELOPMENT",
		"LAUNCH",
		"GROWTH",
		"MONETIZATION",
		"FUNDING",
		"COMPLETED",
	];

	if (!stage || !validStages.includes(stage)) {
		return ProjectStage.IDEA_VALIDATION;
	}
	return stage as ProjectStage;
}

function getSafeProjectTags(tags: any): string[] {
	if (!tags || !Array.isArray(tags)) return [];
	return tags.filter((tag) => typeof tag === "string");
}

export function ProjectsSection({
	user,
	currentUserId,
	t,
}: ProjectsSectionProps) {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>
					{t("userProfile.projects")} ({user.projects.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				{user.projects.length > 0 ? (
					<>
						<div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
							{user.projects.slice(0, 6).map((project: any) => {
								const safeStage = getSafeProjectStage(
									project.stage,
								);
								const safeTags = getSafeProjectTags(
									project.projectTags,
								);

								return (
									<div
										key={project.id}
										className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
									>
										<Link
											href={`/projects/${project.id}`}
											className="block"
										>
											<div className="flex items-start justify-between mb-3">
												<h3 className="font-semibold">
													{project.title}
												</h3>
												<div className="flex gap-2">
													{project.featured && (
														<Badge
															variant="default"
															className="text-xs"
														>
															{t(
																"userProfile.featured",
															)}
														</Badge>
													)}
													<Badge
														className={`text-xs ${
															projectStageColors[
																safeStage
															] ||
															"bg-gray-100 text-gray-800 border-gray-200"
														}`}
													>
														{t(
															`userProfile.projectStages.${safeStage}`,
														) ||
															projectStageLabels[
																safeStage
															]}
													</Badge>
												</div>
											</div>
											{project.description && (
												<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
													{project.description}
												</p>
											)}
											{safeTags.length > 0 && (
												<div className="flex flex-wrap gap-1 mb-3">
													{safeTags
														.slice(0, 3)
														.map(
															(
																tag: string,
																index: number,
															) => (
																<Badge
																	key={index}
																	variant="outline"
																	className="text-xs"
																>
																	{tag}
																</Badge>
															),
														)}
													{safeTags.length > 3 && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															+
															{safeTags.length -
																3}
														</Badge>
													)}
												</div>
											)}

											{/* Project Stats */}
											<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
												<div className="flex items-center gap-1">
													<EyeIcon className="h-3 w-3" />
													{project.viewCount}
												</div>
												<div className="flex items-center gap-1">
													<HeartIcon className="h-3 w-3" />
													{project.likeCount}
												</div>
												<div className="flex items-center gap-1">
													<MessageCircleIcon className="h-3 w-3" />
													{project.commentCount}
												</div>
											</div>
										</Link>
										{project.url && (
											<a
												href={project.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center text-sm text-primary hover:underline z-10 relative"
											>
												{t("userProfile.viewProject")}
												<ExternalLinkIcon className="h-3 w-3 ml-1" />
											</a>
										)}
									</div>
								);
							})}
						</div>
						{user.projects.length > 6 && (
							<div className="mt-4 text-center">
								<Button variant="outline" size="sm" asChild>
									<Link
										href={
											currentUserId === user.id
												? "/app/projects"
												: "#"
										}
									>
										查看全部 {user.projects.length} 个作品
									</Link>
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<div className="mb-2">📝</div>
						<p className="text-sm">
							{currentUserId === user.id
								? "你还没有发布任何作品"
								: "该用户还没有展示任何作品"}
						</p>
						{currentUserId === user.id && (
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								asChild
							>
								<Link href="/app/projects/create">
									创建第一个作品
								</Link>
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
