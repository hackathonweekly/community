"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";

interface RoleAssignmentItem {
	id: string;
	user: {
		id: string;
		name?: string | null;
		email?: string | null;
		username?: string | null;
		image?: string | null;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
	};
	functionalRole: {
		id: string;
		name: string;
		description: string;
		applicableScope: string | null;
		organizationId: string | null;
	};
	roleType: "system" | "custom";
	startDate: string;
	endDate: string | null;
	status: "ACTIVE" | "UPCOMING" | "HISTORICAL" | "INACTIVE";
}

interface FunctionalRolesResponse {
	assignments: RoleAssignmentItem[];
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface OrganizationOption {
	id: string;
	name: string;
}

interface FunctionalRolesDirectoryProps {
	locale: string;
}

const ROLE_TYPE_OPTIONS: {
	label: string;
	value: "all" | "system" | "custom";
}[] = [
	{ value: "all", label: "全部类型" },
	{ value: "system", label: "系统预设" },
	{ value: "custom", label: "组织自定义" },
];

function resolveMemberDisplayName(
	...values: Array<string | null | undefined>
): string {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value;
		}
	}
	return "匿名成员";
}

export function FunctionalRolesDirectory({
	locale,
}: FunctionalRolesDirectoryProps) {
	const systemRoleMessages = useTranslations("profile.systemRoles");
	const resolveRoleDisplayName = useMemo(
		() =>
			createFunctionalRoleDisplayNameResolver((key) =>
				systemRoleMessages(
					key as Parameters<typeof systemRoleMessages>[0],
				),
			),
		[systemRoleMessages],
	);
	const [searchInput, setSearchInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedOrganizationId, setSelectedOrganizationId] = useState<
		"all" | string
	>("all");
	const [selectedRoleType, setSelectedRoleType] = useState<
		"all" | "system" | "custom"
	>("all");
	const [page, setPage] = useState(1);
	const limit = 20;

	useEffect(() => {
		const timeout = setTimeout(() => {
			setSearchTerm(searchInput.trim());
		}, 300);
		return () => clearTimeout(timeout);
	}, [searchInput]);

	useEffect(() => {
		setPage(1);
	}, [searchTerm, selectedOrganizationId, selectedRoleType]);

	const { data: organizationOptions = [] } = useQuery<OrganizationOption[]>({
		queryKey: ["functional-roles", "organizations"],
		queryFn: async () => {
			const response = await fetch("/api/organizations?limit=100");
			if (!response.ok) {
				throw new Error("加载组织列表失败");
			}
			const data = await response.json();
			return (data.organizations || []).map((organization: any) => ({
				id: organization.id,
				name: organization.name,
			}));
		},
		staleTime: 1000 * 60 * 10,
	});

	const { data, isLoading, error, isFetching } =
		useQuery<FunctionalRolesResponse>({
			queryKey: [
				"functional-roles-directory",
				page,
				limit,
				searchTerm,
				selectedOrganizationId,
				selectedRoleType,
			],
			queryFn: async (): Promise<FunctionalRolesResponse> => {
				const params = new URLSearchParams({
					page: String(page),
					limit: String(limit),
					status: "active",
				});

				if (searchTerm) {
					params.set("search", searchTerm);
				}

				if (selectedOrganizationId !== "all") {
					params.set("organizationId", selectedOrganizationId);
				}

				if (selectedRoleType !== "all") {
					params.set("roleType", selectedRoleType);
				}

				const response = await fetch(
					`/api/functional-roles/assignments?${params.toString()}`,
				);

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(errorText || "加载职能角色失败");
				}

				return (await response.json()) as FunctionalRolesResponse;
			},
			placeholderData: (previousData) => previousData,
		});

	const assignments: RoleAssignmentItem[] = data?.assignments ?? [];
	const pagination = data?.pagination ?? {
		page,
		limit,
		total: assignments.length,
		totalPages: page,
	};

	const errorMessage = useMemo(() => {
		if (!error) {
			return null;
		}
		if (error instanceof Error) {
			return error.message;
		}
		return "加载职能角色失败";
	}, [error]);

	const handlePrevPage = () => {
		setPage((prev) => Math.max(1, prev - 1));
	};

	const handleNextPage = () => {
		if (pagination.totalPages && page < pagination.totalPages) {
			setPage((prev) => prev + 1);
		}
	};

	return (
		<div className="space-y-6 pb-16">
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-bold">职能角色对接</h1>
				<p className="text-sm text-muted-foreground">
					浏览所有社区组织的在任职能角色，快速找到合适的对接人
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>筛选条件</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-2 sm:col-span-2">
							<label className="text-xs font-medium text-muted-foreground">
								关键词搜索
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									value={searchInput}
									onChange={(event) =>
										setSearchInput(event.target.value)
									}
									placeholder="搜索组织、职能角色或成员"
									className="pl-9"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">
								所属组织
							</label>
							<Select
								value={selectedOrganizationId}
								onValueChange={setSelectedOrganizationId}
							>
								<SelectTrigger>
									<SelectValue placeholder="全部组织" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部组织
									</SelectItem>
									{organizationOptions.map((organization) => (
										<SelectItem
											key={organization.id}
											value={organization.id}
										>
											{organization.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">
								角色类型
							</label>
							<Select
								value={selectedRoleType}
								onValueChange={(
									value: "all" | "system" | "custom",
								) => setSelectedRoleType(value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ROLE_TYPE_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle>职能角色列表</CardTitle>
					{isFetching && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>数据更新中</span>
						</div>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : errorMessage ? (
						<p className="text-sm text-destructive">
							{errorMessage}
						</p>
					) : assignments.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							暂无符合条件的职能角色
						</p>
					) : (
						<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
							{assignments.map(
								(assignment: RoleAssignmentItem) => {
									const memberName = resolveMemberDisplayName(
										assignment.user.name,
										assignment.user.username,
										assignment.user.email,
									);
									const userLink = assignment.user.username
										? `/${locale}/u/${assignment.user.username}`
										: undefined;

									const cardContent = (
										<div className="flex h-full flex-col gap-3 rounded-lg border p-4 transition hover:bg-muted/50">
											<div className="flex items-center gap-3">
												<UserAvatar
													name={memberName}
													avatarUrl={
														assignment.user.image
													}
													className="h-12 w-12 flex-shrink-0"
												/>
												<div className="flex-1 min-w-0">
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-medium truncate">
															{memberName}
														</span>
														<Badge variant="secondary">
															{resolveRoleDisplayName(
																assignment.functionalRole,
															)}
														</Badge>
														<Badge variant="outline">
															{assignment.roleType ===
															"custom"
																? "组织自定义"
																: "系统预设"}
														</Badge>
													</div>
													<div className="text-xs text-muted-foreground">
														任期：
														{formatDateDisplay(
															assignment.startDate,
														)}{" "}
														~{" "}
														{formatDateDisplay(
															assignment.endDate,
														)}
													</div>
													{assignment.functionalRole
														.description && (
														<p className="text-xs text-muted-foreground line-clamp-2">
															{
																assignment
																	.functionalRole
																	.description
															}
														</p>
													)}
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												{assignment.organization && (
													<Link
														href={`/${locale}/orgs/${assignment.organization.slug}`}
														className="hover:underline"
													>
														组织：
														{
															assignment
																.organization
																.name
														}
													</Link>
												)}
												<span>
													角色编号：
													{
														assignment
															.functionalRole.id
													}
												</span>
											</div>
										</div>
									);

									return (
										<Fragment key={assignment.id}>
											{userLink ? (
												<Link
													href={userLink}
													className="block"
												>
													{cardContent}
												</Link>
											) : (
												cardContent
											)}
										</Fragment>
									);
								},
							)}
						</div>
					)}

					<div className="flex items-center justify-between border-t pt-4">
						<div className="text-xs text-muted-foreground">
							{pagination.total ?? assignments.length} 条结果
							{pagination.totalPages &&
								pagination.totalPages > 1 && (
									<span className="ml-2">
										第 {pagination.page} /{" "}
										{pagination.totalPages} 页
									</span>
								)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrevPage}
								disabled={page === 1}
							>
								上一页
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNextPage}
								disabled={
									!pagination.totalPages ||
									page >= pagination.totalPages
								}
							>
								下一页
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function formatDateDisplay(value: string | null) {
	if (!value) {
		return "长期";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
