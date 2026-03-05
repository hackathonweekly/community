import { Button } from "@community/ui/ui/button";
import {
	projectStageColors,
	projectStageLabels,
} from "@community/lib-shared/project-stage";
import { ProjectStage } from "@prisma/client";
import {
	ExternalLinkIcon,
	EyeIcon,
	FolderOpen,
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
	const isSelf = currentUserId === user.id;

	// Non-self with no projects: hide
	if (user.projects.length === 0 && !isSelf) {
		return null;
	}

	return (
		<div>
			{/* Section divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					{t("userProfile.projects")} ({user.projects.length})
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>

			{user.projects.length > 0 ? (
				<>
					<div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
									className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
								>
									<Link
										href={`/projects/${project.shortId || project.id}`}
										className="block"
									>
										<div className="flex items-start justify-between mb-1">
											<h3 className="font-brand text-base font-bold leading-tight group-hover:text-gray-600 transition-colors line-clamp-1">
												{project.title}
											</h3>
											<div className="flex gap-1.5 shrink-0 ml-2">
												{project.featured && (
													<span className="px-2 py-0.5 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
														{t(
															"userProfile.featured",
														)}
													</span>
												)}
												<span
													className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
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
												</span>
											</div>
										</div>
										{project.description && (
											<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
												{project.description}
											</p>
										)}
										{safeTags.length > 0 && (
											<div className="flex flex-wrap gap-1 mb-2">
												{safeTags
													.slice(0, 3)
													.map(
														(
															tag: string,
															index: number,
														) => (
															<span
																key={index}
																className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200"
															>
																{tag}
															</span>
														),
													)}
												{safeTags.length > 3 && (
													<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold border border-gray-200">
														+{safeTags.length - 3}
													</span>
												)}
											</div>
										)}
										<div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono">
											<span className="flex items-center gap-1">
												<EyeIcon className="h-3 w-3" />
												{project.viewCount}
											</span>
											<span className="flex items-center gap-1">
												<HeartIcon className="h-3 w-3" />
												{project.likeCount}
											</span>
											<span className="flex items-center gap-1">
												<MessageCircleIcon className="h-3 w-3" />
												{project.commentCount}
											</span>
										</div>
									</Link>
									{project.url && (
										<a
											href={project.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center text-sm text-primary hover:underline z-10 relative mt-2"
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
								<Link href={isSelf ? "/projects?tab=my" : "#"}>
									查看全部 {user.projects.length} 个作品
								</Link>
							</Button>
						</div>
					)}
				</>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
						<FolderOpen className="w-6 h-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground mb-4">
						你还没有发布任何作品
					</p>
					<Button variant="outline" size="sm" asChild>
						<Link href="/projects/create">创建第一个作品</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
