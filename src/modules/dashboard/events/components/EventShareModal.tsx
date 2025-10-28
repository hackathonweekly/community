"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ClipboardDocumentIcon,
	LinkIcon,
	ArrowDownTrayIcon,
	PhotoIcon,
} from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useEventPosterGenerator } from "@/modules/public/events/components/event-poster-generator";

interface EventShareModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
	eventTitle: string;
	event?: {
		startTime: string;
		endTime: string;
		address?: string;
		isOnline: boolean;
		onlineUrl?: string;
		coverImage?: string;
		richContent?: string | null;
	};
}

export function EventShareModal({
	isOpen,
	onClose,
	eventId,
	eventTitle,
	event,
}: EventShareModalProps) {
	const t = useTranslations("events");
	const locale = useLocale();
	const qrRef = useRef<HTMLDivElement>(null);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const generatePoster = useEventPosterGenerator(eventId, eventTitle, event, {
		inviteCode: inviteCode ?? undefined,
	});

	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const baseEventUrl = origin
		? `${origin}/${locale}/events/${eventId}`
		: `/${locale}/events/${eventId}`;
	const shareUrl = inviteCode
		? `${baseEventUrl}?invite=${inviteCode}`
		: baseEventUrl;

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		let cancelled = false;

		const fetchInvite = async () => {
			setInviteLoading(true);
			setInviteError(null);
			try {
				const response = await fetch(
					`/api/events/${eventId}/invites/user`,
					{
						method: "POST",
						credentials: "include",
					},
				);

				if (!response.ok) {
					if (response.status === 401) {
						setInviteCode(null);
						return;
					}
					throw new Error(
						`Invite request failed: ${response.status}`,
					);
				}

				const data = await response.json();
				if (!cancelled) {
					setInviteCode(data?.data?.invite?.code ?? null);
				}
			} catch (error) {
				console.error("Failed to load invite code:", error);
				if (!cancelled) {
					setInviteCode(null);
					setInviteError(t("invite.fetchFailed"));
				}
			} finally {
				if (!cancelled) {
					setInviteLoading(false);
				}
			}
		};

		fetchInvite();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, eventId]);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(t("linkCopied"));
		} catch (error) {
			console.error("Failed to copy:", error);
			toast.error(t("linkCopyFailed"));
		}
	};

	const downloadQRCode = () => {
		if (!qrRef.current) return;

		const svg = qrRef.current.querySelector("svg");
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		canvas.width = 300;
		canvas.height = 300;

		img.onload = () => {
			if (!ctx) return;
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			const link = document.createElement("a");
			link.download = `${eventTitle}-qrcode.png`;
			link.href = canvas.toDataURL();
			link.click();
			toast.success(t("qrCodeDownloaded"));
		};

		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	};

	const formatEventTime = (startTime: string, endTime: string) => {
		const start = new Date(startTime);
		const end = new Date(endTime);
		const formatter = new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		const startStr = formatter.format(start);
		const endStr = formatter.format(end);

		if (start.toDateString() === end.toDateString()) {
			return `${startStr} - ${formatter.format(end).split(" ")[1]}`;
		}
		return `${startStr} - ${endStr}`;
	};

	const generateShareText = () => {
		if (!event) return `${eventTitle}\n\n活动链接：${shareUrl}`;

		const timeStr = formatEventTime(event.startTime, event.endTime);
		let locationStr = "";

		if (event.isOnline) {
			locationStr = "线上活动";
		} else if (event.address) {
			locationStr = `地点：${event.address}`;
		}

		return `🎉 ${eventTitle}\n\n⏰ 时间：${timeStr}\n${locationStr ? `📍 ${locationStr}\n` : ""}\n🔗 报名链接：${shareUrl}`;
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[min(512px,95vw)] mx-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LinkIcon className="w-5 h-5" />
						{t("shareEvent")}
					</DialogTitle>
					<DialogDescription>
						{t("shareEventDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* QR Code */}
					<div className="flex flex-col items-center space-y-4">
						<div className="text-sm font-medium text-center">
							{inviteLoading
								? t("invite.generating")
								: t("scanQRToShare")}
						</div>
						{inviteError && (
							<div className="text-xs text-red-500 text-center max-w-sm">
								{inviteError}
							</div>
						)}
						<div
							ref={qrRef}
							className="bg-white p-4 rounded-lg border"
						>
							<QRCode
								value={shareUrl}
								size={Math.min(200, window.innerWidth - 160)}
								className="max-w-full h-auto"
							/>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={downloadQRCode}
								className="flex items-center gap-2"
							>
								<ArrowDownTrayIcon className="w-4 h-4" />
								{t("downloadQRCode")}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={generatePoster}
								className="flex items-center gap-2"
							>
								<PhotoIcon className="w-4 h-4" />
								{t("generatePoster")}
							</Button>
						</div>
					</div>

					{/* Share Text */}
					<div className="space-y-2">
						<div className="text-sm font-medium">
							{t("shareText")}
						</div>
						<div className="space-y-2">
							<textarea
								value={generateShareText()}
								readOnly
								rows={6}
								className="w-full p-3 text-sm border rounded-md resize-none bg-gray-50"
							/>
							{inviteCode && (
								<div className="text-xs text-muted-foreground">
									{t("invite.codeLabel", {
										code: inviteCode,
									})}
								</div>
							)}
							<Button
								size="sm"
								onClick={() =>
									copyToClipboard(generateShareText())
								}
								className="flex items-center gap-2 w-full"
							>
								<ClipboardDocumentIcon className="w-4 h-4" />
								{t("copyShareText")}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
