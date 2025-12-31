/**
 * 投票错误消息工具函数
 * 将投票API错误转换为用户友好的中文消息
 */

import { ApiError } from "../api";

interface VotingErrorContext {
	voteQuota?: number | null;
}

function getErrorCode(error: unknown): string | undefined {
	if (error instanceof ApiError) {
		return error.code;
	}
	if (error && typeof error === "object" && "code" in error) {
		const code = (error as any).code;
		return typeof code === "string" ? code : undefined;
	}
	return undefined;
}

export function toVotingErrorMessage(
	error: unknown,
	context?: VotingErrorContext,
): string {
	if (!(error instanceof Error)) {
		return "操作失败";
	}

	const { voteQuota } = context ?? {};
	const code = getErrorCode(error);

	if (code) {
		if (code === "NO_VOTES_LEFT") {
			if (voteQuota === null || voteQuota === undefined) {
				return "可用票数已用完";
			}
			return `可用票数已用完（每人最多 ${voteQuota} 票）`;
		}
		if (code === "OWN_PROJECT") {
			return "无法给自己的作品投票";
		}
		if (code === "ALREADY_VOTED") {
			return "你已经投过该作品了";
		}
		if (code === "VOTING_CLOSED") {
			return "投票未开放或已结束";
		}
		if (code === "VOTING_ENDED") {
			return "投票已结束";
		}
		if (code === "NOT_VOTED") {
			return "你还没有给该作品投票";
		}
		if (code === "NOT_ELIGIBLE") {
			return "报名活动后才可投票";
		}
		if (code === "PUBLIC_VOTING_DISABLED") {
			return "本场活动未开启观众投票";
		}
	}

	const message = error.message;

	// 票数已用完
	if (message.includes("used all available votes")) {
		if (voteQuota === null || voteQuota === undefined) {
			return "可用票数已用完";
		}
		return `可用票数已用完（每人最多 ${voteQuota} 票）`;
	}

	// 不能给自己的作品投票
	if (
		message.includes("own submission") ||
		message.includes("own team's submission") ||
		message.includes("own team's")
	) {
		return "无法给自己的作品投票";
	}

	// 已经投过票
	if (message.includes("already voted")) {
		return "你已经投过该作品了";
	}

	// 投票未开放或已关闭
	if (message.includes("Voting is closed")) {
		return "投票未开放或已结束";
	}

	// 投票已结束
	if (message.includes("Voting has ended")) {
		return "投票已结束";
	}

	// 还未投票
	if (message.includes("You have not voted")) {
		return "你还没有给该作品投票";
	}

	// 需要先报名
	if (message.includes("您需要先报名")) {
		return "报名活动后才可投票";
	}

	// 默认错误消息
	return "操作失败，请重试";
}
