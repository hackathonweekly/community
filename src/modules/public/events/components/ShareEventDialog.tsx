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
	ShareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { useEventPosterGenerator } from "@/modules/public/events/components/event-poster-generator";

interface ShareEventDialogProps {
	isOpen: boolean;
	onClose: () => void;
	eventTitle: string;
	eventUrl: string;
	eventId: string;
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

export function ShareEventDialog({
	isOpen,
	onClose,
	eventTitle,
	eventUrl,
	eventId,
	event,
}: ShareEventDialogProps) {
	const qrRef = useRef<HTMLDivElement>(null);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [showQRCode, setShowQRCode] = useState(false);
	const generatePoster = useEventPosterGenerator(eventId, eventTitle, event, {
		inviteCode: inviteCode ?? undefined,
	});

	// Generate share URL with invite code if available
	const getShareUrl = () => {
		if (inviteCode) {
			const separator = eventUrl.includes("?") ? "&" : "?";
			return `${eventUrl}${separator}invite=${inviteCode}`;
		}
		return eventUrl;
	};

	// Fetch invite code when dialog opens
	useEffect(() => {
		if (!isOpen) return;

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
					setInviteError("获取邀请码失败");
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
	}, [isOpen, eventId]);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("已复制到剪贴板");
		} catch (error) {
			console.error("Failed to copy:", error);
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand("copy");
				toast.success("已复制到剪贴板");
			} catch (fallbackError) {
				toast.error("复制失败");
			}
			document.body.removeChild(textArea);
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
			toast.success("二维码已下载");
		};

		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	};

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: eventTitle,
					text: generateShareText(),
					url: getShareUrl(),
				});
			} catch (error) {
				console.log("Native share failed or cancelled:", error);
			}
		}
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
		if (!event) return `${eventTitle}\n\n活动链接：${getShareUrl()}`;

		const timeStr = formatEventTime(event.startTime, event.endTime);
		let locationStr = "";

		if (event.isOnline) {
			locationStr = "线上活动";
		} else if (event.address) {
			locationStr = `地点：${event.address}`;
		}

		return `🎉 ${eventTitle}\n\n⏰ 时间：${timeStr}\n${locationStr ? `📍 ${locationStr}\n` : ""}\n🔗 报名链接：${getShareUrl()}`;
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<LinkIcon className="w-5 h-5" />
						分享活动
					</DialogTitle>
					<DialogDescription>
						选择分享方式，邀请更多朋友参加活动
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Share Options */}
					<div className="space-y-2">
						{/* Native Share (if available) */}
						{typeof navigator !== "undefined" &&
							navigator.share &&
							navigator.share !== undefined && (
								<Button
									onClick={handleNativeShare}
									variant="outline"
									className="w-full flex items-center gap-3 justify-start h-12"
								>
									<ShareIcon className="h-5 w-5" />
									<span>系统分享</span>
								</Button>
							)}

						{/* Copy Link */}
						<Button
							onClick={() => copyToClipboard(getShareUrl())}
							variant="outline"
							className="w-full flex items-center gap-3 justify-start h-12"
						>
							<LinkIcon className="h-5 w-5" />
							<span>复制链接</span>
						</Button>
					</div>

					{/* Share Text */}
					<div className="space-y-2">
						<div className="text-sm font-medium">分享文案</div>
						<textarea
							value={generateShareText()}
							readOnly
							rows={4}
							className="w-full p-3 text-sm border rounded-md resize-none bg-gray-50"
						/>
						<Button
							onClick={() => copyToClipboard(generateShareText())}
							variant="outline"
							className="w-full flex items-center gap-2"
						>
							<ClipboardDocumentIcon className="w-4 h-4" />
							复制分享文案
						</Button>
					</div>

					{/* QR Code */}
					<div className="flex flex-col items-center space-y-3 pt-2 border-t">
						{!showQRCode ? (
							<Button
								variant="outline"
								onClick={() => setShowQRCode(true)}
								className="flex items-center gap-2"
							>
								<PhotoIcon className="w-4 h-4" />
								生成二维码
							</Button>
						) : (
							<>
								<div className="text-sm font-medium text-center">
									{inviteLoading
										? "生成邀请码中..."
										: "扫描二维码快速报名"}
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
										value={getShareUrl()}
										size={200}
										className="max-w-full h-auto"
									/>
								</div>
								{inviteCode && (
									<div className="text-xs text-muted-foreground text-center">
										邀请码：{inviteCode}
									</div>
								)}
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={downloadQRCode}
										className="flex items-center gap-2"
									>
										<ArrowDownTrayIcon className="w-4 h-4" />
										下载二维码
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={generatePoster}
										className="flex items-center gap-2"
									>
										<PhotoIcon className="w-4 h-4" />
										生成海报
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
