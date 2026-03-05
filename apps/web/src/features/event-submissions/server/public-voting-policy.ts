import type { HackathonConfig } from "@/features/hackathon/config";
import { withHackathonConfigDefaults } from "@/features/hackathon/config";

export type PublicVotingScope = "ALL" | "REGISTERED" | "PARTICIPANTS";
export type PublicVotingMode = "FIXED_QUOTA" | "PER_PROJECT_LIKE";

export type PublicVotingPolicy = {
	mode: PublicVotingMode;
	quota: number | null;
};

export type PublicVotingConfig = PublicVotingPolicy & {
	allowPublicVoting: boolean;
	scope: PublicVotingScope;
};

export function getPublicVotingConfigForEvent(params: {
	eventType: string;
	hackathonConfig: HackathonConfig | null;
	defaultQuota: number;
}): PublicVotingConfig {
	const { eventType, hackathonConfig, defaultQuota } = params;

	if (eventType !== "HACKATHON") {
		return {
			allowPublicVoting: true,
			scope: "PARTICIPANTS",
			mode: "FIXED_QUOTA",
			quota: defaultQuota,
		};
	}

	const voting = withHackathonConfigDefaults(hackathonConfig).voting;
	if (voting.publicVotingMode === "PER_PROJECT_LIKE") {
		return {
			allowPublicVoting: voting.allowPublicVoting,
			scope: voting.publicVotingScope,
			mode: "PER_PROJECT_LIKE",
			quota: null,
		};
	}

	return {
		allowPublicVoting: voting.allowPublicVoting,
		scope: voting.publicVotingScope,
		mode: "FIXED_QUOTA",
		quota: voting.publicVoteQuota ?? defaultQuota,
	};
}

export function getPublicVotingPolicyForEvent(params: {
	eventType: string;
	hackathonConfig: HackathonConfig | null;
	defaultQuota: number;
}): PublicVotingPolicy {
	const config = getPublicVotingConfigForEvent(params);
	return { mode: config.mode, quota: config.quota };
}

export function getRemainingVotes(
	policy: PublicVotingPolicy,
	votesUsed: number,
): number | null {
	if (policy.quota === null) {
		return null;
	}
	return Math.max(0, policy.quota - votesUsed);
}

export function canCastVote(policy: PublicVotingPolicy, votesUsed: number) {
	if (policy.quota === null) {
		return true;
	}
	return votesUsed < policy.quota;
}
