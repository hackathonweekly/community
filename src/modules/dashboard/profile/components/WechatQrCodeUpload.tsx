"use client";

import { config } from "@/config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { requestImageModeration } from "@/lib/content-moderation/client";
import { useSignedUploadUrlMutation } from "@dashboard/shared/lib/api";
import { Spinner } from "@/components/shared/Spinner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuid } from "uuid";

interface WechatQrCodeUploadProps {
	userId: string;
	currentQrCode?: string | null;
	onSuccess: (imageUrl: string) => void;
	onRemove: () => void;
	disabled?: boolean;
}

export function WechatQrCodeUpload({
	userId,
	currentQrCode,
	onSuccess,
	onRemove,
	disabled = false,
}: WechatQrCodeUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const { toast } = useToast();
	const getSignedUploadUrlMutation = useSignedUploadUrlMutation();

	const uploadFile = useCallback(
		async (file: File) => {
			if (!file) return;

			setUploading(true);
			try {
				// Generate unique filename
				const extension = file.name.split(".").pop() || "jpg";
				const path = `wechat-qr/${userId}-${uuid()}.${extension}`;

				// Get signed upload URL
				const { signedUrl } =
					await getSignedUploadUrlMutation.mutateAsync({
						path,
						bucket: config.storage.bucketNames.public,
						contentType: file.type,
					});

				// Upload file to S3
				const response = await fetch(signedUrl, {
					method: "PUT",
					body: file,
					headers: {
						"Content-Type": file.type,
					},
				});

				if (!response.ok) {
					throw new Error("Failed to upload image");
				}

				const imageUrl = `${config.storage.endpoints.public}/${path}`;
				await requestImageModeration(imageUrl, "content");

				// Success - return the path
				onSuccess(path);
				// Clean up preview after successful upload
				if (preview) {
					URL.revokeObjectURL(preview);
				}
				setPreview(null);

				toast({
					title: "上传成功",
					description: "微信二维码已上传",
				});
			} catch (error) {
				console.error("Upload error:", error);
				// Clean up preview on error
				if (preview) {
					URL.revokeObjectURL(preview);
					setPreview(null);
				}
				toast({
					title: "上传失败",
					description:
						error instanceof Error ? error.message : "请重试",
					variant: "destructive",
				});
			} finally {
				setUploading(false);
			}
		},
		[userId, getSignedUploadUrlMutation, onSuccess, toast],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (file) {
				// Create preview
				const previewUrl = URL.createObjectURL(file);
				setPreview(previewUrl);

				// Upload file
				uploadFile(file);
			}
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/webp": [".webp"],
		},
		multiple: false,
		disabled: disabled || uploading,
	});

	const handleRemove = useCallback(() => {
		if (preview) {
			URL.revokeObjectURL(preview);
			setPreview(null);
		}
		onRemove();
	}, [preview, onRemove]);

	// Clean up preview URL on unmount
	useEffect(() => {
		return () => {
			if (preview) {
				URL.revokeObjectURL(preview);
			}
		};
	}, [preview]);

	const displayImage =
		preview ||
		(currentQrCode
			? `${config.storage.endpoints.public}/${currentQrCode}`
			: null);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<label className="text-sm font-medium">微信二维码</label>
					<p className="text-xs text-muted-foreground mt-1">
						上传您的微信二维码，仅在互相关注时显示给对方，确保隐私安全
					</p>
				</div>
				{displayImage && !uploading && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleRemove}
						disabled={disabled}
						className="text-destructive hover:text-destructive"
					>
						<X className="h-4 w-4 mr-1" />
						删除
					</Button>
				)}
			</div>

			{displayImage ? (
				<div className="relative">
					<div className="w-48 h-48 mx-auto border rounded-lg overflow-hidden bg-muted">
						<img
							src={displayImage}
							alt="微信二维码"
							className="w-full h-full object-contain"
						/>
					</div>
					{uploading && (
						<div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
							<Spinner className="h-6 w-6" />
						</div>
					)}
				</div>
			) : (
				<div
					{...getRootProps()}
					className={`
						w-48 h-48 mx-auto border-2 border-dashed rounded-lg 
						flex flex-col items-center justify-center cursor-pointer
						transition-colors hover:bg-muted/50
						${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
						${disabled || uploading ? "cursor-not-allowed opacity-50" : ""}
					`}
				>
					<input {...getInputProps()} />
					{uploading ? (
						<Spinner className="h-8 w-8 text-muted-foreground" />
					) : (
						<>
							<div className="flex flex-col items-center gap-2">
								<ImageIcon className="h-8 w-8 text-muted-foreground" />
								<div className="text-center">
									<p className="text-sm font-medium">
										{isDragActive
											? "放下图片文件"
											: "上传二维码"}
									</p>
									<p className="text-xs text-muted-foreground">
										拖拽或点击选择图片
									</p>
								</div>
							</div>
							<div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
								<Upload className="h-3 w-3" />
								支持 PNG, JPG, WEBP
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
