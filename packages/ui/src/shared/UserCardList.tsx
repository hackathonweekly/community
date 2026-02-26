"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { getLifeStatusLabel } from "@community/lib-shared/utils/life-status";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Input } from "@community/ui/ui/input";
import { Button } from "@community/ui/ui/button";
import { Skeleton } from "@community/ui/ui/skeleton";
import Link from "next/link";
import {
	MailIcon,
	MessageSquareIcon,
	GithubIcon,
	TwitterIcon,
	ExternalLinkIcon,
	SearchIcon,
	Users2Icon,
	MapPinIcon,
	BriefcaseIcon,
	HeartIcon,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../lib/utils";

const getLifeStatusDisplay = (status: string | null | undefined) => {
	if (!status) return null;

	const label = getLifeStatusLabel(status);
	if (!label) return { label: status, variant: "outline" as const };

	// Return with appropriate variant based on status
	return { label, variant: "default" as const };
};

export interface UserCardData {
	id: string;
	name: string | null;
	username: string | null;
	image: string | null;
	bio: string | null;
	region: string | null;
	userRoleString: string | null;
	currentWorkOn: string | null;
	lifeStatus: string | null;
	githubUrl: string | null;
	twitterUrl: string | null;
	websiteUrl: string | null;
	wechatId: string | null;
	email: string;
	showEmail: boolean;
	showWechat: boolean;
	profilePublic: boolean;
	skills: string[];
	createdAt: string;
	// 可选的额外信息
	role?: string;
	commonEventsCount?: number;
	commonEvents?: Array<{ id: string; title: string }>;
}

interface UserCardListProps {
	title: string;
	description?: string;
	apiEndpoint: string;
	searchPlaceholder?: string;
	emptyStateMessage?: string;
	showCommonEvents?: boolean;
	getRoleLabel?: (role: string) => string;
}

export function UserCardList({
	title,
	description,
	apiEndpoint,
	searchPlaceholder = "搜索用户姓名、自我介绍或技能...",
	emptyStateMessage = "暂无用户",
	showCommonEvents = false,
	getRoleLabel,
}: UserCardListProps) {
	const [users, setUsers] = useState<UserCardData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});

	// 使用 useCallback 优化 fetchUsers 函数
	const fetchUsers = useCallback(
		async (isSearch = false) => {
			if (isSearch) {
				setSearchLoading(true);
			} else {
				setLoading(true);
			}

			try {
				const params = new URLSearchParams({
					page: pagination.page.toString(),
					limit: pagination.limit.toString(),
					...(debouncedSearchTerm && { search: debouncedSearchTerm }),
				});

				const response = await fetch(`${apiEndpoint}?${params}`);
				if (response.ok) {
					const data = await response.json();
					setUsers(data.data?.users || []);
					setPagination((prev) => ({
						...prev,
						...data.data?.pagination,
					}));
				} else {
					console.error("Failed to fetch users");
					setUsers([]);
				}
			} catch (error) {
				console.error("Error fetching users:", error);
				setUsers([]);
			} finally {
				if (isSearch) {
					setSearchLoading(false);
				} else {
					setLoading(false);
				}
			}
		},
		[apiEndpoint, debouncedSearchTerm, pagination.page],
	);

	useEffect(() => {
		// 初次加载或分页变化
		if (loading) {
			fetchUsers(false);
		} else {
			// 搜索时使用搜索loading状态
			fetchUsers(true);
		}
	}, [fetchUsers, loading]);

	// 防抖搜索 - 分离输入值和搜索值以支持中文输入
	useEffect(() => {
		const timer = setTimeout(() => {
			const isNewSearch = searchTerm !== debouncedSearchTerm;
			setDebouncedSearchTerm(searchTerm);
			if (isNewSearch) {
				setPagination((prev) => ({ ...prev, page: 1 }));
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchTerm, debouncedSearchTerm]);

	// 优化搜索输入处理
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(e.target.value);
		},
		[],
	);

	const clearSearch = useCallback(() => {
		setSearchTerm("");
	}, []);

	// 优化分页控制
	const handlePrevPage = useCallback(() => {
		setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
	}, []);

	const handleNextPage = useCallback(() => {
		setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
	}, []);

	const handlePageClick = useCallback((pageNum: number) => {
		setPagination((prev) => ({ ...prev, page: pageNum }));
	}, []);

	// 使用 useMemo 缓存分页数字计算
	const pageNumbers = useMemo(() => {
		const totalPages = pagination.totalPages;
		const currentPage = pagination.page;

		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		if (currentPage <= 3) {
			return [1, 2, 3, 4, 5];
		}

		if (currentPage >= totalPages - 2) {
			return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
		}

		return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
	}, [pagination.page, pagination.totalPages]);

	// 缓存清除搜索按钮的处理
	const clearSearchButton = useMemo(
		() => (
			<Button variant="outline" onClick={clearSearch} className="gap-2">
				清除搜索条件
			</Button>
		),
		[clearSearch],
	);

	// 渲染骨架屏的函数
	const renderSkeletonCards = useMemo(
		() => (
			<div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-3 sm:space-x-4">
								<Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-32" />
									<div className="flex gap-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-20" />
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="pt-0 space-y-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-24" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-20" />
								<Skeleton className="h-6 w-12" />
							</div>
							<div className="flex justify-between items-center pt-2">
								<div className="flex gap-3">
									<Skeleton className="h-4 w-12" />
									<Skeleton className="h-4 w-16" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		),
		[],
	);

	return (
		<div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 pb-20 lg:pb-0">
			{/* Header - 始终显示 */}
			{(title || description) && (
				<div className="mb-4 sm:mb-6 md:mb-8">
					{title && (
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
							{title}
						</h1>
					)}
					{description && (
						<p className="text-muted-foreground text-sm sm:text-base mb-3">
							{description}
						</p>
					)}
					{!loading && (
						<div className="flex items-center gap-2 text-sm">
							<div className="flex items-center gap-1">
								<Users2Icon className="h-4 w-4 text-primary" />
								<span className="font-medium">
									共有 {pagination.total} 位用户
								</span>
							</div>
							{debouncedSearchTerm && (
								<div className="text-muted-foreground">
									· 找到 {users.length} 位符合条件的用户
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Search Bar - 始终显示 */}
			<div className="mb-4 sm:mb-6 md:mb-8">
				<div className="relative max-w-md sm:max-w-lg">
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={handleSearchChange}
						className="pl-10 h-11 text-base"
						disabled={loading}
					/>
					{searchTerm && (
						<button
							onClick={clearSearch}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
							disabled={loading}
						>
							×
						</button>
					)}
					{searchLoading && (
						<div className="absolute right-10 top-1/2 transform -translate-y-1/2">
							<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
						</div>
					)}
				</div>
			</div>

			{/* Content Area - 根据状态显示不同内容 */}
			{loading ? (
				<div className="space-y-6 sm:space-y-8">
					{/* Content skeleton */}
					{renderSkeletonCards}
				</div>
			) : (
				<>
					{/* Empty States */}
					{users.length === 0 && debouncedSearchTerm ? (
						<div className="text-center py-10 sm:py-16">
							<SearchIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
							<h3 className="text-lg font-medium mb-2">
								没有找到相关用户
							</h3>
							<p className="text-muted-foreground mb-4">
								没有找到与 "{debouncedSearchTerm}" 相关的用户
							</p>
							{clearSearchButton}
						</div>
					) : users.length === 0 ? (
						<div className="text-center py-10 sm:py-16">
							<Users2Icon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
							<h3 className="text-lg font-medium mb-2">
								暂无用户
							</h3>
							<p className="text-muted-foreground">
								{emptyStateMessage}
							</p>
						</div>
					) : (
						<>
							{/* Search Loading Overlay */}
							<div className="relative">
								{searchLoading && (
									<div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 rounded-lg">
										<div className="flex items-center justify-center h-full">
											<div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 shadow-sm border">
												<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
												<span className="text-sm text-muted-foreground">
													搜索中...
												</span>
											</div>
										</div>
									</div>
								)}
								<div
									className={cn(
										"transition-opacity duration-200",
										searchLoading && "opacity-50",
									)}
								>
									<div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
										{users.map((user) => (
											<Card
												key={user.id}
												className="group hover:shadow-lg hover:shadow-black/5 transition-all duration-200 overflow-hidden border-0 shadow-sm hover:-translate-y-1"
											>
												<CardHeader className="pb-3 sm:pb-4">
													<div className="flex items-start space-x-3 sm:space-x-4">
														<div className="relative">
															<UserAvatar
																name={
																	user.name ||
																	"User"
																}
																avatarUrl={
																	user.image
																}
																className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-background shadow-sm"
															/>
															{user.profilePublic && (
																<div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
															)}
														</div>
														<div className="flex-1 min-w-0 space-y-1">
															<CardTitle className="text-lg leading-tight">
																{user.profilePublic &&
																user.username ? (
																	<Link
																		href={`/u/${user.username}`}
																		target="_blank"
																		className="hover:text-primary transition-colors duration-200 block truncate group-hover:underline decoration-2 underline-offset-2"
																	>
																		{
																			user.name
																		}
																	</Link>
																) : (
																	<span className="block truncate">
																		{
																			user.name
																		}
																	</span>
																)}
															</CardTitle>
															<div className="flex flex-wrap items-center gap-1 sm:gap-2">
																{user.role &&
																	getRoleLabel && (
																		<Badge
																			variant="secondary"
																			className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
																		>
																			{getRoleLabel(
																				user.role,
																			)}
																		</Badge>
																	)}
																{user.userRoleString && (
																	<Badge
																		variant="outline"
																		className="text-xs font-medium"
																	>
																		{
																			user.userRoleString
																		}
																	</Badge>
																)}
																{showCommonEvents &&
																	user.commonEventsCount &&
																	user.commonEventsCount >
																		0 && (
																		<Badge
																			variant="outline"
																			className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
																		>
																			<Users2Icon className="h-3 w-3" />
																			{
																				user.commonEventsCount
																			}{" "}
																			共同活动
																		</Badge>
																	)}
															</div>
														</div>
													</div>
												</CardHeader>
												<CardContent className="pt-0 space-y-4">
													{user.bio && (
														<p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
															{user.bio}
														</p>
													)}

													{/* Current Work and Life Status */}
													{(user.currentWorkOn ||
														user.lifeStatus) && (
														<div className="space-y-2">
															{user.currentWorkOn && (
																<div className="flex items-start gap-2 text-sm">
																	<BriefcaseIcon className="h-4 w-4 text-primary/60 mt-0.5 flex-shrink-0" />
																	<span className="text-muted-foreground leading-relaxed line-clamp-2">
																		{
																			user.currentWorkOn
																		}
																	</span>
																</div>
															)}
															{user.lifeStatus &&
																(() => {
																	const statusInfo =
																		getLifeStatusDisplay(
																			user.lifeStatus,
																		);
																	return statusInfo ? (
																		<div className="flex items-center gap-2">
																			<HeartIcon className="h-4 w-4 text-primary/60" />
																			<Badge
																				variant={
																					statusInfo.variant
																				}
																				className="text-xs font-medium"
																			>
																				{
																					statusInfo.label
																				}
																			</Badge>
																		</div>
																	) : null;
																})()}
														</div>
													)}

													{user.region && (
														<div className="flex items-center gap-2 text-sm text-muted-foreground">
															<MapPinIcon className="h-4 w-4 text-primary/60" />
															<span>
																{user.region}
															</span>
														</div>
													)}

													{/* Skills */}
													{user.skills &&
														user.skills.length >
															0 && (
															<div className="flex flex-wrap gap-1.5">
																{user.skills
																	.slice(0, 3)
																	.map(
																		(
																			skill,
																			index,
																		) => (
																			<Badge
																				key={
																					index
																				}
																				variant="secondary"
																				className="text-xs font-normal bg-muted/50 hover:bg-muted transition-colors"
																			>
																				{
																					skill
																				}
																			</Badge>
																		),
																	)}
																{user.skills
																	.length >
																	3 && (
																	<Badge
																		variant="secondary"
																		className="text-xs font-normal bg-muted/50"
																	>
																		+
																		{user
																			.skills
																			.length -
																			3}
																	</Badge>
																)}
															</div>
														)}

													{/* Contact Links */}
													<div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
														{user.showEmail &&
															user.email && (
																<a
																	href={`mailto:${user.email}`}
																	className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-105"
																>
																	<MailIcon className="h-4 w-4 mr-1.5" />
																	邮箱
																</a>
															)}
														{user.showWechat &&
															user.wechatId && (
																<div className="flex items-center text-xs text-muted-foreground">
																	<MessageSquareIcon className="h-4 w-4 mr-1.5" />
																	<span className="max-w-[80px] truncate">
																		{
																			user.wechatId
																		}
																	</span>
																</div>
															)}
														{user.githubUrl && (
															<a
																href={
																	user.githubUrl
																}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-105"
															>
																<GithubIcon className="h-4 w-4 mr-1.5" />
																GitHub
															</a>
														)}
														{user.twitterUrl && (
															<a
																href={
																	user.twitterUrl
																}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-105"
															>
																<TwitterIcon className="h-4 w-4 mr-1.5" />
																Twitter
															</a>
														)}
														{user.websiteUrl && (
															<a
																href={
																	user.websiteUrl
																}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors duration-200 hover:scale-105"
															>
																<ExternalLinkIcon className="h-4 w-4 mr-1.5" />
																网站
															</a>
														)}
													</div>
												</CardContent>
											</Card>
										))}
									</div>

									{/* Pagination */}
									{pagination.totalPages > 1 && (
										<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 sm:mt-8 sm:pt-6 border-t border-border/50">
											<div className="text-sm text-muted-foreground">
												第 {pagination.page} 页，共{" "}
												{pagination.totalPages} 页
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={
														pagination.page <= 1
													}
													onClick={handlePrevPage}
													className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
												>
													<span>←</span>
													上一页
												</Button>

												{/* Page Numbers */}
												<div className="hidden sm:flex items-center gap-1">
													{pageNumbers.map(
														(pageNum) => (
															<Button
																key={pageNum}
																variant={
																	pagination.page ===
																	pageNum
																		? "default"
																		: "outline"
																}
																size="sm"
																onClick={() =>
																	handlePageClick(
																		pageNum,
																	)
																}
																className={cn(
																	"w-8 h-8 p-0",
																	pagination.page ===
																		pageNum &&
																		"bg-primary text-primary-foreground",
																)}
															>
																{pageNum}
															</Button>
														),
													)}
												</div>

												<Button
													variant="outline"
													size="sm"
													disabled={
														pagination.page >=
														pagination.totalPages
													}
													onClick={handleNextPage}
													className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
												>
													下一页
													<span>→</span>
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
}
