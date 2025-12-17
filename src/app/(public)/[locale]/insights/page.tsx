import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";
import type {
	AdminInsights,
	InsightsBucket,
	PublicInsights,
	TopUserStat,
} from "@/lib/database/prisma/queries/insights";
import {
	getAdminInsights,
	getPublicInsights,
} from "@/lib/database/prisma/queries/insights";
import { getSession } from "@dashboard/auth/lib/server";
import Link from "next/link";

export async function generateMetadata() {
	return {
		title: "社区数据看板",
		description:
			"公开统计 + 管理员深度分析：活动数量、参与规模、反馈与用户画像等。",
	};
}

function formatNumber(locale: string, value: number) {
	return new Intl.NumberFormat(locale).format(value);
}

function formatPercent(locale: string, value: number) {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
		value,
	);
}

function BucketList({
	locale,
	title,
	description,
	buckets,
}: {
	locale: string;
	title: string;
	description: string;
	buckets: InsightsBucket[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{buckets.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						暂无数据
					</div>
				) : (
					buckets.map((bucket) => (
						<div key={bucket.key} className="space-y-1">
							<div className="flex items-center justify-between gap-4">
								<div className="truncate text-sm font-medium">
									{bucket.key}
								</div>
								<div className="shrink-0 text-xs text-muted-foreground tabular-nums">
									{formatNumber(locale, bucket.count)}（
									{formatPercent(locale, bucket.percent)}%）
								</div>
							</div>
							<Progress value={bucket.percent} />
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

function MetricCard({
	title,
	value,
	definition,
}: {
	title: string;
	value: string;
	definition: string;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">{title}</CardTitle>
				<CardDescription className="text-xs leading-relaxed">
					{definition}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-semibold tabular-nums">
					{value}
				</div>
			</CardContent>
		</Card>
	);
}

function TopUsersCard({
	locale,
	title,
	description,
	unitLabel,
	users,
	profileLocale,
}: {
	locale: string;
	title: string;
	description: string;
	unitLabel: string;
	users: TopUserStat[];
	profileLocale: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				{users.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						暂无数据
					</div>
				) : (
					users.map((user, index) => {
						const profileHref = user.username
							? `/${profileLocale}/u/${user.username}`
							: null;

						return (
							<div
								key={user.userId}
								className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2 min-w-0">
										<span className="text-xs tabular-nums text-muted-foreground w-6">
											{index + 1}
										</span>
										{profileHref ? (
											<Link
												href={profileHref}
												className="truncate font-medium hover:underline"
											>
												{user.name}
											</Link>
										) : (
											<span className="truncate font-medium">
												{user.name}
											</span>
										)}
										{user.username ? (
											<span className="truncate text-xs text-muted-foreground">
												@{user.username}
											</span>
										) : null}
									</div>
								</div>
								<Badge
									variant="secondary"
									className="tabular-nums"
								>
									{formatNumber(locale, user.count)}{" "}
									{unitLabel}
								</Badge>
							</div>
						);
					})
				)}
			</CardContent>
		</Card>
	);
}

function KeywordCloudCard({
	title,
	description,
	keywords,
	stats,
}: {
	title: string;
	description: string;
	keywords: Array<{ keyword: string; count: number }>;
	stats: { usersAnalyzed: number; tokensAnalyzed: number };
}) {
	const maxCount = keywords[0]?.count ?? 1;
	const toSizeClass = (count: number) => {
		const ratio = count / maxCount;
		if (ratio >= 0.85) return "text-2xl";
		if (ratio >= 0.65) return "text-xl";
		if (ratio >= 0.45) return "text-lg";
		if (ratio >= 0.25) return "text-base";
		return "text-sm";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>
					{description}（样本：{stats.usersAnalyzed} 人；分词：
					{stats.tokensAnalyzed}）
				</CardDescription>
			</CardHeader>
			<CardContent>
				{keywords.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						暂无数据
					</div>
				) : (
					<div className="flex flex-wrap gap-x-3 gap-y-2">
						{keywords.map((item) => (
							<span
								key={item.keyword}
								title={`${item.keyword}: ${item.count}`}
								className={`${toSizeClass(
									item.count,
								)} text-foreground/90 hover:text-foreground transition-colors`}
							>
								{item.keyword}
							</span>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

type InsightsPageSearchParams = Record<string, string | string[] | undefined>;

export default async function InsightsPage(props: {
	params: Promise<{ locale: string }>;
	searchParams?: Promise<InsightsPageSearchParams>;
}) {
	const { locale } = await props.params;
	const resolvedSearchParams = (await props.searchParams) ?? {};

	const heavyParam = Array.isArray(resolvedSearchParams.heavy)
		? resolvedSearchParams.heavy[0]
		: resolvedSearchParams.heavy;
	const refreshParam = Array.isArray(resolvedSearchParams.refresh)
		? resolvedSearchParams.refresh[0]
		: resolvedSearchParams.refresh;

	const includeHeavy = heavyParam === "1";
	const refresh = refreshParam === "1";

	const session = await getSession();
	const isAdmin =
		!!session?.user &&
		hasPermission(session.user, AdminPermission.VIEW_DASHBOARD);

	const insights: PublicInsights | AdminInsights = isAdmin
		? await getAdminInsights({ includeHeavy, refresh })
		: await getPublicInsights({ refresh });

	const numberLocale = locale === "en" ? "en-US" : "zh-CN";
	const generatedAt = new Date(insights.generatedAt).toLocaleString(
		numberLocale,
	);

	const feedbackSummary =
		insights.feedback.ratingsCount > 0 &&
		insights.feedback.averageRating !== null
			? `${insights.feedback.averageRating.toFixed(2)} / 5`
			: "—";

	const recommendSummary =
		insights.feedback.recommendRate === null
			? "—"
			: `${insights.feedback.recommendRate.toFixed(1)}%`;

	return (
		<div className="container pt-28 pb-12 space-y-10">
			<div className="space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-3xl font-bold">社区数据看板</h1>
					<Badge variant="secondary">公开</Badge>
					{isAdmin ? <Badge>管理员增强</Badge> : null}
				</div>
				<p className="text-muted-foreground">
					同一个页面下，所有人可看公开数据；管理员可看到额外的深度分析与用户画像。
				</p>
				<p className="text-xs text-muted-foreground">
					数据生成时间：{generatedAt}
				</p>
			</div>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold">公开概览</h2>
					<p className="text-sm text-muted-foreground">
						这些指标对所有访客可见，并在卡片内给出“口径定义”。
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="正在进行的活动"
						value={formatNumber(
							numberLocale,
							insights.events.ongoing,
						)}
						definition="口径：状态为 ONGOING，或已发布且当前时间在开始/结束之间。"
					/>
					<MetricCard
						title="未来 14 天活动"
						value={formatNumber(
							numberLocale,
							insights.events.upcoming14d,
						)}
						definition="口径：开始时间在未来 14 天内，状态为已发布/报名关闭。"
					/>
					<MetricCard
						title="已结束活动"
						value={formatNumber(
							numberLocale,
							insights.events.completed,
						)}
						definition="口径：状态为 COMPLETED，或结束时间早于当前时间（非草稿）。"
					/>
					<MetricCard
						title="累计活动数"
						value={formatNumber(
							numberLocale,
							insights.events.totalNonDraft,
						)}
						definition="口径：活动表中非草稿（非 DRAFT）的总数。"
					/>
					<MetricCard
						title="累计参与人次"
						value={formatNumber(
							numberLocale,
							insights.participation.approvedRegistrations,
						)}
						definition="口径：所有活动“已通过（APPROVED）”的报名记录总数（同一用户多场活动会重复计数）。"
					/>
					<MetricCard
						title="累计独立参与者"
						value={formatNumber(
							numberLocale,
							insights.participation.uniqueParticipants,
						)}
						definition="口径：已通过报名记录按 userId 去重后的人数。"
					/>
					<MetricCard
						title="累计签到次数"
						value={formatNumber(
							numberLocale,
							insights.participation.checkIns,
						)}
						definition="口径：EventCheckIn 总数（一次签到 = 一条记录）。"
					/>
					<MetricCard
						title="平均评分 / 推荐率"
						value={`${feedbackSummary} · ${recommendSummary}`}
						definition="口径：评分取 EventFeedback.rating 平均值（1-5）；推荐率 = wouldRecommend=true / 全部反馈。"
					/>
				</div>
			</section>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold">公开洞察</h2>
					<p className="text-sm text-muted-foreground">
						用于理解近期社区内容的关注点（不涉及任何个人信息）。
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>近 90 天热门标签</CardTitle>
						<CardDescription>
							口径：统计近 90 天内创建的非草稿活动的 tags
							字段出现次数。
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{insights.topTags90d.length === 0 ? (
							<div className="text-sm text-muted-foreground">
								暂无标签数据
							</div>
						) : (
							insights.topTags90d.map((item) => (
								<Badge key={item.tag} variant="secondary">
									{item.tag} ·{" "}
									{formatNumber(numberLocale, item.count)}
								</Badge>
							))
						)}
					</CardContent>
				</Card>
			</section>

			{isAdmin ? (
				<>
					<Separator />
					<section className="space-y-4">
						<div className="space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="text-xl font-semibold">
									管理员专区
								</h2>
								<Badge>仅管理员可见</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								包含增长/活跃/画像等深度分析，可能涉及更敏感的聚合数据。
							</p>
						</div>

						<Alert>
							<AlertTitle>访问控制</AlertTitle>
							<AlertDescription>
								该区域仅对拥有 `VIEW_DASHBOARD`
								权限的管理员渲染；普通用户不会触发对应的数据库查询。部分“重计算”指标默认不加载，并带缓存（可手动刷新）。
							</AlertDescription>
						</Alert>

						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<MetricCard
								title="总用户数"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users.total,
								)}
								definition="口径：User 表总数。"
							/>
							<MetricCard
								title="今日新增用户"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users.newToday,
								)}
								definition="口径：createdAt >= 今日 00:00 的用户数。"
							/>
							<MetricCard
								title="本周新增用户"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users
										.newThisWeek,
								)}
								definition="口径：createdAt >= 本周周日 00:00 的用户数。"
							/>
							<MetricCard
								title="近 7 天活跃用户"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users.active7d,
								)}
								definition="口径：Session.updatedAt >= 近 7 天，按 userId 去重。"
							/>
							<MetricCard
								title="近 30 天活跃用户"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users.active30d,
								)}
								definition="口径：Session.updatedAt >= 近 30 天，按 userId 去重。"
							/>
							<MetricCard
								title="完成引导（Onboarding）"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users
										.onboardingComplete,
								)}
								definition="口径：onboardingComplete=true 的用户数。"
							/>
							<MetricCard
								title="公开个人主页"
								value={formatNumber(
									numberLocale,
									(insights as AdminInsights).users
										.profilePublic,
								)}
								definition="口径：profilePublic=true 的用户数。"
							/>
							<MetricCard
								title="参与渗透率（粗略）"
								value={`${formatPercent(
									numberLocale,
									(insights.participation.uniqueParticipants /
										Math.max(
											(insights as AdminInsights).users
												.total,
											1,
										)) *
										100,
								)}%`}
								definition="口径：累计独立参与者 / 总用户数（仅用于宏观判断）。"
							/>
						</div>

						<div className="grid gap-4 lg:grid-cols-2">
							<TopUsersCard
								locale={numberLocale}
								profileLocale={locale}
								title="最常参加活动的用户（按报名）"
								description="口径：EventRegistration.status=APPROVED 的记录数；由于同一活动只允许报名一次，因此等价于“参加过多少场活动”。"
								unitLabel="场"
								users={
									(insights as AdminInsights).fun
										.topAttendeesByRegistrationsAllTime
								}
							/>
							<TopUsersCard
								locale={numberLocale}
								profileLocale={locale}
								title="近 90 天最常参加（按报名）"
								description="口径：近 90 天 registeredAt >= now-90d 的 APPROVED 报名记录数。"
								unitLabel="场"
								users={
									(insights as AdminInsights).fun
										.topAttendeesByRegistrations90d
								}
							/>
							<TopUsersCard
								locale={numberLocale}
								profileLocale={locale}
								title="最常签到的用户（按签到）"
								description="口径：EventCheckIn 记录数（一次签到=一条记录）。"
								unitLabel="次"
								users={
									(insights as AdminInsights).fun
										.topAttendeesByCheckInsAllTime
								}
							/>
							<TopUsersCard
								locale={numberLocale}
								profileLocale={locale}
								title="近 90 天最常签到（按签到）"
								description="口径：近 90 天 checkedInAt >= now-90d 的签到记录数。"
								unitLabel="次"
								users={
									(insights as AdminInsights).fun
										.topAttendeesByCheckIns90d
								}
							/>
						</div>

						<div className="grid gap-4 lg:grid-cols-2">
							<BucketList
								locale={numberLocale}
								title="性别分布"
								description="口径：User.gender（未填写单列）。"
								buckets={
									(insights as AdminInsights).segments.gender
								}
							/>
							<BucketList
								locale={numberLocale}
								title="地区 Top 10"
								description="口径：User.region，按人数排序取前 10。"
								buckets={
									(insights as AdminInsights).segments
										.regionTop10
								}
							/>
							<BucketList
								locale={numberLocale}
								title="成员等级分布"
								description="口径：User.membershipLevel（未设置单列）。"
								buckets={
									(insights as AdminInsights).segments
										.membershipLevel
								}
							/>
							<BucketList
								locale={numberLocale}
								title="创造者等级分布"
								description="口径：User.creatorLevel（未设置单列）。"
								buckets={
									(insights as AdminInsights).segments
										.creatorLevel
								}
							/>
							<BucketList
								locale={numberLocale}
								title="导师等级分布"
								description="口径：User.mentorLevel（未设置单列）。"
								buckets={
									(insights as AdminInsights).segments
										.mentorLevel
								}
							/>
							<BucketList
								locale={numberLocale}
								title="贡献者等级分布"
								description="口径：User.contributorLevel（未设置单列）。"
								buckets={
									(insights as AdminInsights).segments
										.contributorLevel
								}
							/>
						</div>

						<BucketList
							locale={numberLocale}
							title="技能 Top 12"
							description="口径：汇总 User.skills 字符串数组出现次数，按人数排序取前 12。"
							buckets={
								(insights as AdminInsights).segments.topSkills
							}
						/>

						<div className="space-y-3">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="space-y-0.5">
									<h3 className="text-lg font-semibold">
										用户介绍关键词云
									</h3>
									<p className="text-sm text-muted-foreground">
										从公开个人主页的自我介绍字段里提取高频词（用于理解用户画像与兴趣点）。
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Button asChild variant="outline" size="sm">
										<Link
											href={`/${locale}/insights?heavy=1`}
											prefetch={false}
										>
											加载关键词云
										</Link>
									</Button>
									<Button asChild variant="outline" size="sm">
										<Link
											href={`/${locale}/insights?heavy=1&refresh=1`}
											prefetch={false}
										>
											跳过缓存刷新
										</Link>
									</Button>
									<Button asChild variant="ghost" size="sm">
										<Link
											href={`/${locale}/insights`}
											prefetch={false}
										>
											清除参数
										</Link>
									</Button>
								</div>
							</div>

							{(insights as AdminInsights).keywords ? (
								<KeywordCloudCard
									title="关键词云（公开个人介绍）"
									description="口径：对 bio/currentWorkOn/whatICanOffer/whatIAmLookingFor/lifeStatus 做分词与去停用词后计数，取 Top 60。"
									keywords={
										(insights as AdminInsights).keywords
											?.topKeywords ?? []
									}
									stats={{
										usersAnalyzed:
											(insights as AdminInsights).keywords
												?.usersAnalyzed ?? 0,
										tokensAnalyzed:
											(insights as AdminInsights).keywords
												?.tokensAnalyzed ?? 0,
									}}
								/>
							) : (
								<Card>
									<CardHeader>
										<CardTitle>
											关键词云（未加载）
										</CardTitle>
										<CardDescription>
											该指标会扫描公开个人主页文本并做分词统计，可能较耗时；默认不计算。点击“加载关键词云”后会走缓存（6
											小时自动刷新一次），也可选择“跳过缓存刷新”。
										</CardDescription>
									</CardHeader>
									<CardContent className="text-sm text-muted-foreground">
										提示：如果你只想快速浏览其余指标，保持未加载即可。
									</CardContent>
								</Card>
							)}
						</div>
					</section>
				</>
			) : (
				<Alert>
					<AlertTitle>想看更深度的数据？</AlertTitle>
					<AlertDescription>
						管理员登录后将看到“用户画像、活跃、增长”等额外区块（该部分对普通用户不可见）。
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
