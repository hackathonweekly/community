"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useEventsListQuery,
	useEventsOrganizationsQuery,
} from "@/lib/api/api-hooks";
import {
	Bars3Icon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	MagnifyingGlassIcon,
	Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useLocaleRouter } from "@i18n/routing";
import type { EventListItem } from "@/lib/api/api-fetchers";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { EventCard } from "./EventCard";
import { EventCardCompact } from "./EventCardCompact";

type Event = EventListItem;

const eventTypes = [
	{ value: "MEETUP", label: "常规活动" },
	{ value: "HACKATHON", label: "黑客马拉松" },
	{ value: "BUILDING_PUBLIC", label: "Build In Public" },
];

function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
		BUILDING_PUBLIC: t("events.types.buildingPublic"),
	};
	return typeLabels[value] || value;
}

function getHostTypeLabel(value: string, t: (key: string) => string) {
	const labels: Record<string, string> = {
		organization: t("events.filters.hostOrganizations"),
		individual: t("events.filters.hostIndividuals"),
		all: t("events.filters.hostAll"),
	};
	return labels[value] || value;
}

const eventStatusColors: Record<string, string> = {
	PUBLISHED: "bg-green-100 text-green-800",
	REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-800",
	ONGOING: "bg-blue-100 text-blue-800",
	COMPLETED: "bg-gray-100 text-gray-800",
	CANCELLED: "bg-red-100 text-red-800",
};

function LoadingSkeleton() {
	return (
		<div className="space-y-6">
			{[...Array(6)].map((_, i) => (
				<Card key={i}>
					<CardContent className="p-6">
						<div className="space-y-4">
							<div className="flex justify-between">
								<Skeleton className="h-6 w-1/3" />
								<Skeleton className="h-5 w-20" />
							</div>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
							<div className="flex justify-between items-center">
								<Skeleton className="h-4 w-1/4" />
								<Skeleton className="h-8 w-20" />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EventListContent() {
	const searchParams = useSearchParams();
	const router = useLocaleRouter();
	const t = useTranslations();

	const hostTypeParam = searchParams?.get("hostType");
	const initialHostType =
		hostTypeParam === "individual"
			? "individual"
			: hostTypeParam === "all"
				? "all"
				: "organization";

	// 合并所有筛选状态为一个对象
	const [filters, setFilters] = useState({
		searchTerm: searchParams?.get("search") || "",
		selectedType: searchParams?.get("type") || "",
		selectedOrganization: searchParams?.get("organization") || "",
		isOnline: searchParams?.get("isOnline") || "",
		showExpired: searchParams?.get("showExpired") === "true" || false,
		selectedStatus: searchParams?.get("status") || "upcoming",
		selectedHostType: initialHostType,
		selectedTags: searchParams?.get("tags") || "",
	});
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	// Set compact view as default for mobile
	const [viewMode, setViewMode] = useState<"card" | "compact">(() => {
		// Check if window is available (client-side)
		if (typeof window !== "undefined") {
			return window.innerWidth < 768 ? "compact" : "card";
		}
		return "card"; // Default for server-side rendering
	});

	// Handle responsive view switching
	useEffect(() => {
		const handleResize = () => {
			// Only switch to compact on very small screens
			if (window.innerWidth < 640) {
				setViewMode("compact");
			}
		};

		// Throttle resize events
		let timeoutId: NodeJS.Timeout;
		const throttledResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(handleResize, 150);
		};

		window.addEventListener("resize", throttledResize);
		return () => {
			window.removeEventListener("resize", throttledResize);
			clearTimeout(timeoutId);
		};
	}, []);

	// Use TanStack Query hooks
	const { data: organizations = [], isLoading: organizationsLoading } =
		useEventsOrganizationsQuery();

	// Prepare query parameters
	const eventsQueryParams = {
		search: filters.searchTerm || undefined,
		type: filters.selectedType || undefined,
		organizationId: filters.selectedOrganization
			? organizations?.find(
					(o: { id: string; slug: string }) =>
						o.slug === filters.selectedOrganization,
				)?.id
			: undefined,
		isOnline: filters.isOnline || undefined,
		status:
			filters.selectedStatus === "all"
				? undefined
				: filters.selectedStatus === "ongoing"
					? "ONGOING"
					: filters.selectedStatus === "completed"
						? "COMPLETED"
						: "PUBLISHED",
		showExpired:
			filters.selectedStatus === "all" ||
			filters.selectedStatus === "completed"
				? true
				: undefined,
		hostType: (filters.selectedHostType === "individual"
			? "individual"
			: filters.selectedHostType === "organization"
				? "organization"
				: undefined) as "organization" | "individual" | undefined,
		tags: filters.selectedTags || undefined,
	};

	const {
		data: events = [],
		isLoading: eventsLoading,
		error: eventsError,
	} = useEventsListQuery(eventsQueryParams);

	// Debounce timer ref for search
	const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

	const updateURL = useCallback(
		(newFilters: typeof filters) => {
			const params = new URLSearchParams();

			if (newFilters.searchTerm)
				params.append("search", newFilters.searchTerm);
			if (newFilters.selectedType)
				params.append("type", newFilters.selectedType);
			if (newFilters.selectedOrganization)
				params.append("organization", newFilters.selectedOrganization);
			if (newFilters.isOnline)
				params.append("isOnline", newFilters.isOnline);
			if (newFilters.selectedTags)
				params.append("tags", newFilters.selectedTags);
			if (
				newFilters.selectedStatus &&
				newFilters.selectedStatus !== "upcoming"
			) {
				params.append("status", newFilters.selectedStatus);
			}
			if (
				newFilters.selectedHostType === "individual" ||
				newFilters.selectedHostType === "all"
			) {
				params.append("hostType", newFilters.selectedHostType);
			} else if (newFilters.selectedHostType === "organization") {
				// 默认展示组织活动，不需要写入 URL
			}

			const newURL = params.toString() ? `?${params.toString()}` : "";
			router.push(`/events${newURL}`);
		},
		[router],
	);

	const updateFilter = (
		key: keyof typeof filters,
		value: any,
		immediate = false,
	) => {
		setFilters((prev) => {
			const newFilters = { ...prev, [key]: value };

			if (immediate) {
				// Clear any pending debounced updates
				if (searchDebounceRef.current) {
					clearTimeout(searchDebounceRef.current);
					searchDebounceRef.current = null;
				}
				updateURL(newFilters);
			} else {
				// For search, set up debounced update
				if (searchDebounceRef.current) {
					clearTimeout(searchDebounceRef.current);
				}
				searchDebounceRef.current = setTimeout(() => {
					updateURL(newFilters);
				}, 500);
			}

			return newFilters;
		});
	};

	const handleSearch = (value: string) => {
		updateFilter("searchTerm", value, false);
	};

	const handleTypeChange = (value: string) => {
		const newType = value === "all" ? "" : value;
		updateFilter("selectedType", newType, true);
	};

	const handleLocationChange = (value: string) => {
		const newIsOnline = value === "all" ? "" : value;
		updateFilter("isOnline", newIsOnline, true);
	};

	const handleOrganizationChange = (value: string) => {
		const newOrganization = value === "all" ? "" : value;
		updateFilter("selectedOrganization", newOrganization, true);
	};

	const handleHostTypeChange = (value: string) => {
		updateFilter("selectedHostType", value, true);
	};

	const handleStatusChange = (value: string) => {
		updateFilter("selectedStatus", value, true);
	};

	const handleTagsChange = (value: string) => {
		updateFilter("selectedTags", value, false); // 使用防抖更新
	};

	const handleShowExpiredChange = (checked: boolean) => {
		const newStatus = checked ? "all" : "upcoming";
		setFilters((prev) => ({
			...prev,
			showExpired: checked,
			selectedStatus: newStatus,
		}));
		updateURL({
			...filters,
			showExpired: checked,
			selectedStatus: newStatus,
		});
	};

	const clearFilters = () => {
		const defaultFilters = {
			searchTerm: "",
			selectedType: "",
			selectedOrganization: "",
			isOnline: "",
			showExpired: false,
			selectedStatus: "upcoming",
			selectedHostType: "organization",
			selectedTags: "",
		};
		setFilters(defaultFilters);
		router.push("/events");
	};

	return (
		<div className="space-y-6 md:space-y-8">
			{/* 搜索和筛选 - 优化布局 */}
			<div className="mb-6 md:mb-8">
				<div className="flex flex-col gap-4">
					{/* 第一行：搜索框 + 工具栏 */}
					<div className="flex flex-col sm:flex-row gap-3">
						{/* 搜索框 */}
						<div className="relative flex-1">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<Input
								placeholder={t(
									"events.filters.searchPlaceholder",
								)}
								value={filters.searchTerm}
								onChange={(e) => handleSearch(e.target.value)}
								className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
								aria-label={t(
									"events.filters.searchPlaceholder",
								)}
							/>
						</div>

						{/* 工具栏：视图切换 + 更多筛选 */}
						<div className="flex items-center gap-2 flex-shrink-0">
							{/* 视图切换按钮 */}
							<div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50">
								<Button
									variant={
										viewMode === "card"
											? "default"
											: "ghost"
									}
									size="sm"
									onClick={() => setViewMode("card")}
									className="h-8 w-8 p-0 rounded-lg"
									aria-label={t("events.viewMode.card")}
								>
									<Squares2X2Icon className="h-4 w-4" />
								</Button>
								<Button
									variant={
										viewMode === "compact"
											? "default"
											: "ghost"
									}
									size="sm"
									onClick={() => setViewMode("compact")}
									className="h-8 w-8 p-0 rounded-lg"
									aria-label={t("events.viewMode.compact")}
								>
									<Bars3Icon className="h-4 w-4" />
								</Button>
							</div>

							{/* 更多筛选按钮 */}
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setShowAdvancedFilters(!showAdvancedFilters)
								}
								className="flex items-center gap-2 px-4 py-2 h-10 rounded-xl border-gray-200 relative"
							>
								<span className="text-sm font-medium">
									{t("events.filters.more")}
								</span>
								{(filters.selectedType ||
									filters.selectedOrganization ||
									filters.isOnline ||
									filters.selectedTags ||
									filters.selectedHostType !==
										"organization") && (
									<Badge
										variant="destructive"
										className="text-xs min-w-5 h-5 p-0 flex items-center justify-center rounded-full"
									>
										{
											[
												filters.selectedType,
												filters.selectedOrganization,
												filters.isOnline,
												filters.selectedTags,
												filters.selectedHostType !==
												"organization"
													? filters.selectedHostType
													: undefined,
											].filter(Boolean).length
										}
									</Badge>
								)}
								{showAdvancedFilters ? (
									<ChevronUpIcon className="h-4 w-4" />
								) : (
									<ChevronDownIcon className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* 第二行：状态筛选按钮 */}
					<div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
						<Button
							variant={
								filters.selectedStatus === "upcoming"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => handleStatusChange("upcoming")}
							className="flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium"
						>
							{t("events.status.upcoming")}
						</Button>
						<Button
							variant={
								filters.selectedStatus === "ongoing"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => handleStatusChange("ongoing")}
							className="flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium"
						>
							{t("events.status.ongoing")}
						</Button>
						<Button
							variant={
								filters.selectedStatus === "completed"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => handleStatusChange("completed")}
							className="flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium"
						>
							{t("events.status.completed")}
						</Button>
					</div>

					{/* 活跃筛选标签显示区域 - 更突出 */}
					{(filters.selectedType ||
						filters.selectedOrganization ||
						filters.isOnline ||
						filters.selectedTags ||
						filters.selectedHostType !== "organization") && (
						<div className="flex flex-wrap gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
							<span className="text-xs font-medium text-gray-600 self-center">
								{t("events.filters.activeFilters")}:
							</span>
							{filters.selectedType && (
								<Badge
									variant="secondary"
									className="text-xs px-2.5 py-1 bg-white text-gray-400"
								>
									{getEventTypeLabel(filters.selectedType, t)}
								</Badge>
							)}
							{filters.selectedOrganization && (
								<Badge
									variant="secondary"
									className="text-xs px-2.5 py-1 bg-white text-gray-400"
								>
									{
										organizations?.find(
											(org: {
												id: string;
												name: string;
												slug: string;
											}) =>
												org.slug ===
												filters.selectedOrganization,
										)?.name
									}
								</Badge>
							)}
							{filters.isOnline && (
								<Badge
									variant="secondary"
									className="text-xs px-2.5 py-1 bg-white"
								>
									{filters.isOnline === "true"
										? t("events.filters.online")
										: t("events.filters.inPerson")}
								</Badge>
							)}
							{filters.selectedTags && (
								<Badge
									variant="secondary"
									className="text-xs px-2.5 py-1 bg-white"
								>
									标签: {filters.selectedTags}
								</Badge>
							)}
							{filters.selectedHostType !== "organization" && (
								<Badge
									variant="secondary"
									className="text-xs px-2.5 py-1 bg-white"
								>
									{getHostTypeLabel(
										filters.selectedHostType,
										t,
									)}
								</Badge>
							)}
						</div>
					)}

					{/* 高级筛选面板 - 优化样式 */}
					{showAdvancedFilters && (
						<div className="p-4 border rounded-xl bg-gray-50/80 backdrop-blur-sm">
							<div className="space-y-4">
								{/* 类型筛选 */}
								<div>
									<label
										htmlFor="type-select"
										className="block text-sm font-medium mb-2 text-gray-700"
									>
										{t("events.filters.typeSelect")}
									</label>
									<Select
										value={filters.selectedType || "all"}
										onValueChange={handleTypeChange}
									>
										<SelectTrigger
											id="type-select"
											className="h-11 rounded-xl"
										>
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
											{eventTypes
												.filter(
													(type) =>
														type.value &&
														type.value.trim() !==
															"",
												)
												.map((type) => (
													<SelectItem
														key={type.value}
														value={type.value}
													>
														{getEventTypeLabel(
															type.value,
															t,
														)}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>

								{/* 组织筛选 */}
								<div>
									<label
										htmlFor="organization-select"
										className="block text-sm font-medium mb-2 text-gray-700"
									>
										{t("events.filters.organization")}
									</label>
									<Select
										value={
											filters.selectedOrganization ||
											"all"
										}
										onValueChange={handleOrganizationChange}
									>
										<SelectTrigger
											id="organization-select"
											className="h-11 rounded-xl"
										>
											<SelectValue
												placeholder={t(
													"events.filters.allOrganizations",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t(
													"events.filters.allOrganizations",
												)}
											</SelectItem>
											{organizations
												.filter(
													(org: {
														id: string;
														name: string;
														slug: string;
													}) =>
														org.slug &&
														org.slug.trim() !== "",
												)
												.map(
													(org: {
														id: string;
														name: string;
														slug: string;
													}) => (
														<SelectItem
															key={org.id}
															value={org.slug}
														>
															{org.name}
														</SelectItem>
													),
												)}
										</SelectContent>
									</Select>
								</div>

								{/* 位置筛选 */}
								<div>
									<label
										htmlFor="location-select"
										className="block text-sm font-medium mb-2 text-gray-700"
									>
										{t("events.filters.location")}
									</label>
									<Select
										value={filters.isOnline || "all"}
										onValueChange={handleLocationChange}
									>
										<SelectTrigger
											id="location-select"
											className="h-11 rounded-xl"
										>
											<SelectValue
												placeholder={t(
													"events.filters.allLocations",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{t(
													"events.filters.allLocations",
												)}
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
									<label
										htmlFor="host-type-select"
										className="block text-sm font-medium mb-2 text-gray-700"
									>
										{t("events.filters.hostTypeSelect")}
									</label>
									<Select
										value={filters.selectedHostType}
										onValueChange={handleHostTypeChange}
									>
										<SelectTrigger
											id="host-type-select"
											className="h-11 rounded-xl"
										>
											<SelectValue
												placeholder={t(
													"events.filters.hostType",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="organization">
												{t(
													"events.filters.hostOrganizations",
												)}
											</SelectItem>
											<SelectItem value="individual">
												{t(
													"events.filters.hostIndividuals",
												)}
											</SelectItem>
											<SelectItem value="all">
												{t("events.filters.hostAll")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* 标签筛选 */}
								<div>
									<label
										htmlFor="tags-input"
										className="block text-sm font-medium mb-2 text-gray-700"
									>
										标签筛选
									</label>
									<Input
										id="tags-input"
										placeholder="输入标签（多个标签用逗号分隔）"
										value={filters.selectedTags}
										onChange={(e) =>
											handleTagsChange(e.target.value)
										}
										className="h-11 rounded-xl"
									/>
									<p className="text-xs text-gray-500 mt-1">
										例如: 技术,AI,创业
									</p>
								</div>
							</div>

							{/* 清除筛选按钮 */}
							{(filters.searchTerm ||
								filters.selectedType ||
								filters.selectedOrganization ||
								filters.isOnline ||
								filters.selectedTags ||
								filters.selectedHostType !== "organization" ||
								filters.selectedStatus !== "upcoming") && (
								<div className="mt-4 pt-4 border-t border-gray-200">
									<Button
										variant="outline"
										size="sm"
										onClick={clearFilters}
										className="w-full h-11 rounded-xl font-medium"
									>
										{t("events.filters.clearAll")}
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* 活动列表 */}
			<div className="space-y-5 md:space-y-6">
				{eventsLoading ? (
					<LoadingSkeleton />
				) : events.length === 0 ? (
					<div className="text-center py-16 px-4">
						<CalendarIcon
							className="w-20 h-20 mx-auto text-gray-300 mb-5"
							aria-hidden="true"
						/>
						<div className="text-gray-900 text-xl mb-3 font-semibold">
							{t("events.emptyState.title")}
						</div>
						<p className="text-gray-500 mb-8 text-base max-w-md mx-auto">
							{filters.searchTerm ||
							filters.selectedType ||
							filters.isOnline ||
							filters.selectedTags ||
							filters.selectedHostType !== "organization" ||
							filters.selectedStatus !== "upcoming"
								? t("events.emptyState.tryAdjustFilters")
								: t("events.emptyState.noEventsYet")}
						</p>
						{(filters.searchTerm ||
							filters.selectedType ||
							filters.isOnline ||
							filters.selectedTags ||
							filters.selectedHostType !== "organization" ||
							filters.selectedStatus !== "upcoming") && (
							<Button
								onClick={clearFilters}
								variant="outline"
								className="rounded-xl h-11 px-6"
							>
								{t("events.filters.clearFilters")}
							</Button>
						)}
					</div>
				) : (
					<div
						className={
							viewMode === "compact"
								? "space-y-2 sm:space-y-3"
								: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"
						}
					>
						{events.map((event: Event) =>
							viewMode === "compact" ? (
								<EventCardCompact
									key={event.id}
									event={event}
								/>
							) : (
								<EventCard key={event.id} event={event} />
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export function EventListWithFilters() {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<EventListContent />
		</Suspense>
	);
}
