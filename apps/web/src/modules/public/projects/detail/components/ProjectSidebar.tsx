import {
	projectStageColors,
	projectStageLabels,
} from "@community/lib-shared/project-stage";
import type { ProjectStage } from "@prisma/client";
import {
	CalendarIcon,
	ExternalLinkIcon,
	HeartIcon,
	RefreshCwIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@community/ui/ui/skeleton";

interface User {
	name: string;
	username: string;
	image?: string | null;
	userRoleString?: string | null;
}

interface RelatedProject {
	id: string;
	shortId?: string | null;
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
		<div className="hidden lg:block lg:col-span-4 relative">
			<div className="sticky top-16 bg-white border border-gray-200 rounded-lg p-5 shadow-sm max-h-[calc(100vh-5rem)] overflow-y-auto space-y-5">
				{/* Visit CTA */}
				{project.url && (
					<a
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full bg-black text-white py-2.5 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
					>
						访问作品
						<ExternalLinkIcon className="h-3.5 w-3.5" />
					</a>
				)}

				{/* Creator */}
				<div>
					<div className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">
						作者
					</div>
					<Link
						href={`/u/${project.user.username}`}
						className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
					>
						{project.user.image ? (
							<img
								src={
									getImageUrl(project.user.image) || undefined
								}
								alt={project.user.name}
								className="w-10 h-10 rounded-full border border-gray-200"
							/>
						) : (
							<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
								<UserIcon className="h-5 w-5 text-gray-400" />
							</div>
						)}
						<div>
							<div className="font-bold text-xs text-gray-900">
								{project.user.name}
							</div>
							<div className="text-[10px] text-gray-500">
								{project.user.userRoleString || "社区成员"}
							</div>
						</div>
					</Link>
				</div>

				{/* Info rows */}
				<div className="space-y-3 text-sm">
					<div className="flex gap-3 items-start p-2 rounded-md hover:bg-gray-50 transition-colors">
						<div className="w-5 text-center text-gray-400 mt-0.5">
							<CalendarIcon className="h-4 w-4" />
						</div>
						<div>
							<div className="font-bold text-xs text-gray-900">
								创建时间
							</div>
							<div className="text-[10px] text-gray-500">
								{new Date(project.createdAt).toLocaleDateString(
									"zh-CN",
								)}
							</div>
						</div>
					</div>
					<div className="flex gap-3 items-start p-2 rounded-md hover:bg-gray-50 transition-colors">
						<div className="w-5 text-center text-gray-400 mt-0.5">
							<RefreshCwIcon className="h-4 w-4" />
						</div>
						<div>
							<div className="font-bold text-xs text-gray-900">
								最后更新
							</div>
							<div className="text-[10px] text-gray-500">
								{new Date(project.updatedAt).toLocaleDateString(
									"zh-CN",
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Related Projects */}
				{(isLoadingRelated ||
					relatedError ||
					(relatedProjects && relatedProjects.length > 0)) && (
					<div className="pt-4 border-t border-gray-100">
						<div className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">
							更多作品
						</div>
						{isLoadingRelated ? (
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className="p-2 rounded-md border border-gray-100"
									>
										<Skeleton className="h-3.5 w-full mb-1.5" />
										<Skeleton className="h-3 w-2/3 mb-1.5" />
										<Skeleton className="h-3 w-1/3" />
									</div>
								))}
							</div>
						) : relatedError ? (
							<p className="text-[10px] text-gray-400">
								加载失败
							</p>
						) : (
							<div className="space-y-2">
								{relatedProjects?.map((otherProject) => (
									<Link
										key={otherProject.id}
										href={`/projects/${otherProject.shortId || otherProject.id}`}
										className="block p-2 rounded-md border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors group"
									>
										<h4 className="font-bold text-xs text-gray-900 line-clamp-1 mb-0.5 group-hover:text-gray-600 transition-colors break-words">
											{otherProject.title}
										</h4>
										<p className="text-[10px] text-gray-500 line-clamp-2 mb-1.5 break-words">
											{otherProject.subtitle ||
												otherProject.description}
										</p>
										<div className="flex items-center justify-between">
											{otherProject.stage ? (
												<span
													className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border ${projectStageColors[otherProject.stage as ProjectStage] || "bg-gray-100 text-gray-800 border-gray-200"}`}
												>
													{projectStageLabels[
														otherProject.stage as ProjectStage
													] || otherProject.stage}
												</span>
											) : (
												<div />
											)}
											<div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
												<HeartIcon className="h-3 w-3" />
												{otherProject._count.likes}
											</div>
										</div>
									</Link>
								))}
								<Link
									href={`/u/${project.user.username}`}
									className="block text-[10px] font-bold text-gray-400 hover:text-black transition-colors pt-1"
								>
									查看所有作品 →
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
