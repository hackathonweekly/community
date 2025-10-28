"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	MagnifyingGlassIcon,
	FunnelIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslations, useLocale } from "next-intl";
import {
	EVENT_TYPES,
	getEventTypeLabel,
	getHostTypeLabel,
} from "@/lib/api/server-fetchers";
import { useRouter, useSearchParams } from "next/navigation";

interface EventsFiltersClientProps {
	searchParams: Record<string, string | string[] | undefined>;
	organizations: any[];
}

export function EventsFiltersClient({
	searchParams,
	organizations,
}: EventsFiltersClientProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams_obj = useSearchParams();
	const locale = useLocale();

	const [isExpanded, setIsExpanded] = useState(false);

	// 解析当前筛选值
	const searchTerm = Array.isArray(searchParams.search)
		? searchParams.search[0]
		: searchParams.search || "";

	const selectedType = Array.isArray(searchParams.type)
		? searchParams.type[0]
		: searchParams.type || "";

	const selectedOrganization = Array.isArray(searchParams.organization)
		? searchParams.organization[0]
		: searchParams.organization || "";

	const isOnline = Array.isArray(searchParams.isOnline)
		? searchParams.isOnline[0]
		: searchParams.isOnline || "";

	const selectedStatus = Array.isArray(searchParams.status)
		? searchParams.status[0]
		: searchParams.status || "upcoming";

	const hostTypeParam = Array.isArray(searchParams.hostType)
		? searchParams.hostType[0]
		: searchParams.hostType;

	const selectedHostType =
		hostTypeParam === "individual"
			? "individual"
			: hostTypeParam === "all"
				? "all"
				: "organization";

	// 计算活跃筛选器数量（除了状态和搜索）
	const activeFilters = [
		selectedType,
		selectedOrganization,
		isOnline,
		selectedHostType !== "organization" ? selectedHostType : undefined,
	].filter(Boolean);

	const hasActiveFilters = activeFilters.length > 0;

	// 构建筛选器 URL
	const buildFilterUrl = (
		newParams: Record<string, string>,
		removeParams?: string[],
	) => {
		const params = new URLSearchParams(searchParams_obj.toString());

		// 移除指定参数
		if (removeParams) {
			removeParams.forEach((param) => params.delete(param));
		}

		// 添加新参数
		Object.entries(newParams).forEach(([key, value]) => {
			if (key === "status" && value === "upcoming") {
				params.delete("status");
			} else if (value && value !== "all") {
				params.set(key, value);
			}
		});

		return `/${locale}/events${params.toString() ? `?${params.toString()}` : ""}`;
	};

	const handleFilterChange = (key: string, value: string) => {
		const url = buildFilterUrl({ [key]: value });
		router.push(url);
	};

	const handleClearAll = () => {
		router.push(`/${locale}/events`);
	};

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const searchValue = formData.get("search") as string;

		const url = buildFilterUrl({ search: searchValue }, ["search"]);
		router.push(url);
	};

	return (
		<div className="space-y-4">
			{/* 搜索区域 */}
			<form onSubmit={handleSearch} className="space-y-4">
				<div className="relative">
					<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<Input
						name="search"
						placeholder={t("events.filters.searchPlaceholder")}
						defaultValue={searchTerm}
						className="pl-10 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
					/>
				</div>
			</form>

			{/* 状态筛选器 */}
			<div className="max-w-md mx-auto grid grid-cols-3 gap-2">
				<Button
					onClick={() => handleFilterChange("status", "upcoming")}
					variant={
						selectedStatus === "upcoming" ? "default" : "outline"
					}
					size="sm"
					className="rounded-lg px-4 py-2 text-sm"
				>
					{t("events.status.upcoming")}
				</Button>
				<Button
					onClick={() => handleFilterChange("status", "ongoing")}
					variant={
						selectedStatus === "ongoing" ? "default" : "outline"
					}
					size="sm"
					className="rounded-lg px-4 py-2 text-sm"
				>
					{t("events.status.ongoing")}
				</Button>
				<Button
					onClick={() => handleFilterChange("status", "completed")}
					variant={
						selectedStatus === "completed" ? "default" : "outline"
					}
					size="sm"
					className="rounded-lg px-4 py-2 text-sm"
				>
					{t("events.status.completed")}
				</Button>
			</div>

			{/* 筛选操作栏 */}
			<div className="flex items-center justify-center gap-2">
				<Button
					onClick={() => setIsExpanded(true)}
					variant="ghost"
					size="sm"
					className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
				>
					<FunnelIcon className="w-4 h-4 mr-1" />
					筛选
					{hasActiveFilters && (
						<Badge
							variant="default"
							className="ml-1 text-xs min-w-4 h-4 p-0"
						>
							{activeFilters.length}
						</Badge>
					)}
				</Button>

				{hasActiveFilters && (
					<Button
						onClick={handleClearAll}
						variant="ghost"
						size="sm"
						className="text-xs text-gray-500 hover:text-gray-700"
					>
						{t("events.filters.clearAll")}
					</Button>
				)}
			</div>

			{/* 高级筛选弹窗 */}
			<Dialog open={isExpanded} onOpenChange={setIsExpanded}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>高级筛选</DialogTitle>
					</DialogHeader>
					<div className="space-y-6">
						{/* 类型筛选 */}
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								{t("events.filters.typeSelect")}
							</label>
							<Select
								value={selectedType || "all"}
								onValueChange={(value) =>
									handleFilterChange("type", value)
								}
							>
								<SelectTrigger className="h-10 rounded-lg">
									<SelectValue
										placeholder={t(
											"events.filters.allTypes",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("events.filters.allTypes")}
									</SelectItem>
									{EVENT_TYPES.map((type) => (
										<SelectItem
											key={type.value}
											value={type.value}
										>
											{getEventTypeLabel(type.value, t)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 组织筛选 */}
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								{t("events.filters.organization")}
							</label>
							<Select
								value={selectedOrganization || "all"}
								onValueChange={(value) =>
									handleFilterChange("organization", value)
								}
							>
								<SelectTrigger className="h-10 rounded-lg">
									<SelectValue
										placeholder={t(
											"events.filters.allOrganizations",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("events.filters.allOrganizations")}
									</SelectItem>
									{organizations
										.filter(
											(org: any) =>
												org.slug &&
												org.slug.trim() !== "",
										)
										.map((org: any) => (
											<SelectItem
												key={org.id}
												value={org.slug}
											>
												{org.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{/* 位置筛选 */}
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								{t("events.filters.location")}
							</label>
							<Select
								value={isOnline || "all"}
								onValueChange={(value) =>
									handleFilterChange("isOnline", value)
								}
							>
								<SelectTrigger className="h-10 rounded-lg">
									<SelectValue
										placeholder={t(
											"events.filters.allLocations",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("events.filters.allLocations")}
									</SelectItem>
									<SelectItem value="true">
										{t("events.filters.online")}
									</SelectItem>
									<SelectItem value="false">
										{t("events.filters.inPerson")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* 主办方类型筛选 */}
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								{t("events.filters.hostTypeSelect")}
							</label>
							<Select
								value={selectedHostType}
								onValueChange={(value) =>
									handleFilterChange("hostType", value)
								}
							>
								<SelectTrigger className="h-10 rounded-lg">
									<SelectValue
										placeholder={t(
											"events.filters.hostType",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="organization">
										{t("events.filters.hostOrganizations")}
									</SelectItem>
									<SelectItem value="individual">
										{t("events.filters.hostIndividuals")}
									</SelectItem>
									<SelectItem value="all">
										{t("events.filters.hostAll")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* 活跃筛选标签 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2 p-3 bg-blue-50/70 rounded-lg border border-blue-100">
					<span className="text-xs font-medium text-blue-900 self-center">
						{t("events.filters.activeFilters")}:
					</span>
					{selectedType && (
						<Badge
							variant="secondary"
							className="text-xs px-2.5 py-1 bg-white text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-50"
							onClick={() => handleFilterChange("type", "all")}
						>
							{getEventTypeLabel(selectedType, t)}
							<XMarkIcon className="w-3 h-3 ml-1" />
						</Badge>
					)}
					{selectedOrganization && (
						<Badge
							variant="secondary"
							className="text-xs px-2.5 py-1 bg-white text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-50"
							onClick={() =>
								handleFilterChange("organization", "all")
							}
						>
							{
								organizations.find(
									(org: any) =>
										org.slug === selectedOrganization,
								)?.name
							}
							<XMarkIcon className="w-3 h-3 ml-1" />
						</Badge>
					)}
					{isOnline && (
						<Badge
							variant="secondary"
							className="text-xs px-2.5 py-1 bg-white text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-50"
							onClick={() =>
								handleFilterChange("isOnline", "all")
							}
						>
							{isOnline === "true"
								? t("events.filters.online")
								: t("events.filters.inPerson")}
							<XMarkIcon className="w-3 h-3 ml-1" />
						</Badge>
					)}
					{selectedHostType !== "organization" && (
						<Badge
							variant="secondary"
							className="text-xs px-2.5 py-1 bg-white text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-50"
							onClick={() =>
								handleFilterChange("hostType", "organization")
							}
						>
							{getHostTypeLabel(selectedHostType, t)}
							<XMarkIcon className="w-3 h-3 ml-1" />
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
