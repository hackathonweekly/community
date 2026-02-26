"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { TrophyIcon, SparklesIcon } from "@heroicons/react/24/outline";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from "@community/ui/ui/tabs";
import { Skeleton } from "@community/ui/ui/skeleton";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { useLeaderboard, type LeaderboardPeriod } from "./hooks/useLeaderboard";
import { UserLevelBadges } from "@shared/level/components/LevelBadge";

export function LeaderboardPage() {
	const t = useTranslations();
	const [period, setPeriod] = useState<LeaderboardPeriod>("all");
	const { data, isLoading } = useLeaderboard(period);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8 mb-6">
			{/* Header */}
			<div className="mb-8 text-center">
				<div className="mb-2 flex items-center justify-center gap-2">
					<TrophyIcon className="h-8 w-8 text-yellow-500" />
					<h1 className="font-brand text-3xl font-bold">
						社区排行榜
					</h1>
				</div>
				<p className="text-muted-foreground">
					展示社区贡献者排名，感谢每一位伙伴的付出
				</p>
			</div>

			{/* Period Tabs */}
			<Tabs
				value={period}
				onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
				className="mb-6"
			>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="all">总榜</TabsTrigger>
					<TabsTrigger value="monthly">月榜</TabsTrigger>
					<TabsTrigger value="weekly">周榜</TabsTrigger>
				</TabsList>

				<TabsContent value={period} className="mt-6 space-y-4">
					{/* Current User Rank Card */}
					{data?.currentUser && (
						<Card className="border-primary/20 bg-primary/5">
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
										#{data.currentUser.rank}
									</div>
									<div>
										<div className="font-medium">
											你的排名
										</div>
										<div className="text-sm text-muted-foreground">
											超越了 {data.currentUser.percentile}
											% 的成员
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-bold text-primary">
										{period === "all"
											? data.currentUser.cpValue
											: data.currentUser.cpValue}{" "}
										积分
									</div>
									<div className="text-xs text-muted-foreground">
										{period === "all"
											? "总贡献值"
											: "本期贡献值"}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Leaderboard Table */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<SparklesIcon className="h-5 w-5" />
								{period === "all" && "总排行榜"}
								{period === "monthly" && "本月排行榜"}
								{period === "weekly" && "本周排行榜"}
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{isLoading ? (
								<div className="space-y-2 p-4">
									{[...Array(10)].map((_, i) => (
										<Skeleton
											key={i}
											className="h-16 w-full"
										/>
									))}
								</div>
							) : data?.rankings && data.rankings.length > 0 ? (
								<div className="divide-y">
									{data.rankings.map((ranking) => (
										<LeaderboardRow
											key={ranking.user.id}
											ranking={ranking}
											showPeriodCp={period !== "all"}
										/>
									))}
								</div>
							) : (
								<div className="p-8 text-center text-muted-foreground">
									暂无排名数据
								</div>
							)}
						</CardContent>
					</Card>

					{/* Total Count */}
					{data && data.total > 0 && (
						<div className="text-center text-sm text-muted-foreground">
							共 {data.total} 位贡献者
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

interface LeaderboardRowProps {
	ranking: {
		rank: number;
		user: {
			id: string;
			name: string;
			username: string | null;
			image: string | null;
			membershipLevel: string | null;
		};
		cpValue: number;
		periodCp?: number;
	};
	showPeriodCp?: boolean;
}

function LeaderboardRow({ ranking, showPeriodCp }: LeaderboardRowProps) {
	const { rank, user, cpValue, periodCp } = ranking;
	const profileUrl = user.username
		? `/u/${user.username}`
		: `/users/${user.id}`;

	// Top 3 special styling
	const getRankBadge = (rank: number) => {
		if (rank === 1) {
			return (
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-lg font-bold text-white shadow-lg">
					1
				</div>
			);
		}
		if (rank === 2) {
			return (
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-lg font-bold text-white shadow-lg">
					2
				</div>
			);
		}
		if (rank === 3) {
			return (
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white shadow-lg">
					3
				</div>
			);
		}
		return (
			<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
				{rank}
			</div>
		);
	};

	return (
		<Link
			href={profileUrl}
			className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
		>
			<div className="flex items-center gap-4">
				{getRankBadge(rank)}
				<UserAvatar
					name={user.name}
					avatarUrl={user.image}
					className="h-12 w-12"
				/>
				<div>
					<div className="font-medium">{user.name}</div>
					<div className="flex items-center gap-2">
						<UserLevelBadges
							user={{
								membershipLevel: user.membershipLevel as any,
							}}
							size="sm"
							showTooltip={false}
						/>
					</div>
				</div>
			</div>
			<div className="text-right">
				<div className="font-bold text-primary">
					{showPeriodCp ? periodCp : cpValue}积分
				</div>
				{showPeriodCp && (
					<div className="text-xs text-muted-foreground">
						总计 {cpValue}积分
					</div>
				)}
			</div>
		</Link>
	);
}
