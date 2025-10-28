"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllTags } from "@/lib/utils";
import { LocaleLink } from "@/modules/i18n/routing";
import { OrganizationLogo } from "@dashboard/organizations/components/OrganizationLogo";
import type { MarketingOrganizationListItem } from "@/lib/api/api-fetchers";
import { Filter, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizations } from "../hooks/useOrganizations";

interface OrganizationDiscoveryProps {
	userOrganizations?: Array<{
		id: string;
		name: string;
		slug: string | null;
	}>;
}

export function OrganizationDiscovery({
	userOrganizations,
}: OrganizationDiscoveryProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [showFilters, setShowFilters] = useState(false);

	// 获取用户组织信息（通过 props 传递）

	// 获取所有可用标签 - 静态数据，不需要 useMemo
	const availableTags = getAllTags();

	const { data, isLoading, error } = useOrganizations({
		search: searchQuery,
		tags: selectedTags,
		page: currentPage,
		limit: 12,
	});

	const organizations: MarketingOrganizationListItem[] =
		data?.organizations ?? [];
	const totalPages = data?.pagination.totalPages || 1;

	// 使用 useCallback 优化事件处理函数
	const handleTagToggle = useCallback((tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
		setCurrentPage(1);
	}, []);

	const clearFilters = useCallback(() => {
		setSearchQuery("");
		setSelectedTags([]);
		setCurrentPage(1);
	}, []);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value);
			setCurrentPage(1);
		},
		[],
	);

	const hasActiveFilters = searchQuery || selectedTags.length > 0;

	return (
		<div className="mx-auto px-4">
			{/* 用户组织快速访问 */}
			{userOrganizations && userOrganizations.length > 0 && (
				<div className="mb-8 text-center">
					<Button asChild>
						<Link
							href={`/app/${userOrganizations[0].slug || userOrganizations[0].id}`}
						>
							进入我的组织
						</Link>
					</Button>
				</div>
			)}

			{/* Search and Filters */}
			<div className="mb-6">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder="搜索组织名称或地址..."
							value={searchQuery}
							onChange={handleSearchChange}
							className="pl-10"
						/>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setShowFilters(!showFilters)}
							className="w-auto"
						>
							<Filter className="h-4 w-4 mr-2" />
							按标签筛选{" "}
							{selectedTags.length > 0 &&
								`(${selectedTags.length})`}
						</Button>

						{hasActiveFilters && (
							<Button variant="ghost" onClick={clearFilters}>
								<X className="h-4 w-4 mr-2" />
								清除筛选
							</Button>
						)}
					</div>
				</div>

				{/* Tag Filters */}
				{showFilters && (
					<div className="mt-4 p-4 border rounded-lg bg-background/50">
						<div className="mb-3">
							<h4 className="text-sm font-medium text-muted-foreground">
								选择标签
							</h4>
						</div>
						<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
							{availableTags.map((tag) => (
								<Badge
									key={tag}
									variant={
										selectedTags.includes(tag)
											? "default"
											: "outline"
									}
									className="cursor-pointer hover:bg-muted text-xs"
									onClick={() => handleTagToggle(tag)}
								>
									{tag}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Active Filters Display */}
				{selectedTags.length > 0 && (
					<div className="mt-4 p-3 border rounded-lg bg-muted/30">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm text-muted-foreground">
								已选标签:
							</span>
							{selectedTags.map((tag) => (
								<Badge key={tag} variant="secondary">
									{tag}
									<X
										className="h-3 w-3 ml-1 cursor-pointer"
										onClick={() => handleTagToggle(tag)}
									/>
								</Badge>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Error handling */}
			{error && (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">⚠️</div>
					<h3 className="text-lg font-medium mb-2">加载组织失败</h3>
					<p className="text-muted-foreground mb-4">
						请检查网络连接或稍后重试
					</p>
				</div>
			)}

			{/* Organizations Grid */}
			{!error && isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="flex items-start gap-3">
									<div className="w-12 h-12 bg-muted rounded-full" />
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-muted rounded" />
										<div className="h-3 bg-muted rounded w-2/3" />
									</div>
								</div>
								<div className="mt-4 space-y-2">
									<div className="h-3 bg-muted rounded" />
									<div className="h-3 bg-muted rounded w-3/4" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : !error && organizations.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">🔍</div>
					<h3 className="text-lg font-medium mb-2">
						没有找到相关组织
					</h3>
					<p className="text-muted-foreground mb-4">
						尝试调整搜索条件或清除筛选
					</p>
					{hasActiveFilters && (
						<Button onClick={clearFilters}>清除所有筛选</Button>
					)}
				</div>
			) : !error ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{organizations.map((org) => (
						<LocaleLink
							key={org.id}
							href={`/orgs/${org.slug || org.id}`}
							className="block"
						>
							<Card className="h-full hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group">
								<CardContent className="p-6">
									<div className="flex items-start gap-4 mb-4">
										<OrganizationLogo
											name={org.name}
											logoUrl={org.logo}
											className="h-12 w-12 shrink-0"
										/>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors mb-1">
												{org.name}
											</h3>
											{org.location && (
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<MapPin className="h-3 w-3 shrink-0" />
													<span className="truncate">
														{org.location}
													</span>
												</div>
											)}
										</div>
									</div>

									{(org.summary || org.description) && (
										<p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
											{org.summary || org.description}
										</p>
									)}

									{org.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mb-4">
											{org.tags.slice(0, 4).map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs px-2 py-0.5"
												>
													{tag}
												</Badge>
											))}
											{org.tags.length > 4 && (
												<Badge
													variant="outline"
													className="text-xs px-2 py-0.5 text-muted-foreground"
												>
													+{org.tags.length - 4}
												</Badge>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</LocaleLink>
					))}
				</div>
			) : null}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-center gap-2 mt-8">
					<Button
						variant="outline"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(currentPage - 1)}
					>
						上一页
					</Button>
					{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
						const page = i + 1 + Math.max(0, currentPage - 3);
						if (page > totalPages) {
							return null;
						}
						return (
							<Button
								key={page}
								variant={
									currentPage === page ? "default" : "outline"
								}
								onClick={() => setCurrentPage(page)}
							>
								{page}
							</Button>
						);
					})}
					<Button
						variant="outline"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(currentPage + 1)}
					>
						下一页
					</Button>
				</div>
			)}
		</div>
	);
}
