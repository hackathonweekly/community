"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { TrendingUp, Mail, Users, Eye, MousePointer } from "lucide-react";
import { useEffect, useState } from "react";

interface EmailAnalyticsData {
	overview: {
		totalCampaigns: number;
		activeCampaigns: number;
		totalRecipients: number;
		deliveredEmails: number;
		deliveryRate: number;
		openRate: number;
		clickRate: number;
	};
	// 模拟数据结构
	performanceData?: Array<{
		date: string;
		sent: number;
		delivered: number;
		opened: number;
		clicked: number;
	}>;
	campaignTypes?: Array<{ type: string; count: number; rate: number }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function EmailAnalytics() {
	const [analytics, setAnalytics] = useState<EmailAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [period, setPeriod] = useState("30");

	useEffect(() => {
		fetchAnalytics();
	}, [period]);

	const fetchAnalytics = async () => {
		try {
			const response = await fetch(
				`/api/admin/emails/analytics?period=${period}`,
			);
			if (response.ok) {
				const data = await response.json();
				setAnalytics({
					...data,
					// 模拟额外的分析数据
					performanceData: generateMockPerformanceData(),
					campaignTypes: generateMockCampaignTypes(),
				});
			}
		} catch (error) {
			console.error("Failed to fetch analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	const generateMockPerformanceData = () => {
		const days = Number.parseInt(period);
		const data = [];
		for (let i = days; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			data.push({
				date: date.toLocaleDateString(),
				sent: Math.floor(Math.random() * 1000) + 500,
				delivered: Math.floor(Math.random() * 900) + 450,
				opened: Math.floor(Math.random() * 400) + 100,
				clicked: Math.floor(Math.random() * 100) + 20,
			});
		}
		return data;
	};

	const generateMockCampaignTypes = () => {
		return [
			{ type: "周报", count: 12, rate: 85.2 },
			{ type: "通知", count: 45, rate: 92.1 },
			{ type: "营销", count: 8, rate: 67.3 },
			{ type: "系统", count: 23, rate: 98.5 },
			{ type: "公告", count: 15, rate: 89.7 },
		];
	};

	if (loading || !analytics) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-gray-200 rounded w-64" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-32 bg-gray-200 rounded" />
						))}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="h-80 bg-gray-200 rounded" />
						<div className="h-80 bg-gray-200 rounded" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">邮件数据分析</h1>
					<p className="text-gray-600 mt-2">
						深入了解邮件发送效果和用户互动
					</p>
				</div>
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">近7天</SelectItem>
						<SelectItem value="30">近30天</SelectItem>
						<SelectItem value="90">近90天</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* KPI 指标 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总发送量
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.overview.totalRecipients.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							近{period}天发送的邮件数量
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							投递成功率
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{analytics.overview.deliveryRate}%
						</div>
						<p className="text-xs text-muted-foreground">
							成功投递{" "}
							{analytics.overview.deliveredEmails.toLocaleString()}{" "}
							封
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							平均打开率
						</CardTitle>
						<Eye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{analytics.overview.openRate}%
						</div>
						<p className="text-xs text-muted-foreground">
							行业平均水平 22%
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							平均点击率
						</CardTitle>
						<MousePointer className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							{analytics.overview.clickRate}%
						</div>
						<p className="text-xs text-muted-foreground">
							行业平均水平 3.5%
						</p>
					</CardContent>
				</Card>
			</div>

			{/* 图表区域 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 邮件发送趋势 */}
				<Card>
					<CardHeader>
						<CardTitle>邮件发送趋势</CardTitle>
						<CardDescription>
							过去{period}天的邮件发送和互动数据
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={analytics.performanceData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="sent"
									stroke="#8884d8"
									strokeWidth={2}
									name="发送"
								/>
								<Line
									type="monotone"
									dataKey="delivered"
									stroke="#82ca9d"
									strokeWidth={2}
									name="投递"
								/>
								<Line
									type="monotone"
									dataKey="opened"
									stroke="#ffc658"
									strokeWidth={2}
									name="打开"
								/>
								<Line
									type="monotone"
									dataKey="clicked"
									stroke="#ff7300"
									strokeWidth={2}
									name="点击"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 活动类型分布 */}
				<Card>
					<CardHeader>
						<CardTitle>活动类型分布</CardTitle>
						<CardDescription>
							不同类型邮件活动的数量和效果
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={analytics.campaignTypes}
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
									{analytics.campaignTypes?.map(
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

				{/* 各类型邮件效果对比 */}
				<Card>
					<CardHeader>
						<CardTitle>各类型邮件效果对比</CardTitle>
						<CardDescription>
							不同邮件类型的成功率对比
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analytics.campaignTypes}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="type" />
								<YAxis />
								<Tooltip />
								<Bar
									dataKey="rate"
									fill="#8884d8"
									name="成功率(%)"
								/>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* 关键指标总结 */}
				<Card>
					<CardHeader>
						<CardTitle>关键指标总结</CardTitle>
						<CardDescription>邮件营销效果概览</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
							<div>
								<div className="text-sm font-medium text-blue-900">
									邮件活动总数
								</div>
								<div className="text-2xl font-bold text-blue-600">
									{analytics.overview.totalCampaigns}
								</div>
							</div>
							<div className="text-blue-400">
								<Mail className="w-8 h-8" />
							</div>
						</div>

						<div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
							<div>
								<div className="text-sm font-medium text-green-900">
									活跃活动
								</div>
								<div className="text-2xl font-bold text-green-600">
									{analytics.overview.activeCampaigns}
								</div>
							</div>
							<div className="text-green-400">
								<TrendingUp className="w-8 h-8" />
							</div>
						</div>

						<div className="p-4 bg-gray-50 rounded-lg">
							<div className="text-sm font-medium text-gray-700 mb-2">
								优化建议
							</div>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• 尝试不同的邮件主题以提高打开率</li>
								<li>• 优化邮件内容布局和CTA按钮</li>
								<li>• 分析最佳发送时间段</li>
								<li>• 定期清理无效邮箱地址</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
