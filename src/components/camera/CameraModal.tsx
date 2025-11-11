"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Camera,
	X,
	FlipHorizontal,
	Check,
	RotateCcw,
	Plus,
} from "lucide-react";
import { toast } from "sonner";

interface CameraModalProps {
	open: boolean;
	onClose: () => void;
	onCapture: (file: File) => void;
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [isStreaming, setIsStreaming] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [facingMode, setFacingMode] = useState<"user" | "environment">(
		"environment",
	);
	const [continuousMode, setContinuousMode] = useState(true);
	const [capturedCount, setCapturedCount] = useState(0);

	// Start camera stream
	const startCamera = useCallback(async () => {
		try {
			const constraints = {
				video: {
					facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			};

			const stream =
				await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();
				setIsStreaming(true);
			}
		} catch (error) {
			console.error("Error starting camera:", error);
			toast.error("无法启动相机，请检查权限设置");
		}
	}, [facingMode]);

	// Stop camera stream
	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setIsStreaming(false);
	}, []);

	// Convert data URL to file
	const dataURLtoFile = (dataURL: string, filename: string): File => {
		const arr = dataURL.split(",");
		const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);

		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}

		return new File([u8arr], filename, { type: mime });
	};

	// Capture photo - 支持连续拍照和单次拍照
	const capturePhoto = useCallback(() => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) return;

		// Set canvas size to video size
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Get captured image as data URL
		const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
		setCapturedImage(capturedDataUrl);

		// 连续拍照模式：立即上传并快速返回相机
		if (continuousMode) {
			const file = dataURLtoFile(
				capturedDataUrl,
				`photo_${Date.now()}.jpg`,
			);
			// 尽快开始上传，但不等待结果
			onCapture(file);
			setCapturedCount((prev) => {
				const newCount = prev + 1;
				toast.success(`已拍摄 ${newCount} 张照片`, {
					id: "capture-count",
				});
				return newCount;
			});

			// 立即预览并开始上传，然后快速返回相机
			setTimeout(() => {
				setCapturedImage(null);
				// 重新启动相机
				startCamera();
			}, 500); // 减少到0.5秒，更快返回
		} else {
			// 单次拍照模式：停止相机等待用户确认
			stopCamera();
		}
	}, [stopCamera, continuousMode, onCapture, startCamera]);

	// Confirm captured photo (单次拍照模式)
	const confirmCapture = useCallback(() => {
		if (!capturedImage) return;

		const file = dataURLtoFile(capturedImage, `photo_${Date.now()}.jpg`);
		onCapture(file);
		setCapturedImage(null);
		onClose();
	}, [capturedImage, onCapture, onClose]);

	// Retake photo
	const retakePhoto = useCallback(() => {
		setCapturedImage(null);
		startCamera();
	}, [startCamera]);

	// Switch camera (front/back)
	const switchCamera = useCallback(() => {
		stopCamera();
		setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
	}, [stopCamera]);

	// Start camera when modal opens
	useEffect(() => {
		if (open && !capturedImage) {
			startCamera();
		} else if (!open) {
			stopCamera();
			setCapturedImage(null);
			setCapturedCount(0); // Reset counter when closing
		}

		return () => {
			stopCamera();
		};
	}, [open, startCamera, stopCamera, capturedImage]);

	// Restart camera when facing mode changes
	useEffect(() => {
		if (open && isStreaming && !capturedImage) {
			startCamera();
		}
	}, [facingMode, open, isStreaming, capturedImage, startCamera]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className={
					capturedImage
						? "max-w-2xl w-full p-0 overflow-hidden"
						: "md:max-w-md w-full h-full md:h-[70vh] md:max-h-[600px] md:p-0 p-0 overflow-hidden"
				}
			>
				<DialogHeader className="px-4 py-3 border-b z-10 bg-background">
					<div className="flex items-center justify-between">
						<DialogTitle>
							相机拍照
							{capturedCount > 0 && (
								<span className="ml-2 text-sm text-muted-foreground">
									(已拍: {capturedCount})
								</span>
							)}
						</DialogTitle>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{isStreaming && !capturedImage && (
						<div className="flex items-center gap-2 mt-2">
							<input
								type="checkbox"
								id="continuousMode"
								checked={continuousMode}
								onChange={(e) =>
									setContinuousMode(e.target.checked)
								}
								className="h-4 w-4"
							/>
							<label
								htmlFor="continuousMode"
								className="text-sm text-muted-foreground"
							>
								连续拍照模式
							</label>
						</div>
					)}
				</DialogHeader>

				<div className="relative h-[calc(100vh-56px)] md:h-[calc(70vh-56px)] md:max-h-[544px] bg-black flex items-center justify-center">
					{capturedImage ? (
						<img
							src={capturedImage}
							alt="Captured"
							className={`w-full h-full ${continuousMode ? "hidden" : "object-contain"}`}
						/>
					) : (
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-full object-cover"
						/>
					)}

					<canvas ref={canvasRef} className="hidden" />

					{capturedImage ? (
						!continuousMode && (
							<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
								<Button
									variant="outline"
									size="lg"
									onClick={retakePhoto}
									className="flex-1 md:flex-none bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
								>
									<RotateCcw className="h-4 w-4 mr-2" />
									重拍
								</Button>
								<Button
									size="lg"
									onClick={confirmCapture}
									className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
								>
									<Check className="h-4 w-4 mr-2" />
									使用照片
								</Button>
							</div>
						)
					) : (
						<div className="absolute bottom-6 md:bottom-4 left-0 right-0 flex justify-center">
							{isStreaming && (
								<div className="flex items-center gap-4">
									<Button
										variant="outline"
										size="icon"
										onClick={switchCamera}
										className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 w-12 h-12"
										title={
											facingMode === "user"
												? "切换到后置摄像头"
												: "切换到前置摄像头"
										}
									>
										<FlipHorizontal className="h-5 w-5" />
									</Button>

									<Button
										size="lg"
										onClick={capturePhoto}
										className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-white border-4 border-white/30 hover:bg-white/90 text-black shadow-lg"
									>
										<Camera className="h-8 w-8 md:h-6 md:w-6" />
									</Button>

									<div className="w-12 h-12" />
								</div>
							)}

							{!isStreaming && (
								<div className="text-white text-center">
									<Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
									<p className="text-sm opacity-70">
										启动相机中...
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
