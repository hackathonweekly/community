"use client";

export type ClientImageModerationMode = "avatar" | "content";

const DEFAULT_ERROR_MESSAGE = "发布内容含违规信息，请修改后重试";

export async function requestImageModeration(
	imageUrl: string,
	mode: ClientImageModerationMode = "content",
): Promise<void> {
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
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("图片安全审核失败，请稍后重试");
	}
}
