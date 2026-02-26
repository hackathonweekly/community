"use client";

import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { useEventPosterGenerator } from "@/modules/public/events/components/event-poster-generator";
import {
	ArrowDownTrayIcon,
	ChevronLeftIcon,
	ClipboardDocumentIcon,
	DocumentTextIcon,
	LinkIcon,
	PhotoIcon,
	QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

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

type ShareView = "menu" | "qr" | "link" | "text";

export function EventShareModal({
	isOpen,
	onClose,
	eventId,
	eventTitle,
	event,
}: EventShareModalProps) {
	const t = useTranslations("events");
	const qrRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<ShareView>("menu");
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

	const posterGenerator = useEventPosterGenerator(
		eventId,
		eventTitle,
		event,
		{
			inviteCode: inviteCode ?? undefined,
		},
	);

	const handleGeneratePoster = async () => {
		try {
			setIsGeneratingPoster(true);
			await posterGenerator();
		} finally {
			setIsGeneratingPoster(false);
		}
	};

	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const baseEventUrl = origin
		? `${origin}/events/${eventId}`
		: `/events/${eventId}`;
	const shareUrl = inviteCode
		? `${baseEventUrl}?invite=${inviteCode}`
		: baseEventUrl;

	useEffect(() => {
		if (isOpen) {
			setView("menu");
		}
	}, [isOpen]);

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

	const renderMenu = () => (
		<div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
			<button
				onClick={() => setView("qr")}
				className="flex flex-col items-center gap-3 p-4 rounded-lg border border-dashed hover:border-solid hover:border-primary hover:bg-muted transition-all"
			>
				<div className="p-3 bg-muted text-foreground rounded-full">
					<QrCodeIcon className="w-6 h-6" />
				</div>
				<span className="text-sm font-medium text-foreground">
					二维码
				</span>
			</button>

			<button
				onClick={() => setView("link")}
				className="flex flex-col items-center gap-3 p-4 rounded-lg border border-dashed hover:border-solid hover:border-primary hover:bg-muted transition-all"
			>
				<div className="p-3 bg-muted text-foreground rounded-full">
					<LinkIcon className="w-6 h-6" />
				</div>
				<span className="text-sm font-medium text-foreground">
					复制链接
				</span>
			</button>

			<button
				onClick={() => setView("text")}
				className="flex flex-col items-center gap-3 p-4 rounded-lg border border-dashed hover:border-solid hover:border-primary hover:bg-muted transition-all"
			>
				<div className="p-3 bg-muted text-foreground rounded-full">
					<DocumentTextIcon className="w-6 h-6" />
				</div>
				<span className="text-sm font-medium text-foreground">
					复制文案
				</span>
			</button>

			<button
				onClick={handleGeneratePoster}
				disabled={isGeneratingPoster}
				className="flex flex-col items-center gap-3 p-4 rounded-lg border border-dashed hover:border-solid hover:border-primary hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div className="p-3 bg-muted text-foreground rounded-full">
					<PhotoIcon className="w-6 h-6" />
				</div>
				<span className="text-sm font-medium text-foreground">
					{isGeneratingPoster ? "生成中..." : "生成海报"}
				</span>
			</button>
		</div>
	);

	const renderQRView = () => (
		<div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
			<div className="text-sm font-medium text-center text-muted-foreground">
				{inviteLoading ? t("invite.generating") : t("scanQRToShare")}
			</div>
			{inviteError && (
				<div className="text-xs text-destructive text-center max-w-sm">
					{inviteError}
				</div>
			)}
			<div
				ref={qrRef}
				className="bg-card p-4 rounded-lg border shadow-sm"
			>
				<QRCode
					value={shareUrl}
					size={Math.min(200, window.innerWidth - 160)}
					className="max-w-full h-auto"
				/>
			</div>
			<Button
				variant="outline"
				onClick={downloadQRCode}
				className="flex items-center gap-2"
			>
				<ArrowDownTrayIcon className="w-4 h-4" />
				{t("downloadQRCode")}
			</Button>
		</div>
	);

	const renderLinkView = () => (
		<div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
			<div className="p-4 bg-muted rounded-lg border break-all text-sm text-muted-foreground font-mono">
				{shareUrl}
			</div>
			<Button
				onClick={() => copyToClipboard(shareUrl)}
				className="w-full flex items-center gap-2"
			>
				<LinkIcon className="w-4 h-4" />
				复制链接
			</Button>
		</div>
	);

	const renderTextView = () => (
		<div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
			<div className="p-4 bg-muted rounded-lg border text-sm text-muted-foreground min-h-[150px] whitespace-pre-wrap">
				{generateShareText()}
			</div>
			{inviteCode && (
				<div className="text-xs text-muted-foreground">
					{t("invite.codeLabel", { code: inviteCode })}
				</div>
			)}
			<Button
				onClick={() => copyToClipboard(generateShareText())}
				className="w-full flex items-center gap-2"
			>
				<ClipboardDocumentIcon className="w-4 h-4" />
				{t("copyShareText")}
			</Button>
		</div>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[min(512px,95vw)] mx-auto p-6">
				<DialogHeader className="space-y-3">
					<div className="flex items-center gap-2 relative">
						{view !== "menu" && (
							<button
								onClick={() => setView("menu")}
								className="absolute -left-2 p-1 rounded-full hover:bg-muted transition-colors"
								aria-label="Back"
							>
								<ChevronLeftIcon className="w-5 h-5 text-muted-foreground" />
							</button>
						)}
						<DialogTitle className={view !== "menu" ? "pl-8" : ""}>
							{view === "menu" && t("shareEvent")}
							{view === "qr" && "活动二维码"}
							{view === "link" && "活动链接"}
							{view === "text" && "分享文案"}
						</DialogTitle>
					</div>
					{view === "menu" && (
						<DialogDescription>
							{t("shareEventDescription")}
						</DialogDescription>
					)}
				</DialogHeader>

				<div className="py-2">
					{view === "menu" && renderMenu()}
					{view === "qr" && renderQRView()}
					{view === "link" && renderLinkView()}
					{view === "text" && renderTextView()}
				</div>
			</DialogContent>
		</Dialog>
	);
}
