"use client";
import { config } from "@community/config";
import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { requestImageModeration } from "@community/lib-client/content-moderation/client";
import { uploadWithSignedUrlFallback } from "@community/lib-client/uploads/client";
import { CloudUpload, X, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ImageUploadProps {
	label: string;
	value?: string;
	onChange: (url: string) => void;
	onRemove: () => void;
	acceptedFileTypes?: string[];
	maxSizeInMB?: number;
	aspectRatio?: string;
	description?: string;
	bucketType?: "public";
	className?: string;
	moderationMode?: "avatar" | "content";
}

export function ImageUpload({
	label,
	value,
	onChange,
	onRemove,
	acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
	maxSizeInMB = 5,
	aspectRatio,
	description,
	bucketType = "public",
	className,
	moderationMode = "content",
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("uploader.singleImage");

	const generateFileName = (originalName: string) => {
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const extension = originalName.split(".").pop();
		return `${timestamp}-${randomString}.${extension}`;
	};

	const uploadFile = async (file: File) => {
		setIsUploading(true);
		try {
			// Validate file type
			if (!acceptedFileTypes.includes(file.type)) {
				throw new Error(
					t("unsupportedType", {
						types: acceptedFileTypes.join(", "),
					}),
				);
			}

			// Validate file size
			const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
			if (file.size > maxSizeInBytes) {
				throw new Error(t("sizeLimit", { max: maxSizeInMB }));
			}

			const fileName = generateFileName(file.name);
			const bucketName = config.storage.bucketNames[bucketType];
			const filePath = `${bucketType}/${fileName}`;

			const fileUrl = await uploadWithSignedUrlFallback({
				file,
				bucket: bucketName,
				path: filePath,
				contentType: file.type,
			});
			await requestImageModeration(fileUrl, moderationMode);
			onChange(fileUrl);
			toast.success(t("uploadSuccess"));
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error instanceof Error ? error.message : t("uploadFailed"),
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileSelect = (files: FileList | null) => {
		if (files && files.length > 0) {
			uploadFile(files[0]);
		}
	};

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		handleFileSelect(e.dataTransfer.files);
	}, []);

	const openFileDialog = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}

			{value ? (
				<Card className="relative">
					<CardContent className="p-4">
						<div className="relative group">
							<img
								src={value}
								alt={label}
								className={`w-full h-32 object-cover rounded-lg ${
									aspectRatio ? `aspect-${aspectRatio}` : ""
								}`}
							/>
							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
								<div className="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onClick={openFileDialog}
										disabled={isUploading}
									>
										<CloudUpload className="h-4 w-4 mr-1" />
										重新上传
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={onRemove}
									>
										<X className="h-4 w-4 mr-1" />
										删除
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card
					className={`border-2 border-dashed cursor-pointer transition-colors ${
						dragActive
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25 hover:border-primary/50"
					} ${isUploading ? "pointer-events-none opacity-50" : ""} ${className || ""}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
					onClick={openFileDialog}
				>
					<CardContent className={`${className ? "p-4" : "p-6"}`}>
						<div className="flex flex-col items-center justify-center text-center">
							{isUploading ? (
								<>
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
									<p className="text-sm text-muted-foreground">
										{t("uploading")}
									</p>
								</>
							) : (
								<>
									<div className="rounded-full bg-muted p-3 mb-3">
										<ImageIcon className="h-6 w-6 text-muted-foreground" />
									</div>
									<div className="space-y-2">
										<p className="text-sm font-medium">
											点击或拖拽文件到此处上传
										</p>
										<p className="text-xs text-muted-foreground">
											支持 JPG、PNG、WebP 格式，最大{" "}
											{maxSizeInMB}MB
										</p>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Input
				ref={fileInputRef}
				type="file"
				accept={acceptedFileTypes.join(",")}
				onChange={(e) => handleFileSelect(e.target.files)}
				className="hidden"
			/>
		</div>
	);
}
