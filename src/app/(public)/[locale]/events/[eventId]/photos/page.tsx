"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Grid3x3, User, Upload, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import Image from "next/image";
import { config } from "@/config";
import { buildPublicUrl } from "@/lib/uploads/client";

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

// Format relative time
function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor(now.getTime() - date.getTime()) / 1000;

	if (diffInSeconds < 60) {
		return "刚刚";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}分钟前`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}小时前`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays}天前`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks}周前`;
	}

	// More than 4 weeks, show date
	return date.toLocaleDateString("zh-CN", {
		month: "short",
		day: "numeric",
	});
}

interface PhotosResponse {
	success: boolean;
	data: { photos: Photo[]; nextCursor?: string | null };
}

export default function EventPhotosPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const queryClient = useQueryClient();

	const eventId = params.eventId as string;
	const locale = params.locale as string;
	const [uploadOpen, setUploadOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadingFileName, setUploadingFileName] = useState<string | null>(
		null,
	);
	const [uploadingFileIndex, setUploadingFileIndex] = useState(0);
	const [uploadingTotalFiles, setUploadingTotalFiles] = useState(0);
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [groupBy, setGroupBy] = useState<"none" | "photographer">("none");
	const allPhotosLoadMoreRef = useRef<HTMLDivElement | null>(null);
	const myPhotosLoadMoreRef = useRef<HTMLDivElement | null>(null);

	// Fetch event information for sharing
	const { data: eventData } = useQuery({
		queryKey: ["event", eventId],
		queryFn: async () => {
			const res = await fetch(`/api/events/${eventId}`);
			if (!res.ok) {
				throw new Error("获取活动信息失败");
			}
			return res.json();
		},
		retry: 1,
	});

	// Check if user is registered for the event
	const { data: registrationData } = useQuery({
		queryKey: ["event-registration", eventId],
		queryFn: async () => {
			if (!session?.user) {
				return { isRegistered: false };
			}
			const res = await fetch(`/api/events/${eventId}/registration`);
			if (!res.ok) {
				return { isRegistered: false };
			}
			const data = await res.json();
			return { isRegistered: !!data.data }; // Check if registration exists
		},
		enabled: !!session?.user,
		retry: 1,
	});

	// Fetch all photos
	const {
		data: allPhotosPages,
		isLoading: allPhotosLoading,
		isFetchingNextPage: isFetchingMorePhotos,
		error: allPhotosErrorRaw,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery<PhotosResponse, Error>({
		queryKey: ["event-photos", eventId],
		queryFn: async ({ pageParam }) => {
			const searchParams = new URLSearchParams({
				limit: "24",
			});

			if (typeof pageParam === "string" && pageParam.length > 0) {
				searchParams.set("cursor", pageParam);
			}

			const res = await fetch(
				`/api/events/${eventId}/photos?${searchParams.toString()}`,
			);
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "获取照片失败");
			}
			return res.json();
		},
		getNextPageParam: (lastPage) => lastPage?.data?.nextCursor ?? undefined,
		initialPageParam: undefined,
		retry: 2,
		retryDelay: 1000,
	});

	// Fetch my photos
	const {
		data: myPhotosPages,
		isLoading: myPhotosLoading,
		error: myPhotosErrorRaw,
		isFetchingNextPage: isFetchingMoreMyPhotos,
		fetchNextPage: fetchNextMyPhotos,
		hasNextPage: hasMoreMyPhotos,
	} = useInfiniteQuery<PhotosResponse, Error>({
		queryKey: ["my-event-photos", eventId],
		queryFn: async ({ pageParam }) => {
			const searchParams = new URLSearchParams({
				limit: "24",
			});

			if (typeof pageParam === "string" && pageParam.length > 0) {
				searchParams.set("cursor", pageParam);
			}

			const res = await fetch(
				`/api/events/${eventId}/photos/my?${searchParams.toString()}`,
			);
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "获取我的照片失败");
			}
			return res.json();
		},
		enabled: !!session?.user,
		getNextPageParam: (lastPage) => lastPage?.data?.nextCursor ?? undefined,
		initialPageParam: undefined,
		retry: 2,
		retryDelay: 1000,
	});

	const allPhotos =
		allPhotosPages?.pages.flatMap((page) => page.data.photos) || [];
	const myPhotos =
		myPhotosPages?.pages.flatMap((page) => page.data.photos) || [];
	const allPhotosError = allPhotosErrorRaw ?? null;
	const myPhotosError = myPhotosErrorRaw ?? null;

	useEffect(() => {
		const target = allPhotosLoadMoreRef.current;
		if (!target) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (
					entry.isIntersecting &&
					hasNextPage &&
					!isFetchingMorePhotos
				) {
					fetchNextPage();
				}
			},
			{ rootMargin: "320px" },
		);

		observer.observe(target);

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingMorePhotos]);

	useEffect(() => {
		const target = myPhotosLoadMoreRef.current;
		if (!target) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (
					entry.isIntersecting &&
					hasMoreMyPhotos &&
					!isFetchingMoreMyPhotos
				) {
					fetchNextMyPhotos();
				}
			},
			{ rootMargin: "320px" },
		);

		observer.observe(target);

		return () => observer.disconnect();
	}, [fetchNextMyPhotos, hasMoreMyPhotos, isFetchingMoreMyPhotos]);

	// Check upload permission
	const checkUploadPermission = useCallback(() => {
		// Check if user is logged in
		if (!session?.user) {
			toast.error("请先登录后再上传照片", {
				action: {
					label: "去登录",
					onClick: () =>
						router.push(
							`/${locale}/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`,
						),
				},
			});
			return false;
		}

		// Check if user is registered for the event
		const isRegistered = registrationData?.isRegistered;
		if (!isRegistered) {
			toast.error("您需要报名参加活动后才能上传照片", {
				action: {
					label: "去报名",
					onClick: () =>
						router.push(`/${locale}/events/${eventId}/register`),
				},
			});
			return false;
		}

		return true;
	}, [session, registrationData, router, eventId, locale]);

	const uploadToSignedUrl = (
		signedUrl: string,
		file: File,
		onProgress?: (loaded: number, total?: number) => void,
	) =>
		new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("PUT", signedUrl, true);

			if (file.type) {
				xhr.setRequestHeader("Content-Type", file.type);
			}

			xhr.upload.onprogress = (event) => {
				if (onProgress) {
					onProgress(
						event.loaded,
						event.lengthComputable ? event.total : undefined,
					);
				}
			};

			xhr.onerror = () => reject(new Error("图片上传失败，请重试"));
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve();
				} else {
					reject(new Error("图片上传失败，请重试"));
				}
			};

			xhr.send(file);
		});

	// Handle file upload (shared logic)
	const uploadFile = async (
		file: File,
		onProgress?: (loaded: number, total?: number) => void,
	) => {
		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			throw new Error("图片大小不能超过10MB");
		}

		// Check file type
		if (!file.type.startsWith("image/")) {
			throw new Error("请选择图片文件");
		}

		try {
			// Generate unique path for the file
			const timestamp = Date.now();
			const randomStr = Math.random().toString(36).substring(2, 8);
			const extension =
				file.name.split(".").pop()?.toLowerCase() || "jpg";
			const fileName = `events/${eventId}/photos/${timestamp}_${randomStr}.${extension}`;

			const searchParams = new URLSearchParams({
				bucket: config.storage.bucketNames.public,
				path: fileName,
			});

			if (file.type) {
				searchParams.set("contentType", file.type);
			}

			// Get signed upload URL to let the client upload directly to S3
			const signedUrlRes = await fetch(
				`/api/uploads/signed-upload-url?${searchParams.toString()}`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			if (!signedUrlRes.ok) {
				const errorData = await signedUrlRes.json().catch(() => ({}));
				throw new Error(
					errorData.error || errorData.message || "获取上传地址失败",
				);
			}

			const { signedUrl, publicUrl } = (await signedUrlRes.json()) as {
				signedUrl?: string;
				publicUrl?: string;
			};

			if (!signedUrl) {
				throw new Error("获取上传地址失败");
			}

			await uploadToSignedUrl(signedUrl, file, onProgress);

			const fileUrl =
				publicUrl ??
				buildPublicUrl(
					fileName,
					config.storage.endpoints.public,
					signedUrl,
				);

			// Then submit to photos API
			const submitRes = await fetch(`/api/events/${eventId}/photos`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: fileUrl }),
			});

			if (!submitRes.ok) {
				const errorData = await submitRes.json().catch(() => ({}));
				throw new Error(errorData.error || "提交照片失败");
			}

			return submitRes.json();
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("上传失败，请检查网络连接");
		}
	};

	// Handle image upload from file input (supports multiple files) - 带上传进度
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		const fileArray = Array.from(files);
		const totalFiles = fileArray.length;
		const totalBytes = fileArray.reduce((sum, file) => sum + file.size, 0);
		let uploadedBytes = 0;

		setUploadProgress(0);
		setUploadingTotalFiles(totalFiles);
		setUploadingFileIndex(0);
		setUploadingFileName(null);

		// 立即关闭上传对话框，在后台上传
		setUploadOpen(false);

		try {
			// 显示开始上传提示
			if (totalFiles > 1) {
				toast.info(`开始上传 ${totalFiles} 张照片，将在后台完成...`);
			}

			// 逐个上传文件，带进度
			const results: Array<PromiseSettledResult<unknown>> = [];

			for (let i = 0; i < fileArray.length; i++) {
				const file = fileArray[i];
				setUploadingFileName(file.name);
				setUploadingFileIndex(i + 1);

				const updateProgress = (loaded: number, total?: number) => {
					const currentLoaded = Math.min(
						loaded,
						typeof total === "number" ? total : file.size,
					);
					const overallLoaded = uploadedBytes + currentLoaded;
					const percent =
						totalBytes === 0
							? 100
							: Math.min(
									100,
									Math.round(
										(overallLoaded / totalBytes) * 100,
									),
								);
					setUploadProgress(percent);
				};

				try {
					const value = await uploadFile(file, updateProgress);
					results.push({ status: "fulfilled", value });
				} catch (error) {
					results.push({ status: "rejected", reason: error });
				} finally {
					uploadedBytes += file.size;
					const percent =
						totalBytes === 0
							? 100
							: Math.min(
									100,
									Math.round(
										(uploadedBytes / totalBytes) * 100,
									),
								);
					setUploadProgress(percent);
				}
			}
			setUploadingFileName(null);

			const successCount = results.filter(
				(r) => r.status === "fulfilled",
			).length;
			const failCount = results.filter(
				(r) => r.status === "rejected",
			).length;

			// 如果有失败，显示哪些文件失败了
			const errors: string[] = [];
			results.forEach((result, index) => {
				if (
					result.status === "rejected" &&
					result.reason instanceof Error
				) {
					errors.push(
						`文件 ${fileArray[index].name}: ${result.reason.message}`,
					);
				}
			});

			if (successCount > 0) {
				const message =
					totalFiles === 1
						? "照片上传成功！"
						: `成功上传 ${successCount} 张照片${failCount > 0 ? `，${failCount} 张失败` : ""}`;
				toast.success(message);

				// Invalidate queries to refresh photos
				queryClient.invalidateQueries({
					queryKey: ["event-photos", eventId],
				});
				queryClient.invalidateQueries({
					queryKey: ["my-event-photos", eventId],
				});
			} else {
				// All failed
				const errorMsg =
					errors.length > 0
						? `上传失败: ${errors[0]}`
						: "所有文件上传失败，请重试";
				toast.error(errorMsg);
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("上传失败，请重试");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			setUploadingFileName(null);
			setUploadingFileIndex(0);
			setUploadingTotalFiles(0);
			// Reset input
			event.target.value = "";
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

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "删除失败");
			}

			toast.success("照片已删除");
			queryClient.invalidateQueries({
				queryKey: ["event-photos", eventId],
			});
			queryClient.invalidateQueries({
				queryKey: ["my-event-photos", eventId],
			});
		} catch (error) {
			console.error("Delete error:", error);
			toast.error(
				error instanceof Error ? error.message : "删除失败，请重试",
			);
		}
	};

	// Share album
	const handleShare = async () => {
		const url = window.location.href;
		const eventTitle = eventData?.data?.title || "活动";
		const shareText = `活动【${eventTitle}】现场照片来啦！${url}`;

		try {
			if (navigator.share) {
				await navigator.share({
					title: "活动相册",
					text: shareText,
					url,
				});
			} else {
				await navigator.clipboard.writeText(shareText);
				toast.success("分享文案已复制到剪贴板");
			}
		} catch {
			toast.error("分享失败");
		}
	};

	const PhotoGrid = ({
		photos,
		loading,
		canDelete,
		error,
		sortBy,
		groupBy,
		loadMoreRef,
		isFetchingMore,
		hasMore,
	}: {
		photos: Photo[];
		loading: boolean;
		canDelete?: boolean;
		error?: Error | null;
		sortBy?: "newest" | "oldest";
		groupBy?: "none" | "photographer";
		loadMoreRef?: React.RefObject<HTMLDivElement | null>;
		isFetchingMore?: boolean;
		hasMore?: boolean;
	}) => {
		const renderLoadMore = () => {
			if (!loadMoreRef) return null;
			if (!hasMore && !isFetchingMore) return null;

			return (
				<div
					ref={(node) => {
						if (loadMoreRef) {
							loadMoreRef.current = node;
						}
					}}
					className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
				>
					{isFetchingMore ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>加载更多照片...</span>
						</>
					) : (
						<span>继续下滑加载更多</span>
					)}
				</div>
			);
		};

		if (loading) {
			return (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="text-destructive mb-4">
						<svg
							className="h-12 w-12 mx-auto"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<p className="text-muted-foreground mb-2">
						{error.message || "加载照片失败"}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							queryClient.invalidateQueries({
								queryKey: ["event-photos", eventId],
							});
							queryClient.invalidateQueries({
								queryKey: ["my-event-photos", eventId],
							});
						}}
					>
						重试
					</Button>
				</div>
			);
		}

		if (photos.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Grid3x3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-muted-foreground">还没有照片</p>
					<p className="text-sm text-muted-foreground/70 mt-2">
						成为第一个上传照片的人！
					</p>
				</div>
			);
		}

		// Sort photos
		const sortedPhotos = [...photos];
		if (sortBy === "newest") {
			sortedPhotos.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			);
		} else if (sortBy === "oldest") {
			sortedPhotos.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() -
					new Date(b.createdAt).getTime(),
			);
		}

		// Group photos by photographer or just display grid
		if (groupBy === "photographer") {
			// Group photos by user
			const groupedPhotos = sortedPhotos.reduce(
				(acc, photo) => {
					const userId = photo.user.id;
					const userName = photo.user.name;
					if (!acc[userId]) {
						acc[userId] = {
							user: photo.user,
							photos: [],
						};
					}
					acc[userId].photos.push(photo);
					return acc;
				},
				{} as Record<string, { user: Photo["user"]; photos: Photo[] }>,
			);

			// Sort groups by user name
			const sortedGroups = Object.values(groupedPhotos).sort((a, b) =>
				a.user.name.localeCompare(b.user.name),
			);

			return (
				<div className="space-y-8">
					{sortedGroups.map((group) => (
						<div key={group.user.id}>
							<div className="flex items-center gap-3 mb-4">
								{group.user.image ? (
									<Image
										src={group.user.image}
										alt={group.user.name}
										width={32}
										height={32}
										className="rounded-full object-cover border"
									/>
								) : (
									<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
										<User className="h-4 w-4" />
									</div>
								)}
								<h3 className="font-medium text-foreground">
									{group.user.name}
									<span className="text-sm text-muted-foreground ml-2">
										({group.photos.length} 张)
									</span>
								</h3>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								{group.photos.map((photo) => (
									<div
										key={photo.id}
										className="relative group aspect-square overflow-hidden rounded-lg border bg-muted"
									>
										<Image
											src={photo.imageUrl}
											alt={photo.caption || "活动照片"}
											fill
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
											className="object-cover cursor-pointer transition-transform hover:scale-105"
											onClick={() =>
												setSelectedImage(photo.imageUrl)
											}
											loading="lazy"
										/>
										{canDelete && (
											<Button
												variant="destructive"
												size="sm"
												className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
												onClick={() =>
													handleDeletePhoto(photo.id)
												}
											>
												×
											</Button>
										)}
										<div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
											{formatRelativeTime(
												photo.createdAt,
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
					{renderLoadMore()}
				</div>
			);
		}

		// Default grid view
		return (
			<>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{sortedPhotos.map((photo) => (
						<div
							key={photo.id}
							className="relative group aspect-square overflow-hidden rounded-lg border bg-muted"
						>
							<Image
								src={photo.imageUrl}
								alt={photo.caption || "活动照片"}
								fill
								sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
								className="object-cover cursor-pointer transition-transform hover:scale-105"
								onClick={() => setSelectedImage(photo.imageUrl)}
								loading="lazy"
							/>
							{canDelete && (
								<Button
									variant="destructive"
									size="sm"
									className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
									onClick={() => handleDeletePhoto(photo.id)}
								>
									×
								</Button>
							)}
							{/* Time label */}
							<div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
								{formatRelativeTime(photo.createdAt)}
							</div>
						</div>
					))}
				</div>
				{renderLoadMore()}
			</>
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
						onClick={() =>
							router.push(`/${locale}/events/${eventId}`)
						}
					>
						← 返回活动
					</Button>
					<h1 className="font-semibold">活动相册</h1>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleShare}
							title="分享"
						>
							<Share2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="p-4 pb-24">
				<Tabs defaultValue="all" className="w-full">
					<div className="bg-card rounded-xl p-1 mb-4">
						<TabsList className="grid w-full grid-cols-2 h-auto bg-transparent">
							<TabsTrigger
								value="all"
								className="data-[state=active]:bg-background py-2 pl-4 pr-5 rounded-lg"
							>
								<Grid3x3 className="h-4 w-4 mr-2" />
								所有照片
							</TabsTrigger>
							<TabsTrigger
								value="my"
								disabled={!session?.user}
								className="data-[state=active]:bg-background py-2 pl-4 pr-5 rounded-lg disabled:opacity-50"
							>
								<User className="h-4 w-4 mr-2" />
								我的照片
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="mb-4">
						<TabsContent value="all">
							{/* Controls for all photos */}
							<div className="flex flex-wrap items-center gap-2 mb-4">
								<div className="flex items-center gap-1 bg-background rounded-lg p-1 border">
									<button
										onClick={() => setSortBy("newest")}
										className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
											sortBy === "newest"
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										最新上传
									</button>
									<button
										onClick={() => setSortBy("oldest")}
										className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
											sortBy === "oldest"
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										最早上传
									</button>
								</div>

								<div className="flex items-center gap-1 bg-background rounded-lg p-1 border">
									<button
										onClick={() => setGroupBy("none")}
										className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
											groupBy === "none"
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										网格视图
									</button>
									<button
										onClick={() =>
											setGroupBy("photographer")
										}
										className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
											groupBy === "photographer"
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										按拍摄者分组
									</button>
								</div>
							</div>

							<PhotoGrid
								photos={allPhotos}
								loading={
									allPhotosLoading && !isFetchingMorePhotos
								}
								error={allPhotosError}
								sortBy={sortBy}
								groupBy={groupBy}
								loadMoreRef={allPhotosLoadMoreRef}
								isFetchingMore={isFetchingMorePhotos}
								hasMore={Boolean(hasNextPage)}
							/>
						</TabsContent>

						<TabsContent value="my">
							<PhotoGrid
								photos={myPhotos}
								loading={
									myPhotosLoading && !isFetchingMoreMyPhotos
								}
								canDelete={true}
								error={myPhotosError}
								sortBy="newest"
								groupBy="none"
								loadMoreRef={myPhotosLoadMoreRef}
								isFetchingMore={isFetchingMoreMyPhotos}
								hasMore={Boolean(hasMoreMyPhotos)}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</div>

			{isUploading && (
				<div className="fixed bottom-24 left-0 right-0 z-40 px-4">
					<div className="mx-auto max-w-lg rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
						<div className="flex items-center justify-between text-sm font-medium">
							<span>
								正在上传照片
								{uploadingTotalFiles > 0
									? ` (${uploadingFileIndex}/${uploadingTotalFiles})`
									: ""}
							</span>
							<span className="text-primary">
								{uploadProgress}%
							</span>
						</div>
						<p className="mt-1 truncate text-xs text-muted-foreground">
							{uploadingFileName
								? `当前：${uploadingFileName}`
								: "准备上传..."}
						</p>
						<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full bg-primary transition-[width] duration-200"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Upload Button */}
			<div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 sm:gap-4 px-4">
				<Dialog
					open={uploadOpen}
					onOpenChange={(open) => {
						if (open && !checkUploadPermission()) {
							return;
						}
						setUploadOpen(open);
					}}
				>
					<DialogTrigger asChild>
						<Button
							className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base shadow-lg"
							disabled={isUploading}
						>
							<Upload className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
							{isUploading ? "上传中..." : "上传照片"}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>从相册上传</DialogTitle>
						</DialogHeader>
						<div className="py-4">
							<label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<Upload className="w-10 h-10 text-muted-foreground mb-4" />
									<p className="text-sm font-medium text-foreground">
										点击选择图片或拖拽到此处
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										支持 JPG、PNG、WEBP 格式，单个文件最大
										10MB
									</p>
								</div>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									disabled={isUploading}
									className="hidden"
								/>
							</label>
						</div>
						{isUploading && (
							<div className="w-full h-1 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-[width] duration-200"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>

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
