"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Users,
	Calendar,
	Trophy,
	Building2,
	TrendingUp,
	AlertCircle,
	CheckCircle,
	Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
	totalUsers: number;
	todayUsers: number;
	thisWeekUsers: number;
	pendingContributions: number;
	activeOrganizations: number;
	totalEvents: number;
	totalProjects: number;
	totalContributions: number;
	totalBadges: number;
}

export function SuperAdminDashboard() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardStats();
	}, []);

	const fetchDashboardStats = async () => {
		try {
			const response = await fetch("/api/super-admin/dashboard");
			if (response.ok) {
				const data = await response.json();
				setStats(data.stats);
			}
		} catch (error) {
			console.error("Failed to fetch dashboard stats:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-32 bg-muted rounded" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="p-6">
				<Card>
					<CardContent className="pt-6">
						<div className="text-center text-muted-foreground">
							<AlertCircle className="mx-auto h-12 w-12 mb-4" />
							<p>无法加载仪表板数据</p>
							<Button
								onClick={fetchDashboardStats}
								className="mt-4"
							>
								重试
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold">
						超级管理员仪表板
					</h1>
					<p className="text-muted-foreground mt-2">
						社区运营数据总览
					</p>
				</div>
				<Badge
					variant="outline"
					className="text-green-600 border-green-600 self-start"
				>
					<CheckCircle className="w-4 h-4 mr-1" />
					系统正常
				</Badge>
			</div>

			{/* 核心指标卡片 */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
				{/* 总用户数 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总用户数
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl lg:text-2xl font-bold">
							{stats.totalUsers.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							本周新增 {stats.thisWeekUsers} 人
						</p>
					</CardContent>
				</Card>

				{/* 今日新增 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							今日新增
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl lg:text-2xl font-bold">
							{stats.todayUsers}
						</div>
						<p className="text-xs text-muted-foreground">
							新注册用户数
						</p>
					</CardContent>
				</Card>

				{/* 待审核贡献 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							待审核贡献
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl lg:text-2xl font-bold text-orange-600">
							{stats.pendingContributions}
						</div>
						<p className="text-xs text-muted-foreground">
							需要处理的申请
						</p>
					</CardContent>
				</Card>

				{/* 活跃组织数 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							活跃组织数
						</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl lg:text-2xl font-bold">
							{stats.activeOrganizations}
						</div>
						<p className="text-xs text-muted-foreground">
							本月有活动的组织
						</p>
					</CardContent>
				</Card>
			</div>

			{/* 快速操作 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* 待处理任务 */}
				<Card>
					<CardHeader>
						<CardTitle>待处理任务</CardTitle>
						<CardDescription>需要你关注的事项</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4 text-orange-600" />
								<span>待审核贡献</span>
							</div>
							<div className="flex items-center space-x-2">
								<Badge
									variant={
										stats.pendingContributions > 0
											? "destructive"
											: "secondary"
									}
								>
									{stats.pendingContributions}
								</Badge>
								<Button size="sm" variant="outline" asChild>
									<a href="/admin/contributions/pending">
										处理
									</a>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 快速跳转 */}
				<Card>
					<CardHeader>
						<CardTitle>快速跳转</CardTitle>
						<CardDescription>常用管理功能</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-auto p-3"
							>
								<a
									href="/admin/users"
									className="flex flex-col items-center space-y-1"
								>
									<Users className="h-4 w-4" />
									<span className="text-xs text-center whitespace-nowrap">
										用户管理
									</span>
								</a>
							</Button>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-auto p-3"
							>
								<a
									href="/admin/badges"
									className="flex flex-col items-center space-y-1"
								>
									<Trophy className="h-4 w-4" />
									<span className="text-xs text-center whitespace-nowrap">
										勋章管理
									</span>
								</a>
							</Button>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-auto p-3"
							>
								<a
									href="/admin/organizations"
									className="flex flex-col items-center space-y-1"
								>
									<Building2 className="h-4 w-4" />
									<span className="text-xs text-center whitespace-nowrap">
										组织管理
									</span>
								</a>
							</Button>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-auto p-3"
							>
								<a
									href="/admin/certificates"
									className="flex flex-col items-center space-y-1"
								>
									<Trophy className="h-4 w-4" />
									<span className="text-xs text-center whitespace-nowrap">
										获奖证书
									</span>
								</a>
							</Button>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-auto p-3"
							>
								<a
									href="/admin/config"
									className="flex flex-col items-center space-y-1"
								>
									<Calendar className="h-4 w-4" />
									<span className="text-xs text-center whitespace-nowrap">
										系统配置
									</span>
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 统计概览 */}
			<Card>
				<CardHeader>
					<CardTitle>社区统计概览</CardTitle>
					<CardDescription>各模块数据统计</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
						<div className="text-center">
							<div className="text-xl lg:text-2xl font-bold text-blue-600">
								{stats.totalEvents}
							</div>
							<div className="text-xs lg:text-sm text-muted-foreground">
								总活动数
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl lg:text-2xl font-bold text-green-600">
								{stats.totalProjects}
							</div>
							<div className="text-xs lg:text-sm text-muted-foreground">
								总作品数
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl lg:text-2xl font-bold text-purple-600">
								{stats.totalContributions}
							</div>
							<div className="text-xs lg:text-sm text-muted-foreground">
								总贡献数
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl lg:text-2xl font-bold text-yellow-600">
								{stats.totalBadges}
							</div>
							<div className="text-xs lg:text-sm text-muted-foreground">
								总勋章数
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
