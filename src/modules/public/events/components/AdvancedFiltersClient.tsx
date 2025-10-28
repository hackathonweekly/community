"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, getEventTypeLabel } from "@/lib/api/server-fetchers";

interface AdvancedFiltersClientProps {
	searchParams: Record<string, string | string[] | undefined>;
	organizations: any[];
}

export function AdvancedFiltersClient({
	searchParams,
	organizations,
}: AdvancedFiltersClientProps) {
	const t = useTranslations();
	const router = useRouter();
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

	// 处理表单提交
	const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const params = new URLSearchParams();

		// 添加搜索词
		if (searchTerm) {
			params.append("search", searchTerm);
		}

		// 添加状态
		if (selectedStatus !== "upcoming") {
			params.append("status", selectedStatus);
		}

		// 处理表单数据，将 "all" 转换为空值（不添加到 URL）
		const type = formData.get("type") as string;
		if (type && type !== "all") {
			params.append("type", type);
		}

		const organization = formData.get("organization") as string;
		if (organization && organization !== "all") {
			params.append("organization", organization);
		}

		const isOnlineValue = formData.get("isOnline") as string;
		if (isOnlineValue && isOnlineValue !== "all") {
			params.append("isOnline", isOnlineValue);
		}

		const hostType = formData.get("hostType") as string;
		if (hostType && hostType !== "organization") {
			params.append("hostType", hostType);
		}

		// 导航到新 URL
		const newURL = params.toString()
			? `/events?${params.toString()}`
			: "/events";
		router.push(newURL);
	};

	return (
		<div>
			{/* 更多筛选按钮 */}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
				className="flex items-center gap-2 px-4 py-2 h-10 rounded-xl border-gray-200 relative"
			>
				<span className="text-sm font-medium">
					{t("events.filters.more")}
				</span>
				{showAdvancedFilters ? (
					<ChevronUpIcon className="h-4 w-4" />
				) : (
					<ChevronDownIcon className="h-4 w-4" />
				)}
			</Button>

			{/* 高级筛选面板 */}
			{showAdvancedFilters && (
				<div className="mt-4 p-4 border rounded-xl bg-gray-50/80 backdrop-blur-sm">
					<form onSubmit={handleFormSubmit} className="space-y-4">
						{/* 类型筛选 */}
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								{t("events.filters.typeSelect")}
							</label>
							<Select
								name="type"
								defaultValue={selectedType || "all"}
							>
								<SelectTrigger className="h-11 rounded-xl">
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
								name="organization"
								defaultValue={selectedOrganization || "all"}
							>
								<SelectTrigger className="h-11 rounded-xl">
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
								name="isOnline"
								defaultValue={isOnline || "all"}
							>
								<SelectTrigger className="h-11 rounded-xl">
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
								name="hostType"
								defaultValue={selectedHostType}
							>
								<SelectTrigger className="h-11 rounded-xl">
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

						<div className="flex gap-2">
							<Button
								type="submit"
								className="flex-1 h-11 rounded-xl"
							>
								{t("events.filters.apply")}
							</Button>
							<Button
								type="button"
								variant="outline"
								className="h-11 rounded-xl"
								onClick={() => router.push("/events")}
							>
								{t("events.filters.clearAll")}
							</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
