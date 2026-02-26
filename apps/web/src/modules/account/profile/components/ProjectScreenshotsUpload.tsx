"use client";
import { config } from "@community/config";
import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { requestImageModeration } from "@community/lib-client/content-moderation/client";
import { uploadWithSignedUrlFallback } from "@community/lib-client/uploads/client";
import { X, Image as ImageIcon, Plus, Move } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface ProjectScreenshotsUploadProps {
	value: string[];
	onChange: (urls: string[]) => void;
	acceptedFileTypes?: string[];
	maxSizeInMB?: number;
	maxImages?: number;
	showTitle?: boolean;
}

export function ProjectScreenshotsUpload({
	value = [],
	onChange,
	acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
	maxSizeInMB = 5,
	maxImages = 8,
	showTitle = true,
}: ProjectScreenshotsUploadProps) {
	const normalizeMimeType = useCallback((type?: string | null) => {
		if (!type) {
			return null;
		}

		const lower = type.toLowerCase();
		switch (lower) {
			case "image/x-png":
				return "image/png";
			case "image/jpg":
			case "image/pjpeg":
				return "image/jpeg";
			default:
				return lower;
		}
	}, []);

	const normalizedAcceptedTypes = useMemo(() => {
		const normalized = new Set<string>();

		for (const type of acceptedFileTypes) {
			const lower = type.toLowerCase();
			normalized.add(lower);

			const normalizedType = normalizeMimeType(lower);
			if (normalizedType) {
				normalized.add(normalizedType);
			}
		}

		return normalized;
	}, [acceptedFileTypes, normalizeMimeType]);

	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateFileName = (originalName: string) => {
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const extension = originalName.split(".").pop();
		return `${timestamp}-${randomString}.${extension}`;
	};

	const uploadFile = async (file: File) => {
		// Validate file type
		const normalizedType =
			normalizeMimeType(file.type) ?? file.type.toLowerCase();

		if (!normalizedAcceptedTypes.has(normalizedType)) {
			throw new Error(
				`不支持的文件类型。请上传：${acceptedFileTypes.join(", ")}`,
			);
		}

		// Validate file size
		const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
		if (file.size > maxSizeInBytes) {
			throw new Error(`文件大小不能超过 ${maxSizeInMB}MB`);
		}

		const fileName = generateFileName(file.name);
		const bucketName = config.storage.bucketNames.public;
		const filePath = `public/project-screenshots/${fileName}`;

		return uploadWithSignedUrlFallback({
			file,
			bucket: bucketName,
			path: filePath,
			contentType: normalizedType,
		});
	};

	const uploadFiles = async (files: File[]) => {
		if (value.length + files.length > maxImages) {
			toast.error(`最多只能上传 ${maxImages} 张截图`);
			return;
		}

		setIsUploading(true);
		try {
			const uploadedAndModerated: string[] = [];
			for (const file of files) {
				const uploadedUrl = await uploadFile(file);
				await requestImageModeration(uploadedUrl, "content");
				uploadedAndModerated.push(uploadedUrl);
			}

			const newUrls = [...value, ...uploadedAndModerated];
			onChange(newUrls);
			toast.success(`成功上传 ${files.length} 张截图`);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "上传失败");
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

	// 图片拖拽排序
	const handleImageDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleImageDragOver = (e: React.DragEvent, _index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === dropIndex) {
			return;
		}

		const newUrls = [...value];
		const draggedUrl = newUrls[draggedIndex];
		newUrls.splice(draggedIndex, 1);
		newUrls.splice(dropIndex, 0, draggedUrl);

		onChange(newUrls);
		setDraggedIndex(null);
	};

	const canAddMore = value.length < maxImages;

	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<p className="text-xs text-muted-foreground">
						上传产品截图展示项目效果（最多{maxImages}
						张，可拖拽调整顺序）
					</p>
				</div>
			)}

			{/* Display existing images */}
			{value.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{value.map((url, index) => (
						<Card
							key={index}
							className="relative group cursor-move"
							draggable
							onDragStart={(e) => handleImageDragStart(e, index)}
							onDragOver={(e) => handleImageDragOver(e, index)}
							onDrop={(e) => handleImageDrop(e, index)}
						>
							<CardContent className="p-2">
								{/* 删除按钮 - 始终显示在右上角 */}
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										removeImage(index);
									}}
									className="absolute top-2 right-2 z-10 h-6 w-6 p-0 rounded-full shadow-lg"
									title="删除此图片"
								>
									<X className="h-3 w-3" />
								</Button>
								<div className="relative aspect-video">
									{/* 主图标签 */}
									{index === 0 && (
										<div className="absolute top-1 left-1 z-10">
											<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
												主图
											</span>
										</div>
									)}

									<img
										src={url}
										alt={`Screenshot ${index + 1}`}
										className="w-full h-full object-cover rounded"
									/>

									{/* 拖拽提示 - hover 时显示 */}
									<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
										<div className="p-2 bg-white/20 rounded">
											<Move className="h-4 w-4 text-white" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{/* Add more button */}
					{canAddMore && (
						<Card
							className={`border-2 border-dashed cursor-pointer transition-colors aspect-video ${
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
												添加截图
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
											点击或拖拽截图到此处上传
										</p>
										<p className="text-xs text-muted-foreground">
											支持 JPG、PNG、WebP 格式，最大{" "}
											{maxSizeInMB}MB，最多 {maxImages} 张
										</p>
										<p className="text-xs text-muted-foreground">
											第一张截图将作为项目主图显示
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
					已上传 {value.length} / {maxImages} 张截图
					{value.length > 0 && (
						<span className="ml-2">• 拖拽调整顺序</span>
					)}
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
