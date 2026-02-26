"use client";

export type ClientImageModerationMode = "avatar" | "content";

const DEFAULT_ERROR_MESSAGE = "发布内容含违规信息，请修改后重试";

const isImageModerationDisabled = () => {
	const normalize = (val: string | number | boolean | undefined | null) => {
		if (val === undefined || val === null) return false;
		const normalized = val.toString().toLowerCase();
		return (
			normalized === "1" ||
			normalized === "true" ||
			normalized === "yes" ||
			normalized === "on"
		);
	};

	// 显式开启优先（默认关闭）
	const enableFlag =
		process.env.NEXT_PUBLIC_ENABLE_IMAGE_MODERATION ||
		process.env.ENABLE_IMAGE_MODERATION;
	if (normalize(enableFlag)) return false;

	// 显式关闭
	const disableFlag =
		process.env.NEXT_PUBLIC_DISABLE_IMAGE_MODERATION ||
		process.env.DISABLE_IMAGE_MODERATION;
	if (normalize(disableFlag)) return true;

	// 默认关闭审核
	return true;
};

export async function requestImageModeration(
	imageUrl: string,
	mode: ClientImageModerationMode = "content",
): Promise<void> {
	// Skip moderation entirely when the flag is set (temporary kill switch)
	if (isImageModerationDisabled()) {
		console.info(
			"[moderation] 图片审核已禁用，直接通过 (DISABLE_IMAGE_MODERATION)",
		);
		return;
	}

	try {
		const response = await fetch("/api/uploads/moderate-image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ imageUrl, mode }),
		});

		let payload: any = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		const success = payload?.success ?? response.ok;
		if (!success) {
			const message = payload?.message ?? DEFAULT_ERROR_MESSAGE;
			throw new Error(message);
		}

		// 如果有警告信息，记录到控制台
		if (payload?.result?.warning) {
			console.warn("图片审核警告:", payload.result.warning);
		}
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("图片安全审核失败，请稍后重试");
	}
}
