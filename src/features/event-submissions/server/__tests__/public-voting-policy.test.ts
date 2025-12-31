import {
	canCastVote,
	getPublicVotingConfigForEvent,
	getPublicVotingPolicyForEvent,
	getRemainingVotes,
} from "../public-voting-policy";

describe("public voting policy", () => {
	test("defaults to FIXED_QUOTA=3 for hackathon when config is missing", () => {
		const policy = getPublicVotingPolicyForEvent({
			eventType: "HACKATHON",
			hackathonConfig: null,
			defaultQuota: 3,
		});

		expect(policy).toEqual({ mode: "FIXED_QUOTA", quota: 3 });
		expect(getRemainingVotes(policy, 0)).toBe(3);
		expect(canCastVote(policy, 2)).toBe(true);
		expect(canCastVote(policy, 3)).toBe(false);
	});

	test("PER_PROJECT_LIKE yields unlimited remainingVotes", () => {
		const policy = getPublicVotingPolicyForEvent({
			eventType: "HACKATHON",
			hackathonConfig: {
				voting: {
					publicVotingMode: "PER_PROJECT_LIKE",
				},
			},
			defaultQuota: 3,
		});

		expect(policy).toEqual({ mode: "PER_PROJECT_LIKE", quota: null });
		expect(getRemainingVotes(policy, 0)).toBeNull();
		expect(getRemainingVotes(policy, 999)).toBeNull();
		expect(canCastVote(policy, 999)).toBe(true);
	});

	test("FIXED_QUOTA uses configured publicVoteQuota", () => {
		const policy = getPublicVotingPolicyForEvent({
			eventType: "HACKATHON",
			hackathonConfig: {
				voting: {
					publicVotingMode: "FIXED_QUOTA",
					publicVoteQuota: 7,
				},
			},
			defaultQuota: 3,
		});

		expect(policy).toEqual({ mode: "FIXED_QUOTA", quota: 7 });
		expect(getRemainingVotes(policy, 3)).toBe(4);
		expect(canCastVote(policy, 6)).toBe(true);
		expect(canCastVote(policy, 7)).toBe(false);
	});

	test("non-hackathon events ignore hackathon config and keep default quota", () => {
		const policy = getPublicVotingPolicyForEvent({
			eventType: "MEETUP",
			hackathonConfig: {
				voting: {
					publicVotingMode: "PER_PROJECT_LIKE",
					publicVoteQuota: 999,
				},
			},
			defaultQuota: 3,
		});

		expect(policy).toEqual({ mode: "FIXED_QUOTA", quota: 3 });
	});

	test("getPublicVotingConfigForEvent returns scope + allowPublicVoting for hackathon config", () => {
		const config = getPublicVotingConfigForEvent({
			eventType: "HACKATHON",
			hackathonConfig: {
				voting: {
					allowPublicVoting: false,
					publicVotingScope: "ALL",
					publicVotingMode: "FIXED_QUOTA",
					publicVoteQuota: 9,
				},
			},
			defaultQuota: 3,
		});

		expect(config).toEqual({
			allowPublicVoting: false,
			scope: "ALL",
			mode: "FIXED_QUOTA",
			quota: 9,
		});
	});

	test("getPublicVotingConfigForEvent defaults non-hackathon to PARTICIPANTS+FIXED_QUOTA", () => {
		const config = getPublicVotingConfigForEvent({
			eventType: "MEETUP",
			hackathonConfig: null,
			defaultQuota: 7,
		});

		expect(config).toEqual({
			allowPublicVoting: true,
			scope: "PARTICIPANTS",
			mode: "FIXED_QUOTA",
			quota: 7,
		});
	});
});
