"use client";

import { useState, useCallback } from "react";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { config } from "@community/config";
import { uploadWithSignedUrlFallback } from "@community/lib-client/uploads/client";

interface ImageUploaderProps {
	eventId: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function ImageUploader({
	eventId,
	value,
	onChange,
	placeholder,
}: ImageUploaderProps) {
	const [isUploading, setIsUploading] = useState(false);
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

			// Validate file type
			if (!file.type.startsWith("image/")) {
				toast.error("请上传图片文件");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("图片大小不能超过 10MB");
				return;
			}

			setIsUploading(true);
			try {
				const fileUrl = await uploadWithSignedUrlFallback({
					file,
					bucket,
					path: buildFilePath(file),
					contentType: file.type,
					publicEndpoint: config.storage.endpoints.public,
				});
				onChange(fileUrl);
				toast.success("图片上传成功");
			} catch (error) {
				console.error("Upload error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "图片上传失败，请重试",
				);
			} finally {
				setIsUploading(false);
			}
		},
		[bucket, buildFilePath, onChange],
	);

	const handleRemove = useCallback(() => {
		onChange("");
	}, [onChange]);

	if (value) {
		return (
			<div className="relative inline-block">
				<img
					src={value}
					alt="Uploaded"
					className="max-w-[200px] max-h-[200px] rounded-lg border object-cover"
				/>
				<Button
					type="button"
					variant="destructive"
					size="icon"
					className="absolute -top-2 -right-2 h-6 w-6"
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
				accept="image/*"
				onChange={handleFileChange}
				disabled={isUploading}
				className="hidden"
				id={`image-upload-${eventId}`}
			/>
			<label htmlFor={`image-upload-${eventId}`}>
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
								<ImagePlus className="mr-2 h-4 w-4" />
								{placeholder || "上传图片"}
							</>
						)}
					</span>
				</Button>
			</label>
		</div>
	);
}
