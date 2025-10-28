"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import QrScanner from "qr-scanner";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface QRScannerProps {
	isOpen: boolean;
	onClose: () => void;
	onScanSuccess: (result: string) => void;
	eventId: string;
}

export function QRScanner({
	isOpen,
	onClose,
	onScanSuccess,
	eventId,
}: QRScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const qrScannerRef = useRef<QrScanner | null>(null);
	const [hasCamera, setHasCamera] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showSuccessFlash, setShowSuccessFlash] = useState(false);
	const [errorDetails, setErrorDetails] = useState<string>("");
	const [showManualInput, setShowManualInput] = useState(false);
	const [manualInput, setManualInput] = useState("");

	const t = useTranslations("events.checkIn");

	// Use layoutEffect to ensure DOM is ready before attempting initialization
	useLayoutEffect(() => {
		// Ready for initialization
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			// Reset states when dialog is closed
			setIsLoading(true);
			setHasCamera(false);
			setErrorDetails("");
			return;
		}

		const initializeScanner = async (retryCount = 0) => {
			const MAX_RETRIES = 2;

			try {
				setIsLoading(true);
				console.log(
					`[QR Scanner] Initializing scanner (attempt ${retryCount + 1}/${MAX_RETRIES})`,
				);

				// Check for HTTPS requirement with detailed localhost support
				const isLocalHost =
					location.hostname === "localhost" ||
					location.hostname === "127.0.0.1" ||
					location.hostname.startsWith("192.168.") ||
					location.hostname.startsWith("10.") ||
					location.hostname.startsWith("172.");

				if (location.protocol !== "https:" && !isLocalHost) {
					const httpsWarning =
						"摄像头需要 HTTPS 连接。请使用 https:// 访问此页面，或在本地开发时使用 localhost。";
					console.error("[QR Scanner] HTTPS requirement failed:", {
						protocol: location.protocol,
						hostname: location.hostname,
					});
					setErrorDetails(httpsWarning);
					toast.error(httpsWarning);
					setIsLoading(false);
					return;
				}

				// Check if camera is available first
				console.log("[QR Scanner] Checking camera availability...");
				const hasCameraAvailable = await QrScanner.hasCamera();
				setHasCamera(hasCameraAvailable);
				console.log(
					"[QR Scanner] Camera available:",
					hasCameraAvailable,
				);

				if (!hasCameraAvailable) {
					const errorMsg = "设备上未找到可用的摄像头";
					console.error("[QR Scanner] No camera found");
					setErrorDetails(errorMsg);
					toast.error(t("noCameraFound"));
					setIsLoading(false);
					return;
				}

				// Simplified video element initialization - no complex polling
				if (!videoRef.current) {
					throw new Error("Video element not found in DOM");
				}

				console.log(
					"[QR Scanner] Video element found, creating scanner instance...",
				);

				// Create QR scanner instance with optimized settings
				qrScannerRef.current = new QrScanner(
					videoRef.current,
					(result) => {
						console.log(
							"[QR Scanner] QR code detected:",
							result.data,
						);
						handleScanResult(result.data);
					},
					{
						onDecodeError: (err) => {
							// Only log non-NotFoundException errors to avoid spam
							const errorMessage =
								typeof err === "string" ? err : err.message;
							if (errorMessage !== "NotFoundException") {
								console.warn(
									"[QR Scanner] Decode error:",
									errorMessage,
								);
							}
						},
						highlightScanRegion: true,
						highlightCodeOutline: true,
						preferredCamera: "environment", // Prefer back camera
						maxScansPerSecond: 5, // Reduced for better stability
						// Optimized scan region for better QR detection
						calculateScanRegion: (video) => {
							const width = video.videoWidth || 640;
							const height = video.videoHeight || 480;
							const size = Math.min(width, height) * 0.7; // 70% of smaller dimension for better coverage

							const region = {
								x: Math.round((width - size) / 2),
								y: Math.round((height - size) / 2),
								width: Math.round(size),
								height: Math.round(size),
							};

							console.log(
								"[QR Scanner] Calculated scan region:",
								region,
							);
							return region;
						},
					},
				);

				console.log("[QR Scanner] Starting scanner...");
				// Start scanning with enhanced error handling
				try {
					await qrScannerRef.current.start();
					console.log("[QR Scanner] Scanner started successfully");
					setHasCamera(true);
					setIsLoading(false);
				} catch (startError: unknown) {
					const error = startError as Error;
					console.error("[QR Scanner] Failed to start scanner:", {
						name: error.name,
						message: error.message,
					});

					// Check for specific error types and provide detailed feedback
					let errorMsg = "";
					if (
						error.name === "NotAllowedError" ||
						error.message?.includes("permission")
					) {
						errorMsg =
							"摄像头权限被拒绝。请点击地址栏的摄像头图标，选择'始终允许'，然后刷新页面重试。";
					} else if (
						error.name === "NotFoundError" ||
						error.message?.includes("not found")
					) {
						errorMsg =
							"未找到摄像头设备。请确保设备有可用的摄像头。";
					} else if (
						error.name === "NotReadableError" ||
						error.message?.includes("not readable")
					) {
						errorMsg =
							"摄像头被其他应用占用。请关闭其他使用摄像头的应用后重试。";
					} else if (error.message?.includes("secure context")) {
						errorMsg =
							"需要使用 HTTPS 才能访问摄像头。请确保网站使用安全连接。";
					} else {
						errorMsg = `初始化摄像头失败：${error.message || "未知错误"}`;
					}

					setErrorDetails(errorMsg);
					toast.error(errorMsg);

					// Clean up failed scanner instance
					if (qrScannerRef.current) {
						qrScannerRef.current.destroy();
						qrScannerRef.current = null;
					}

					// Retry if not at max attempts for certain errors
					const retryableErrors = [
						"AbortError",
						"InternalError",
						"OverconstrainedError",
					];
					if (
						retryCount < MAX_RETRIES &&
						retryableErrors.includes(error.name)
					) {
						console.log("[QR Scanner] Retrying in 1 second...");
						setTimeout(
							() => initializeScanner(retryCount + 1),
							1000,
						);
						return;
					}

					setIsLoading(false);
				}
			} catch (error) {
				console.error("[QR Scanner] Initialization error:", error);

				// Retry if not at max attempts
				if (retryCount < MAX_RETRIES) {
					console.log(
						"[QR Scanner] Retrying initialization in 1 second...",
					);
					setTimeout(() => initializeScanner(retryCount + 1), 1000);
					return;
				}

				const errorMsg =
					"无法初始化扫码器。请尝试刷新页面或使用手动输入功能。";
				setErrorDetails(errorMsg);
				toast.error(t("cameraInitError"));
				setIsLoading(false);
			}
		};

		// Simple delay to ensure Dialog has rendered
		const timeoutId = setTimeout(() => {
			console.log("[QR Scanner] Starting initialization after delay...");
			initializeScanner();
		}, 200);

		return () => {
			clearTimeout(timeoutId);
			if (qrScannerRef.current) {
				console.log("[QR Scanner] Cleaning up scanner instance...");
				qrScannerRef.current.destroy();
				qrScannerRef.current = null;
			}
		};
	}, [isOpen, t]);

	const handleScanResult = (data: string) => {
		try {
			console.log("[QR Scanner] Raw scan data received:", data);

			// Temporarily pause scanning to prevent duplicate scans
			if (qrScannerRef.current) {
				try {
					qrScannerRef.current.pause();
					console.log("[QR Scanner] Scanner paused for processing");
				} catch (e) {
					console.warn("[QR Scanner] Failed to pause scanner:", e);
				}
			}

			// Validate input data
			if (!data || typeof data !== "string" || data.trim().length === 0) {
				console.error(
					"[QR Scanner] Invalid scan data: empty or not a string",
				);
				toast.error("扫码数据无效，请重试");
				resumeScanning(2000);
				return;
			}

			// Parse the QR code data
			// Expected format: JSON with eventId and userId, or just userId
			let userId: string | null = null;
			let scannedEventId: string | null = null;

			try {
				const parsed = JSON.parse(data.trim());
				console.log("[QR Scanner] Parsed JSON data:", parsed);

				// Validate JSON structure
				if (parsed.eventId && parsed.userId) {
					scannedEventId = parsed.eventId;
					userId = parsed.userId;
					console.log(
						"[QR Scanner] QR code format: JSON with eventId and userId",
					);
				} else if (parsed.userId) {
					userId = parsed.userId;
					console.log(
						"[QR Scanner] QR code format: JSON with userId only",
					);
				} else {
					console.warn(
						"[QR Scanner] JSON format invalid - missing userId",
					);
				}
			} catch (parseError) {
				console.log(
					"[QR Scanner] Not JSON format, treating as plain user ID",
				);
				// If not JSON, treat as plain user ID (backward compatibility)
				userId = data.trim();
			}

			// Validate extracted userId
			if (!userId || userId.length === 0) {
				console.error("[QR Scanner] No valid userId found in QR code");
				toast.error("签到码格式无效：缺少用户ID");
				resumeScanning(2000);
				return;
			}

			// Validate event ID if present
			if (scannedEventId) {
				console.log("[QR Scanner] Validating event ID:", {
					scanned: scannedEventId,
					expected: eventId,
					match: scannedEventId === eventId,
				});

				if (scannedEventId !== eventId) {
					console.error("[QR Scanner] Event ID mismatch");
					toast.error(t("wrongEventQR"), {
						description: "此签到码不是当前活动的签到码",
					});
					resumeScanning(3000);
					return;
				}
			} else {
				console.log(
					"[QR Scanner] No event ID in QR code, proceeding with userId only",
				);
			}

			console.log("[QR Scanner] Processing check-in for userId:", userId);

			// Show success flash animation
			setShowSuccessFlash(true);
			setTimeout(() => setShowSuccessFlash(false), 600);

			// Call the success callback
			onScanSuccess(userId);
			toast.success(t("scanSuccess"), {
				description: t("processingCheckIn"),
			});

			// Play success sound (if browser supports it)
			playSuccessSound();

			// Resume scanning after success animation for continuous scanning
			resumeScanning(800);
		} catch (error) {
			console.error(
				"[QR Scanner] Unexpected error processing QR code:",
				error,
			);
			toast.error(t("qrProcessError"), {
				description: "处理签到码时发生错误，请重试",
			});
			resumeScanning(2000);
		}
	};

	// Helper function to resume scanning with delay
	const resumeScanning = (delayMs: number) => {
		setTimeout(() => {
			if (qrScannerRef.current) {
				try {
					qrScannerRef.current.start();
					console.log("[QR Scanner] Scanner resumed");
				} catch (e) {
					console.warn("[QR Scanner] Failed to resume scanner:", e);
				}
			}
		}, delayMs);
	};

	// Helper function to play success sound
	const playSuccessSound = () => {
		try {
			const audioContext = new (
				window.AudioContext || window.webkitAudioContext
			)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
			oscillator.frequency.setValueAtTime(
				1000,
				audioContext.currentTime + 0.1,
			);
			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + 0.3,
			);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.3);
			console.log("[QR Scanner] Success sound played");
		} catch (e) {
			console.log("[QR Scanner] Could not play success sound:", e);
		}
	};

	const handleManualInput = () => {
		const input = manualInput.trim();

		if (!input) {
			toast.error("请输入签到码");
			return;
		}

		console.log("[QR Scanner] Manual input submitted:", input);

		// Show processing feedback
		toast.info("正在处理手动输入的签到码...", {
			duration: 1000,
		});

		// Process the input using the same logic as QR scanning
		handleScanResult(input);

		// Clear the input after processing
		setManualInput("");
	};

	const handleClose = () => {
		if (qrScannerRef.current) {
			qrScannerRef.current.stop();
		}
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md max-w-[95vw] mx-auto">
				<DialogHeader>
					<DialogTitle>{t("scanQRTitle")}</DialogTitle>
					<DialogDescription>
						{t("scanQRDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center space-y-4">
					{/* Single container for all states - prevents multiple frames */}
					<div className="relative mx-auto w-64 h-64 bg-gray-100 rounded-lg border-2 border-gray-200">
						{/* Loading State */}
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="animate-pulse text-center">
									<p className="text-sm text-gray-500">
										{t("initializingCamera")}
									</p>
								</div>
							</div>
						)}

						{/* Error State */}
						{!hasCamera && !isLoading && (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center p-4">
									<p className="text-sm text-gray-600 mb-2">
										{errorDetails || t("noCameraAvailable")}
									</p>
									{!errorDetails && (
										<p className="text-xs text-gray-500">
											{t("cameraPermissionHelp")}
										</p>
									)}
									{errorDetails && (
										<div className="mt-3 text-xs text-gray-500 space-y-1">
											<p>常见解决方案：</p>
											<p>• 刷新页面重新授权摄像头</p>
											<p>• 检查浏览器摄像头权限设置</p>
											<p>
												• 确保只有一个标签页使用摄像头
											</p>
										</div>
									)}
									{errorDetails && (
										<Button
											variant="outline"
											size="sm"
											className="mt-3"
											onClick={() => {
												setErrorDetails("");
												setIsLoading(true);
												setHasCamera(false);
												// Restart initialization by reloading page
												window.location.reload();
											}}
										>
											重新尝试
										</Button>
									)}
								</div>
							</div>
						)}

						{/* Video Element - Minimal setup, let QR Scanner control everything */}
						<video
							ref={videoRef}
							className="absolute inset-0 w-full h-full object-cover rounded-lg"
							muted
							playsInline
						/>

						{/* Scanning Overlay - Only show when camera is active */}
						{!isLoading && hasCamera && (
							<div
								className={`absolute inset-0 border-2 rounded-lg pointer-events-none transition-all duration-300 ${
									showSuccessFlash
										? "border-green-500 bg-green-500 bg-opacity-20"
										: "border-blue-500"
								}`}
							>
								<div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
								<div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
								<div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
								<div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
							</div>
						)}
					</div>

					<div className="text-center text-sm text-gray-600 px-4">
						<p>{t("scanInstruction")}</p>

						{isLoading && (
							<div className="mt-2 text-xs text-blue-600">
								⏳ 正在初始化摄像头...
							</div>
						)}

						{hasCamera && !isLoading && (
							<div className="mt-2 text-xs text-green-600">
								✅ 摄像头已就绪，请将二维码对准扫描框
								<div className="text-xs text-gray-500 mt-1">
									💡 提示：保持手机稳定，确保二维码清晰可见
								</div>
							</div>
						)}

						{!hasCamera && !isLoading && (
							<div className="mt-2 text-xs text-orange-600">
								❌ 摄像头不可用，请使用手动输入功能
							</div>
						)}

						{showSuccessFlash && (
							<div className="mt-2 text-xs text-green-600 font-semibold animate-pulse">
								🎉 扫码成功！正在处理签到...
							</div>
						)}

						{process.env.NODE_ENV === "development" && (
							<div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
								🔧 调试模式：打开浏览器控制台查看详细日志
								<div className="mt-1 text-gray-500">
									支持格式：JSON或纯文本用户ID
								</div>
							</div>
						)}
					</div>

					{/* Manual Input Section */}
					{!isLoading && (
						<div className="w-full space-y-3 border-t pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setShowManualInput(!showManualInput)
								}
								className="text-xs w-full justify-center"
							>
								{showManualInput
									? "🙈 隐藏手动输入"
									: "⌨️ 扫码有问题？手动输入签到码"}
							</Button>

							{showManualInput && (
								<div className="space-y-2">
									<div className="text-xs text-gray-600 text-center">
										支持格式：JSON {"{"}eventId: "...",
										userId: "..."{"}"} 或纯用户ID
									</div>
									<div className="flex gap-2">
										<input
											type="text"
											value={manualInput}
											onChange={(e) =>
												setManualInput(e.target.value)
											}
											placeholder='例如：{"eventId":"xxx","userId":"yyy"} 或用户ID'
											className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													handleManualInput();
												}
											}}
										/>
										<Button
											size="sm"
											onClick={handleManualInput}
											disabled={!manualInput.trim()}
										>
											签到
										</Button>
									</div>
									<div className="text-xs text-gray-500 text-center">
										💡 提示：可复制粘贴完整的JSON格式签到码
									</div>
								</div>
							)}
						</div>
					)}

					<Button variant="outline" onClick={handleClose}>
						{t("cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
