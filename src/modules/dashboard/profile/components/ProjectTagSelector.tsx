"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";

// 标签推荐库（用于自动补全）
const TAG_SUGGESTIONS = [
	// 技术栈
	"React",
	"Vue.js",
	"Next.js",
	"Node.js",
	"Python",
	"TypeScript",
	"JavaScript",
	"AI/ML",
	"区块链",
	"微信小程序",
	"Flutter",
	"React Native",
	"Django",
	"FastAPI",
	"PostgreSQL",
	"MongoDB",
	"Redis",
	"Docker",
	"AWS",
	"Vercel",

	// 产品形态
	"网站",
	"Web应用",
	"移动应用",
	"桌面软件",
	"硬件产品",
	"小程序",
	"小游戏",
	"移动游戏",
	"桌面游戏",
	"浏览器插件",
	"API服务",
	"命令行工具",
	"Chrome扩展",
	"VS Code插件",
	"Figma插件",
	"机器人/Bot",
	"智能硬件",
	"IoT设备",

	// 产品类型
	"效率工具",
	"社交平台",
	"电商平台",
	"游戏娱乐",
	"教育学习",
	"医疗健康",
	"金融理财",
	"企业服务",
	"开发工具",
	"设计工具",
	"内容创作",
	"数据分析",
	"人工智能",
	"物联网",
	"区块链应用",

	// 目标用户
	"开发者",
	"设计师",
	"产品经理",
	"学生",
	"企业用户",
	"个人用户",
	"创业者",
	"自由职业者",
	"内容创作者",
	"教师",
	"研究人员",
	"投资人",
	"运营人员",
	"销售人员",

	// 项目属性标签
	"开源项目",
	"AI应用",
	"教育科技",
	"远程合作",
	"本地团队",
	"兼职参与",
	"全职投入",
	"公开构建",
	"暂停中",
	"寻求指导",
];

interface ProjectTagSelectorProps {
	selectedTags: string[];
	onTagsChange: (tags: string[]) => void;
	maxTags?: number;
	showTitle?: boolean;
}

export function ProjectTagSelector({
	selectedTags = [],
	onTagsChange,
	maxTags = 10,
	showTitle = true,
}: ProjectTagSelectorProps) {
	const [inputValue, setInputValue] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);

	// 根据输入值过滤推荐标签
	const filteredSuggestions = useMemo(() => {
		if (!inputValue.trim()) {
			return [];
		}

		const searchValue = inputValue.toLowerCase();
		return TAG_SUGGESTIONS.filter(
			(tag) =>
				tag.toLowerCase().includes(searchValue) &&
				!selectedTags.includes(tag),
		).slice(0, 8); // 最多显示8个建议
	}, [inputValue, selectedTags]);

	const handleInputChange = (value: string) => {
		setInputValue(value);
		setShowSuggestions(value.trim().length > 0);
	};

	const handleAddTag = (tag: string) => {
		const trimmedTag = tag.trim();
		if (
			trimmedTag &&
			!selectedTags.includes(trimmedTag) &&
			selectedTags.length < maxTags
		) {
			onTagsChange([...selectedTags, trimmedTag]);
			setInputValue("");
			setShowSuggestions(false);
		}
	};

	const handleRemoveTag = (tag: string) => {
		onTagsChange(selectedTags.filter((t) => t !== tag));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			e.stopPropagation();
			if (inputValue.trim()) {
				handleAddTag(inputValue);
			}
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
		}
	};

	const isMaxTagsReached = selectedTags.length >= maxTags;

	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<h4 className="font-medium text-sm mb-1">项目标签</h4>
					<p className="text-xs text-muted-foreground">
						输入标签描述你的项目，系统会提供相关建议（最多{maxTags}
						个）
					</p>
				</div>
			)}

			{/* 已选择的标签 */}
			{selectedTags.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						已选择 ({selectedTags.length}/{maxTags})
					</p>
					<div className="flex flex-wrap gap-2">
						{selectedTags.map((tag) => (
							<Badge
								key={tag}
								variant="default"
								className="text-sm pr-1 flex items-center gap-1"
							>
								{tag}
								<button
									type="button"
									onClick={() => handleRemoveTag(tag)}
									className="ml-1 hover:bg-white/20 rounded-full p-0.5 flex items-center justify-center"
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
				</div>
			)}

			{/* 标签输入 */}
			<div className="space-y-2 relative">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<Input
							type="text"
							placeholder="输入标签，如: React, AI工具, 开源项目..."
							value={inputValue}
							onChange={(e) => handleInputChange(e.target.value)}
							onKeyDown={handleKeyDown}
							onFocus={() =>
								setShowSuggestions(inputValue.trim().length > 0)
							}
							onBlur={() => {
								// 延迟隐藏建议，允许点击建议
								setTimeout(
									() => setShowSuggestions(false),
									150,
								);
							}}
							disabled={isMaxTagsReached}
							className="w-full"
						/>

						{/* 标签建议下拉 */}
						{showSuggestions && filteredSuggestions.length > 0 && (
							<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
								{filteredSuggestions.map((suggestion) => (
									<button
										key={suggestion}
										type="button"
										className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
										onClick={() => handleAddTag(suggestion)}
									>
										{suggestion}
									</button>
								))}
							</div>
						)}
					</div>
					<Button
						type="button"
						size="sm"
						onClick={() => handleAddTag(inputValue)}
						disabled={
							!inputValue.trim() ||
							selectedTags.includes(inputValue.trim()) ||
							isMaxTagsReached
						}
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				{isMaxTagsReached && (
					<p className="text-xs text-muted-foreground">
						已达到最大标签数量限制
					</p>
				)}

				{!inputValue && selectedTags.length === 0 && (
					<div className="text-xs text-muted-foreground">
						<p className="mb-1">推荐标签示例：</p>
						<div className="flex flex-wrap gap-1">
							{TAG_SUGGESTIONS.slice(0, 6).map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => handleAddTag(tag)}
									className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
									disabled={isMaxTagsReached}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
