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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	CalendarIcon,
	ChevronRightIcon,
	ClockIcon,
	PencilIcon,
	SparklesIcon,
	TrashIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";

export interface EventTemplate {
	id: string;
	name: string;
	type: "HACKATHON_LEARNING" | "MEETUP" | "BUILDING_PUBLIC" | "CUSTOM";
	description: string;
	title: string;
	defaultDescription: string;
	shortDescription?: string | null;
	duration?: number;
	maxAttendees?: number;
	requireApproval: boolean;
	isSystemTemplate: boolean;
	isFeatured: boolean;
	isPublic: boolean;
	createdBy?: string;
	originalEventId?: string;
	usageCount: number;
	ticketTypes: Array<{
		id: string;
		name: string;
		description?: string;
		price?: number;
		maxQuantity?: number;
	}>;
	volunteerRoles: Array<{
		id: string;
		volunteerRoleId: string;
		recruitCount: number;
		description?: string;
		requireApproval: boolean;
		cpReward: number;
		volunteerRole: {
			id: string;
			name: string;
			description: string;
		};
	}>;
	questions: Array<{
		id: string;
		question: string;
		type: string;
		options: string[];
		required: boolean;
		targetRole?: string;
		order: number;
	}>;
	schedules: Array<{
		id: string;
		title: string;
		duration: number;
		type: string;
	}>;
}

interface EventTemplateSelectorProps {
	templates?: EventTemplate[];
	isLoading?: boolean;
	onTemplateSelect: (template: EventTemplate | null) => void;
	onEditTemplate?: (template: EventTemplate) => void;
	onDeleteTemplate?: (template: EventTemplate) => void;
	selectedTemplateId?: string;
}

const templateTypeConfig = {
	HACKATHON_LEARNING: {
		icon: "🎯",
		label: "迷你黑客松",
		description: "全天学习+开发，适合技能提升",
		color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
		tagColor: "bg-blue-100 text-blue-800",
	},
	MEETUP: {
		icon: "🤝",
		label: "常规活动",
		description: "2小时项目分享，适合获得反馈",
		color: "bg-green-50 border-green-200 hover:bg-green-100",
		tagColor: "bg-green-100 text-green-800",
	},
	BUILDING_PUBLIC: {
		icon: "📅",
		label: "Building Public",
		description: "21天打卡挑战，适合项目推进",
		color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
		tagColor: "bg-purple-100 text-purple-800",
	},
	CUSTOM: {
		icon: "➕",
		label: "自定义活动",
		description: "从空白开始创建",
		color: "bg-gray-50 border-gray-200 hover:bg-gray-100",
		tagColor: "bg-gray-100 text-gray-800",
	},
};

function formatDuration(minutes?: number): string {
	if (!minutes) {
		return "未设置";
	}

	const days = Math.floor(minutes / (24 * 60));
	const hours = Math.floor((minutes % (24 * 60)) / 60);
	const mins = minutes % 60;

	if (days > 0) {
		return `${days}天`;
	}
	if (hours > 0) {
		return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
	}
	return `${mins}分钟`;
}

function TemplateCard({
	template,
	isSelected,
	onSelect,
	onEdit,
	onDelete,
}: {
	template: EventTemplate;
	isSelected: boolean;
	onSelect: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}) {
	const config = templateTypeConfig[template.type];
	const canEdit = !template.isSystemTemplate && onEdit;
	const canDelete = !template.isSystemTemplate && onDelete;

	return (
		<Card
			className={cn(
				"cursor-pointer transition-all duration-200 hover:shadow-md",
				config.color,
				isSelected && "ring-2 ring-primary ring-offset-2",
			)}
			onClick={onSelect}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="text-2xl">{config.icon}</div>
						<div>
							<CardTitle className="text-lg">
								{template.name || config.label}
							</CardTitle>
							<CardDescription className="text-sm">
								{template.description || config.description}
							</CardDescription>
						</div>
					</div>
					<div className="flex gap-2">
						{template.isFeatured && (
							<Badge
								variant="secondary"
								className="bg-amber-100 text-amber-800"
							>
								精选
							</Badge>
						)}
						{!template.isSystemTemplate && (
							<Badge
								variant="secondary"
								className="bg-blue-100 text-blue-800"
							>
								个人
							</Badge>
						)}
						{template.isSystemTemplate && !template.isFeatured && (
							<Badge
								variant="secondary"
								className={config.tagColor}
							>
								系统模板
							</Badge>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground line-clamp-2">
					{template.defaultDescription || template.description}
				</p>

				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="flex items-center gap-2">
						<ClockIcon className="w-4 h-4 text-muted-foreground" />
						<span>{formatDuration(template.duration)}</span>
					</div>
					<div className="flex items-center gap-2">
						<UsersIcon className="w-4 h-4 text-muted-foreground" />
						<span>{template.maxAttendees || "不限制"}</span>
					</div>
				</div>

				<div className="text-xs text-muted-foreground">
					已使用 {template.usageCount} 次
				</div>

				<div className="flex gap-2 pt-2 border-t">
					{canEdit && (
						<Button
							size="sm"
							variant="outline"
							className={canDelete ? "flex-1" : "flex-1"}
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
						>
							<PencilIcon className="w-4 h-4 mr-1" />
							编辑
						</Button>
					)}
					{canDelete && (
						<Button
							size="sm"
							variant="outline"
							className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
						>
							<TrashIcon className="w-4 h-4" />
						</Button>
					)}
					<Button
						size="sm"
						variant={isSelected ? "default" : "outline"}
						className={canEdit || canDelete ? "flex-1" : "w-full"}
						onClick={(e) => {
							e.stopPropagation();
							onSelect();
						}}
					>
						{isSelected ? "已选择" : "选择模板"}
						<ChevronRightIcon className="w-4 h-4 ml-1" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function TemplateCardSkeleton() {
	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Skeleton className="w-8 h-8 rounded" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
				</div>
				<div className="flex justify-between items-center pt-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
		</Card>
	);
}

export function EventTemplateSelector({
	templates = [],
	isLoading = false,
	onTemplateSelect,
	onEditTemplate,
	onDeleteTemplate,
	selectedTemplateId,
}: EventTemplateSelectorProps) {
	const handleTemplateSelect = (template: EventTemplate) => {
		onTemplateSelect(template);
	};

	const handleTemplateEdit = (template: EventTemplate) => {
		if (onEditTemplate) {
			onEditTemplate(template);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="text-center space-y-2">
					<h2 className="text-2xl font-bold">选择活动模板</h2>
					<p className="text-muted-foreground">
						选择一个预设模板快速开始创建活动
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<TemplateCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	// Sort templates: featured first, then personal templates, then system templates by usage count
	const sortedTemplates = [...templates].sort((a, b) => {
		// Featured templates first
		if (a.isFeatured && !b.isFeatured) {
			return -1;
		}
		if (!a.isFeatured && b.isFeatured) {
			return 1;
		}

		// Then personal templates (isSystemTemplate = false)
		if (!a.isSystemTemplate && b.isSystemTemplate) {
			return -1;
		}
		if (a.isSystemTemplate && !b.isSystemTemplate) {
			return 1;
		}

		// Within same category, sort by usage count
		return b.usageCount - a.usageCount;
	});

	// Group templates by category
	const personalTemplates = sortedTemplates.filter(
		(t) => !t.isSystemTemplate,
	);
	const featuredTemplates = sortedTemplates.filter(
		(t) => t.isFeatured && t.isSystemTemplate,
	);
	const otherTemplates = sortedTemplates.filter(
		(t) => !t.isFeatured && t.isSystemTemplate,
	);

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold">选择活动模板</h2>
				<p className="text-muted-foreground">
					选择一个模板快速开始创建活动
				</p>
			</div>

			{/* 个人模板 */}
			{personalTemplates.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<UsersIcon className="w-5 h-5 text-blue-600" />
						<h3 className="text-lg font-semibold text-blue-600">
							我的模板
						</h3>
						<Badge
							variant="outline"
							className="bg-blue-50 text-blue-600 border-blue-200"
						>
							{personalTemplates.length}
						</Badge>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{personalTemplates.map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								isSelected={selectedTemplateId === template.id}
								onSelect={() => handleTemplateSelect(template)}
								onEdit={() => handleTemplateEdit(template)}
								onDelete={
									onDeleteTemplate
										? () => onDeleteTemplate(template)
										: undefined
								}
							/>
						))}
					</div>
				</div>
			)}

			{/* 精选模板 */}
			{featuredTemplates.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<SparklesIcon className="w-5 h-5 text-amber-600" />
						<h3 className="text-lg font-semibold text-amber-600">
							精选模板
						</h3>
						<Badge
							variant="outline"
							className="bg-amber-50 text-amber-600 border-amber-200"
						>
							推荐
						</Badge>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{featuredTemplates.map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								isSelected={selectedTemplateId === template.id}
								onSelect={() => handleTemplateSelect(template)}
								onEdit={() => handleTemplateEdit(template)}
								onDelete={
									onDeleteTemplate
										? () => onDeleteTemplate(template)
										: undefined
								}
							/>
						))}
					</div>
				</div>
			)}

			{/* 其他系统模板 */}
			{otherTemplates.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<CalendarIcon className="w-5 h-5 text-muted-foreground" />
						<h3 className="text-lg font-semibold text-muted-foreground">
							更多模板
						</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{otherTemplates.map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								isSelected={selectedTemplateId === template.id}
								onSelect={() => handleTemplateSelect(template)}
								onEdit={() => handleTemplateEdit(template)}
								onDelete={
									onDeleteTemplate
										? () => onDeleteTemplate(template)
										: undefined
								}
							/>
						))}
					</div>
				</div>
			)}

			{sortedTemplates.length === 0 && (
				<div className="text-center py-12">
					<CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">暂无可用模板</h3>
					<p className="text-muted-foreground mb-4">
						目前没有可用的活动模板
					</p>
				</div>
			)}
		</div>
	);
}
