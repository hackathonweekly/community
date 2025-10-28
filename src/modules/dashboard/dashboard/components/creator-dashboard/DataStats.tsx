import { useProfileQuery } from "@/lib/api/api-hooks";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import {
	Users,
	Calendar,
	Briefcase,
	Trophy,
	Building,
	Heart,
} from "lucide-react";
import { useEffect, useState } from "react";

// 模拟数据获取（实际项目中应该从API获取）
interface UserStats {
	cpTotal: number;
	cpThisMonth: number;
	eventsTotal: number;
	awardsCount: number;
	projectsTotal: number;
	followingCount: number;
	organizationsCount: number;
	followersCount: number;
}

export function DataStats() {
	const { user } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();
	const t = useTranslations();
	const [stats, setStats] = useState<UserStats>({
		cpTotal: 0,
		cpThisMonth: 0,
		eventsTotal: 0,
		awardsCount: 0,
		projectsTotal: 0,
		followingCount: 0,
		organizationsCount: 0,
		followersCount: 0,
	});

	// 模拟数据加载（实际项目中应该从API获取）
	useEffect(() => {
		// 这里应该调用实际的API获取用户统计数据
		// 目前使用模拟数据
		const mockStats: UserStats = {
			cpTotal: 128,
			cpThisMonth: 32,
			eventsTotal: 8,
			awardsCount: 2,
			projectsTotal: 3,
			followingCount: 45,
			organizationsCount: 1,
			followersCount: 128,
		};
		setStats(mockStats);
	}, [user?.id]);

	const statCards = [
		{
			title: "CP贡献点",
			value: stats.cpTotal.toString(),
			subValue: `+${stats.cpThisMonth}本月`,
			icon: Trophy,
			color: "bg-blue-50 text-blue-600 border-blue-200",
			subColor: "text-blue-600",
		},
		{
			title: "活动数量",
			value: stats.eventsTotal.toString(),
			subValue:
				stats.awardsCount > 0
					? `🏆获奖${stats.awardsCount}次`
					: "参与中",
			icon: Calendar,
			color: "bg-green-50 text-green-600 border-green-200",
			subColor: "text-green-600",
		},
		{
			title: "项目数量",
			value: stats.projectsTotal.toString(),
			subValue: "已发布",
			icon: Briefcase,
			color: "bg-purple-50 text-purple-600 border-purple-200",
			subColor: "text-purple-600",
		},
		{
			title: "社交数据",
			value: stats.followingCount.toString(),
			subValue: `组织:${stats.organizationsCount} 粉丝:${stats.followersCount}`,
			icon: Users,
			color: "bg-orange-50 text-orange-600 border-orange-200",
			subColor: "text-orange-600",
		},
	];

	if (isLoading) {
		return <DataStatsSkeleton />;
	}

	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				数据概览
			</h3>

			{/* 第一行：4个核心数据指标 */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
				{statCards.map((stat, index) => (
					<div
						key={index}
						className={`p-2 sm:p-3 rounded-lg border ${stat.color}`}
					>
						<div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
							<stat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="text-xs text-gray-600">
								{stat.title}
							</span>
						</div>
						<div className="text-base sm:text-lg font-bold text-gray-900">
							{stat.value}
						</div>
						<div className={`text-xs ${stat.subColor} mt-1`}>
							{stat.subValue}
						</div>
					</div>
				))}
			</div>

			{/* 第二行：详细数据展示（仅在桌面端显示） */}
			<div className="mt-4 pt-4 border-t border-gray-100 hidden sm:block">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2">
							<Building className="h-4 w-4 text-gray-600" />
							<span className="text-sm text-gray-600">
								加入组织
							</span>
						</div>
						<span className="text-sm font-medium text-gray-900">
							{stats.organizationsCount}个
						</span>
					</div>
					<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2">
							<Heart className="h-4 w-4 text-gray-600" />
							<span className="text-sm text-gray-600">
								获得关注
							</span>
						</div>
						<span className="text-sm font-medium text-gray-900">
							{stats.followersCount}人
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function DataStatsSkeleton() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
			</h3>

			{/* 数据卡片骨架 */}
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

			{/* 详细数据骨架 */}
			<div className="mt-4 pt-4 border-t border-gray-100 hidden sm:block">
				<div className="grid grid-cols-2 gap-4">
					{Array.from({ length: 2 }).map((_, index) => (
						<div
							key={index}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
								<div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
							</div>
							<div className="h-3 w-8 bg-gray-200 animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
