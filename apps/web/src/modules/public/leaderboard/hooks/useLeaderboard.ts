"use client";

import { useQuery } from "@tanstack/react-query";

export type LeaderboardPeriod = "all" | "monthly" | "weekly";

interface LeaderboardRanking {
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
}

interface LeaderboardData {
	rankings: LeaderboardRanking[];
	total: number;
	currentUser: {
		rank: number;
		cpValue: number;
		percentile: number;
	} | null;
}

export function useLeaderboard(period: LeaderboardPeriod = "all", limit = 50) {
	return useQuery({
		queryKey: ["leaderboard", period, limit],
		queryFn: async (): Promise<LeaderboardData> => {
			const params = new URLSearchParams({
				period,
				limit: limit.toString(),
			});
			const response = await fetch(`/api/leaderboard?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch leaderboard");
			}
			const result = await response.json();
			return result.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
