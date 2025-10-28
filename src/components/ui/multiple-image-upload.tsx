"use client";
import { config } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestImageModeration } from "@/lib/content-moderation/client";
import { uploadWithSignedUrlFallback } from "@/lib/uploads/client";
import { X, Image as ImageIcon, Plus } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface MultipleImageUploadProps {
	label: string;
	value: string[];
	onChange: (urls: string[]) => void;
	acceptedFileTypes?: string[];
	maxSizeInMB?: number;
	maxImages?: number;
	description?: string;
	bucketType?: "public";
	moderationMode?: "avatar" | "content";
}

export function MultipleImageUpload({
	label,
	value = [],
	onChange,
	acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
	maxSizeInMB = 5,
	maxImages = 10,
	description,
	bucketType = "public",
	moderationMode = "content",
}: MultipleImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("uploader.multipleImages");

	const generateFileName = (originalName: string) => {
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const extension = originalName.split(".").pop();
		return `${timestamp}-${randomString}.${extension}`;
	};

	const uploadFile = async (file: File) => {
		// Validate file type
		if (!acceptedFileTypes.includes(file.type)) {
			throw new Error(
				t("unsupportedType", { types: acceptedFileTypes.join(", ") }),
			);
		}

		// Validate file size
		const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
		if (file.size > maxSizeInBytes) {
			throw new Error(t("sizeLimit", { max: maxSizeInMB }));
		}

		const fileName = generateFileName(file.name);
		const bucketName = config.storage.bucketNames[bucketType];
		const filePath = `${bucketType}/event-photos/${fileName}`;

		return uploadWithSignedUrlFallback({
			file,
			bucket: bucketName,
			path: filePath,
			contentType: file.type,
		});
	};

	const uploadFiles = async (files: File[]) => {
		if (value.length + files.length > maxImages) {
			toast.error(t("maxLimit", { count: maxImages }));
			return;
		}

		setIsUploading(true);
		try {
			const moderatedUrls: string[] = [];
			for (const file of files) {
				const uploadedUrl = await uploadFile(file);
				await requestImageModeration(uploadedUrl, moderationMode);
				moderatedUrls.push(uploadedUrl);
			}

			const newUrls = [...value, ...moderatedUrls];
			onChange(newUrls);
			toast.success(t("uploadSuccess", { count: files.length }));
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
			const fileArray = Array.from(files);
			uploadFiles(fileArray);
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

	const removeImage = (indexToRemove: number) => {
		const newUrls = value.filter((_, index) => index !== indexToRemove);
		onChange(newUrls);
	};

	const canAddMore = value.length < maxImages;

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}

			{/* Display existing images */}
			{value.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
					{value.map((url, index) => (
						<Card key={index} className="relative group">
							<CardContent className="p-2">
								<div className="relative aspect-square">
									<img
										src={url}
										alt={`Photo ${index + 1}`}
										className="w-full h-full object-cover rounded"
									/>
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
										<Button
											variant="destructive"
											size="sm"
											onClick={() => removeImage(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{/* Add more button */}
					{canAddMore && (
						<Card
							className={`border-2 border-dashed cursor-pointer transition-colors aspect-square ${
								dragActive
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 hover:border-primary/50"
							} ${isUploading ? "pointer-events-none opacity-50" : ""}`}
							onDragEnter={handleDrag}
							onDragLeave={handleDrag}
							onDragOver={handleDrag}
							onDrop={handleDrop}
							onClick={openFileDialog}
						>
							<CardContent className="p-2 h-full">
								<div className="flex flex-col items-center justify-center text-center h-full">
									{isUploading ? (
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
									) : (
										<>
											<div className="rounded-full bg-muted p-2 mb-2">
												<Plus className="h-4 w-4 text-muted-foreground" />
											</div>
											<p className="text-xs font-medium">
												添加图片
											</p>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Upload area for when no images exist */}
			{value.length === 0 && (
				<Card
					className={`border-2 border-dashed cursor-pointer transition-colors ${
						dragActive
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25 hover:border-primary/50"
					} ${isUploading ? "pointer-events-none opacity-50" : ""}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
					onClick={openFileDialog}
				>
					<CardContent className="p-8">
						<div className="flex flex-col items-center justify-center text-center">
							{isUploading ? (
								<>
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
									<p className="text-sm text-muted-foreground">
										上传中...
									</p>
								</>
							) : (
								<>
									<div className="rounded-full bg-muted p-4 mb-4">
										<ImageIcon className="h-8 w-8 text-muted-foreground" />
									</div>
									<div className="space-y-2">
										<p className="text-sm font-medium">
											点击或拖拽图片到此处上传
										</p>
										<p className="text-xs text-muted-foreground">
											支持 JPG、PNG、WebP 格式，最大{" "}
											{maxSizeInMB}MB，最多 {maxImages} 张
										</p>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Display upload count */}
			{value.length > 0 && (
				<p className="text-xs text-muted-foreground text-center">
					已上传 {value.length} / {maxImages} 张图片
				</p>
			)}

			<Input
				ref={fileInputRef}
				type="file"
				accept={acceptedFileTypes.join(",")}
				multiple
				onChange={(e) => handleFileSelect(e.target.files)}
				className="hidden"
			/>
		</div>
	);
}
