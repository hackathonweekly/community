"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Grid3x3, User, Upload, Share2, Download } from "lucide-react";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Button } from "@community/ui/ui/button";
import {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from "@community/ui/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Switch } from "@community/ui/ui/switch";
import { useSession } from "@community/lib-client/auth/client";
import { toast } from "sonner";
import Image from "next/image";
import { config } from "@community/config";
import { buildPublicUrl } from "@community/lib-client/uploads/client";
import { cn } from "@community/lib-shared/utils";
import { useConfirmationAlert } from "@/modules/shared/components/ConfirmationAlertProvider";

interface Photo {
	id: string;
	imageUrl: string;
	thumbnailUrl?: string | null;
	originalUrl?: string | null;
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
	const { confirm } = useConfirmationAlert();

	const eventId = params.eventId as string;
	const [activeTab, setActiveTab] = useState<"all" | "my">("all");
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
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
		new Set(),
	);
	const [isBatchDeleting, setIsBatchDeleting] = useState(false);
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

	// Check if user can upload
	const canUpload = !!session?.user && !!registrationData?.isRegistered;

	useEffect(() => {
		const target = allPhotosLoadMoreRef.current;
		if (!target || !hasNextPage) return;

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
			{ rootMargin: "480px", threshold: 0.01 },
		);

		observer.observe(target);

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingMorePhotos]);

	useEffect(() => {
		const target = myPhotosLoadMoreRef.current;
		if (!target || !hasMoreMyPhotos) return;

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
			{ rootMargin: "480px", threshold: 0.01 },
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
							`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`,
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
					onClick: () => router.push(`/events/${eventId}/register`),
				},
			});
			return false;
		}

		return true;
	}, [session, registrationData, router, eventId]);

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

	const clearSelection = () => {
		setSelectionMode(false);
		setSelectedPhotoIds(new Set());
	};

	// Handle photo delete
	const handleDeletePhoto = async (photoId: string) => {
		confirm({
			title: "确定要删除这张照片吗？",
			destructive: true,
			onConfirm: async () => {
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
						error instanceof Error
							? error.message
							: "删除失败，请重试",
					);
				}
			},
		});
	};

	const handleBatchDelete = async () => {
		const ids = Array.from(selectedPhotoIds);
		if (ids.length === 0) {
			toast.error("请先选择要删除的照片");
			return;
		}
		confirm({
			title: `确定删除选中的 ${ids.length} 张照片吗？`,
			destructive: true,
			onConfirm: async () => {
				setIsBatchDeleting(true);

				try {
					await Promise.all(
						ids.map(async (photoId) => {
							const res = await fetch(
								`/api/events/${eventId}/photos`,
								{
									method: "DELETE",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ photoId }),
								},
							);
							if (!res.ok) {
								const errorData = await res
									.json()
									.catch(() => ({}));
								throw new Error(errorData.error || "删除失败");
							}
						}),
					);

					toast.success(`已删除 ${ids.length} 张照片`);
					clearSelection();
					queryClient.invalidateQueries({
						queryKey: ["event-photos", eventId],
					});
					queryClient.invalidateQueries({
						queryKey: ["my-event-photos", eventId],
					});
				} catch (error) {
					console.error("Batch delete error:", error);
					toast.error(
						error instanceof Error
							? error.message
							: "删除失败，请重试",
					);
				} finally {
					setIsBatchDeleting(false);
				}
			},
		});
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
		selectionMode: selectionModeProp = false,
		selectedPhotoIds: selectedPhotoIdsProp = new Set<string>(),
		onToggleSelect,
		onManualLoadMore,
		viewMode: viewModeProp = "grid",
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
		selectionMode?: boolean;
		selectedPhotoIds?: Set<string>;
		onToggleSelect?: (photoId: string) => void;
		onManualLoadMore?: () => void;
		viewMode?: "grid" | "list";
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
					className="flex flex-col items-center justify-center gap-3 py-6 text-sm text-muted-foreground"
				>
					{isFetchingMore ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>加载更多照片...</span>
						</>
					) : (
						<>
							<span>继续下滑加载更多</span>
							<Button
								variant="outline"
								size="sm"
								onClick={onManualLoadMore}
								disabled={!hasMore || isFetchingMore}
							>
								点击加载更多
							</Button>
						</>
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
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
						<Grid3x3 className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="font-brand text-lg font-bold text-foreground">
						还没有照片
					</p>
					<p className="text-sm text-muted-foreground mt-2">
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
								{group.photos.map((photo) => {
									const displayUrl = photo.imageUrl;
									const thumbnailUrl =
										photo.thumbnailUrl || displayUrl;

									return (
										<div
											key={photo.id}
											className="relative group aspect-square overflow-hidden rounded-lg border bg-muted"
										>
											<Image
												src={thumbnailUrl}
												alt={
													photo.caption || "活动照片"
												}
												fill
												sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
												className="object-cover cursor-pointer transition-transform hover:scale-105"
												onClick={() =>
													setSelectedImage(displayUrl)
												}
												loading="lazy"
											/>
											{canDelete && (
												<Button
													variant="destructive"
													size="sm"
													className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
													onClick={() =>
														handleDeletePhoto(
															photo.id,
														)
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
									);
								})}
							</div>
						</div>
					))}
					{renderLoadMore()}
				</div>
			);
		}

		if (viewModeProp === "list") {
			return (
				<>
					<div className="space-y-3">
						{sortedPhotos.map((photo) => {
							const isSelected =
								selectionModeProp &&
								selectedPhotoIdsProp.has(photo.id);
							const displayUrl = photo.imageUrl;
							const thumbnailUrl =
								photo.thumbnailUrl || displayUrl;

							return (
								<div
									key={photo.id}
									className={cn(
										"flex items-center gap-3 rounded-lg border bg-muted/40 p-2 pr-3",
										isSelected
											? "ring-2 ring-primary/70"
											: "",
									)}
								>
									<div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
										<Image
											src={thumbnailUrl}
											alt={photo.caption || "活动照片"}
											fill
											sizes="80px"
											className="object-cover cursor-pointer"
											onClick={() =>
												setSelectedImage(displayUrl)
											}
										/>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium truncate">
												{photo.caption || "未添加描述"}
											</p>
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(
													photo.createdAt,
												)}
											</span>
										</div>
										<p className="text-xs text-muted-foreground truncate">
											{photo.user?.name}
										</p>
									</div>
									{selectionModeProp && onToggleSelect ? (
										<Checkbox
											checked={isSelected}
											onCheckedChange={() =>
												onToggleSelect(photo.id)
											}
										/>
									) : null}
									{canDelete && !selectionModeProp && (
										<Button
											variant="destructive"
											size="sm"
											onClick={() =>
												handleDeletePhoto(photo.id)
											}
										>
											删除
										</Button>
									)}
								</div>
							);
						})}
					</div>
					{renderLoadMore()}
				</>
			);
		}

		// Default grid view
		return (
			<>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{sortedPhotos.map((photo) => {
						const isSelected =
							selectionModeProp &&
							selectedPhotoIdsProp.has(photo.id);
						const displayUrl = photo.imageUrl;
						const thumbnailUrl = photo.thumbnailUrl || displayUrl;

						return (
							<div
								key={photo.id}
								className={cn(
									"relative group aspect-square overflow-hidden rounded-lg border bg-muted",
									isSelected ? "ring-2 ring-primary/70" : "",
								)}
							>
								<Image
									src={thumbnailUrl}
									alt={photo.caption || "活动照片"}
									fill
									sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
									className="object-cover cursor-pointer transition-transform hover:scale-105"
									onClick={() => setSelectedImage(displayUrl)}
									loading="lazy"
								/>
								{selectionModeProp && onToggleSelect ? (
									<div className="absolute top-2 left-2">
										<Checkbox
											checked={isSelected}
											onCheckedChange={() =>
												onToggleSelect(photo.id)
											}
											className="bg-white/80 shadow"
										/>
									</div>
								) : null}
								{canDelete && !selectionModeProp && (
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
								{/* Time label */}
								<div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
									{formatRelativeTime(photo.createdAt)}
								</div>
							</div>
						);
					})}
				</div>
				{renderLoadMore()}
			</>
		);
	};

	return (
		<div className="min-h-screen bg-background pb-20 lg:pb-6">
			{/* Header */}
			<div className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
				<div className="flex items-center justify-between h-14 px-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push(`/events/${eventId}`)}
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
				<Tabs
					value={activeTab}
					defaultValue="all"
					className="w-full"
					onValueChange={(value) => {
						const next = value as "all" | "my";
						setActiveTab(next);
						if (next === "all") {
							clearSelection();
							setViewMode("grid");
						}
					}}
				>
					<div className="border-b border-border/30 mb-4">
						<TabsList className="w-full justify-start bg-transparent p-0 border-none gap-6 h-auto">
							<TabsTrigger
								value="all"
								className="relative flex-none !rounded-none !border-none !bg-transparent !shadow-none px-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-bold transition-colors after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-foreground after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:origin-center"
							>
								<Grid3x3 className="h-4 w-4 mr-2" />
								所有照片
							</TabsTrigger>
							<TabsTrigger
								value="my"
								disabled={!session?.user}
								className="relative flex-none !rounded-none !border-none !bg-transparent !shadow-none px-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-bold transition-colors after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-foreground after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:origin-center disabled:opacity-50"
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
								<div className="bg-muted/50 p-1 rounded-lg border border-border">
									<button
										onClick={() => setSortBy("newest")}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											sortBy === "newest"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										最新上传
									</button>
									<button
										onClick={() => setSortBy("oldest")}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											sortBy === "oldest"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										最早上传
									</button>
								</div>

								<div className="bg-muted/50 p-1 rounded-lg border border-border">
									<button
										onClick={() => setGroupBy("none")}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											groupBy === "none"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										网格视图
									</button>
									<button
										onClick={() =>
											setGroupBy("photographer")
										}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											groupBy === "photographer"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
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
								onManualLoadMore={() => {
									if (hasNextPage && !isFetchingMorePhotos) {
										fetchNextPage();
									}
								}}
							/>
						</TabsContent>

						<TabsContent value="my">
							<div className="flex flex-wrap items-center gap-2 mb-4">
								<div className="bg-muted/50 p-1 rounded-lg border border-border">
									<button
										onClick={() => setViewMode("grid")}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											viewMode === "grid"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										网格视图
									</button>
									<button
										onClick={() => setViewMode("list")}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											viewMode === "list"
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										列表视图
									</button>
								</div>

								<div className="bg-muted/50 p-1 rounded-lg border border-border">
									<button
										onClick={() => {
											const next = !selectionMode;
											setSelectionMode(next);
											if (!next) {
												setSelectedPhotoIds(new Set());
											}
										}}
										className={cn(
											"px-3 py-1.5 text-xs rounded-md transition-colors",
											selectionMode
												? "bg-card text-foreground font-bold shadow-sm border border-border"
												: "text-muted-foreground font-medium hover:bg-muted/70",
										)}
									>
										批量管理
									</button>
									<Button
										variant="outline"
										size="sm"
										disabled={
											selectedPhotoIds.size === 0 ||
											isBatchDeleting
										}
										onClick={handleBatchDelete}
										className="text-xs font-bold"
									>
										{isBatchDeleting
											? "删除中..."
											: `删除选中 (${selectedPhotoIds.size})`}
									</Button>
								</div>
							</div>

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
								selectionMode={selectionMode}
								selectedPhotoIds={selectedPhotoIds}
								onToggleSelect={(photoId) => {
									setSelectedPhotoIds((prev) => {
										const next = new Set(prev);
										if (next.has(photoId)) {
											next.delete(photoId);
										} else {
											next.add(photoId);
										}
										return next;
									});
								}}
								onManualLoadMore={() => {
									if (
										hasMoreMyPhotos &&
										!isFetchingMoreMyPhotos
									) {
										fetchNextMyPhotos();
									}
								}}
								viewMode={viewMode}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</div>

			{isUploading && (
				<div className="fixed bottom-24 lg:bottom-20 left-0 right-0 z-40 px-4">
					<div className="mx-auto max-w-lg rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
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
			{canUpload ? (
				<div className="fixed bottom-20 lg:bottom-4 left-0 right-0 flex justify-center gap-3 sm:gap-4 px-4 z-30">
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
								className="rounded-full px-6 h-12 text-sm font-bold shadow-lg bg-primary text-primary-foreground"
								disabled={isUploading}
							>
								<Upload className="h-5 w-5 mr-2" />
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
											支持 JPG、PNG、WEBP
											格式，单个文件最大 10MB
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
			) : (
				<div className="fixed bottom-20 lg:bottom-4 left-0 right-0 flex justify-center px-4 z-30">
					<div className="rounded-xl border border-border bg-card p-4 shadow-lg max-w-md mx-auto">
						<p className="text-sm font-bold text-foreground mb-2">
							{!session?.user
								? "需要登录并报名"
								: "需要报名参加活动"}
						</p>
						<p className="text-xs text-muted-foreground mb-3">
							{!session?.user
								? "您需要登录并报名参加活动后才能上传照片"
								: "您需要报名参加活动后才能上传照片"}
						</p>
						<Button
							className="rounded-full px-4 py-1.5 text-xs font-bold w-full"
							onClick={() => {
								if (!session?.user) {
									router.push(
										`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`,
									);
								} else {
									router.push(`/events/${eventId}`);
								}
							}}
						>
							{!session?.user ? "去登录" : "去报名"}
						</Button>
					</div>
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
					<a
						href={selectedImage}
						download
						onClick={(e) => e.stopPropagation()}
						className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-colors"
					>
						<Download className="h-4 w-4" />
						下载照片
					</a>
				</div>
			)}
		</div>
	);
}
