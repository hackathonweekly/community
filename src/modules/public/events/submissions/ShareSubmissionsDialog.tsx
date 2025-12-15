"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Copy, Download, Link2, QrCode, Share2 } from "lucide-react";

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success("已复制到剪贴板");
		return;
	} catch (error) {
		console.error("Failed to copy text:", error);
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	try {
		document.execCommand("copy");
		toast.success("已复制到剪贴板");
	} catch (fallbackError) {
		console.error("Fallback copy failed:", fallbackError);
		toast.error("复制失败");
	} finally {
		document.body.removeChild(textArea);
	}
}

function svgToPngBlob(
	svg: SVGSVGElement,
	{ size, background }: { size: number; background: string },
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		canvas.width = size;
		canvas.height = size;

		img.onload = () => {
			if (!ctx) {
				reject(new Error("Canvas context not available"));
				return;
			}
			ctx.fillStyle = background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			canvas.toBlob((blob) => {
				if (!blob) {
					reject(new Error("Failed to create PNG blob"));
					return;
				}
				resolve(blob);
			}, "image/png");
		};

		img.onerror = () => reject(new Error("Failed to load SVG image"));
		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	});
}

async function copyQrCodeAsImage(qrContainer: HTMLDivElement) {
	const svg = qrContainer.querySelector("svg");
	if (!svg) {
		toast.error("二维码生成失败");
		return;
	}

	if (
		!navigator.clipboard ||
		typeof navigator.clipboard.write !== "function" ||
		typeof ClipboardItem === "undefined"
	) {
		toast.error("当前浏览器不支持复制图片，请使用下载二维码");
		return;
	}

	try {
		const blob = await svgToPngBlob(svg, {
			size: 512,
			background: "white",
		});
		await navigator.clipboard.write([
			new ClipboardItem({
				[blob.type]: blob,
			}),
		]);
		toast.success("二维码已复制到剪贴板");
	} catch (error) {
		console.error("Failed to copy QR code:", error);
		toast.error("复制二维码失败，请尝试下载二维码");
	}
}

function downloadQrCodePng(qrContainer: HTMLDivElement, fileName: string) {
	const svg = qrContainer.querySelector("svg");
	if (!svg) return;

	const svgData = new XMLSerializer().serializeToString(svg);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const img = new Image();

	canvas.width = 512;
	canvas.height = 512;

	img.onload = () => {
		if (!ctx) return;
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		const link = document.createElement("a");
		link.download = fileName;
		link.href = canvas.toDataURL("image/png");
		link.click();
		toast.success("二维码已下载");
	};

	img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
}

export function ShareSubmissionsDialog() {
	const pathname = usePathname();
	const qrRef = useRef<HTMLDivElement>(null);
	const [shareUrl, setShareUrl] = useState<string>("");

	useEffect(() => {
		setShareUrl(`${window.location.origin}${pathname}`);
	}, [pathname]);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="lg" className="gap-2">
					<Share2 className="h-4 w-4" />
					分享
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5" />
						分享作品广场
					</DialogTitle>
					<DialogDescription>
						复制链接或二维码，分享给朋友。
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					<div className="space-y-2">
						<div className="text-sm font-medium">链接</div>
						<div className="flex gap-2">
							<Input value={shareUrl} readOnly />
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => copyText(shareUrl)}
								disabled={!shareUrl}
								aria-label="复制链接"
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-3 border-t pt-4">
						<div className="text-sm font-medium flex items-center gap-2">
							<QrCode className="h-4 w-4" />
							二维码
						</div>

						<div
							ref={qrRef}
							className="mx-auto w-fit rounded-lg border bg-white p-4"
						>
							<QRCode
								value={shareUrl || " "}
								size={200}
								className="h-auto max-w-full"
							/>
						</div>

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1 gap-2"
								onClick={async () => {
									if (!qrRef.current) return;
									await copyQrCodeAsImage(qrRef.current);
								}}
								disabled={!shareUrl}
							>
								<Copy className="h-4 w-4" />
								复制二维码
							</Button>
							<Button
								type="button"
								variant="outline"
								className="flex-1 gap-2"
								onClick={() => {
									if (!qrRef.current) return;
									downloadQrCodePng(
										qrRef.current,
										"submissions-qrcode.png",
									);
								}}
								disabled={!shareUrl}
							>
								<Download className="h-4 w-4" />
								下载二维码
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
