"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	// Determine if we should show pending state (for approval-required events with PENDING status)
	const isPendingState = requireApproval && registrationStatus === "PENDING";
	const displayInfo = isPendingState ? pendingInfo : successInfo;
	const displayImage = isPendingState ? pendingImage : successImage;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						{isPendingState ? (
							<div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
								<span className="text-white text-sm font-bold">
									⏳
								</span>
							</div>
						) : (
							<CheckCircleIcon className="h-8 w-8 text-green-600" />
						)}
						<div>
							<DialogTitle
								className={`text-lg font-semibold ${
									isPendingState
										? "text-yellow-800"
										: "text-green-800"
								}`}
							>
								{isPendingState
									? "报名申请已提交"
									: "报名成功！"}
							</DialogTitle>
							<DialogDescription
								className={
									isPendingState
										? "text-yellow-600"
										: "text-green-600"
								}
							>
								{isPendingState
									? `您已成功提交报名申请「${eventTitle}」，请等待审核结果`
									: `您已成功报名活动「${eventTitle}」`}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					{/* 重要信息区域 - 始终显示 */}
					<div
						className={`border rounded-lg overflow-hidden ${
							isPendingState
								? "border-yellow-200"
								: "border-blue-200"
						}`}
					>
						<div
							className={`px-4 py-3 border-b ${
								isPendingState
									? "bg-yellow-100 border-yellow-200"
									: "bg-blue-100 border-blue-200"
							}`}
						>
							<h4
								className={`font-semibold flex items-center gap-2 ${
									isPendingState
										? "text-yellow-900"
										: "text-blue-900"
								}`}
							>
								<span className="text-lg">
									{isPendingState ? "⏰" : "📋"}
								</span>
								{isPendingState
									? "审核中 - 请仔细阅读"
									: "重要信息 - 请仔细阅读"}
							</h4>
						</div>
						<div
							className={`p-4 space-y-4 ${
								isPendingState ? "bg-yellow-50" : "bg-blue-50"
							}`}
						>
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
										style={{ maxHeight: "300px" }}
									/>
								</div>
							)}
							{/* 文字信息 */}
							{displayInfo?.trim() ? (
								<div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
									{displayInfo}
								</div>
							) : (
								<div className="text-sm text-gray-700 space-y-2">
									{isPendingState ? (
										<>
											<p>⏳ 您的报名申请正在审核中</p>
											<p>
												📧
												审核结果将通过短信或邮箱通知您
											</p>
											<p>
												💡
												请保持联系方式畅通，耐心等待审核结果
											</p>
										</>
									) : (
										<>
											<p>✅ 您的报名已确认</p>
											<p>📧 如有问题请联系主办方</p>
										</>
									)}
								</div>
							)}
						</div>
					</div>

					{/* 确认按钮 - 强调样式 */}
					<div className="flex justify-center pt-4 border-t">
						<Button
							onClick={onClose}
							className={`px-8 py-2 text-white font-medium ${
								isPendingState
									? "bg-yellow-600 hover:bg-yellow-700"
									: "bg-blue-600 hover:bg-blue-700"
							}`}
							size="lg"
						>
							我已阅读并确认
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
