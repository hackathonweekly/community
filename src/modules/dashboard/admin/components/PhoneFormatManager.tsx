"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { phoneMonitor } from "@/lib/monitoring/phone-format-monitor";
import {
	BarChart3,
	AlertTriangle,
	CheckCircle,
	Download,
	RefreshCw,
	Eye,
	Trash2,
} from "lucide-react";

export function PhoneFormatManager() {
	const [stats, setStats] = useState<any>(null);
	const [logs, setLogs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("stats");

	const loadData = async () => {
		setLoading(true);
		try {
			// 获取统计数据
			const statsData = phoneMonitor.getStats();
			setStats(statsData);

			// 获取最近日志
			const recentLogs = phoneMonitor.getRecentLogs(100);
			setLogs(recentLogs);
		} catch (error) {
			console.error("Failed to load phone format data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();

		// 定期刷新数据
		const interval = setInterval(loadData, 30000); // 30秒刷新一次
		return () => clearInterval(interval);
	}, []);

	const handleExportLogs = (format: "json" | "csv") => {
		try {
			const data = phoneMonitor.exportLogs(format);
			const blob = new Blob([data], {
				type: format === "json" ? "application/json" : "text/csv",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `phone-format-logs-${new Date().toISOString().split("T")[0]}.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to export logs:", error);
		}
	};

	const handleClearLogs = () => {
		if (confirm("确定要清空所有日志吗？此操作不可撤销。")) {
			phoneMonitor.clearLogs();
			loadData();
		}
	};

	const getLevelIcon = (level: string) => {
		switch (level) {
			case "error":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "warn":
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
			default:
				return <CheckCircle className="h-4 w-4 text-green-500" />;
		}
	};

	const getLevelBadgeVariant = (level: string) => {
		switch (level) {
			case "error":
				return "destructive";
			case "warn":
				return "secondary";
			default:
				return "default";
		}
	};

	if (loading && !stats) {
		return (
			<div className="flex items-center justify-center h-64">
				<RefreshCw className="h-6 w-6 animate-spin" />
				<span className="ml-2">加载中...</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">手机号格式管理</h2>
					<p className="text-muted-foreground">
						监控和管理手机号格式化状态
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={loadData}
						disabled={loading}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
						/>
						刷新
					</Button>
					<Button
						variant="outline"
						onClick={() => handleExportLogs("json")}
					>
						<Download className="h-4 w-4 mr-2" />
						导出 JSON
					</Button>
					<Button
						variant="outline"
						onClick={() => handleExportLogs("csv")}
					>
						<Download className="h-4 w-4 mr-2" />
						导出 CSV
					</Button>
					<Button variant="outline" onClick={handleClearLogs}>
						<Trash2 className="h-4 w-4 mr-2" />
						清空日志
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="stats">
						<BarChart3 className="h-4 w-4 mr-2" />
						统计信息
					</TabsTrigger>
					<TabsTrigger value="logs">
						<Eye className="h-4 w-4 mr-2" />
						操作日志
					</TabsTrigger>
					<TabsTrigger value="errors">
						<AlertTriangle className="h-4 w-4 mr-2" />
						错误日志
					</TabsTrigger>
				</TabsList>

				<TabsContent value="stats" className="space-y-4">
					{stats && (
						<>
							{/* 总览卡片 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											总操作数
										</CardTitle>
										<BarChart3 className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{stats.total}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											正常操作
										</CardTitle>
										<CheckCircle className="h-4 w-4 text-green-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-green-600">
											{stats.byLevel.info}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											警告操作
										</CardTitle>
										<AlertTriangle className="h-4 w-4 text-yellow-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-yellow-600">
											{stats.byLevel.warn}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											错误操作
										</CardTitle>
										<AlertTriangle className="h-4 w-4 text-red-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-red-600">
											{stats.byLevel.error}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* 按来源统计 */}
							<Card>
								<CardHeader>
									<CardTitle>按来源统计</CardTitle>
									<CardDescription>
										不同来源的操作次数分布
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{Object.entries(stats.bySource).map(
											([source, count]) => (
												<div
													key={source}
													className="flex items-center justify-between"
												>
													<span className="text-sm font-medium">
														{source}
													</span>
													<Badge variant="outline">
														{count as number}
													</Badge>
												</div>
											),
										)}
									</div>
								</CardContent>
							</Card>

							{/* 按操作类型统计 */}
							<Card>
								<CardHeader>
									<CardTitle>按操作类型统计</CardTitle>
									<CardDescription>
										不同操作类型的次数分布
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{Object.entries(stats.byAction).map(
											([action, count]) => (
												<div
													key={action}
													className="flex items-center justify-between"
												>
													<span className="text-sm font-medium">
														{action}
													</span>
													<Badge variant="outline">
														{count as number}
													</Badge>
												</div>
											),
										)}
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</TabsContent>

				<TabsContent value="logs" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>最近操作日志</CardTitle>
							<CardDescription>
								显示最近 100 条手机号格式化操作记录
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{logs.map((log, index) => (
									<div
										key={index}
										className="flex items-start gap-3 p-3 rounded-lg border text-sm"
									>
										{getLevelIcon(log.level)}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<Badge
													variant={getLevelBadgeVariant(
														log.level,
													)}
												>
													{log.level.toUpperCase()}
												</Badge>
												<span className="font-medium">
													{log.source}
												</span>
												<span className="text-muted-foreground">
													{log.action}
												</span>
												<span className="text-muted-foreground text-xs">
													{new Date(
														log.timestamp,
													).toLocaleString()}
												</span>
											</div>
											{log.originalPhone && (
												<div className="text-muted-foreground">
													{log.originalPhone}
													{log.normalizedPhone &&
														log.originalPhone !==
															log.normalizedPhone && (
															<>
																{" → "}
																<span className="text-green-600 font-medium">
																	{
																		log.normalizedPhone
																	}
																</span>
															</>
														)}
												</div>
											)}
											{log.metadata &&
												Object.keys(log.metadata)
													.length > 0 && (
													<div className="text-xs text-muted-foreground mt-1">
														{Object.entries(
															log.metadata,
														).map(
															([key, value]) => (
																<span
																	key={key}
																	className="mr-3"
																>
																	{key}:{" "}
																	{String(
																		value,
																	)}
																</span>
															),
														)}
													</div>
												)}
										</div>
									</div>
								))}
								{logs.length === 0 && (
									<div className="text-center text-muted-foreground py-8">
										暂无日志记录
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="errors" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>最近错误日志</CardTitle>
							<CardDescription>
								显示最近 10 条错误记录，便于问题排查
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{stats?.recentErrors?.map(
									(error: any, index: number) => (
										<div
											key={index}
											className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-sm"
										>
											<AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<Badge variant="destructive">
														ERROR
													</Badge>
													<span className="font-medium">
														{error.source}
													</span>
													<span className="text-muted-foreground">
														{error.action}
													</span>
													<span className="text-muted-foreground text-xs">
														{new Date(
															error.timestamp,
														).toLocaleString()}
													</span>
												</div>
												{error.originalPhone && (
													<div className="text-red-700">
														手机号:{" "}
														{error.originalPhone}
													</div>
												)}
												{error.metadata && (
													<div className="text-xs text-red-600 mt-1">
														{Object.entries(
															error.metadata,
														).map(
															([key, value]) => (
																<span
																	key={key}
																	className="mr-3"
																>
																	{key}:{" "}
																	{String(
																		value,
																	)}
																</span>
															),
														)}
													</div>
												)}
											</div>
										</div>
									),
								)}
								{(!stats?.recentErrors ||
									stats.recentErrors.length === 0) && (
									<div className="text-center text-muted-foreground py-8">
										<CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
										暂无错误记录
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
