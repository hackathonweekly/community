"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface RegistrationSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventTitle: string;
	successInfo?: string;
	successImage?: string;
	requireApproval?: boolean;
	registrationStatus?: string;
	pendingInfo?: string;
	pendingImage?: string;
}

export function RegistrationSuccessModal({
	isOpen,
	onClose,
	eventTitle,
	successInfo,
	successImage,
	requireApproval = false,
	registrationStatus,
	pendingInfo,
	pendingImage,
}: RegistrationSuccessModalProps) {
	const isMobile = useIsMobile();
	// Determine if we should show pending state (for approval-required events with PENDING status)
	const isPendingState = requireApproval && registrationStatus === "PENDING";
	const displayInfo = isPendingState ? pendingInfo : successInfo;
	const displayImage = isPendingState ? pendingImage : successImage;
	const titleText = isPendingState ? "报名申请已提交" : "报名成功！";
	const descriptionText = isPendingState
		? `您已成功提交报名申请「${eventTitle}」，请等待审核结果`
		: `您已成功报名活动「${eventTitle}」`;
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			onClose();
		}
	};

	const renderHeader = (withDialogSemantics: boolean) => (
		<div className="flex items-center gap-2 sm:gap-3 mb-2">
			{isPendingState ? (
				<div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
					<span className="text-white text-sm font-bold">⏳</span>
				</div>
			) : (
				<CheckCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
			)}
			<div className="flex-1 min-w-0">
				{withDialogSemantics ? (
					<>
						<DialogTitle
							className={`text-base sm:text-lg font-semibold ${
								isPendingState
									? "text-yellow-800"
									: "text-green-800"
							}`}
						>
							{titleText}
						</DialogTitle>
						<DialogDescription
							className={`text-xs sm:text-sm ${
								isPendingState
									? "text-yellow-600"
									: "text-green-600"
							}`}
						>
							{descriptionText}
						</DialogDescription>
					</>
				) : (
					<>
						<p
							className={`text-base sm:text-lg font-semibold ${
								isPendingState
									? "text-yellow-800"
									: "text-green-800"
							}`}
						>
							{titleText}
						</p>
						<p
							className={`text-xs sm:text-sm ${
								isPendingState
									? "text-yellow-600"
									: "text-green-600"
							}`}
						>
							{descriptionText}
						</p>
					</>
				)}
			</div>
		</div>
	);

	const importantInfoCard = (
		<div
			className={`border rounded-lg overflow-hidden ${
				isPendingState ? "border-yellow-200" : "border-blue-200"
			}`}
		>
			<div
				className={`px-3 sm:px-4 py-2 sm:py-3 border-b ${
					isPendingState
						? "bg-yellow-100 border-yellow-200"
						: "bg-blue-100 border-blue-200"
				}`}
			>
				<h4
					className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
						isPendingState ? "text-yellow-900" : "text-blue-900"
					}`}
				>
					<span className="text-base sm:text-lg">
						{isPendingState ? "⏰" : "📋"}
					</span>
					{isPendingState
						? "审核中 - 请仔细阅读"
						: "重要信息 - 请仔细阅读"}
				</h4>
			</div>
			<div
				className={`p-3 sm:p-4 space-y-3 sm:space-y-4 ${
					isPendingState ? "bg-yellow-50" : "bg-blue-50"
				}`}
			>
				{/* 文字信息 */}
				{displayInfo?.trim() ? (
					<div className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
						{displayInfo}
					</div>
				) : (
					<div className="text-xs sm:text-sm text-gray-700 space-y-2">
						{isPendingState ? (
							<>
								<p>⏳ 您的报名申请正在审核中</p>
								<p>📧 审核结果将通过短信或邮箱通知您</p>
								<p>💡 请保持联系方式畅通，耐心等待审核结果</p>
							</>
						) : (
							<>
								<p>✅ 您的报名已确认</p>
								<p>📧 如有问题请联系主办方</p>
							</>
						)}
					</div>
				)}
				{/* 图片 */}
				{displayImage?.trim() && (
					<div className="flex justify-center">
						<img
							src={displayImage}
							alt={
								isPendingState
									? "审核中信息图片"
									: "重要信息图片"
							}
							className="max-w-full h-auto rounded-lg shadow-sm border"
							style={{ maxHeight: "250px" }}
						/>
					</div>
				)}
			</div>
		</div>
	);

	const confirmationButton = (
		<Button
			onClick={onClose}
			className={`px-6 sm:px-8 py-2 text-white font-medium w-full sm:w-auto ${
				isPendingState
					? "bg-yellow-600 hover:bg-yellow-700"
					: "bg-blue-600 hover:bg-blue-700"
			}`}
			size="lg"
		>
			我已阅读并确认
		</Button>
	);

	const infoSection = importantInfoCard;

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={handleOpenChange}>
				<DrawerContent className="h-[92dvh] max-h-[92dvh] rounded-t-3xl border-t px-4 pb-4 pt-2">
					<div className="flex h-full flex-col gap-4">
						<div className="pt-2">{renderHeader(false)}</div>
						<div className="flex-1 overflow-y-auto pr-1">
							<div className="space-y-3 sm:space-y-4">
								{infoSection}
							</div>
						</div>
						<div className="border-t pt-3">
							{confirmationButton}
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
				<DialogHeader>{renderHeader(true)}</DialogHeader>

				<div className="space-y-3 sm:space-y-4">
					{infoSection}

					<div className="flex justify-center pt-2 sm:pt-4 border-t">
						{confirmationButton}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
