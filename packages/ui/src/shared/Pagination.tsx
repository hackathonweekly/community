"use client";

import { Button } from "@community/ui/ui/button";
import { Skeleton } from "@community/ui/ui/skeleton";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppErrorHandler } from "@community/lib-client/error/handler";

export interface PaginationMeta {
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface UsePaginationOptions {
	pageSize?: number;
	initialLoad?: boolean;
	loadingType?: "skeleton" | "spinner" | "button";
	errorHandling?: "toast" | "silent" | "throw";
}

export interface UsePaginationResult<T> {
	data: T[];
	meta: PaginationMeta | null;
	loading: boolean;
	loadingMore: boolean;
	error: Error | null;
	hasNextPage: boolean;
	loadNextPage: () => Promise<void>;
	reload: () => Promise<void>;
	reset: () => void;
	updateData: (updater: (prevData: T[]) => T[]) => void;
}

export function usePagination<T>(
	fetchFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
	options: UsePaginationOptions = {},
): UsePaginationResult<T> {
	const {
		pageSize = 20,
		initialLoad = true,
		loadingType = "skeleton",
		errorHandling = "toast",
	} = options;

	const [data, setData] = useState<T[]>([]);
	const [meta, setMeta] = useState<PaginationMeta | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const currentPageRef = useRef(0);
	const isInitializedRef = useRef(false);

	const loadPage = useCallback(
		async (page: number, append = false) => {
			try {
				if (page === 1) {
					setLoading(true);
				} else {
					setLoadingMore(true);
				}
				setError(null);

				const result = await fetchFn(page, pageSize);

				setData((prevData) =>
					append ? [...prevData, ...result.data] : result.data,
				);
				setMeta(result.meta);
				currentPageRef.current = page;
			} catch (err) {
				const appError = AppErrorHandler.handleError(
					err as Error,
					errorHandling === "toast",
				);
				setError(appError);

				if (errorHandling === "throw") {
					throw appError;
				}
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[fetchFn, pageSize, errorHandling],
	);

	const loadNextPage = useCallback(async () => {
		if (!meta?.hasNextPage || loadingMore) return;
		await loadPage(currentPageRef.current + 1, true);
	}, [meta?.hasNextPage, loadingMore, loadPage]);

	const reload = useCallback(async () => {
		await loadPage(1, false);
	}, [loadPage]);

	const reset = useCallback(() => {
		setData([]);
		setMeta(null);
		setError(null);
		currentPageRef.current = 0;
		isInitializedRef.current = false;
	}, []);

	useEffect(() => {
		if (initialLoad && !isInitializedRef.current) {
			isInitializedRef.current = true;
			loadPage(1, false);
		}
	}, [initialLoad, loadPage]);

	const updateData = useCallback((updater: (prevData: T[]) => T[]) => {
		setData(updater);
	}, []);

	return {
		data,
		meta,
		loading,
		loadingMore,
		error,
		hasNextPage: meta?.hasNextPage ?? false,
		loadNextPage,
		reload,
		reset,
		updateData,
	};
}

interface InfiniteScrollProps<T> {
	data: T[];
	loading: boolean;
	loadingMore: boolean;
	hasNextPage: boolean;
	onLoadMore: () => Promise<void>;
	renderItem: (item: T, index: number) => React.ReactNode;
	loadingComponent?: React.ReactNode;
	loadingMoreComponent?: React.ReactNode;
	endMessage?: React.ReactNode;
	threshold?: number;
	className?: string;
}

export function InfiniteScroll<T>({
	data,
	loading,
	loadingMore,
	hasNextPage,
	onLoadMore,
	renderItem,
	loadingComponent,
	loadingMoreComponent,
	endMessage,
	threshold = 300,
	className = "",
}: InfiniteScrollProps<T>) {
	const loadingRef = useRef<HTMLDivElement>(null);
	const isLoadingRef = useRef(false);

	useEffect(() => {
		const element = loadingRef.current;
		if (!element || !hasNextPage || loadingMore) return;

		const observer = new IntersectionObserver(
			async ([entry]) => {
				if (entry.isIntersecting && !isLoadingRef.current) {
					isLoadingRef.current = true;
					try {
						await onLoadMore();
					} finally {
						isLoadingRef.current = false;
					}
				}
			},
			{ rootMargin: `${threshold}px` },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [hasNextPage, loadingMore, onLoadMore, threshold]);

	if (loading) {
		return (
			loadingComponent || (
				<div className={`space-y-4 ${className}`}>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-[250px]" />
							<Skeleton className="h-4 w-[200px]" />
						</div>
					))}
				</div>
			)
		);
	}

	return (
		<div className={className}>
			<div className="space-y-4">{data.map(renderItem)}</div>

			{/* Loading trigger element */}
			<div ref={loadingRef} className="h-4" />

			{/* Loading more indicator */}
			{loadingMore &&
				(loadingMoreComponent || (
					<div className="flex justify-center py-4">
						<ArrowPathIcon className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				))}

			{/* End message */}
			{!hasNextPage &&
				data.length > 0 &&
				(endMessage || (
					<div className="text-center py-4 text-sm text-muted-foreground">
						没有更多内容了
					</div>
				))}
		</div>
	);
}

interface LoadMoreButtonProps {
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	className?: string;
	children?: React.ReactNode;
}

export function LoadMoreButton({
	loading,
	hasMore,
	onLoadMore,
	className = "",
	children,
}: LoadMoreButtonProps) {
	if (!hasMore) {
		return (
			<div
				className={`text-center py-4 text-sm text-muted-foreground ${className}`}
			>
				没有更多内容了
			</div>
		);
	}

	return (
		<div className={`text-center py-4 ${className}`}>
			<Button
				variant="outline"
				onClick={onLoadMore}
				disabled={loading}
				className="gap-2"
			>
				{loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
				{children || (loading ? "加载中..." : "加载更多")}
			</Button>
		</div>
	);
}
