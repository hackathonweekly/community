import Link from "next/link";
import { fetchEventSeriesList } from "@community/lib-shared/api/api-fetchers";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Badge } from "@community/ui/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "系列活动",
	description: "浏览社区系列活动，查看即将开始与历史活动。",
};

export default async function EventSeriesListPage() {
	const result = await fetchEventSeriesList(
		{ limit: 100 },
		{ next: { revalidate: 60 } },
	);
	const seriesList = result.series || [];

	return (
		<div className="min-h-screen bg-background pb-20 lg:pb-16">
			<div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
				<div className="mb-6 flex items-end justify-between gap-3">
					<div>
						<h1 className="font-brand text-2xl font-bold tracking-tight md:text-3xl">
							系列活动
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							订阅你关心的长期活动主题，及时获取最新场次更新。
						</p>
					</div>
					<Link
						href="/events"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						返回活动列表
					</Link>
				</div>

				<div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
					<p className="text-sm text-muted-foreground">
						探索社区长期主题系列，查看后续场次安排并持续关注。
					</p>
					<div className="mt-3 flex items-center gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								系列数
							</span>
							<span className="ml-2 font-semibold text-foreground">
								{seriesList.length}
							</span>
						</div>
					</div>
				</div>

				{seriesList.length === 0 ? (
					<Card className="rounded-lg border border-border shadow-subtle">
						<CardContent className="py-12 text-center text-sm text-muted-foreground">
							暂时还没有公开的系列活动
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{seriesList.map((series) => {
							const ownerName =
								series.organization?.name ||
								series.organizer?.name ||
								"社区官方";
							const ownerAvatar =
								series.organization?.logo ||
								series.organizer?.image;
							return (
								<Link
									key={series.id}
									href={`/events/series/${series.slug}`}
								>
									<Card className="h-full overflow-hidden rounded-lg border border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
										{series.coverImage ? (
											<div className="h-36 w-full overflow-hidden border-b border-border/60 bg-muted">
												<img
													src={series.coverImage}
													alt={series.title}
													className="h-full w-full object-cover"
												/>
											</div>
										) : null}
										<CardHeader className="space-y-2 border-b border-border/50 pb-3">
											<div className="flex items-center justify-between gap-2">
												<CardTitle className="line-clamp-1 font-brand text-lg">
													{series.title}
												</CardTitle>
												<Badge variant="outline">
													系列
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground">
												/{series.slug}
											</p>
										</CardHeader>
										<CardContent className="space-y-3 pt-4">
											<p className="line-clamp-3 text-sm text-muted-foreground">
												{series.description ||
													"点击查看该系列下的即将开始与历史活动。"}
											</p>
											<div className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/20 p-2.5">
												<UserAvatar
													name={ownerName}
													avatarUrl={ownerAvatar}
													className="h-8 w-8 border border-border"
												/>
												<div className="min-w-0">
													<p className="truncate text-sm font-medium text-foreground">
														{ownerName}
													</p>
													<p className="text-xs text-muted-foreground">
														{series.organizationId
															? "组织系列"
															: "个人系列"}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-4 text-xs text-muted-foreground">
												<span>
													活动{" "}
													{series._count?.events ?? 0}
												</span>
												<span>
													订阅{" "}
													{series._count
														?.subscriptions ?? 0}
												</span>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
