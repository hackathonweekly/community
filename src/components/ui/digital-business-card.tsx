"use client";

import { useRef } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import QRCode from "react-qr-code";
import Image from "next/image";
import { useLocale } from "next-intl";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import * as htmlToImage from "html-to-image";

export interface DigitalBusinessCardData {
	id: string;
	name: string;
	username?: string | null;
	image?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
	lifeStatus?: string | null;
	region?: string | null;
}

interface DigitalBusinessCardProps {
	user: DigitalBusinessCardData;
	className?: string;
	forExport?: boolean; // 标记是否为导出模式
	cardRef?: React.RefObject<HTMLDivElement>; // 添加 ref 支持
}

export function DigitalBusinessCard({
	user,
	className = "",
	forExport = false,
	cardRef: externalRef,
}: DigitalBusinessCardProps) {
	const locale = useLocale();
	const internalRef = useRef<HTMLDivElement>(null);
	const cardRef = externalRef || internalRef;

	const profileUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/${locale}/u/${user.username || user.id}`
			: `/${locale}/u/${user.username || user.id}`;

	const lifeStatusLabel = user.lifeStatus
		? getLifeStatusLabel(user.lifeStatus)
		: null;

	return (
		<div
			ref={cardRef}
			className={`relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden ${className}`}
			style={{
				width: "100%",
				height: "100%",
			}}
			data-card-root="true"
		>
			{/* Content */}
			<div className="relative h-full flex flex-col items-center justify-center px-8 py-12">
				{/* Avatar */}
				<div className="mb-6">
					{forExport && user.image ? (
						<img
							src={user.image}
							alt={user.name}
							className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
							crossOrigin="anonymous"
						/>
					) : (
						<UserAvatar
							name={user.name}
							avatarUrl={user.image}
							className="w-32 h-32 border-4 border-white shadow-lg"
						/>
					)}
				</div>

				{/* Name */}
				<h1 className="text-4xl font-bold text-gray-900 mb-3 text-center px-4 line-clamp-1 break-words max-w-full">
					{user.name}
				</h1>

				{/* User Role */}
				{user.userRoleString && (
					<p className="text-xl text-primary font-medium mb-3 text-center px-4 line-clamp-1 break-words max-w-full">
						{user.userRoleString}
					</p>
				)}

				{/* Current Work */}
				{user.currentWorkOn && (
					<p className="text-lg text-gray-600 mb-3 text-center px-6 line-clamp-2 break-words max-w-full">
						在做：{user.currentWorkOn}
					</p>
				)}

				{/* Life Status */}
				{lifeStatusLabel && (
					<div className="mb-6 max-w-full px-4">
						<span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-base font-medium line-clamp-1 break-words">
							{lifeStatusLabel}
						</span>
					</div>
				)}

				{/* Spacer */}
				<div className="flex-1 min-h-4" />

				{/* QR Code */}
				<div className="bg-white p-4 rounded-xl shadow-md">
					<QRCode value={profileUrl} size={110} level="M" />
				</div>

				{/* QR Code Label */}
				<p className="mt-2 text-xs text-gray-500 text-center">
					扫码查看个人主页
				</p>

				{/* Logo - 移到底部 */}
				<div className="mt-4 flex justify-center">
					{forExport ? (
						<img
							src="/images/logo-black.png"
							alt="Community Logo"
							className="w-20 h-20 object-contain opacity-80"
							crossOrigin="anonymous"
						/>
					) : (
						<div className="relative w-20 h-20 opacity-80">
							<Image
								src="/images/logo-black.png"
								alt="Community Logo"
								fill
								className="object-contain"
								priority
							/>
						</div>
					)}
				</div>
			</div>

			{/* Decorative Elements */}
			<div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
			<div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-0" />
		</div>
	);
}

// Use html-to-image for better quality and style preservation
export async function convertCardToImage(
	user: DigitalBusinessCardData,
	existingCardElement?: HTMLElement,
): Promise<Blob> {
	// If we have an existing card element, use it directly
	if (existingCardElement) {
		try {
			const dataUrl = await htmlToImage.toJpeg(existingCardElement, {
				quality: 0.85,
				pixelRatio: 1.5,
				cacheBust: true,
			});

			// Convert data URL to blob
			const response = await fetch(dataUrl);
			const blob = await response.blob();
			return blob;
		} catch (error) {
			// Fall through to create new element
		}
	}

	// Create a temporary container
	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.left = "-9999px";
	container.style.top = "-9999px";
	container.style.width = "600px";
	container.style.height = "800px";
	document.body.appendChild(container);

	try {
		// Create React root and render the card
		const { createRoot } = await import("react-dom/client");
		const { NextIntlClientProvider } = await import("next-intl");
		const root = createRoot(container);

		// Render the card with forExport flag and intl provider
		root.render(
			<NextIntlClientProvider locale="zh" messages={{}}>
				<div style={{ width: "600px", height: "800px" }}>
					<DigitalBusinessCard user={user} forExport={true} />
				</div>
			</NextIntlClientProvider>,
		);

		// Wait for the card element to appear
		const cardElement = await new Promise<HTMLElement>(
			(resolve, reject) => {
				const timeoutId = setTimeout(() => {
					observer.disconnect();
					reject(new Error("等待卡片元素超时 (10秒)"));
				}, 10000);

				const observer = new MutationObserver(() => {
					const element = container.querySelector(
						"[data-card-root]",
					) as HTMLElement;
					if (element) {
						clearTimeout(timeoutId);
						observer.disconnect();
						resolve(element);
					}
				});

				// Check if element already exists
				const existing = container.querySelector(
					"[data-card-root]",
				) as HTMLElement;
				if (existing) {
					clearTimeout(timeoutId);
					resolve(existing);
					return;
				}

				observer.observe(container, {
					childList: true,
					subtree: true,
				});
			},
		);

		// Wait for all images to load
		const images = cardElement.querySelectorAll("img");
		await Promise.all(
			Array.from(images).map((img) => {
				if (img.complete && img.naturalHeight > 0) {
					return Promise.resolve();
				}
				return new Promise<void>((resolve) => {
					const timeout = setTimeout(() => resolve(), 5000);
					img.onload = () => {
						clearTimeout(timeout);
						resolve();
					};
					img.onerror = () => {
						clearTimeout(timeout);
						resolve();
					};
				});
			}),
		);

		// Extra wait for layout stabilization
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Use html-to-image with JPEG for smaller file size
		const dataUrl = await htmlToImage.toJpeg(cardElement, {
			quality: 0.85,
			pixelRatio: 1.5,
			cacheBust: true,
		});

		// Convert data URL to blob
		const response = await fetch(dataUrl);
		const blob = await response.blob();

		// Cleanup
		root.unmount();
		document.body.removeChild(container);

		return blob;
	} catch (error) {
		// Cleanup on error
		try {
			document.body.removeChild(container);
		} catch (e) {
			// Ignore cleanup errors
		}
		throw error;
	}
}
