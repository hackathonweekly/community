"use client";

import { Button } from "@/components/ui/button";
import { QrCodeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface User {
	id: string;
	name: string;
	username: string | null;
	profilePublic: boolean;
}

interface CompactQRCodeProps {
	user: User;
	className?: string;
}

export function CompactQRCode({ user, className = "" }: CompactQRCodeProps) {
	const [showQR, setShowQR] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const qrRef = useRef<HTMLDivElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const t = useTranslations();
	const locale = useLocale();

	useEffect(() => {
		// 检测是否为移动设备
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target as Node)
			) {
				setShowQR(false);
			}
		}

		if (showQR && !isMobile) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [showQR, isMobile]);

	// 阻止移动端背景滚动
	useEffect(() => {
		if (showQR && isMobile) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [showQR, isMobile]);

	if (!user.username || !user.profilePublic) {
		return null;
	}

	const profilePath = `/${locale}/u/${user.username}`;
	const profileUrl =
		typeof window !== "undefined"
			? `${window.location.origin}${profilePath}`
			: profilePath;

	const toggleQR = () => setShowQR(!showQR);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(profileUrl);
			toast.success(t("profile.qr.notifications.copySuccess"));
		} catch (error) {
			toast.error(t("profile.qr.notifications.copyError"));
		}
	};

	const closeQR = () => setShowQR(false);

	const openProfile = () => {
		if (typeof window === "undefined" || !profileUrl) return;
		window.open(profileUrl, "_blank", "noopener,noreferrer");
		closeQR();
	};

	return (
		<div className={`relative ${className}`}>
			{/* className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all" */}
			<Button
				variant="outline"
				size="sm"
				onClick={toggleQR}
				className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 text-primary transition-all bg-white border-none shadow-none"
				title={t("profile.qr.showPersonalQRCode")}
			>
				<QrCodeIcon className="h-4 w-4 text-primary" />
				{/* <span className="text-xs font-medium hidden sm:inline">
					{t("profile.qr.openDigitalCard")}
				</span>
				<span className="text-xs font-medium sm:hidden">
					{t("profile.qr.openDigitalCardShort")}
				</span> */}
			</Button>

			{showQR &&
				(isMobile ? (
					// 移动端全屏显示
					<div className="fixed inset-0 bg-white z-50 flex flex-col">
						<div className="flex justify-between items-center p-4 border-b">
							<h3 className="text-lg font-semibold">
								{t("profile.qr.personalQRCode")}
							</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={closeQR}
								className="p-2"
							>
								<XMarkIcon className="h-5 w-5" />
							</Button>
						</div>
						<div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6">
							<div className="bg-white p-6 rounded-lg shadow-sm border">
								<QRCode
									value={profileUrl}
									size={Math.min(
										window.innerWidth - 120,
										300,
									)}
									level="M"
								/>
							</div>
							<div className="text-center space-y-4">
								<div className="space-y-2">
									<p className="text-base font-semibold">
										{t("profile.qr.personalQRCode")}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("profile.qr.qrCodeDescriptionFull")}
									</p>
									<p className="text-xs text-muted-foreground">
										{t("profile.qr.scanToViewProfile")}
									</p>
									<code className="text-sm bg-muted px-2 py-1 rounded">
										@{user.username}
									</code>
								</div>
								<div className="space-y-2">
									<Button
										onClick={openProfile}
										className="w-full"
									>
										{t("profile.qr.viewDigitalCard")}
									</Button>
									<Button
										onClick={copyLink}
										className="w-full"
									>
										{t("profile.qr.copyProfileLink")}
									</Button>
									<Button
										variant="outline"
										onClick={closeQR}
										className="w-full"
									>
										{t("profile.qr.close")}
									</Button>
								</div>
							</div>
						</div>
					</div>
				) : (
					// 桌面端弹窗显示 - 更大尺寸
					<div
						ref={popupRef}
						className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 min-w-[280px]"
					>
						<div className="flex justify-center mb-3">
							<div
								ref={qrRef}
								className="bg-white p-2 rounded border"
							>
								<QRCode
									value={profileUrl}
									size={200}
									level="M"
								/>
							</div>
						</div>
						<div className="text-center mb-4 space-y-2">
							<p className="text-sm font-semibold">
								{t("profile.qr.personalQRCode")}
							</p>
							<p className="text-xs text-muted-foreground">
								{t("profile.qr.qrCodeDescriptionFull")}
							</p>
							<p className="text-xs text-muted-foreground">
								{t("profile.qr.scanToViewProfile")}
							</p>
							<code className="text-sm bg-muted px-2 py-1 rounded">
								@{user.username}
							</code>
						</div>
						<div className="space-y-2">
							<Button
								size="sm"
								onClick={openProfile}
								className="w-full"
							>
								{t("profile.qr.viewDigitalCard")}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={copyLink}
								className="w-full"
							>
								{t("profile.qr.copyProfileLink")}
							</Button>
						</div>
					</div>
				))}
		</div>
	);
}
