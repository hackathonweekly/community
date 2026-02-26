"use client";
import { getAllTags } from "@community/lib-shared/utils";
import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";
import type { MarketingOrganizationListItem } from "@community/lib-shared/api/api-fetchers";
import { Filter, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizations } from "../hooks/useOrganizations";
import { CardSkeleton } from "@/modules/public/shared/components/CardSkeleton";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";

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
		<div>
			{/* Quick access for user's org */}
			{userOrganizations && userOrganizations.length > 0 && (
				<div className="mb-6">
					<Link
						href={`/orgs/${userOrganizations[0].slug || userOrganizations[0].id}`}
						className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
					>
						进入我的组织
					</Link>
				</div>
			)}

			{/* Search and Filters */}
			<div className="mb-6 space-y-3">
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground w-4 h-4" />
						<input
							placeholder="搜索组织名称或地址..."
							value={searchQuery}
							onChange={handleSearchChange}
							className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-gray-400 dark:placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-colors"
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setShowFilters(!showFilters)}
							className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-muted transition-colors"
						>
							<Filter className="h-3.5 w-3.5" />
							按标签筛选
							{selectedTags.length > 0 && (
								<span className="bg-black dark:bg-white text-white dark:text-black text-[10px] px-1.5 py-0.5 rounded-full">
									{selectedTags.length}
								</span>
							)}
						</button>

						{hasActiveFilters && (
							<button
								type="button"
								onClick={clearFilters}
								className="flex items-center gap-1.5 text-muted-foreground px-3 py-2 rounded-full text-xs font-bold hover:bg-muted transition-colors"
							>
								<X className="h-3.5 w-3.5" />
								清除
							</button>
						)}
					</div>
				</div>

				{/* Tag Filters */}
				{showFilters && (
					<div className="p-3 border border-border rounded-lg bg-gray-50 dark:bg-secondary">
						<h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground mb-2">
							选择标签
						</h4>
						<div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
							{availableTags.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => handleTagToggle(tag)}
									className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors ${
										selectedTags.includes(tag)
											? "bg-black text-white dark:bg-white dark:text-black border-transparent"
											: "bg-card text-gray-600 dark:text-muted-foreground border-border hover:bg-gray-100 dark:hover:bg-[#1F1F1F]"
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Active Filters Display */}
				{selectedTags.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
							已选:
						</span>
						{selectedTags.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => handleTagToggle(tag)}
								className="flex items-center gap-1 px-2 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded-md text-[10px] font-bold border border-border hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors"
							>
								{tag}
								<X className="h-2.5 w-2.5" />
							</button>
						))}
					</div>
				)}
			</div>

			{/* Error */}
			{error && (
				<EmptyState
					title="加载组织失败"
					description="请检查网络连接或稍后重试。"
					action={
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors"
						>
							重新加载
						</button>
					}
				/>
			)}

			{/* Organizations Grid */}
			{!error && isLoading ? (
				<CardSkeleton
					count={6}
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				/>
			) : !error && organizations.length === 0 ? (
				<EmptyState
					title="没有找到相关组织"
					description="尝试调整搜索条件或清除筛选。"
					action={
						hasActiveFilters ? (
							<button
								type="button"
								onClick={clearFilters}
								className="bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
							>
								清除所有筛选
							</button>
						) : null
					}
				/>
			) : !error ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{organizations.map((org) => (
						<Link
							key={org.id}
							href={`/orgs/${org.slug || org.id}`}
							className="block"
						>
							<div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col h-full">
								<div className="p-3 flex-1 flex flex-col">
									{/* Header: Logo + Name + Location */}
									<div className="flex items-start gap-3 mb-2">
										<OrganizationLogo
											name={org.name}
											logoUrl={org.logo}
											className="h-10 w-10 shrink-0 rounded-lg"
										/>
										<div className="flex-1 min-w-0">
											<h3 className="font-brand text-base font-bold leading-tight text-foreground group-hover:text-gray-600 dark:group-hover:text-[#A3A3A3] transition-colors line-clamp-1">
												{org.name}
											</h3>
											{org.location && (
												<div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground mt-0.5">
													<MapPin className="h-3 w-3 shrink-0" />
													<span className="truncate">
														{org.location}
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Description */}
									{(org.summary || org.description) && (
										<p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
											{org.summary || org.description}
										</p>
									)}

									{/* Tags */}
									{org.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mb-2">
											{org.tags.slice(0, 3).map((tag) => (
												<span
													key={tag}
													className="px-2 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider border border-border"
												>
													{tag}
												</span>
											))}
											{org.tags.length > 3 && (
												<span className="px-2 py-0.5 text-gray-400 dark:text-muted-foreground text-[10px] font-bold">
													+{org.tags.length - 3}
												</span>
											)}
										</div>
									)}

									{/* Footer */}
									<div className="mt-auto pt-2 border-t border-gray-50 dark:border-border flex items-center justify-between">
										<span className="text-[10px] text-gray-400 dark:text-muted-foreground font-medium">
											寻找伙伴 · 产生链接
										</span>
										<span className="text-[10px] font-mono text-gray-400 dark:text-muted-foreground">
											{new Date(
												org.createdAt,
											).getFullYear()}
										</span>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			) : null}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-center items-center gap-2 mt-8">
					<button
						type="button"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(currentPage - 1)}
						className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						上一页
					</button>
					<span className="text-[11px] font-mono text-muted-foreground px-2">
						{currentPage} / {totalPages}
					</span>
					<button
						type="button"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(currentPage + 1)}
						className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						下一页
					</button>
				</div>
			)}
		</div>
	);
}
