"use client";

import { config } from "@/config";
import { requestImageModeration } from "@/lib/content-moderation/client";
import { getPublicStorageUrl } from "@/lib/storage";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import {
	activeOrganizationQueryKey,
	organizationListQueryKey,
} from "@dashboard/organizations/lib/api";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { useSignedUploadUrlMutation } from "@dashboard/shared/lib/api";
import { Spinner } from "@/components/shared/Spinner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { CropImageDialog } from "../../settings/components/CropImageDialog";
import { ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrganizationCoverImageForm() {
	const t = useTranslations();
	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [image, setImage] = useState<File | null>(null);
	const { activeOrganization, refetchActiveOrganization } =
		useActiveOrganization();
	const queryClient = useQueryClient();
	const getSignedUploadUrlMutation = useSignedUploadUrlMutation();

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (acceptedFiles) => {
			setImage(acceptedFiles[0]);
			setCropDialogOpen(true);
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
		},
		multiple: false,
	});

	if (!activeOrganization) {
		return null;
	}

	const coverImageUrl =
		typeof activeOrganization.coverImage === "string" &&
		activeOrganization.coverImage.trim().length > 0
			? activeOrganization.coverImage
			: null;

	const onCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) {
			return;
		}

		setUploading(true);
		try {
			const path = `cover-${activeOrganization.id}-${uuid()}.png`;
			const { signedUrl } = await getSignedUploadUrlMutation.mutateAsync({
				path,
				bucket: config.storage.bucketNames.public,
			});

			const uploadResponse = await fetch(signedUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: {
					"Content-Type": "image/png",
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload image");
			}

			const imageUrl = `${config.storage.endpoints.public}/${path}`;
			await requestImageModeration(imageUrl, "content");

			const updateResponse = await fetch(
				`/api/organizations/${activeOrganization.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						coverImage: path,
					}),
				},
			);

			if (!updateResponse.ok) {
				throw new Error("Failed to update organization cover image");
			}

			toast.success("组织封面图更新成功");

			const publicCoverUrl = getPublicStorageUrl(path) ?? imageUrl;
			if (activeOrganization.slug) {
				queryClient.setQueryData(
					activeOrganizationQueryKey(activeOrganization.slug),
					(previous: any) =>
						previous
							? {
									...previous,
									coverImage: publicCoverUrl,
								}
							: previous,
				);
			}

			refetchActiveOrganization();
			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
		} catch (e) {
			toast.error("封面图更新失败，请重试");
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setUploading(true);
		try {
			const updateResponse = await fetch(
				`/api/organizations/${activeOrganization.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						coverImage: null,
					}),
				},
			);

			if (!updateResponse.ok) {
				throw new Error("Failed to delete organization cover image");
			}

			toast.success("组织封面图已删除");

			if (activeOrganization.slug) {
				queryClient.setQueryData(
					activeOrganizationQueryKey(activeOrganization.slug),
					(previous: any) =>
						previous
							? {
									...previous,
									coverImage: null,
								}
							: previous,
				);
			}

			refetchActiveOrganization();
			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
		} catch (e) {
			toast.error("封面图删除失败，请重试");
		} finally {
			setUploading(false);
		}
	};

	return (
		<SettingsItem
			title="组织封面图"
			description="上传组织封面图，建议尺寸为1200x400像素"
		>
			<div
				className={`relative w-full aspect-[3/1] border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden ${
					isDragActive
						? "border-primary bg-primary/10"
						: "border-gray-300 hover:border-primary"
				}`}
				{...getRootProps()}
			>
				<input {...getInputProps()} />

				{coverImageUrl ? (
					<div className="relative w-full h-full">
						<img
							src={coverImageUrl}
							alt="组织封面图"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
							<div className="text-white text-center">
								<Upload className="w-6 h-6 mx-auto mb-2" />
								<p className="text-sm">点击或拖拽更换封面图</p>
							</div>
						</div>
						<Button
							variant="destructive"
							size="icon"
							className="absolute top-2 right-2 h-8 w-8 opacity-0 hover:opacity-100 transition-opacity z-10"
							onClick={handleDelete}
							disabled={uploading}
							type="button"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
						<ImageIcon className="w-8 h-8 mb-2" />
						<p className="text-sm">
							{isDragActive
								? "放开以上传封面图"
								: "点击或拖拽上传封面图"}
						</p>
						<p className="text-xs text-gray-400 mt-1">
							支持 PNG、JPEG 格式
						</p>
					</div>
				)}

				{uploading && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 rounded-lg">
						<div className="text-center">
							<Spinner />
							<p className="text-sm text-gray-600 mt-2">
								上传中...
							</p>
						</div>
					</div>
				)}
			</div>

			<CropImageDialog
				image={image}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
				aspectRatio={3}
				maxWidth={1200}
				maxHeight={400}
			/>
		</SettingsItem>
	);
}
