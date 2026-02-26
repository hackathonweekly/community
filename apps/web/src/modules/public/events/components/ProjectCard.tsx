"use client";

import { Button } from "@community/ui/ui/button";
import { FolderIcon } from "@heroicons/react/24/outline";
import type { Project } from "./types";

interface ProjectCardProps {
	project: Project;
	isSelected: boolean;
	onSelect: () => void;
}

export function ProjectCard({
	project,
	isSelected,
	onSelect,
}: ProjectCardProps) {
	return (
		<div
			className={`w-full text-left cursor-pointer transition-all hover:shadow-sm border rounded-lg p-3 ${
				isSelected ? "border-primary bg-primary/5" : "hover:bg-gray-50"
			}`}
			onClick={onSelect}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
			aria-pressed={isSelected}
		>
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-2 flex-1">
					{project.screenshots?.[0] ? (
						<img
							src={project.screenshots[0]}
							alt={project.title}
							className="w-8 h-8 rounded object-cover flex-shrink-0"
						/>
					) : (
						<div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
							<FolderIcon className="w-4 h-4 text-muted-foreground" />
						</div>
					)}
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-sm truncate">
							{project.title}
						</h3>
						<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
							{project.description || "暂无描述"}
						</p>
						<div className="flex items-center gap-1 mt-1">
							<span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
								{project.stage}
							</span>
							{project.projectTags?.slice(0, 1).map((tag) => (
								<span
									key={tag}
									className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				</div>
				<div className="flex-shrink-0 ml-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							window.open(
								`/projects/${project.shortId || project.id}/edit`,
								"_blank",
							);
						}}
						className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
					>
						编辑
					</Button>
				</div>
			</div>
		</div>
	);
}
