"use client";

import { config } from "@/config";

const SIGNED_UPLOAD_ENDPOINT = "/api/uploads/signed-upload-url";
const DIRECT_UPLOAD_ENDPOINT = "/api/uploads/direct-upload";

type UploadOptions = {
	file: File;
	bucket: string;
	path: string;
	contentType?: string;
	publicEndpoint?: string;
};

export const buildPublicUrl = (
	path: string,
	publicEndpoint?: string,
	signedUrl?: string,
) => {
	const normalizedPath = path.replace(/^\/+/, "");

	// Prefer explicit endpoint, then config, finally derive from signedUrl origin
	const candidates = [publicEndpoint, config.storage.endpoints.public];

	if (signedUrl) {
		try {
			candidates.push(new URL(signedUrl).origin);
		} catch {
			// ignore invalid URL
		}
	}

	const base = candidates
		.filter(Boolean)
		.map((b) => (b as string).trim().replace(/\/+$/, ""))
		.find((b) => b.length > 0);

	if (!base) {
		// Fail loudly in dev, degrade to relative path in prod to avoid crash
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"[uploads] public endpoint missing, returning relative URL",
			);
		}
		return `/${normalizedPath}`;
	}

	return `${base}/${normalizedPath}`;
};

const safeParseJson = async (response: Response) => {
	try {
		return await response.json();
	} catch {
		return null;
	}
};

export async function uploadWithSignedUrlFallback({
	file,
	bucket,
	path,
	contentType,
	publicEndpoint,
}: UploadOptions): Promise<string> {
	const searchParams = new URLSearchParams({
		bucket,
		path,
	});

	if (contentType) {
		searchParams.set("contentType", contentType);
	}

	try {
		const signedUrlResponse = await fetch(
			`${SIGNED_UPLOAD_ENDPOINT}?${searchParams.toString()}`,
			{
				method: "POST",
				credentials: "include",
			},
		);

		if (!signedUrlResponse.ok) {
			const payload = await safeParseJson(signedUrlResponse);
			const message =
				(payload?.message as string | undefined) ??
				(payload?.error as string | undefined) ??
				"获取上传链接失败";
			throw new Error(message);
		}

		const { signedUrl, publicUrl } = (await signedUrlResponse.json()) as {
			signedUrl?: string;
			publicUrl?: string;
		};

		if (!signedUrl) {
			throw new Error("获取上传链接失败");
		}

		const uploadResponse = await fetch(signedUrl, {
			method: "PUT",
			body: file,
			headers: contentType ? { "Content-Type": contentType } : undefined,
		});

		if (!uploadResponse.ok) {
			throw new Error("文件上传失败");
		}

		return publicUrl ?? buildPublicUrl(path, publicEndpoint, signedUrl);
	} catch (error) {
		console.warn(
			"[uploads] Signed URL upload failed, attempting direct upload fallback",
			error,
		);

		try {
			const fallbackFormData = new FormData();
			fallbackFormData.append("file", file);
			fallbackFormData.append("bucket", bucket);
			fallbackFormData.append("path", path);
			if (contentType) {
				fallbackFormData.append("contentType", contentType);
			}

			const fallbackResponse = await fetch(DIRECT_UPLOAD_ENDPOINT, {
				method: "POST",
				body: fallbackFormData,
				credentials: "include",
			});

			if (!fallbackResponse.ok) {
				const payload = await safeParseJson(fallbackResponse);
				const message =
					(payload?.message as string | undefined) ??
					(payload?.error as string | undefined) ??
					"文件上传失败";
				throw new Error(message);
			}

			const payload = await safeParseJson(fallbackResponse);
			const fallbackUrlFromResponse =
				(typeof payload?.publicUrl === "string" &&
					payload.publicUrl.length > 0 &&
					payload.publicUrl) ||
				(typeof payload?.fileUrl === "string" &&
					payload.fileUrl.length > 0 &&
					payload.fileUrl) ||
				null;

			return (
				fallbackUrlFromResponse ?? buildPublicUrl(path, publicEndpoint)
			);
		} catch (fallbackError) {
			if (fallbackError instanceof Error) {
				throw fallbackError;
			}

			throw new Error("文件上传失败");
		}
	}
}
