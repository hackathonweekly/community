"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { config } from "@community/config";
import { authClient } from "@community/lib-client/auth/client";
import { requestImageModeration } from "@community/lib-client/content-moderation/client";
import { getPublicStorageUrl } from "@community/lib-shared/storage/url";
import { Spinner } from "@community/ui/shared/Spinner";
import { useActiveOrganization } from "@account/organizations/hooks/use-active-organization";
import {
	activeOrganizationQueryKey,
	organizationListQueryKey,
} from "@account/organizations/lib/api";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useSignedUploadUrlMutation } from "@account/shared/lib/api";
import { CropImageDialog } from "../../settings/components/CropImageDialog";
import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";

export function OrganizationLogoForm() {
	const t = useTranslations();
	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [image, setImage] = useState<File | null>(null);
	const { activeOrganization, refetchActiveOrganization } =
		useActiveOrganization();
	const queryClient = useQueryClient();
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

	if (!activeOrganization) {
		return null;
	}

	const onCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) {
			return;
		}

		setUploading(true);
		try {
			const path = `${activeOrganization.id}-${uuid()}.png`;
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

			const { error } = await authClient.organization.update({
				organizationId: activeOrganization.id,
				data: {
					logo: path,
				},
			});

			if (error) {
				throw error;
			}

			toast.success(t("settings.account.avatar.notifications.success"));

			const publicLogoUrl = getPublicStorageUrl(path) ?? imageUrl;
			if (activeOrganization.slug) {
				queryClient.setQueryData(
					activeOrganizationQueryKey(activeOrganization.slug),
					(previous: any) =>
						previous
							? {
									...previous,
									logo: publicLogoUrl,
								}
							: previous,
				);
			}

			refetchActiveOrganization();
			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
		} catch (e) {
			toast.error(t("settings.account.avatar.notifications.error"));
		} finally {
			setUploading(false);
		}
	};

	return (
		<SettingsItem
			title={t("organizations.settings.logo.title")}
			description={t("organizations.settings.logo.description")}
		>
			<div className="relative size-24 rounded-full" {...getRootProps()}>
				<input {...getInputProps()} />
				<OrganizationLogo
					className="size-24 cursor-pointer text-xl"
					logoUrl={activeOrganization.logo}
					name={activeOrganization.name ?? ""}
				/>

				{uploading && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90">
						<Spinner />
					</div>
				)}
			</div>

			<CropImageDialog
				image={image}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
			/>
		</SettingsItem>
	);
}
