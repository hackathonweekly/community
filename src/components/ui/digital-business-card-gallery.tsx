"use client";

import { Button } from "@/components/ui/button";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import JSZip from "jszip";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
	DigitalBusinessCard,
	type DigitalBusinessCardData,
	convertCardToImage,
} from "./digital-business-card";

interface DigitalBusinessCardGalleryProps {
	users: DigitalBusinessCardData[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// Sanitize filename to make it safe for file systems
function sanitizeFilename(name: string): string {
	// Remove invalid filesystem characters
	let sanitized = name.replace(/[<>:"/\\|?*]/g, "");
	// Remove control characters (0x00-0x1F)
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Need to remove control characters for safe filenames
	sanitized = sanitized.replace(/[\x00-\x1F]/g, "");
	// Replace spaces with underscores
	sanitized = sanitized.replace(/\s+/g, "_");
	// Limit length
	return sanitized.substring(0, 200);
}

export function DigitalBusinessCardGallery({
	users,
	open,
	onOpenChange,
}: DigitalBusinessCardGalleryProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDownloading, setIsDownloading] = useState(false);
	const [portalTarget] = useState<HTMLElement | null>(() => {
		if (typeof document === "undefined") return null;
		return document.body;
	});
	const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	const locale = useLocale();
	const isZh = locale?.startsWith("zh");
	const backLabel = isZh ? "返回" : "Back";
	const closeLabel = isZh ? "关闭" : "Close";

	const goToPrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : users.length - 1));
	};

	const goToNext = () => {
		setCurrentIndex((prev) => (prev < users.length - 1 ? prev + 1 : 0));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowLeft") {
			goToPrevious();
		} else if (e.key === "ArrowRight") {
			goToNext();
		}
	};

	const downloadSingleCard = async (user: DigitalBusinessCardData) => {
		try {
			setIsDownloading(true);
			// Try to get the currently displayed card element
			const cardElement = cardRefs.current.get(user.id);
			const blob = await convertCardToImage(user, cardElement);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${sanitizeFilename(user.name)}_数字名片.jpg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success(`已下载 ${user.name} 的数字名片`);
		} catch (error) {
			console.error("Error downloading card:", error);
			toast.error("下载名片失败，请重试");
		} finally {
			setIsDownloading(false);
		}
	};

	const downloadAllCards = async () => {
		if (users.length === 0) {
			toast.error("没有可下载的名片");
			return;
		}

		try {
			setIsDownloading(true);
			toast.info(`开始批量下载 ${users.length} 张名片，请稍候...`);

			const zip = new JSZip();
			const folder = zip.folder("数字名片集");

			if (!folder) {
				throw new Error("Failed to create zip folder");
			}

			// Download all cards
			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				try {
					toast.info(
						`正在处理 ${i + 1}/${users.length}: ${user.name}`,
					);
					const blob = await convertCardToImage(user);
					const arrayBuffer = await blob.arrayBuffer();
					folder.file(
						`${sanitizeFilename(user.name)}_数字名片.jpg`,
						arrayBuffer,
					);
				} catch (error) {
					console.error(
						`Error processing card for ${user.name}:`,
						error,
					);
					toast.error(`处理 ${user.name} 的名片时出错，已跳过`);
				}
			}

			// Generate zip file
			toast.info("正在打包文件...");
			const zipBlob = await zip.generateAsync({ type: "blob" });

			// Download zip file
			const url = URL.createObjectURL(zipBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `数字名片集_${new Date().toISOString().split("T")[0]}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success(`成功下载 ${users.length} 张名片！`);
		} catch (error) {
			console.error("Error downloading all cards:", error);
			toast.error("批量下载失败，请重试");
		} finally {
			setIsDownloading(false);
		}
	};

	if (users.length === 0) {
		return null;
	}

	const currentUser = users[currentIndex];

	// Handle keyboard navigation
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				goToPrevious();
			} else if (e.key === "ArrowRight") {
				goToNext();
			} else if (e.key === "Escape") {
				onOpenChange(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, goToPrevious, goToNext, onOpenChange]);

	// Prevent body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) {
		return null;
	}

	if (!portalTarget) {
		return null;
	}

	return createPortal(
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6 lg:p-10">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
			/>

			{/* Content */}
			<div className="relative w-full h-full sm:h-[90vh] sm:max-w-6xl flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 sm:rounded-2xl sm:border sm:shadow-2xl overflow-hidden">
				{/* Header Bar */}
				<div className="relative z-50 bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="gap-1 px-2"
							aria-label={backLabel}
						>
							<ChevronLeftIcon className="h-5 w-5" />
							<span className="text-sm font-medium">
								{backLabel}
							</span>
						</Button>
						<div className="flex items-center gap-4">
							<span className="text-sm font-medium">
								{currentIndex + 1} / {users.length}
							</span>
							<span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
								{currentUser.name}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => downloadSingleCard(currentUser)}
							disabled={isDownloading}
							className="text-xs"
						>
							<ArrowDownTrayIcon className="h-4 w-4 sm:mr-1" />
							<span className="hidden sm:inline">下载</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={downloadAllCards}
							disabled={isDownloading}
							className="text-xs"
						>
							<ArrowDownTrayIcon className="h-4 w-4 sm:mr-1" />
							<span className="hidden sm:inline">
								全部 ({users.length})
							</span>
							<span className="sm:hidden">全部</span>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="ml-2"
							aria-label={closeLabel}
						>
							<XMarkIcon className="h-5 w-5" />
							<span className="sr-only">{closeLabel}</span>
						</Button>
					</div>
				</div>

				{/* Main Content Area */}
				<div className="relative flex-1 min-h-0 flex items-center justify-center p-2">
					{/* Card Display */}
					<div className="relative w-full h-full max-w-[500px] max-h-[calc(100vh-120px)] sm:max-h-[calc(150vh)]">
						{users.map((user, index) => (
							<div
								key={user.id}
								className={`absolute inset-0 transition-all duration-300 ${
									index === currentIndex
										? "opacity-100 scale-100 z-10"
										: "opacity-0 scale-95 z-0 pointer-events-none"
								}`}
								ref={(el) => {
									if (el) {
										const cardEl = el.querySelector(
											"[data-card-root]",
										) as HTMLDivElement;
										if (cardEl) {
											cardRefs.current.set(
												user.id,
												cardEl,
											);
										}
									}
								}}
							>
								{Math.abs(index - currentIndex) <= 1 && (
									<DigitalBusinessCard user={user} />
								)}
							</div>
						))}
					</div>

					{/* Navigation Buttons */}
					{users.length > 1 && (
						<>
							<Button
								variant="outline"
								size="icon"
								className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow-lg z-20 h-10 w-10 sm:h-12 sm:w-12"
								onClick={goToPrevious}
								disabled={isDownloading}
							>
								<ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow-lg z-20 h-10 w-10 sm:h-12 sm:w-12"
								onClick={goToNext}
								disabled={isDownloading}
							>
								<ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
							</Button>
						</>
					)}
				</div>

				{/* Bottom Info */}
				<div className="relative z-50 bg-background/95 backdrop-blur-sm border-t px-4 py-2">
					<p className="text-xs text-center text-muted-foreground">
						使用左右箭头键或点击按钮切换 • ESC 键退出
					</p>
				</div>
			</div>
		</div>,
		portalTarget,
	);
}
