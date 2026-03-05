import type { EventSubmission } from "@/features/event-submissions/types";

/**
 * 媒体类型定义
 */
export type VisualMediaType =
	| { type: "image"; url: string; name?: string }
	| { type: "video"; url: string; name?: string }
	| null;

export type AudioMediaType = {
	fileUrl: string;
	mimeType?: string | null;
} | null;

export interface SubmissionMedia {
	visual: VisualMediaType;
	audio: AudioMediaType;
}

/**
 * 从作品中提取媒体信息（用于投屏模式）
 * 优先级：封面图 > 第一个图片/视频附件
 */
export function getSubmissionMedia(
	submission: EventSubmission,
): SubmissionMedia {
	const attachments = (submission.attachments ?? [])
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const firstAudio =
		attachments.find((attachment) => attachment.fileType === "audio") ??
		null;

	// 优先使用封面图
	if (submission.coverImage) {
		return {
			visual: { type: "image", url: submission.coverImage },
			audio: firstAudio,
		};
	}

	// 查找第一个图片或视频附件
	const firstVisual = attachments.find(
		(attachment) =>
			attachment.fileType === "image" || attachment.fileType === "video",
	);

	if (!firstVisual) {
		return { visual: null, audio: firstAudio };
	}

	if (firstVisual.fileType === "video") {
		return {
			visual: { type: "video", url: firstVisual.fileUrl },
			audio: firstAudio,
		};
	}

	return {
		visual: { type: "image", url: firstVisual.fileUrl },
		audio: firstAudio,
	};
}

/**
 * 从作品中提取媒体信息（用于详情页）
 * 优先级：第一个视频附件 > 第一个图片附件 > 封面图
 */
export function getSubmissionMediaForDetail(
	submission: EventSubmission,
): VisualMediaType {
	if (submission.attachments.length > 0) {
		// 优先查找视频
		const video = submission.attachments.find(
			(a) => a.fileType === "video",
		);
		if (video) {
			return {
				type: "video",
				url: video.fileUrl,
				name: video.fileName,
			};
		}

		// 其次查找图片
		const image = submission.attachments.find(
			(a) => a.fileType === "image",
		);
		if (image) {
			return {
				type: "image",
				url: image.fileUrl,
				name: image.fileName,
			};
		}
	}

	// 最后使用封面图
	if (submission.coverImage) {
		return {
			type: "image",
			url: submission.coverImage,
			name: submission.name,
		};
	}

	return null;
}

/**
 * 从作品中提取音频附件
 */
export function getSubmissionAudio(
	submission: EventSubmission,
): AudioMediaType {
	const attachments = (submission.attachments ?? [])
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	return (
		attachments.find((attachment) => attachment.fileType === "audio") ??
		null
	);
}
