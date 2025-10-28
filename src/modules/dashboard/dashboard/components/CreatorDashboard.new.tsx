"use client";

import { useProfileQuery } from "@/lib/api/api-hooks";
import { prefetchStrategies } from "@/lib/cache-config";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { UserInfo } from "./creator-dashboard/UserInfo";
import { DataStats } from "./creator-dashboard/DataStats";
import { QuickActions } from "./creator-dashboard/QuickActions";
import { RecentActivity } from "./creator-dashboard/RecentActivity";
import { ResourceMatchingPrompt } from "./creator-dashboard/ResourceMatchingPrompt";
import { FooterLinks } from "./creator-dashboard/FooterLinks";
import {
	NewUserAlert,
	ProfileIncompleteAlert,
} from "./creator-dashboard/Alerts";

export function CreatorDashboard() {
	const { user, loaded: sessionLoaded } = useSession();
	const queryClient = useQueryClient();

	const { data: userProfile } = useProfileQuery();

	// 监听session状态变化，清除相关缓存
	useEffect(() => {
		if (sessionLoaded && user) {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		}
	}, [sessionLoaded, user?.id, queryClient]);

	// 数据预加载 - 在session准备好后才预加载仪表板数据
	useEffect(() => {
		if (!sessionLoaded || !user) {
			return;
		}

		let isCancelled = false;

		const prefetchData = async () => {
			try {
				await prefetchStrategies.prefetchDashboardData(queryClient);
			} catch (error) {
				if (!isCancelled) {
					console.warn("预加载仪表板数据失败:", error);
					if (process.env.NODE_ENV === "development") {
						console.error("预加载错误详情:", error);
					}
				}
			}
		};

		prefetchData();
		return () => {
			isCancelled = true;
		};
	}, [sessionLoaded, user?.id, queryClient]);

	// 如果session还没加载完成，显示加载状态
	if (!sessionLoaded) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* 用户信息区域 - 新设计 */}
			<UserInfo />

			{/* 数据概览区域 - 新设计 */}
			<DataStats />

			{/* 重要提醒区域 - 集中显示 */}
			<div className="space-y-3 sm:space-y-4">
				<NewUserAlert />
				<ProfileIncompleteAlert />
				<ResourceMatchingPrompt />
			</div>

			{/* 功能入口区域 - 新设计 */}
			<QuickActions />

			{/* 动态内容区域 - 新设计 */}
			<RecentActivity />

			{/* 帮助与支持区域 - 新增 */}
			<FooterLinks />
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* 用户信息区域骨架 */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 p-3 sm:p-4">
				<div className="flex items-center gap-2 sm:gap-3">
					<div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 animate-pulse rounded-full flex-shrink-0" />
					<div className="flex-1 space-y-2">
						<div className="h-4 sm:h-5 bg-gray-200 animate-pulse rounded w-1/2" />
						<div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
					</div>
					<div className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 animate-pulse rounded-full" />
				</div>
				<div className="mt-2 h-3 bg-gray-200 animate-pulse rounded w-3/4" />
				<div className="mt-3 pt-3 border-t border-blue-100">
					<div className="flex items-center justify-between">
						<div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
						<div className="h-5 w-16 bg-gray-200 animate-pulse rounded-lg" />
					</div>
				</div>
			</div>

			{/* 数据概览区域骨架 */}
			<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded mb-3 sm:mb-4" />
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={index}
							className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200"
						>
							<div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
								<div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 animate-pulse rounded" />
								<div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
							</div>
							<div className="h-5 w-8 bg-gray-200 animate-pulse rounded mb-1" />
							<div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>

			{/* 重要提醒区域骨架 */}
			<div className="space-y-3">
				{Array.from({ length: 2 }).map((_, index) => (
					<div
						key={index}
						className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4"
					>
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 bg-yellow-100 animate-pulse rounded-lg flex-shrink-0" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-32 bg-yellow-200 animate-pulse rounded" />
								<div className="h-3 w-full bg-yellow-200 animate-pulse rounded" />
								<div className="h-6 w-20 bg-yellow-200 animate-pulse rounded" />
							</div>
						</div>
					</div>
				))}
			</div>

			{/* 功能入口区域骨架 */}
			<div className="space-y-4 sm:space-y-6">
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-1 h-4 bg-gray-200 animate-pulse rounded-full" />
						<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
							>
								<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 animate-pulse rounded-lg mb-3" />
								<div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-1" />
								<div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
							</div>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-1 h-4 bg-gray-200 animate-pulse rounded-full" />
						<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
							>
								<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 animate-pulse rounded-lg mb-3" />
								<div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-1" />
								<div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* 动态内容区域骨架 */}
			<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded mb-3 sm:mb-4" />
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					{Array.from({ length: 2 }).map((_, colIndex) => (
						<div key={colIndex}>
							<div className="flex items-center gap-2 mb-2 sm:mb-3">
								<div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 animate-pulse rounded" />
								<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
							</div>
							<div className="space-y-2 sm:space-y-3">
								{Array.from({ length: 3 }).map((_, index) => (
									<div
										key={index}
										className="p-2 sm:p-3 rounded-lg border border-gray-200"
									>
										<div className="flex items-start gap-2 sm:gap-3">
											<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
											<div className="flex-1 space-y-2">
												<div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
												<div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
												<div className="h-2 w-3/4 bg-gray-200 animate-pulse rounded" />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 帮助与支持区域骨架 */}
			<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded mb-3 sm:mb-4" />
				{/* 移动端骨架：一行显示 */}
				<div className="flex flex-wrap gap-2 sm:hidden">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="flex items-center gap-1 px-2 py-1.5 bg-gray-200 animate-pulse rounded-md"
						>
							<div className="h-3 w-3 bg-gray-300 animate-pulse rounded" />
							<div className="h-3 w-12 bg-gray-300 animate-pulse rounded" />
						</div>
					))}
				</div>
				{/* 桌面端骨架 */}
				<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
						>
							<div className="w-8 h-8 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
							<div className="flex-1 min-w-0 space-y-2">
								<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
								<div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default CreatorDashboard;
