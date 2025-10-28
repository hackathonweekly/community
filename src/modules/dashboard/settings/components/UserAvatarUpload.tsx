"use client";

import { config } from "@/config";
import { authClient } from "@/lib/auth/client";
import { requestImageModeration } from "@/lib/content-moderation/client";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useSignedUploadUrlMutation } from "@dashboard/shared/lib/api";
import { Spinner } from "@/components/shared/Spinner";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuid } from "uuid";
import { CropImageDialog } from "./CropImageDialog";

export function UserAvatarUpload({
	onSuccess,
	onError,
}: {
	onSuccess: () => void;
	onError?: (message?: string) => void;
}) {
	const { user, reloadSession } = useSession();
	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [image, setImage] = useState<File | null>(null);

	const getSignedUploadUrlMutation = useSignedUploadUrlMutation();

	const { getRootProps, getInputProps } = useDropzone({
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

	if (!user) {
		return null;
	}
	const onCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) {
			return;
		}

		setUploading(true);
		try {
			const path = `${user.id}-${uuid()}.png`;
			const { signedUrl } = await getSignedUploadUrlMutation.mutateAsync({
				path,
				bucket: config.storage.bucketNames.public,
			});

			const response = await fetch(signedUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: {
					"Content-Type": "image/png",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to upload image");
			}

			const imageUrl = `${config.storage.endpoints.public}/${path}`;
			await requestImageModeration(imageUrl, "avatar");

			const { error } = await authClient.updateUser({
				image: path,
			});

			if (error) {
				throw error;
			}

			await reloadSession();

			onSuccess();
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : undefined;
			onError?.(errorMessage);
		} finally {
			setUploading(false);
		}
	};

	return (
		<>
			<div
				className="relative size-24 rounded-full overflow-hidden"
				{...getRootProps()}
			>
				<input {...getInputProps()} />
				<UserAvatar
					className="size-24 cursor-pointer text-xl"
					avatarUrl={user.image}
					name={user.name ?? ""}
				/>

				{uploading && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 rounded-full">
						<Spinner className="size-6" />
					</div>
				)}
			</div>

			<CropImageDialog
				image={image}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
			/>
		</>
	);
}
