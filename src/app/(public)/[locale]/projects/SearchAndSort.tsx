"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLocaleRouter } from "@i18n/routing";
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import {
	type ProjectUrlParams,
	buildProjectsUrl,
	mergeProjectUrlParams,
} from "./lib/url-utils";

interface SearchAndSortProps {
	search?: string;
	sort?: string;
	sortOrder?: "asc" | "desc";
	stageParam?: string;
	organization?: string;
}

export function SearchAndSort({
	search = "",
	sort = "latest",
	sortOrder = "desc",
	stageParam,
	organization,
}: SearchAndSortProps) {
	const router = useLocaleRouter();
	const t = useTranslations("projects");
	const [searchValue, setSearchValue] = useState(search);
	const [isPending, startTransition] = useTransition();

	// 实时搜索 - 使用防抖
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== search) {
				updateURL({ search: searchValue });
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [searchValue]);

	const updateURL = (newParams: Partial<ProjectUrlParams>) => {
		const currentUrlParams: ProjectUrlParams = {
			stage: stageParam,
			search,
			organization,
			sort,
			sortOrder,
		};

		const mergedParams = mergeProjectUrlParams(currentUrlParams, newParams);
		const newURL = buildProjectsUrl(mergedParams);

		startTransition(() => {
			router.push(newURL);
		});
	};

	const handleSortChange = (newSort: string) => {
		updateURL({ sort: newSort });
	};

	const toggleSortOrder = () => {
		const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
		updateURL({ sortOrder: newSortOrder });
	};

	return (
		<div className="mb-6">
			<div className="flex flex-col sm:flex-row gap-3">
				{/* 搜索框 - 实时搜索 */}
				<div className="relative flex-1">
					<SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("search.placeholder")}
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						className="pl-9"
						disabled={isPending}
					/>
				</div>

				{/* 排序选择器 - 带升序/降序切换按钮 */}
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={toggleSortOrder}
						disabled={isPending}
						className="shrink-0"
						title={sortOrder === "desc" ? "降序" : "升序"}
					>
						{sortOrder === "desc" ? (
							<ArrowDownIcon className="h-4 w-4" />
						) : (
							<ArrowUpIcon className="h-4 w-4" />
						)}
					</Button>
					<Select
						value={sort}
						onValueChange={handleSortChange}
						disabled={isPending}
					>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="latest">
								{t("sort.latest")}
							</SelectItem>
							<SelectItem value="popular">
								{t("sort.popular")}
							</SelectItem>
							<SelectItem value="views">
								{t("sort.views")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
