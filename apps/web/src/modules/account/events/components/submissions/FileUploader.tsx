"use client";

import { useState, useCallback } from "react";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { FileUp, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { config } from "@community/config";
import { uploadWithSignedUrlFallback } from "@community/lib-client/uploads/client";

interface FileUploaderProps {
	eventId: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

function truncateFileNameMiddle(name: string, max = 32) {
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

export function FileUploader({
	eventId,
	value,
	onChange,
	placeholder,
}: FileUploaderProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [fileName, setFileName] = useState<string>("");
	const bucket = config.storage.bucketNames.public;

	const buildFilePath = useCallback(
		(file: File) => {
			const ext = (() => {
				const dot = file.name.lastIndexOf(".");
				return dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
			})();
			const unique = `${eventId}-${Date.now()}-${Math.random()
				.toString(36)
				.slice(2, 8)}`;
			return `events/${eventId}/custom-fields/${unique}${ext}`;
		},
		[eventId],
	);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file size (max 50MB)
			if (file.size > 50 * 1024 * 1024) {
				toast.error("文件大小不能超过 50MB");
				return;
			}

			setIsUploading(true);
			try {
				const fileUrl = await uploadWithSignedUrlFallback({
					file,
					bucket,
					path: buildFilePath(file),
					contentType: file.type || undefined,
					publicEndpoint: config.storage.endpoints.public,
				});
				onChange(fileUrl);
				setFileName(file.name);
				toast.success("文件上传成功");
			} catch (error) {
				console.error("Upload error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "文件上传失败，请重试",
				);
			} finally {
				setIsUploading(false);
			}
		},
		[bucket, buildFilePath, onChange],
	);

	const handleRemove = useCallback(() => {
		onChange("");
		setFileName("");
	}, [onChange]);

	if (value) {
		return (
			<div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
				<FileText className="h-5 w-5 text-muted-foreground" />
				<span
					className="flex-1 text-sm truncate"
					title={fileName || "已上传文件"}
				>
					{fileName
						? truncateFileNameMiddle(fileName, 28)
						: "已上传文件"}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					onClick={handleRemove}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Input
				type="file"
				onChange={handleFileChange}
				disabled={isUploading}
				className="hidden"
				id={`file-upload-${eventId}`}
			/>
			<label htmlFor={`file-upload-${eventId}`}>
				<Button
					type="button"
					variant="outline"
					disabled={isUploading}
					asChild
				>
					<span className="cursor-pointer">
						{isUploading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								上传中...
							</>
						) : (
							<>
								<FileUp className="mr-2 h-4 w-4" />
								{placeholder || "上传文件"}
							</>
						)}
					</span>
				</Button>
			</label>
		</div>
	);
}
