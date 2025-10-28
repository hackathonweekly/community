"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LocaleLink, useLocaleRouter } from "@i18n/routing";
import { ProjectStage } from "@prisma/client";
import { ChevronDownIcon, FilterIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { buildProjectsUrl, mergeProjectUrlParams } from "./lib/url-utils";

interface AdvancedFiltersProps {
	stageParam?: string;
	organization?: string;
	search?: string;
	stageStats: Array<{ stage: ProjectStage; count: number }>;
	organizations: Array<{ id: string; name: string; slug: string | null }>;
}

export function AdvancedFilters({
	stageParam,
	organization,
	search,
	stageStats,
	organizations,
}: AdvancedFiltersProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const router = useLocaleRouter();
	const [isPending, startTransition] = useTransition();

	const handleOrganizationChange = (orgSlug: string) => {
		const newURL = buildProjectsUrl(
			mergeProjectUrlParams(
				{ stage: stageParam, search, organization },
				{ organization: orgSlug === "all" ? undefined : orgSlug },
			),
		);

		startTransition(() => {
			router.push(newURL);
		});
	};

	return (
		<div className="mb-6">
			<div className="flex justify-center mb-4">
				<Button
					variant="ghost"
					onClick={() => setIsExpanded(!isExpanded)}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<FilterIcon className="h-4 w-4 mr-2" />
					更多筛选选项
					<ChevronDownIcon
						className={`h-4 w-4 ml-2 transition-transform duration-300 ${
							isExpanded ? "rotate-180" : ""
						}`}
					/>
				</Button>
			</div>

			<div
				className={`transition-all duration-300 ease-in-out overflow-hidden ${
					isExpanded
						? "max-h-[800px] opacity-100"
						: "max-h-0 opacity-0"
				}`}
			>
				<Card className="border shadow-md bg-gradient-to-br from-gray-50 to-white">
					<CardContent className="p-6">
						{/* 具体项目阶段 */}
						<div className="mb-6">
							<h4 className="text-sm font-semibold text-center text-gray-800 mb-4">
								📊 详细项目阶段
							</h4>
							<div className="flex flex-wrap gap-2 justify-center">
								{[
									{
										value: ProjectStage.IDEA_VALIDATION,
										label: "💡 想法验证",
										color: "yellow",
									},
									{
										value: ProjectStage.DEVELOPMENT,
										label: "🔧 产品开发",
										color: "blue",
									},
									{
										value: ProjectStage.LAUNCH,
										label: "🚀 产品发布",
										color: "green",
									},
									{
										value: ProjectStage.GROWTH,
										label: "📈 用户增长",
										color: "emerald",
									},
									{
										value: ProjectStage.MONETIZATION,
										label: "💰 商业变现",
										color: "purple",
									},
									{
										value: ProjectStage.FUNDING,
										label: "💼 融资扩张",
										color: "indigo",
									},
									{
										value: ProjectStage.COMPLETED,
										label: "🎯 项目完结",
										color: "amber",
									},
								].map(({ value: stageValue, label }) => {
									const count =
										stageStats.find(
											(s) => s.stage === stageValue,
										)?.count || 0;
									return (
										<LocaleLink
											key={stageValue}
											href={buildProjectsUrl(
												mergeProjectUrlParams(
													{
														stage: stageParam,
														search,
														organization,
													},
													{ stage: stageValue },
												),
											)}
										>
											<Badge
												variant={
													stageParam === stageValue
														? "default"
														: "secondary"
												}
												className={`cursor-pointer text-xs px-3 py-1.5 hover:shadow-md transition-all duration-200 font-medium ${
													stageParam === stageValue
														? "bg-primary text-primary-foreground hover:bg-primary/90"
														: "bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
												}`}
											>
												{label}
												{count > 0 && (
													<span className="ml-1.5 opacity-75">
														({count})
													</span>
												)}
											</Badge>
										</LocaleLink>
									);
								})}
							</div>
						</div>

						{/* 组织筛选器 */}
						{organizations.length > 0 && (
							<div className="border-t pt-6">
								<h4 className="text-sm font-semibold text-center text-gray-800 mb-4">
									🏢 按组织筛选
								</h4>
								<div className="flex justify-center">
									<Select
										value={organization || "all"}
										onValueChange={handleOrganizationChange}
										disabled={isPending}
									>
										<SelectTrigger className="w-full sm:w-80 bg-white shadow-sm">
											<FilterIcon className="h-4 w-4 mr-2 text-gray-500" />
											<SelectValue placeholder="选择组织" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												所有组织
											</SelectItem>
											{organizations
												.filter(
													(org) =>
														org.slug &&
														org.slug.trim() !== "",
												)
												.map((org) => (
													<SelectItem
														key={org.id}
														value={
															org.slug || org.id
														}
													>
														{org.name}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
