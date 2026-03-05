"use client";

import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Textarea } from "@community/ui/ui/textarea";
import {
	ArrowPathIcon,
	ArrowTopRightOnSquareIcon,
	FolderIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "./types";

interface EditingProject {
	title: string;
	subtitle: string;
	stage: string;
}

interface ProjectSectionProps {
	projects: Project[];
	projectsLoading: boolean;
	selectedProjectId: string;
	showInlineProjectEdit: boolean;
	editingProject: EditingProject;
	savingProject: boolean;
	onProjectSelect: (projectId: string) => void;
	onRefreshProjects: () => void;
	onCreateNewProject: () => void;
	onToggleInlineEdit: (show: boolean) => void;
	onSaveProject: () => void;
	onUpdateEditingProject: (project: Partial<EditingProject>) => void;
}

export function ProjectSection({
	projects,
	projectsLoading,
	selectedProjectId,
	showInlineProjectEdit,
	editingProject,
	savingProject,
	onProjectSelect,
	onRefreshProjects,
	onCreateNewProject,
	onToggleInlineEdit,
	onSaveProject,
	onUpdateEditingProject,
}: ProjectSectionProps) {
	const t = useTranslations("events.registration");
	const router = useRouter();
	const pathname = usePathname();

	const handleCreateNewProject = () => {
		router.push(
			`/projects/create?returnTo=${encodeURIComponent(pathname)}`,
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label className="text-base font-medium">
					{showInlineProjectEdit
						? "分享你的产品或想法"
						: t("projects.selectProject")}
				</Label>
				{!showInlineProjectEdit && (
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onToggleInlineEdit(true)}
						>
							快速填写
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							asChild
							className="text-xs text-muted-foreground hover:text-foreground"
						>
							<a
								href={`/projects/create?returnTo=${encodeURIComponent(pathname)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1"
							>
								完整创建
								<ArrowTopRightOnSquareIcon className="w-3 h-3" />
							</a>
						</Button>
					</div>
				)}
			</div>

			{!showInlineProjectEdit && (
				<p className="text-sm text-muted-foreground">
					请分享你正在做或准备启动的产品、项目、活动或好玩的事情，哪怕只是一个
					idea，也能帮助伙伴们更好地了解你。
				</p>
			)}

			{/* Quick Create Project Form */}
			{showInlineProjectEdit && (
				<ProjectQuickCreateForm
					editingProject={editingProject}
					savingProject={savingProject}
					onUpdateEditingProject={onUpdateEditingProject}
					onSave={onSaveProject}
					onCancel={() => onToggleInlineEdit(false)}
				/>
			)}

			{/* Project List - only show when not editing */}
			{!showInlineProjectEdit &&
				(projectsLoading ? (
					<div className="text-center py-8 text-muted-foreground text-sm">
						正在加载作品列表...
					</div>
				) : projects.length === 0 ? (
					<div className="text-center py-8">
						<FolderIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
						<h3 className="text-base font-medium mb-2">暂无作品</h3>
						<p className="text-muted-foreground text-sm">
							您可以使用上方按钮创建一个作品来展示您的作品或想法（可选）
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-sm">
								{t("buttons.selectExistingProjects")}
							</span>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={onRefreshProjects}
									disabled={projectsLoading}
									title={t("buttons.refreshProjectList")}
								>
									<ArrowPathIcon
										className={`w-4 h-4 ${projectsLoading ? "animate-spin" : ""}`}
									/>
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCreateNewProject}
								>
									<PlusIcon className="w-4 h-4 mr-2" />
									{t("buttons.createNewProject")}
								</Button>
							</div>
						</div>
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{projects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									isSelected={
										selectedProjectId === project.id
									}
									onSelect={() => onProjectSelect(project.id)}
								/>
							))}
						</div>
					</div>
				))}
		</div>
	);
}

interface ProjectQuickCreateFormProps {
	editingProject: EditingProject;
	savingProject: boolean;
	onUpdateEditingProject: (project: Partial<EditingProject>) => void;
	onSave: () => void;
	onCancel: () => void;
}

function ProjectQuickCreateForm({
	editingProject,
	savingProject,
	onUpdateEditingProject,
	onSave,
	onCancel,
}: ProjectQuickCreateFormProps) {
	const projectStages = [
		{ value: "IDEA_VALIDATION", label: "💡 想法验证" },
		{ value: "DEVELOPMENT", label: "🔧 产品开发" },
		{ value: "LAUNCH", label: "🚀 产品发布" },
		{ value: "GROWTH", label: "📈 用户增长" },
		{ value: "MONETIZATION", label: "💰 商业变现" },
		{ value: "FUNDING", label: "💼 融资扩张" },
		{ value: "COMPLETED", label: "🎯 作品完结" },
	];

	return (
		<div className="space-y-4">
			<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
				<p className="text-sm text-blue-800">
					<strong>快速填写作品或想法</strong>{" "}
					欢迎分享你正在构思或推进的产品、项目、活动或好玩的事情，哪怕还只是一个简单的
					idea。完整填写项目信息将有机会获得社区曝光
				</p>
			</div>

			<div className="bg-white rounded-md border p-4 space-y-4">
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						作品名称 <span className="text-red-500">*</span>
					</Label>
					<Input
						value={editingProject.title}
						onChange={(e) =>
							onUpdateEditingProject({
								title: e.target.value,
							})
						}
						placeholder="例如：AI 助手、社区平台、电商小程序等"
						className="w-full"
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">
						一句话描述 <span className="text-red-500">*</span>
					</Label>
					<Textarea
						value={editingProject.subtitle}
						onChange={(e) =>
							onUpdateEditingProject({ subtitle: e.target.value })
						}
						placeholder="用一句话简单描述您的作品是做什么的，解决什么问题"
						rows={2}
						className="w-full"
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">
						作品阶段 <span className="text-red-500">*</span>
					</Label>
					<Select
						value={editingProject.stage}
						onValueChange={(value) =>
							onUpdateEditingProject({ stage: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="请选择作品当前阶段" />
						</SelectTrigger>
						<SelectContent>
							{projectStages.map((stage) => (
								<SelectItem
									key={stage.value}
									value={stage.value}
								>
									{stage.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onCancel}
						disabled={savingProject}
					>
						取消
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={onSave}
						disabled={
							savingProject ||
							!editingProject.title.trim() ||
							!editingProject.subtitle.trim() ||
							!editingProject.stage
						}
					>
						{savingProject ? "保存中..." : "保存信息"}
					</Button>
				</div>

				<div className="flex justify-center pt-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						asChild
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						<a
							href="/projects/create"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1"
						>
							完整创建（可添加截图、团队招募等）
							<ArrowTopRightOnSquareIcon className="w-3 h-3" />
						</a>
					</Button>
				</div>
			</div>
		</div>
	);
}
