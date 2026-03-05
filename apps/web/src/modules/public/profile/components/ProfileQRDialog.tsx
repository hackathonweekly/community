"use client";

import { Button } from "@community/ui/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface ProfileQRDialogProps {
	username: string;
	open: boolean;
	onClose: () => void;
}

export function ProfileQRDialog({
	username,
	open,
	onClose,
}: ProfileQRDialogProps) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth <= 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (open && isMobile) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open, isMobile]);

	if (!open || !username) return null;

	const profileUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/u/${username}`
			: "";

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(profileUrl);
			toast.success("链接已复制");
		} catch {
			toast.error("复制失败");
		}
	};

	if (isMobile) {
		return (
			<div className="fixed inset-0 bg-card z-50 flex flex-col">
				<div className="flex justify-between items-center p-4 border-b">
					<h3 className="text-lg font-semibold">个人名片二维码</h3>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="p-2"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
				<div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6">
					<div className="bg-card p-6 rounded-lg shadow-sm border">
						<QRCode
							value={profileUrl}
							size={Math.min(
								typeof window !== "undefined"
									? window.innerWidth - 120
									: 300,
								300,
							)}
							level="M"
						/>
					</div>
					<div className="text-center space-y-4">
						<div>
							<p className="text-sm text-muted-foreground mb-2">
								扫码查看我的个人主页
							</p>
							<code className="text-sm bg-muted px-2 py-1 rounded">
								@{username}
							</code>
						</div>
						<div className="space-y-2">
							<Button onClick={copyLink} className="w-full">
								复制链接
							</Button>
							<Button
								variant="outline"
								onClick={onClose}
								className="w-full"
							>
								关闭
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
			<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg shadow-lg p-6 z-50 min-w-[320px]">
				<div className="flex justify-center mb-4">
					<div className="bg-card p-3 rounded border">
						<QRCode value={profileUrl} size={240} level="M" />
					</div>
				</div>
				<div className="text-center mb-4">
					<p className="text-sm text-muted-foreground mb-2">
						个人名片二维码
					</p>
					<code className="text-sm bg-muted px-2 py-1 rounded">
						@{username}
					</code>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={copyLink}
						className="flex-1"
					>
						复制链接
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						className="flex-1"
					>
						关闭
					</Button>
				</div>
			</div>
		</>
	);
}
