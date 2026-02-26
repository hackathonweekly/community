"use client";

import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { Skeleton } from "@community/ui/ui/skeleton";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface LoadingStateProps {
	type?: "skeleton" | "spinner" | "pulse" | "custom";
	size?: "sm" | "md" | "lg";
	message?: string;
	children?: ReactNode;
	className?: string;
}

export function LoadingState({
	type = "skeleton",
	size = "md",
	message,
	children,
	className = "",
}: LoadingStateProps) {
	const getSizeClasses = () => {
		switch (size) {
			case "sm":
				return "p-2";
			case "lg":
				return "p-8";
			default:
				return "p-4";
		}
	};

	if (type === "custom" && children) {
		return <div className={className}>{children}</div>;
	}

	if (type === "spinner") {
		return (
			<div
				className={`flex flex-col items-center justify-center ${getSizeClasses()} ${className}`}
			>
				<ArrowPathIcon className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
				{message && (
					<p className="text-sm text-muted-foreground">{message}</p>
				)}
			</div>
		);
	}

	if (type === "pulse") {
		return (
			<div
				className={`flex flex-col items-center justify-center ${getSizeClasses()} ${className}`}
			>
				<div className="w-4 h-4 bg-primary rounded-full animate-pulse mb-2" />
				{message && (
					<p className="text-sm text-muted-foreground">{message}</p>
				)}
			</div>
		);
	}

	// Default skeleton loading
	return (
		<div className={`space-y-3 ${getSizeClasses()} ${className}`}>
			<Skeleton className="h-4 w-[250px]" />
			<Skeleton className="h-4 w-[200px]" />
			<Skeleton className="h-4 w-[300px]" />
			{message && (
				<div className="mt-4">
					<p className="text-sm text-muted-foreground text-center">
						{message}
					</p>
				</div>
			)}
		</div>
	);
}

interface ErrorStateProps {
	title?: string;
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
	variant?: "network" | "permission" | "notfound" | "generic";
	className?: string;
}

export function ErrorState({
	title,
	message,
	actionLabel,
	onAction,
	variant = "generic",
	className = "",
}: ErrorStateProps) {
	const getVariantConfig = () => {
		switch (variant) {
			case "network":
				return {
					title: title || "网络连接失败",
					message: message || "请检查网络连接后重试",
					actionLabel: actionLabel || "重试",
					icon: "🌐",
				};
			case "permission":
				return {
					title: title || "权限不足",
					message: message || "您没有权限访问此内容",
					actionLabel: actionLabel || "返回",
					icon: "🔒",
				};
			case "notfound":
				return {
					title: title || "内容不存在",
					message: message || "请求的内容不存在或已被删除",
					actionLabel: actionLabel || "返回",
					icon: "🔍",
				};
			default:
				return {
					title: title || "出现错误",
					message: message || "系统遇到了一些问题，请稍后重试",
					actionLabel: actionLabel || "重试",
					icon: "⚠️",
				};
		}
	};

	const config = getVariantConfig();

	return (
		<Card className={`border-dashed ${className}`}>
			<CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
				<div className="text-4xl mb-4">{config.icon}</div>
				<h3 className="text-lg font-medium text-muted-foreground mb-2">
					{config.title}
				</h3>
				<p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
					{config.message}
				</p>
				{onAction && (
					<Button
						variant="outline"
						onClick={onAction}
						className="gap-2"
					>
						{variant === "network" && (
							<ArrowPathIcon className="h-4 w-4" />
						)}
						{config.actionLabel}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

interface EmptyStateProps {
	title?: string;
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
	icon?: ReactNode;
	className?: string;
}

export function EmptyState({
	title = "暂无内容",
	message = "还没有相关数据",
	actionLabel,
	onAction,
	icon,
	className = "",
}: EmptyStateProps) {
	return (
		<Card className={`border-dashed ${className}`}>
			<CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
				{icon ? (
					<div className="mb-4">{icon}</div>
				) : (
					<div className="text-6xl mb-4 opacity-50">📭</div>
				)}
				<h3 className="text-lg font-medium text-muted-foreground mb-2">
					{title}
				</h3>
				<p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
					{message}
				</p>
				{onAction && actionLabel && (
					<Button onClick={onAction}>{actionLabel}</Button>
				)}
			</CardContent>
		</Card>
	);
}

// 专门用于表格的加载状态
export function TableLoadingSkeleton({
	rows = 5,
	columns = 4,
}: { rows?: number; columns?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={rowIndex} className="flex gap-4">
					{Array.from({ length: columns }).map((_, colIndex) => (
						<Skeleton
							key={colIndex}
							className="h-4 flex-1"
							style={{ width: `${Math.random() * 40 + 60}%` }}
						/>
					))}
				</div>
			))}
		</div>
	);
}

// 专门用于卡片列表的加载状态
export function CardListLoadingSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, index) => (
				<Card key={index}>
					<CardContent className="p-4">
						<div className="flex gap-3">
							<Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
							<div className="space-y-2 flex-1">
								<Skeleton className="h-4 w-[200px]" />
								<Skeleton className="h-3 w-[150px]" />
								<div className="flex gap-2 mt-2">
									<Skeleton className="h-6 w-[60px] rounded-full" />
									<Skeleton className="h-6 w-[80px] rounded-full" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
