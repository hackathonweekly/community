"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Grid3x3, User, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";

interface Photo {
	id: string;
	imageUrl: string;
	originalUrl?: string;
	caption?: string | null;
	createdAt: string;
	user: {
		id: string;
		name: string;
		image?: string | null;
		username?: string | null;
	};
}

interface PhotosResponse {
	success: boolean;
	data: { photos: Photo[] };
}

export default function EventPhotosPage() {
	const params = useParams();
	const router = useRouter();
	const t = useTranslations();
	const { data: session } = useSession();
	const queryClient = useQueryClient();

	const eventId = params.eventId as string;
	const [uploadOpen, setUploadOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	// Fetch all photos
	const { data: allPhotosData, isLoading: allPhotosLoading } =
		useQuery<PhotosResponse>({
			queryKey: ["event-photos", eventId],
			queryFn: async () => {
				const res = await fetch(`/api/events/${eventId}/photos`);
				if (!res.ok) throw new Error("Failed to fetch photos");
				return res.json();
			},
		});

	// Fetch my photos
	const { data: myPhotosData, isLoading: myPhotosLoading } =
		useQuery<PhotosResponse>({
			queryKey: ["my-event-photos", eventId],
			queryFn: async () => {
				const res = await fetch(`/api/events/${eventId}/photos/my`);
				if (!res.ok) throw new Error("Failed to fetch my photos");
				return res.json();
			},
			enabled: !!session?.user,
		});

	const allPhotos = allPhotosData?.data.photos || [];
	const myPhotos = myPhotosData?.data.photos || [];

	// Handle image upload
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("图片大小不能超过10MB");
			return;
		}

		// Check file type
		if (!file.type.startsWith("image/")) {
			toast.error("请选择图片文件");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);

		try {
			// First upload to get URL
			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadRes.ok) throw new Error("上传失败");

			const { url } = await uploadRes.json();

			// Then submit to photos API
			const submitRes = await fetch(`/api/events/${eventId}/photos`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: url }),
			});

			if (!submitRes.ok) throw new Error("提交失败");

			toast.success("照片上传成功！");

			// Invalidate queries to refresh
			queryClient.invalidateQueries({
				queryKey: ["event-photos", eventId],
			});
			queryClient.invalidateQueries({
				queryKey: ["my-event-photos", eventId],
			});

			setUploadOpen(false);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("上传失败，请重试");
		}
	};

	// Handle photo delete
	const handleDeletePhoto = async (photoId: string) => {
		if (!confirm("确定要删除这张照片吗？")) return;

		try {
			const res = await fetch(`/api/events/${eventId}/photos`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ photoId }),
			});

			if (!res.ok) throw new Error("删除失败");

			toast.success("照片删除成功");
			queryClient.invalidateQueries({
				queryKey: ["event-photos", eventId],
			});
			queryClient.invalidateQueries({
				queryKey: ["my-event-photos", eventId],
			});
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("删除失败");
		}
	};

	// Share album
	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: "活动相册",
					url,
				});
			} else {
				await navigator.clipboard.writeText(url);
				toast.success("链接已复制到剪贴板");
			}
		} catch {
			toast.error("分享失败");
		}
	};

	// Open camera
	const handleOpenCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});
			// In a real implementation, you'd open a camera modal/component here
			// For now, just show a message
			toast.info("相机功能即将实现");
			stream.getTracks().forEach((track) => track.stop());
		} catch (error) {
			toast.error("无法访问相机，请检查权限设置");
		}
	};

	const PhotoGrid = ({
		photos,
		loading,
		canDelete,
	}: {
		photos: Photo[];
		loading: boolean;
		canDelete?: boolean;
	}) => {
		if (loading) {
			return (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			);
		}

		if (photos.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Grid3x3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-muted-foreground">
						{t("No photos yet")}
					</p>
					<p className="text-sm text-muted-foreground/70 mt-2">
						{t("Be the first to upload a photo!")}
					</p>
				</div>
			);
		}

		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{photos.map((photo) => (
					<div
						key={photo.id}
						className="relative group aspect-square overflow-hidden rounded-lg border"
					>
						<img
							src={photo.imageUrl}
							alt={photo.caption || "Photo"}
							className="h-full w-full object-cover cursor-pointer"
							onClick={() => setSelectedImage(photo.imageUrl)}
						/>
						{canDelete && (
							<Button
								variant="destructive"
								size="sm"
								className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => handleDeletePhoto(photo.id)}
							>
								×
							</Button>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex items-center justify-between h-14 px-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.back()}
					>
						← {t("Back")}
					</Button>
					<h1 className="font-semibold">{t("Event Photo Album")}</h1>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleShare}
							title={t("Share")}
						>
							📤
						</Button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="p-4">
				<Tabs defaultValue="all" className="w-full">
					<TabsList className="grid w-full grid-cols-2 mb-4">
						<TabsTrigger value="all">
							<Grid3x3 className="h-4 w-4 mr-2" />
							{t("All Photos")}
						</TabsTrigger>
						<TabsTrigger value="my" disabled={!session?.user}>
							<User className="h-4 w-4 mr-2" />
							{t("My Photos")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="all">
						<PhotoGrid
							photos={allPhotos}
							loading={allPhotosLoading}
						/>
					</TabsContent>

					<TabsContent value="my">
						<PhotoGrid
							photos={myPhotos}
							loading={myPhotosLoading}
							canDelete={true}
						/>
					</TabsContent>
				</Tabs>
			</div>

			{/* Upload & Camera Buttons */}
			{session?.user && (
				<div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
					<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
						<DialogTrigger asChild>
							<Button className="rounded-full px-6">
								<Upload className="h-4 w-4 mr-2" />
								{t("Upload Photo")}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{t("Upload from Gallery")}
								</DialogTitle>
							</DialogHeader>
							<div className="py-4">
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="w-full"
								/>
							</div>
						</DialogContent>
					</Dialog>

					<Button
						className="rounded-full px-6"
						onClick={handleOpenCamera}
					>
						<Camera className="h-4 w-4 mr-2" />
						{t("Camera")}
					</Button>
				</div>
			)}

			{/* Image Preview Modal */}
			{selectedImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
					onClick={() => setSelectedImage(null)}
				>
					<img
						src={selectedImage}
						alt="Preview"
						className="max-w-full max-h-full object-contain"
					/>
				</div>
			)}
		</div>
	);
}
