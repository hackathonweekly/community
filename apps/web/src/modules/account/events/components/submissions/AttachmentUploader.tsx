"use client";

import {
	File as FileIcon,
	Image as ImageIcon,
	MoveDown,
	MoveUp,
	Music2,
	Trash2,
	Upload,
	Video,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";

import { Progress } from "@community/ui/ui/progress";
import { config } from "@community/config";
import type { SubmissionAttachmentInput } from "@/features/event-submissions/types";
import { buildPublicUrl } from "@community/lib-client/uploads/client";
import { cn } from "@community/lib-shared/utils";

const MAX_ATTACHMENT_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_ATTACHMENTS = 20;

export type AttachmentDraft = SubmissionAttachmentInput & {
	tempId: string;
	uploading?: boolean;
	uploadProgress?: number;
};

export type AttachmentChange =
	| AttachmentDraft[]
	| ((current: AttachmentDraft[]) => AttachmentDraft[]);

interface AttachmentUploaderProps {
	eventId: string;
	value: AttachmentDraft[];
	onChange: (attachments: AttachmentChange) => void;
}

const getFileCategory = (mimeType?: string, fallback?: string) => {
	if (!mimeType && fallback) {
		return fallback;
	}
	if (!mimeType) {
		return "file";
	}
	if (mimeType.startsWith("image")) return "image";
	if (mimeType.startsWith("video")) return "video";
	if (mimeType.startsWith("audio")) return "audio";
	return "file";
};

// 在移动端对超长文件名进行中间省略显示，保留扩展名
function truncateFileNameMiddle(name: string, max = 40) {
	if (!name) return "";
	if (name.length <= max) return name;
	const dot = name.lastIndexOf(".");
	const hasExt = dot > 0 && dot < name.length - 1;
	const ext = hasExt ? name.slice(dot) : "";
	const base = hasExt ? name.slice(0, dot) : name;
	const reserve = Math.max(
		6,
		Math.min(12, Math.floor((max - ext.length - 1) / 2)),
	);
	const head = base.slice(0, reserve);
	const tail = base.slice(-reserve);
	return `${head}…${tail}${ext}`;
}

// 生成后端安全文件名：hash(种子+原名+大小+类型)+时间戳+原始扩展名
// - 仅用于存储路径，界面始终显示原始文件名
async function generateServerFileName(
	file: File,
	seed: string,
): Promise<string> {
	const getExtension = (): string => {
		const dot = file.name.lastIndexOf(".");
		if (dot > -1 && dot < file.name.length - 1) {
			// 保留用户扩展名以匹配后端 content-type 校验
			return file.name.slice(dot).toLowerCase();
		}
		// 基于 mime 的兜底扩展名（尽量覆盖常见类型）
		const mime = (file.type || "").toLowerCase();
		const map: Record<string, string> = {
			"image/jpeg": ".jpg",
			"image/jpg": ".jpg",
			"image/pjpeg": ".jpg",
			"image/png": ".png",
			"image/x-png": ".png",
			"image/webp": ".webp",
			"image/gif": ".gif",
			"application/pdf": ".pdf",
			"text/plain": ".txt",
			"application/zip": ".zip",
			"application/x-zip-compressed": ".zip",
			"application/vnd.ms-powerpoint": ".ppt",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation":
				".pptx",
			"application/msword": ".doc",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				".docx",
			"application/vnd.ms-excel": ".xls",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
				".xlsx",
			"video/mp4": ".mp4",
			"video/quicktime": ".mov",
			"video/x-msvideo": ".avi",
			"audio/mpeg": ".mp3",
			"audio/wav": ".wav",
		};
		return map[mime] || "";
	};

	const ext = getExtension();

	// Web Crypto 计算 SHA-256，失败时回退到 uuid 字符串
	const input = `${seed}:${file.name}:${file.size}:${file.type || ""}`;
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const digest = await crypto.subtle.digest("SHA-256", data);
		const hex = Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		const short = hex.slice(0, 24); // 缩短以减少路径长度
		return `${short}-${Date.now()}${ext}`;
	} catch {
		// 某些环境不支持 subtle，使用 uuid 退化保证唯一性
		return `${seed.replace(/[^a-zA-Z0-9-]/g, "")}-${Date.now()}${ext}`;
	}
}

const getFileIcon = (fileType: string) => {
	switch (fileType) {
		case "image":
			return <ImageIcon className="h-4 w-4" />;
		case "video":
			return <Video className="h-4 w-4" />;
		case "audio":
			return <Music2 className="h-4 w-4" />;
		default:
			return <FileIcon className="h-4 w-4" />;
	}
};

async function uploadFileWithProgress(
	file: File,
	bucket: string,
	path: string,
	onProgress: (progress: number) => void,
) {
	const searchParams = new URLSearchParams({ bucket, path });
	if (file.type) {
		searchParams.set("contentType", file.type);
	}

	const signedUrlResponse = await fetch(
		`/api/uploads/signed-upload-url?${searchParams.toString()}`,
		{
			method: "POST",
			credentials: "include",
		},
	);

	if (!signedUrlResponse.ok) {
		const status = signedUrlResponse.status;
		let errorData: any = null;
		let message = "无法获取上传链接";

		try {
			errorData = await signedUrlResponse.json();
		} catch {
			// JSON 解析失败，使用状态文本
			message = `请求失败 (${status}): ${signedUrlResponse.statusText}`;
		}

		if (errorData) {
			// 处理不同的错误响应格式
			if (typeof errorData === "string") {
				message = errorData;
			} else if (errorData.message) {
				message = String(errorData.message);
			} else if (errorData.error) {
				if (typeof errorData.error === "string") {
					message = errorData.error;
				} else if (errorData.error.message) {
					message = String(errorData.error.message);
				} else {
					message = `请求失败 (${status})`;
				}
			} else {
				message = `请求失败 (${status})`;
			}
		}

		console.error("Upload URL request failed:", {
			status,
			errorData,
			message,
		});
		throw new Error(message);
	}

	const { signedUrl, publicUrl } = (await signedUrlResponse.json()) as {
		signedUrl?: string;
		publicUrl?: string;
	};

	if (!signedUrl) {
		throw new Error("上传链接缺失");
	}

	await new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable) {
				const percent = Math.round((event.loaded / event.total) * 100);
				onProgress(percent);
			}
		});
		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(100);
				resolve();
			} else {
				console.error("Upload failed:", {
					status: xhr.status,
					statusText: xhr.statusText,
					responseText: xhr.responseText,
				});
				reject(
					new Error(
						`上传失败 (${xhr.status}): ${xhr.statusText || "未知错误"}`,
					),
				);
			}
		});
		xhr.addEventListener("error", (event) => {
			console.error("Upload error event:", event);
			reject(new Error("网络错误，请检查网络连接"));
		});
		xhr.addEventListener("timeout", () => {
			reject(new Error("上传超时，请重试"));
		});
		xhr.timeout = 120000; // 2分钟超时
		xhr.open("PUT", signedUrl);
		if (file.type) {
			xhr.setRequestHeader("Content-Type", file.type);
		}
		xhr.send(file);
	});

	// 优先使用后端返回的完整地址，兜底用端点或签名URL推导
	return (
		publicUrl ??
		buildPublicUrl(path, config.storage.endpoints.public, signedUrl)
	);
}

export function AttachmentUploader({
	eventId,
	value,
	onChange,
}: AttachmentUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const bucket = config.storage.bucketNames.public;

	const handleDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (acceptedFiles.length === 0) return;
			if (value.length + acceptedFiles.length > MAX_ATTACHMENTS) {
				toast.error(`最多只能上传 ${MAX_ATTACHMENTS} 个附件`);
				return;
			}

			for (const file of acceptedFiles) {
				if (file.size > MAX_ATTACHMENT_SIZE) {
					toast.error(`${file.name} 超过 200MB 限制`);
					continue;
				}

				const tempId = uuid();
				const draft: AttachmentDraft = {
					tempId,
					fileName: file.name, // 保持原始文件名用于显示
					fileUrl: "",
					fileType: getFileCategory(file.type),
					mimeType: file.type,
					fileSize: file.size,
					order: value.length,
					uploading: true,
					uploadProgress: 5,
				};

				onChange((current) => [...current, draft]);

				try {
					// 上传到后端使用安全文件名（hash+时间戳），避免中文或特殊字符被拒绝
					const serverFileName = await generateServerFileName(
						file,
						tempId,
					);
					const filePath = `events/${eventId}/submissions/${serverFileName}`;
					const fileUrl = await uploadFileWithProgress(
						file,
						bucket,
						filePath,
						(progress) => {
							onChange((current) =>
								current.map((attachment) =>
									attachment.tempId === tempId
										? {
												...attachment,
												uploadProgress: progress,
											}
										: attachment,
								),
							);
						},
					);

					onChange((current) =>
						current.map((attachment) =>
							attachment.tempId === tempId
								? {
										...attachment,
										fileUrl,
										uploading: false,
										uploadProgress: 100,
									}
								: attachment,
						),
					);
				} catch (error) {
					console.error(error);
					onChange((current) =>
						current.filter(
							(attachment) => attachment.tempId !== tempId,
						),
					);
					toast.error(
						error instanceof Error
							? error.message
							: "附件上传失败，请重试",
					);
				}
			}
		},
		[bucket, eventId, onChange, value],
	);

	const { getRootProps, getInputProps } = useDropzone({
		onDropAccepted: handleDrop,
		onDragEnter: () => setIsDragging(true),
		onDragLeave: () => setIsDragging(false),
		onDrop: () => setIsDragging(false),
		maxSize: MAX_ATTACHMENT_SIZE,
	});

	const attachments = useMemo(
		() => [...value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		[value],
	);

	const removeAttachment = (tempId: string) => {
		onChange((current) => current.filter((item) => item.tempId !== tempId));
	};

	const moveAttachment = (tempId: string, direction: "up" | "down") => {
		const index = attachments.findIndex((item) => item.tempId === tempId);
		if (index === -1) return;
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= attachments.length) return;

		const newOrder = [...attachments];
		const [removed] = newOrder.splice(index, 1);
		newOrder.splice(targetIndex, 0, removed);
		onChange(
			newOrder.map((attachment, idx) => ({
				...attachment,
				order: idx,
			})),
		);
	};

	return (
		<div className="space-y-3">
			<div
				{...getRootProps({
					className: cn(
						"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition",
						isDragging
							? "border-primary bg-primary/5"
							: "border-muted-foreground/30 hover:border-primary/60",
					),
				})}
			>
				<input {...getInputProps()} />
				<div className="flex flex-col items-center justify-center space-y-2">
					<div className="rounded-full bg-primary/10 p-2">
						<Upload className="h-4 w-4 text-primary" />
					</div>
					<p className="text-sm font-medium">拖拽或点击上传附件</p>
					<p className="text-xs text-muted-foreground">
						≤ 200MB，最多 {MAX_ATTACHMENTS} 个
					</p>
				</div>
			</div>

			<div className="grid gap-3">
				{attachments.length === 0 && (
					<p className="text-sm text-muted-foreground">
						暂未上传任何附件
					</p>
				)}
				{attachments.map((attachment, index) => (
					<div
						key={attachment.tempId}
						className="rounded-lg border p-3 bg-muted/30"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-start gap-3 min-w-0 flex-1">
								<div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
									{getFileIcon(attachment.fileType)}
								</div>
								<div className="min-w-0 flex-1">
									<p
										className="font-medium text-sm truncate"
										title={attachment.fileName}
									>
										{truncateFileNameMiddle(
											attachment.fileName,
											32,
										)}
									</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>
											{(
												attachment.fileSize /
												(1024 * 1024)
											).toFixed(2)}{" "}
											MB
										</span>
										<Badge variant="secondary">
											{attachment.fileType}
										</Badge>
									</div>
									{attachment.uploading && (
										<div className="mt-2">
											<Progress
												value={
													attachment.uploadProgress ??
													0
												}
											/>
											<p className="text-xs text-muted-foreground mt-1">
												正在上传{" "}
												{attachment.uploadProgress ?? 0}
												%
											</p>
										</div>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									disabled={index === 0}
									onClick={() =>
										moveAttachment(attachment.tempId, "up")
									}
								>
									<MoveUp className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									disabled={index === attachments.length - 1}
									onClick={() =>
										moveAttachment(
											attachment.tempId,
											"down",
										)
									}
								>
									<MoveDown className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										removeAttachment(attachment.tempId)
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
