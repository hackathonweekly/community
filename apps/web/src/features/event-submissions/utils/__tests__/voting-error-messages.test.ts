import { ApiError } from "../../api";
import { toVotingErrorMessage } from "../voting-error-messages";

describe("toVotingErrorMessage", () => {
	describe("error code mapping", () => {
		it("should handle NO_VOTES_LEFT error code with quota", () => {
			const error = new ApiError("You have used all available votes", {
				code: "NO_VOTES_LEFT",
			});
			const message = toVotingErrorMessage(error, { voteQuota: 3 });
			expect(message).toBe("可用票数已用完（每人最多 3 票）");
		});

		it("should handle NO_VOTES_LEFT error code without quota", () => {
			const error = new ApiError("You have used all available votes", {
				code: "NO_VOTES_LEFT",
			});
			const message = toVotingErrorMessage(error, { voteQuota: null });
			expect(message).toBe("可用票数已用完");
		});

		it("should handle OWN_PROJECT error code", () => {
			const error = new ApiError("Cannot vote for own project", {
				code: "OWN_PROJECT",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("无法给自己的作品投票");
		});

		it("should handle ALREADY_VOTED error code", () => {
			const error = new ApiError("Already voted", {
				code: "ALREADY_VOTED",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("你已经投过该作品了");
		});

		it("should handle VOTING_CLOSED error code", () => {
			const error = new ApiError("Voting is closed", {
				code: "VOTING_CLOSED",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("投票未开放或已结束");
		});

		it("should handle VOTING_ENDED error code", () => {
			const error = new ApiError("Voting has ended", {
				code: "VOTING_ENDED",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("投票已结束");
		});

		it("should handle NOT_VOTED error code", () => {
			const error = new ApiError("Not voted yet", {
				code: "NOT_VOTED",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("你还没有给该作品投票");
		});

		it("should handle NOT_ELIGIBLE error code", () => {
			const error = new ApiError("Not eligible to vote", {
				code: "NOT_ELIGIBLE",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("报名活动后才可投票");
		});

		it("should handle PUBLIC_VOTING_DISABLED error code", () => {
			const error = new ApiError("Public voting is disabled", {
				code: "PUBLIC_VOTING_DISABLED",
			});
			const message = toVotingErrorMessage(error);
			expect(message).toBe("本场活动未开启观众投票");
		});
	});

	describe("error message fallback", () => {
		it("should handle error with 'used all available votes' message", () => {
			const error = new Error("You have used all available votes");
			const message = toVotingErrorMessage(error, { voteQuota: 5 });
			expect(message).toBe("可用票数已用完（每人最多 5 票）");
		});

		it("should handle error with 'own submission' message", () => {
			const error = new Error("Cannot vote for your own submission");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("无法给自己的作品投票");
		});

		it("should handle error with 'already voted' message", () => {
			const error = new Error("You have already voted for this");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("你已经投过该作品了");
		});

		it("should handle error with 'Voting is closed' message", () => {
			const error = new Error("Voting is closed for this event");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("投票未开放或已结束");
		});

		it("should handle error with 'Voting has ended' message", () => {
			const error = new Error("Voting has ended");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("投票已结束");
		});

		it("should handle error with 'You have not voted' message", () => {
			const error = new Error("You have not voted for this");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("你还没有给该作品投票");
		});

		it("should handle error with '您需要先报名' message", () => {
			const error = new Error("您需要先报名才能投票");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("报名活动后才可投票");
		});
	});

	describe("error code extraction", () => {
		it("should extract code from ApiError", () => {
			const error = new ApiError("Test error", {
				code: "TEST_CODE",
			});
			const message = toVotingErrorMessage(error);
			// Should return default message since TEST_CODE is not mapped
			expect(message).toBe("操作失败，请重试");
		});

		it("should extract code from plain error object with code property", () => {
			// Create a proper Error object with code property
			const error = new Error("Test error") as Error & { code: string };
			error.code = "NO_VOTES_LEFT";
			const message = toVotingErrorMessage(error, {
				voteQuota: 3,
			});
			expect(message).toBe("可用票数已用完（每人最多 3 票）");
		});

		it("should handle non-string code in error object", () => {
			// Create a proper Error object with non-string code
			const error = new Error("Test error") as Error & { code: number };
			error.code = 123;
			const message = toVotingErrorMessage(error);
			expect(message).toBe("操作失败，请重试");
		});
	});

	describe("edge cases", () => {
		it("should handle non-Error objects", () => {
			const message = toVotingErrorMessage("string error");
			expect(message).toBe("操作失败");
		});

		it("should handle null error", () => {
			const message = toVotingErrorMessage(null);
			expect(message).toBe("操作失败");
		});

		it("should handle undefined error", () => {
			const message = toVotingErrorMessage(undefined);
			expect(message).toBe("操作失败");
		});

		it("should handle unknown error messages", () => {
			const error = new Error("Unknown error message");
			const message = toVotingErrorMessage(error);
			expect(message).toBe("操作失败，请重试");
		});
	});
});
