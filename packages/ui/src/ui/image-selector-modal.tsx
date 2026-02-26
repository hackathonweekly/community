"use client";

import { useState, useEffect } from "react";

import { Label } from "@community/ui/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Check, Upload, Edit3, Image, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { ImageUpload } from "@community/ui/ui/image-upload";
import type { ImageTemplate } from "@community/config/image-templates";
import {
	IMAGE_TEMPLATES,
	getTemplateCategories,
	getTemplatesByCategory,
	getRandomTemplate,
} from "@community/config/image-templates";

interface ImageSelectorModalProps {
	value?: string;
	onChange: (value: string) => void;
	eventType?: string;
	label?: string;
	className?: string;
}

export function ImageSelectorModal({
	value,
	onChange,
	eventType,
	label = "活动封面图片",
	className,
}: ImageSelectorModalProps) {
	const [isOpen, setIsOpen] = useState(false);

	// 检查当前值是否是模板图片
	const currentTemplate = IMAGE_TEMPLATES.find(
		(template) => template.url === value,
	);
	const isCustomImage = value && !currentTemplate;

	// 正确初始化 selectedTemplate
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
		currentTemplate?.id || null,
	);
	const [activeTab, setActiveTab] = useState<string>(
		isCustomImage ? "custom" : "templates",
	);

	// 如果没有值，使用默认模板
	const defaultTemplate = !value ? getRandomTemplate(eventType) : null;
	const displayImage = value || defaultTemplate?.url;

	const categories = getTemplateCategories();

	// 当 value 变化时更新内部状态
	useEffect(() => {
		const newCurrentTemplate = IMAGE_TEMPLATES.find(
			(template) => template.url === value,
		);
		const newIsCustomImage = value && !newCurrentTemplate;

		setSelectedTemplate(newCurrentTemplate?.id || null);
		setActiveTab(newIsCustomImage ? "custom" : "templates");
	}, [value]);

	const handleTemplateSelect = (template: ImageTemplate) => {
		setSelectedTemplate(template.id);
		onChange(template.url);
		setIsOpen(false);
	};

	const handleCustomUpload = (url: string) => {
		setSelectedTemplate(null);
		onChange(url);
		setActiveTab("custom");
		setIsOpen(false);
	};

	return (
		<div className={cn("space-y-2", className)}>
			{label && (
				<Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
					{label}
				</Label>
			)}

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<div className="relative group cursor-pointer">
						{/* 默认图片显示 */}
						<div className="relative aspect-video w-full max-w-sm sm:max-w-md lg:max-w-sm rounded-lg overflow-hidden border border-dashed border-gray-300 hover:border-gray-400 transition-colors">
							{displayImage ? (
								<>
									<img
										src={displayImage}
										alt="活动封面预览"
										className="w-full h-full object-cover"
									/>
									{/* 悬停时显示编辑按钮 */}
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<div className="text-white text-center">
											<Edit3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
											<p className="text-xs sm:text-sm font-medium">
												点击更换图片
											</p>
										</div>
									</div>
								</>
							) : (
								/* 空状态 */
								<div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
									<Upload className="h-8 w-8 sm:h-12 sm:w-12 mb-2" />
									<p className="text-xs sm:text-sm font-medium">
										点击选择图片
									</p>
									<p className="text-xs text-gray-400 hidden sm:block">
										支持模板或自定义上传
									</p>
								</div>
							)}
						</div>

						{/* 当前图片信息 */}
						{currentTemplate && (
							<p className="text-xs text-muted-foreground mt-1">
								当前使用: {currentTemplate.name}
							</p>
						)}
						{isCustomImage && (
							<p className="text-xs text-muted-foreground mt-1">
								当前使用: 自定义图片
							</p>
						)}
					</div>
				</DialogTrigger>

				<DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="pb-4">
						<DialogTitle className="flex items-center gap-2 text-lg">
							<Image className="h-5 w-5" />
							选择活动封面图片
						</DialogTitle>
						<p className="text-sm text-muted-foreground mt-1">
							从精选模板中选择，或上传自定义图片
						</p>
					</DialogHeader>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
							<TabsTrigger
								value="templates"
								className="flex items-center gap-2 text-sm font-medium"
							>
								<Sparkles className="h-4 w-4" />
								模板图片
							</TabsTrigger>
							<TabsTrigger
								value="custom"
								className="flex items-center gap-2 text-sm font-medium"
							>
								<Upload className="h-4 w-4" />
								自定义上传
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value="templates"
							className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
						>
							{categories.map((category) => {
								const categoryTemplates =
									getTemplatesByCategory(category);
								const categoryNames: Record<string, string> = {
									technology: "科技/编程",
									business: "商务/网络",
									education: "教育/培训",
									social: "社交/娱乐",
									general: "通用",
									nature: "自然/环境",
									minimal: "极简/清新",
								};

								return (
									<div
										key={category}
										className="space-y-2 sm:space-y-3"
									>
										<h4 className="text-sm font-medium text-gray-900 px-1">
											{categoryNames[category] ||
												category}
										</h4>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
											{categoryTemplates.map(
												(template) => (
													<button
														key={template.id}
														type="button"
														className={cn(
															"relative cursor-pointer transition-all hover:scale-105 border-0 p-0 bg-transparent touch-manipulation",
															(selectedTemplate ===
																template.id ||
																value ===
																	template.url) &&
																"ring-2 ring-primary",
														)}
														onClick={() =>
															handleTemplateSelect(
																template,
															)
														}
														aria-label={`选择模板图片: ${template.name}`}
													>
														<div className="relative aspect-square rounded-lg overflow-hidden min-h-[80px] sm:min-h-[100px]">
															<img
																src={
																	template.url
																}
																alt="模板图片"
																className="w-full h-full object-cover"
															/>
															{(selectedTemplate ===
																template.id ||
																value ===
																	template.url) && (
																<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
																	<div className="bg-primary text-primary-foreground rounded-full p-1.5 sm:p-2">
																		<Check className="h-3 w-3 sm:h-4 sm:w-4" />
																	</div>
																</div>
															)}
														</div>
													</button>
												),
											)}
										</div>
									</div>
								);
							})}
						</TabsContent>

						<TabsContent value="custom" className="mt-4 sm:mt-6">
							<div className="space-y-4">
								<div className="text-center px-2">
									<h3 className="text-base sm:text-lg font-medium mb-2">
										上传自定义图片
									</h3>
									<p className="text-xs sm:text-sm text-gray-600 mb-4">
										推荐尺寸: 800x800px (正方形)，支持
										JPG、PNG、WebP 格式，最大 5MB
									</p>
								</div>

								<ImageUpload
									label=""
									value={isCustomImage ? value : ""}
									onChange={handleCustomUpload}
									onRemove={() => {
										// 切换回模板选择
										setActiveTab("templates");
										const randomTemplate =
											getRandomTemplate(eventType);
										onChange(randomTemplate.url);
										setSelectedTemplate(randomTemplate.id);
									}}
									acceptedFileTypes={[
										"image/jpeg",
										"image/png",
										"image/webp",
									]}
									maxSizeInMB={5}
									description=""
								/>
							</div>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
