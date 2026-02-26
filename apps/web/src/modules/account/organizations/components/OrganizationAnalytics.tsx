"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { Calendar, Users, TrendingUp, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface OrganizationAnalytics {
	memberGrowth: Array<{ month: string; count: number }>;
	eventParticipation: Array<{
		month: string;
		events: number;
		participants: number;
	}>;
	contributionTypes: Array<{ type: string; count: number; cpValue: number }>;
	memberActivity: Array<{
		month: string;
		activeMembers: number;
		totalMembers: number;
	}>;
	topContributors: Array<{ name: string; cpValue: number }>;
	kpis: {
		totalMembers: number;
		monthlyGrowthRate: number;
		avgEventParticipation: number;
		totalContributionValue: number;
		activeMemberRate: number;
	};
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export function OrganizationAnalytics() {
	const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchAnalytics();
	}, []);

	const fetchAnalytics = async () => {
		try {
			const orgSlug = window.location.pathname.split("/")[2];
			const response = await fetch(
				`/api/organizations/${orgSlug}/analytics`,
			);
			if (response.ok) {
				const data = await response.json();
				setAnalytics(data.analytics);
			}
		} catch (error) {
			console.error("Failed to fetch analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading || !analytics) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-32 bg-muted rounded" />
						))}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="h-80 bg-muted rounded" />
						<div className="h-80 bg-muted rounded" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div>
				<h1 className="text-3xl font-bold">数据统计</h1>
				<p className="text-muted-foreground mt-2">
					组织运营数据分析与洞察
				</p>
			</div>

			{/* KPI 指标 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总成员数
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.kpis.totalMembers}
						</div>
						<p className="text-xs text-muted-foreground">
							月增长率{" "}
							{analytics.kpis.monthlyGrowthRate.toFixed(1)}%
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							活动参与率
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{analytics.kpis.avgEventParticipation.toFixed(1)}%
						</div>
						<p className="text-xs text-muted-foreground">
							平均每场活动参与率
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总贡献值
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{analytics.kpis.totalContributionValue.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							组织累计贡献值
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							活跃成员率
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							{analytics.kpis.activeMemberRate.toFixed(1)}%
						</div>
						<p className="text-xs text-muted-foreground">
							近3个月活跃成员占比
						</p>
					</CardContent>
				</Card>
			</div>

			{/* 图表区域 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 成员增长趋势 */}
				<Card>
					<CardHeader>
						<CardTitle>成员增长趋势</CardTitle>
						<CardDescription>
							过去12个月成员数量变化
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={analytics.memberGrowth}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="count"
									stroke="#8884d8"
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 活动参与情况 */}
				<Card>
					<CardHeader>
						<CardTitle>活动参与情况</CardTitle>
						<CardDescription>
							每月活动数量与参与人数
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analytics.eventParticipation}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Bar
									dataKey="events"
									fill="#8884d8"
									name="活动数量"
								/>
								<Bar
									dataKey="participants"
									fill="#82ca9d"
									name="参与人次"
								/>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 贡献类型分布 */}
				<Card>
					<CardHeader>
						<CardTitle>贡献类型分布</CardTitle>
						<CardDescription>
							不同类型贡献的数量分布
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={analytics.contributionTypes}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ type, count }) =>
										`${type}: ${count}`
									}
									outerRadius={80}
									fill="#8884d8"
									dataKey="count"
								>
									{analytics.contributionTypes.map(
										(_entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={
													COLORS[
														index % COLORS.length
													]
												}
											/>
										),
									)}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 成员活跃度 */}
				<Card>
					<CardHeader>
						<CardTitle>成员活跃度</CardTitle>
						<CardDescription>活跃成员与总成员对比</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={analytics.memberActivity}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="totalMembers"
									stroke="#8884d8"
									strokeWidth={2}
									name="总成员数"
								/>
								<Line
									type="monotone"
									dataKey="activeMembers"
									stroke="#82ca9d"
									strokeWidth={2}
									name="活跃成员数"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* 贡献排行榜 */}
			<Card>
				<CardHeader>
					<CardTitle>贡献排行榜</CardTitle>
					<CardDescription>组织内贡献值最高的成员</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{analytics.topContributors.map((contributor, index) => (
							<div
								key={contributor.name}
								className="flex items-center justify-between p-3 bg-muted rounded-lg"
							>
								<div className="flex items-center space-x-3">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
											index === 0
												? "bg-yellow-500 text-white"
												: index === 1
													? "bg-gray-400 text-white"
													: index === 2
														? "bg-orange-500 text-white"
														: "bg-blue-500 text-white"
										}`}
									>
										{index + 1}
									</div>
									<span className="font-medium">
										{contributor.name}
									</span>
								</div>
								<div className="text-lg font-bold text-blue-600">
									{contributor.cpValue.toLocaleString()}积分
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
