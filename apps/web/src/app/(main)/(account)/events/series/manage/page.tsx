"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";

interface EventSeriesListItem {
	id: string;
	slug: string;
	title: string;
	description?: string | null;
	organizationId?: string | null;
	organizerId?: string | null;
	isActive: boolean;
	_count?: {
		events: number;
		subscriptions: number;
	};
}

export default function EventSeriesManagePage() {
	const [seriesList, setSeriesList] = useState<EventSeriesListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [archivingId, setArchivingId] = useState<string | null>(null);

	const fetchSeriesList = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(
				"/api/event-series?mine=true&includeInactive=true&limit=100",
			);
			if (!response.ok) {
				throw new Error("获取系列活动失败");
			}
			const result = await response.json();
			setSeriesList(result?.data?.series ?? []);
		} catch (error) {
			console.error("Error loading event series:", error);
			toast.error(
				error instanceof Error ? error.message : "获取系列活动失败",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSeriesList();
	}, [fetchSeriesList]);

	const handleArchive = async (seriesId: string) => {
		if (!window.confirm("确认归档该系列吗？归档后默认不再公开展示。")) {
			return;
		}

		setArchivingId(seriesId);
		try {
			const response = await fetch(`/api/event-series/${seriesId}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "归档失败");
			}
			toast.success("系列已归档");
			fetchSeriesList();
		} catch (error) {
			console.error("Error archiving event series:", error);
			toast.error(error instanceof Error ? error.message : "归档失败");
		} finally {
			setArchivingId(null);
		}
	};

	return (
		<>
			<MobilePageHeader title="系列管理" />
			<div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-6">
				<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-brand text-2xl font-bold tracking-tight md:text-3xl">
							系列活动管理
						</h1>
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
							创建并维护你的活动系列，绑定活动后可让用户订阅更新。
						</p>
					</div>
					<Button asChild>
						<Link href="/events/series/manage/create">
							创建系列
						</Link>
					</Button>
				</div>

				{loading ? (
					<Card className="rounded-lg border border-border shadow-subtle">
						<CardContent className="py-10 text-center text-sm text-muted-foreground">
							正在加载系列活动...
						</CardContent>
					</Card>
				) : seriesList.length === 0 ? (
					<Card className="rounded-lg border border-border shadow-subtle">
						<CardContent className="space-y-3 py-10 text-center">
							<p className="text-sm text-muted-foreground">
								还没有系列活动
							</p>
							<Button asChild>
								<Link href="/events/series/manage/create">
									创建第一个系列
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{seriesList.map((series) => (
							<Card
								key={series.id}
								className="h-full rounded-lg border border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
							>
								<CardHeader className="space-y-2 border-b border-border/50 pb-3">
									<div className="flex items-center justify-between gap-2">
										<CardTitle className="line-clamp-1 font-brand text-lg">
											{series.title}
										</CardTitle>
										<Badge
											variant={
												series.isActive
													? "default"
													: "secondary"
											}
										>
											{series.isActive
												? "公开"
												: "已归档"}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground">
										/{series.slug}
									</p>
								</CardHeader>
								<CardContent className="space-y-3 pt-4">
									{series.description ? (
										<p className="line-clamp-2 text-sm text-muted-foreground">
											{series.description}
										</p>
									) : (
										<p className="text-sm text-muted-foreground">
											暂无简介
										</p>
									)}
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<span>
											活动 {series._count?.events ?? 0}
										</span>
										<span>
											订阅{" "}
											{series._count?.subscriptions ?? 0}
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											size="sm"
											variant="outline"
											asChild
										>
											<Link
												href={`/events/series/manage/${series.id}/edit`}
											>
												编辑
											</Link>
										</Button>
										<Button
											size="sm"
											variant="outline"
											asChild
										>
											<Link
												href={`/events/series/${series.slug}`}
												target="_blank"
											>
												查看页面
											</Link>
										</Button>
										{series.isActive ? (
											<Button
												size="sm"
												variant="destructive"
												disabled={
													archivingId === series.id
												}
												onClick={() =>
													handleArchive(series.id)
												}
											>
												{archivingId === series.id
													? "归档中..."
													: "归档"}
											</Button>
										) : null}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</>
	);
}
