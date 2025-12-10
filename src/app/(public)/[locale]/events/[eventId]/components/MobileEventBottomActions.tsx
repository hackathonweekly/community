"use client";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useKeyboardDetection } from "@/lib/hooks/use-keyboard-detection";
import { cn } from "@/lib/utils";
import {
	PhotoIcon,
	ShareIcon,
	ChatBubbleLeftEllipsisIcon,
	EllipsisHorizontalIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useUnifiedEventRegistration } from "../hooks/useUnifiedEventRegistration";

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
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
	};
	user?: { id: string } | null;
	existingRegistration?: { status: string } | null;
	canRegister: boolean | null;
	onShowShare: () => void;
	onShowQRGenerator?: () => void;
	onShowSuccessInfo?: () => void;
	pathname: string;
	locale?: string;
	onShowFeedback?: () => void;
	onShowContact?: () => void;
	canShowFeedback?: boolean;
	canContactOrganizer?: boolean;
	hasSubmittedFeedback?: boolean;
	userSubmission?: { id: string; projectId: string } | null;
	projectSubmissions?: Array<{
		id: string;
		userId?: string;
		submitter?: { id?: string };
		user?: { id?: string };
		submitterId?: string;
	}>;
}

export function MobileEventBottomActions({
	event,
	user,
	existingRegistration,
	canRegister,
	onShowShare,
	onShowQRGenerator,
	onShowSuccessInfo,
	pathname,
	locale = "zh",
	onShowFeedback,
	onShowContact,
	canShowFeedback,
	canContactOrganizer,
	hasSubmittedFeedback,
	userSubmission,
	projectSubmissions,
}: MobileEventBottomActionsProps) {
	type ProjectSubmission = NonNullable<
		MobileEventBottomActionsProps["projectSubmissions"]
	>[number];

	const router = useRouter();
	const [isBookmarking, setIsBookmarking] = useState(false);
	const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);

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
	} = useUnifiedEventRegistration({
		event,
		user,
		existingRegistration,
		canRegister,
		pathname,
	});

	const handleShare = () => {
		onShowShare();
	};

	const handleOpenAlbum = () => {
		router.push(`/${locale}/events/${event.id}/photos`);
	};

	const getSubmissionOwnerId = (submission?: ProjectSubmission) =>
		submission?.submitter?.id ??
		submission?.user?.id ??
		submission?.submitterId ??
		submission?.userId ??
		null;

	// 检查用户是否已提交过作品
	const hasUserSubmitted =
		user && projectSubmissions
			? projectSubmissions.some(
					(submission) =>
						getSubmissionOwnerId(submission) === user.id,
				)
			: false;

	const userSubmittedProject = projectSubmissions?.find(
		(submission) => getSubmissionOwnerId(submission) === user?.id,
	);

	// 包装handleBookmark以处理loading状态
	const handleBookmarkWithLoading = async () => {
		setIsBookmarking(true);
		try {
			await handleBookmark();
		} finally {
			setIsBookmarking(false);
		}
	};

	const closeActionsSheet = () => setIsActionsSheetOpen(false);

	const getCancelButtonLabel = () => {
		if (existingRegistration?.status === "WAITLISTED") {
			return "❌ 退出等待名单";
		}
		if (existingRegistration?.status === "PENDING") {
			return "❌ 取消报名申请";
		}
		return "❌ 取消报名";
	};

	// 检查是否有重要信息需要展示
	const hasImportantInfo = Boolean(
		event.registrationSuccessInfo ||
			event.registrationSuccessImage ||
			event.registrationPendingInfo ||
			event.registrationPendingImage,
	);

	// 是否应该显示重要信息按钮
	const shouldShowImportantInfo =
		hasImportantInfo &&
		(existingRegistration?.status === "APPROVED" ||
			existingRegistration?.status === "PENDING");

	type MoreAction = {
		key: string;
		label: string;
		icon?: ReactNode;
		onClick?: () => void;
		isDanger?: boolean;
		disabled?: boolean;
	};

	const moreActions = [
		{
			key: "share",
			label: "分享活动",
			icon: <ShareIcon className="h-5 w-5" />,
			onClick: () => handleShare(),
		},
		onShowQRGenerator && existingRegistration?.status === "APPROVED"
			? {
					key: "qr",
					label: "签到二维码",
					icon: <span className="text-lg">📱</span>,
					onClick: onShowQRGenerator,
				}
			: null,
		canShowFeedback
			? {
					key: "feedback",
					label: hasSubmittedFeedback ? "修改反馈" : "活动反馈",
					icon: <span className="text-lg">💬</span>,
					onClick: onShowFeedback,
				}
			: null,
		canContactOrganizer
			? {
					key: "contact",
					label: "联系组织者",
					icon: <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />,
					onClick: onShowContact,
				}
			: null,
		shouldShowCancelButton()
			? {
					key: "cancel",
					label: getCancelButtonLabel(),
					icon: <XCircleIcon className="h-5 w-5" />,
					onClick: handleCancelRegistrationAction,
					isDanger: true,
					disabled: isRegistering,
				}
			: null,
	].filter(Boolean) as MoreAction[];

	return (
		<>
			<div
				className={cn(
					"fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg shadow-black/10 px-4 py-3 lg:hidden transition-transform duration-300",
					isKeyboardVisible ? "translate-y-full" : "translate-y-0",
				)}
				style={{
					paddingBottom:
						"max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
				}}
			>
				<div className="max-w-md mx-auto">
					<div className="flex items-center gap-3">
						{/* 相册按钮 */}
						<Button
							variant="outline"
							size="icon"
							onClick={handleOpenAlbum}
							className="flex-shrink-0 h-11 w-11"
							title="相册"
						>
							<PhotoIcon className="h-5 w-5" />
						</Button>

						{/* 主按钮 - 根据状态显示不同内容 */}
						{shouldShowImportantInfo &&
						existingRegistration?.status === "APPROVED" ? (
							// 已报名且成功：显示提交/修改作品按钮（黑客松场景优先）
							<Button
								onClick={() => {
									const route = hasUserSubmitted
										? `/app/events/${event.id}/submissions/${userSubmittedProject?.id}`
										: `/app/events/${event.id}/submissions/new`;
									router.push(route);
								}}
								className="flex-1 font-medium text-sm h-12 bg-primary hover:bg-primary/90 text-white"
								size="lg"
							>
								{hasUserSubmitted
									? "✏️ 修改作品"
									: "📤 提交作品"}
							</Button>
						) : shouldShowImportantInfo ? (
							// 报名审核中/等待中且有重要信息：显示查看重要信息
							<Button
								onClick={onShowSuccessInfo}
								className="flex-1 font-medium text-sm h-12 bg-blue-600 hover:bg-blue-700 text-white"
								size="lg"
							>
								<span className="mr-1">📋</span> 查看重要信息
							</Button>
						) : (
							// 其他情况：显示报名/查看二维码按钮
							<Button
								onClick={() => {
									// 如果已报名成功，默认行为是提交/修改作品
									if (
										existingRegistration?.status ===
										"APPROVED"
									) {
										const route = hasUserSubmitted
											? `/app/events/${event.id}/submissions/${userSubmittedProject?.id}`
											: `/app/events/${event.id}/submissions/new`;
										router.push(route);
										return;
									}

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
										? "bg-primary hover:bg-primary/90 text-white"
										: event.isExternalEvent
											? "bg-blue-600 hover:bg-blue-700 text-white"
											: isEventEnded
												? "bg-gray-100 text-gray-600 cursor-not-allowed"
												: "bg-primary hover:bg-primary/90 text-white"
								}`}
								size="lg"
							>
								{existingRegistration?.status === "APPROVED"
									? hasUserSubmitted
										? "✏️ 修改作品"
										: "📤 提交作品"
									: getRegisterButtonText()}
							</Button>
						)}

						{/* 更多操作按钮 */}
						<Button
							variant="outline"
							size="icon"
							onClick={() => setIsActionsSheetOpen(true)}
							className="flex-shrink-0 h-11 w-11"
							title="更多操作"
						>
							<EllipsisHorizontalIcon className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<Sheet
				open={isActionsSheetOpen}
				onOpenChange={setIsActionsSheetOpen}
			>
				<SheetContent
					side="bottom"
					className="rounded-t-3xl border-t px-4 pb-6 pt-4"
				>
					<SheetHeader className="pb-2 text-left">
						<SheetTitle className="text-base font-semibold">
							更多操作
						</SheetTitle>
						<p className="text-muted-foreground text-xs">
							针对当前报名状态的快捷操作
						</p>
					</SheetHeader>
					<div className="space-y-2">
						{moreActions.length > 0 ? (
							moreActions.map((action) => (
								<Button
									key={action.key}
									variant="ghost"
									size="lg"
									disabled={action.disabled}
									className={cn(
										"w-full justify-start gap-3 rounded-2xl border border-gray-100 py-4 text-base font-medium",
										action.isDanger
											? "text-red-600 hover:text-red-700"
											: "text-gray-900 hover:text-gray-950",
									)}
									onClick={() => {
										closeActionsSheet();
										action.onClick?.();
									}}
								>
									{action.icon && (
										<span
											className={cn(
												"text-gray-500",
												action.isDanger &&
													"text-red-500",
											)}
										>
											{action.icon}
										</span>
									)}
									<span>{action.label}</span>
								</Button>
							))
						) : (
							<p className="text-muted-foreground py-6 text-center text-sm">
								暂无可用操作
							</p>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
