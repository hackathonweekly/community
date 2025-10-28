"use client";

import { Button } from "@/components/ui/button";
import { HeartIcon, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { ShareEventDialog } from "@/modules/public/events/components/ShareEventDialog";
import { useUnifiedEventRegistration } from "../hooks/useUnifiedEventRegistration";
import { useKeyboardDetection } from "@/lib/hooks/use-keyboard-detection";
import { cn } from "@/lib/utils";

interface MobileEventBottomActionsProps {
	event: {
		id: string;
		title: string;
		status: string;
		startTime: string;
		endTime: string;
		registrationDeadline?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		requireApproval: boolean;
		isOnline?: boolean;
		address?: string;
		onlineUrl?: string;
		coverImage?: string;
		richContent?: string | null;
	};
	user?: { id: string } | null;
	existingRegistration?: { status: string } | null;
	canRegister: boolean | null;
	onShowShare: () => void;
	onShowQRGenerator?: () => void;
	onVolunteerApply?: (eventVolunteerRoleId: string) => void;
	pathname: string;
}

export function MobileEventBottomActions({
	event,
	user,
	existingRegistration,
	canRegister,
	onShowShare,
	onShowQRGenerator,
	onVolunteerApply,
	pathname,
}: MobileEventBottomActionsProps) {
	const [isBookmarking, setIsBookmarking] = useState(false);
	const [showShareDialog, setShowShareDialog] = useState(false);

	// 使用自定义 hook 检测键盘是否弹出
	const isKeyboardVisible = useKeyboardDetection();

	// 使用统一的Hook
	const {
		isBookmarked,
		isEventEnded,
		isRegistering,
		getRegisterButtonText,
		handleRegisterAction,
		handleCancelRegistrationAction,
		handleBookmark,
		shouldShowCancelButton,
		getShareUrl,
		generateShareText,
		event: eventHookData,
	} = useUnifiedEventRegistration({
		event,
		user,
		existingRegistration,
		canRegister,
		pathname,
	});

	const handleShare = () => {
		// Always show our share dialog for mobile users to have full options
		setShowShareDialog(true);
	};

	// 包装handleBookmark以处理loading状态
	const handleBookmarkWithLoading = async () => {
		setIsBookmarking(true);
		try {
			await handleBookmark();
		} finally {
			setIsBookmarking(false);
		}
	};

	return (
		<>
			<div
				className={cn(
					"fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg shadow-black/10 px-4 py-4 md:hidden transition-transform duration-300",
					// 键盘弹出时隐藏底部工具栏
					isKeyboardVisible ? "translate-y-full" : "translate-y-0",
				)}
				style={{
					paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
				}}
			>
				{shouldShowCancelButton() ? (
					// Show cancel button for pending/waitlisted/approved registrations
					<div className="max-w-md mx-auto space-y-3">
						<div className="flex items-center gap-3">
							{/* 收藏按钮 */}
							<Button
								variant="outline"
								size="icon"
								onClick={handleBookmarkWithLoading}
								disabled={isBookmarking}
								className="flex-shrink-0 h-11 w-11"
							>
								{isBookmarked ? (
									<HeartSolidIcon className="h-5 w-5 text-red-500" />
								) : (
									<HeartIcon className="h-5 w-5" />
								)}
							</Button>

							{/* 分享按钮 */}
							<Button
								variant="outline"
								size="icon"
								onClick={handleShare}
								className="flex-shrink-0 h-11 w-11"
							>
								<ShareIcon className="h-5 w-5" />
							</Button>

							{/* 主要操作按钮 - 签到二维码等 */}
							<Button
								onClick={() => {
									const result = handleRegisterAction();
									if (
										result === "SHOW_QR_CODE" &&
										onShowQRGenerator
									) {
										onShowQRGenerator();
									}
								}}
								disabled={isRegistering}
								className={`flex-1 font-medium text-sm h-12 ${
									existingRegistration?.status === "APPROVED"
										? "bg-green-600 hover:bg-green-700 text-white"
										: "bg-gray-100 text-gray-600 cursor-not-allowed"
								}`}
								size="lg"
							>
								{getRegisterButtonText()}
							</Button>
						</div>

						{/* 取消报名按钮 */}
						<Button
							onClick={handleCancelRegistrationAction}
							disabled={isRegistering}
							variant="outline"
							className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium"
						>
							{isRegistering
								? "取消中..."
								: existingRegistration?.status === "WAITLISTED"
									? "❌ 退出等待名单"
									: "❌ 取消报名"}
						</Button>
					</div>
				) : (
					// Normal layout for other states
					<div className="max-w-md mx-auto flex items-center gap-3">
						{/* 收藏按钮 */}
						<Button
							variant="outline"
							size="icon"
							onClick={handleBookmarkWithLoading}
							disabled={isBookmarking}
							className="flex-shrink-0 h-11 w-11"
						>
							{isBookmarked ? (
								<HeartSolidIcon className="h-5 w-5 text-red-500" />
							) : (
								<HeartIcon className="h-5 w-5" />
							)}
						</Button>

						{/* 分享按钮 */}
						<Button
							variant="outline"
							size="icon"
							onClick={handleShare}
							className="flex-shrink-0 h-11 w-11"
						>
							<ShareIcon className="h-5 w-5" />
						</Button>

						{/* 主要操作按钮 - 报名/签到等 */}
						<Button
							onClick={() => {
								const result = handleRegisterAction();
								if (
									result === "SHOW_QR_CODE" &&
									onShowQRGenerator
								) {
									onShowQRGenerator();
								}
							}}
							disabled={isRegistering}
							className={`flex-1 font-medium text-sm h-12 ${
								existingRegistration?.status === "APPROVED"
									? "bg-green-600 hover:bg-green-700 text-white"
									: event.isExternalEvent
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: isEventEnded
											? "bg-gray-100 text-gray-600 cursor-not-allowed"
											: "bg-primary hover:bg-primary/90 text-white"
							}`}
							size="lg"
						>
							{getRegisterButtonText()}
						</Button>
					</div>
				)}
			</div>

			{/* Share Dialog */}
			<ShareEventDialog
				isOpen={showShareDialog}
				onClose={() => setShowShareDialog(false)}
				eventTitle={event.title}
				eventId={event.id}
				eventUrl={""}
				event={{
					startTime: event.startTime,
					endTime: event.endTime,
					address: event.address,
					isOnline: event.isOnline ?? false,
					onlineUrl: event.onlineUrl,
					coverImage: event.coverImage,
					richContent: event.richContent,
				}}
			/>
		</>
	);
}
