"use client";

import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { MultipleImageUpload } from "@community/ui/ui/multiple-image-upload";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface EventPhotosProps {
	photos: string[];
	isLoadingPhotos: boolean;
	showPhotoUpload: boolean;
	canUploadPhotos: boolean | null | undefined;
	onTogglePhotoUpload: () => void;
	onPhotosChange: (photos: string[]) => void;
}

export function EventPhotos({
	photos,
	isLoadingPhotos,
	showPhotoUpload,
	canUploadPhotos,
	onTogglePhotoUpload,
	onPhotosChange,
}: EventPhotosProps) {
	// Don't render the component if there are no photos and the user can't upload
	if (photos.length === 0 && !canUploadPhotos && !showPhotoUpload) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<PhotoIcon className="w-5 h-5" />
						现场活动照片 {photos.length > 0 && `(${photos.length})`}
					</CardTitle>
					{canUploadPhotos && (
						<Button
							variant="outline"
							size="sm"
							onClick={onTogglePhotoUpload}
						>
							{showPhotoUpload ? "取消上传" : "上传照片"}
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isLoadingPhotos ? (
					<div className="flex justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					</div>
				) : photos.length > 0 || showPhotoUpload ? (
					<div className="space-y-4">
						{/* Photo Upload Section */}
						{showPhotoUpload && canUploadPhotos && (
							<div className="border-b pb-4">
								<MultipleImageUpload
									label="上传现场活动照片"
									value={photos}
									onChange={onPhotosChange}
									description="欢迎上传现场活动照片，分享精彩瞬间让更多人了解活动氛围"
									maxImages={20}
								/>
							</div>
						)}

						{/* Photo Gallery */}
						{photos.length > 0 && (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{photos.map((photo, index) => (
									<button
										key={index}
										type="button"
										className="relative group aspect-square cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
										onClick={() => {
											// TODO: 实现图片预览功能
											window.open(photo, "_blank");
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												e.preventDefault();
												window.open(photo, "_blank");
											}
										}}
										aria-label={`查看现场活动照片 ${index + 1}`}
									>
										<img
											src={photo}
											alt={`现场活动照片 ${index + 1}`}
											className="w-full h-full object-cover rounded-lg hover:opacity-75 transition-opacity"
										/>
									</button>
								))}
							</div>
						)}
					</div>
				) : (
					<div className="text-center py-8">
						<PhotoIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-muted-foreground">
							{canUploadPhotos
								? "还没有现场活动照片，点击上传按钮分享精彩瞬间"
								: "暂无现场活动照片"}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
