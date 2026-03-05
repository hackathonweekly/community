import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchEventSeriesDetail } from "@community/lib-shared/api/api-fetchers";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { EventSeriesSubscriptionButton } from "@community/ui/shared/EventSeriesSubscriptionButton";
import { Badge } from "@community/ui/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";

export const revalidate = 60;

interface EventSeriesDetailPageProps {
	params: Promise<{
		slug: string;
	}>;
}

function toPlainText(value: string) {
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function formatEventDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "时间待定";
	}
	return date.toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export async function generateMetadata({
	params,
}: EventSeriesDetailPageProps): Promise<Metadata> {
	const { slug } = await params;
	const detail = await fetchEventSeriesDetail(slug, {
		next: { revalidate: 60 },
	});
	if (!detail) {
		return {
			title: "系列活动不存在",
		};
	}

	return {
		title: `${detail.title} · 系列活动`,
		description:
			detail.description || `查看 ${detail.title} 的即将开始与历史活动。`,
	};
}

export default async function EventSeriesDetailPage({
	params,
}: EventSeriesDetailPageProps) {
	const { slug } = await params;
	const detail = await fetchEventSeriesDetail(slug, {
		next: { revalidate: 60 },
	});
	if (!detail) {
		notFound();
	}

	const now = new Date();
	const events = detail.events || [];
	const upcomingEvents = events
		.filter((event) => new Date(event.startTime) >= now)
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() -
				new Date(b.startTime).getTime(),
		);
	const historyEvents = events
		.filter((event) => new Date(event.startTime) < now)
		.sort(
			(a, b) =>
				new Date(b.startTime).getTime() -
				new Date(a.startTime).getTime(),
		);
	const ownerName = detail.organization?.name || detail.organizer?.name;
	const ownerAvatar = detail.organization?.logo || detail.organizer?.image;
	const tags = detail.tags || [];
	const descriptionText =
		detail.description || "订阅这个系列，第一时间获取新的活动场次与动态。";
	const richContentText = detail.richContent
		? toPlainText(detail.richContent)
		: "";

	return (
		<div className="min-h-screen bg-background pb-20 lg:pb-16">
			<div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
				<div className="mb-4">
					<Link
						href="/events/series"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						返回系列列表
					</Link>
				</div>

				<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					{detail.coverImage ? (
						<div className="h-44 w-full overflow-hidden border-b border-border/50 bg-muted sm:h-56">
							<img
								src={detail.coverImage}
								alt={detail.title}
								className="h-full w-full object-cover"
							/>
						</div>
					) : null}
					<div className="space-y-4 p-4 sm:p-6">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">系列活动</Badge>
							<Badge variant="secondary">/{detail.slug}</Badge>
							{!detail.isActive ? (
								<Badge variant="secondary">已归档</Badge>
							) : null}
							{tags.slice(0, 3).map((tag) => (
								<Badge key={tag} variant="outline">
									{tag}
								</Badge>
							))}
						</div>
						<div className="space-y-2">
							<h1 className="font-brand text-3xl font-bold tracking-tight text-foreground">
								{detail.title}
							</h1>
							<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
								{descriptionText}
							</p>
						</div>
						<div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<UserAvatar
									name={ownerName || "系列活动"}
									avatarUrl={ownerAvatar}
									className="h-9 w-9 border border-border"
								/>
								<div>
									<p className="text-sm font-semibold text-foreground">
										{ownerName || "社区官方"}
									</p>
									<p className="text-xs text-muted-foreground">
										{detail.organization
											? "组织发起系列"
											: "个人发起系列"}
									</p>
								</div>
							</div>
							<div className="w-full sm:w-72">
								<EventSeriesSubscriptionButton
									seriesId={detail.id}
									seriesName={detail.title}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div className="space-y-6 lg:col-span-8">
						<Card className="rounded-lg border border-border shadow-subtle">
							<CardHeader className="border-b border-border pb-3">
								<CardTitle className="text-lg">
									系列介绍
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-4">
								{richContentText ? (
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
										{richContentText}
									</p>
								) : (
									<p className="text-sm text-muted-foreground">
										暂无详细介绍
									</p>
								)}
							</CardContent>
						</Card>

						<Card className="rounded-lg border border-border shadow-subtle">
							<CardHeader className="border-b border-border pb-3">
								<CardTitle className="text-lg">
									即将开始
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 pt-4">
								{upcomingEvents.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										暂无即将开始的活动
									</p>
								) : (
									upcomingEvents.map((event) => (
										<Link
											key={event.id}
											href={`/events/${event.shortId || event.id}`}
											className="block rounded-lg border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
										>
											<p className="font-semibold text-foreground">
												{event.title}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{formatEventDate(
													event.startTime,
												)}{" "}
												·
												{event.isOnline
													? "线上"
													: event.address ||
														"线下待定"}
											</p>
											<p className="mt-2 text-xs text-muted-foreground">
												报名人数{" "}
												{event._count?.registrations ??
													0}
											</p>
										</Link>
									))
								)}
							</CardContent>
						</Card>

						<Card className="rounded-lg border border-border shadow-subtle">
							<CardHeader className="border-b border-border pb-3">
								<CardTitle className="text-lg">
									历史活动
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 pt-4">
								{historyEvents.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										暂无历史活动
									</p>
								) : (
									historyEvents.map((event) => (
										<Link
											key={event.id}
											href={`/events/${event.shortId || event.id}`}
											className="block rounded-lg border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
										>
											<p className="font-semibold text-foreground">
												{event.title}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{formatEventDate(
													event.startTime,
												)}{" "}
												·
												{event.isOnline
													? "线上"
													: event.address ||
														"线下待定"}
											</p>
											<p className="mt-2 text-xs text-muted-foreground">
												报名人数{" "}
												{event._count?.registrations ??
													0}
											</p>
										</Link>
									))
								)}
							</CardContent>
						</Card>
					</div>

					<div className="space-y-4 lg:col-span-4">
						<Card className="rounded-lg border border-border shadow-subtle lg:sticky lg:top-16">
							<CardHeader className="border-b border-border pb-3">
								<CardTitle className="text-lg">
									系列数据
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 pt-4 text-sm text-muted-foreground">
								<div className="flex items-center justify-between">
									<span>活动总数</span>
									<span className="font-semibold text-foreground">
										{events.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>即将开始</span>
									<span className="font-semibold text-foreground">
										{upcomingEvents.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>历史活动</span>
									<span className="font-semibold text-foreground">
										{historyEvents.length}
									</span>
								</div>
								{tags.length > 0 ? (
									<div className="pt-1">
										<p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
											标签
										</p>
										<div className="flex flex-wrap gap-2">
											{tags.map((tag) => (
												<Badge
													key={tag}
													variant="outline"
												>
													{tag}
												</Badge>
											))}
										</div>
									</div>
								) : null}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
