export interface PhotoAlbumShareOption {
	id: "qr" | "native" | "copyLink";
	label: string;
}

export const PHOTO_ALBUM_SHARE_OPTIONS: PhotoAlbumShareOption[] = [
	{ id: "qr", label: "分享二维码" },
	{ id: "native", label: "原生分享" },
	{ id: "copyLink", label: "复制链接" },
];

export function buildPhotoAlbumShareText(eventTitle: string): string {
	const normalizedTitle = eventTitle.trim() || "活动";
	return `活动【${normalizedTitle}】现场照片来啦！`;
}
