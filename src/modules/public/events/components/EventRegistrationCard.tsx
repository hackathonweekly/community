"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChatBubbleLeftEllipsisIcon,
	LinkIcon as ExternalLinkIcon,
	ShareIcon,
	PhotoIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ContactOrganizerDialog from "./ContactOrganizerDialog";
import { SimpleEventFeedbackDialog } from "./SimpleEventFeedbackDialog";
import { VolunteerListModal } from "./VolunteerListModal";
import { Users } from "lucide-react";
import { useUnifiedEventRegistration } from "../../../../app/(public)/[locale]/events/[eventId]/hooks/useUnifiedEventRegistration";

interface EventRegistrationCardProps {
	event: {
		id: string;
		title: string;
		status: string;
		endTime: string;
		registrationDeadline?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		requireApproval: boolean;
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
		organizerContact?: string;
		organizer: {
			id: string;
			name: string;
			email: string;
			username?: string;
		};
		volunteerRoles?: Array<{
			id: string;
			recruitCount: number;
			isRequired: boolean;
			sopUrl?: string;
			wechatQrCode?: string;
			description?: string;
			volunteerRole: {
				id: string;
				name: string;
				description: string;
				detailDescription?: string;
				iconUrl?: string;
				cpPoints: number;
			};
			registrations: Array<{
				id: string;
				status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
				appliedAt: string;
				approvedAt?: string;
				note?: string;
				user: {
					id: string;
					name: string;
					image?: string;
					username?: string;
					userRoleString?: string;
					currentWorkOn?: string;
				};
			}>;
		}>;
		volunteerContactInfo?: string;
		volunteerWechatQrCode?: string;
		startTime: string;
		address?: string;
		isOnline?: boolean;
		onlineUrl?: string;
		coverImage?: string;
		richContent?: string | null;
	};
	user?: {
		id: string;
	} | null;
	existingRegistration?: {
		status: string;
	} | null;
	canRegister: boolean | null;
	pathname: string;
	onShowQRGenerator: () => void;
	onShowSuccessInfo: () => void;
	onShowShare: () => void;
	onFeedbackSubmit?: (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => void;
	existingFeedback?: {
		rating: number;
		comment?: string;
		suggestions?: string;
		wouldRecommend: boolean;
	} | null;
	hasSubmittedFeedback?: boolean;
	onVolunteerApply?: (eventVolunteerRoleId: string) => void;
	onViewAllVolunteers?: () => void;
	onDataRefresh?: () => void;
}

export function EventRegistrationCard({
	event,
	user,
	existingRegistration,
	canRegister,
	pathname,
	onShowQRGenerator,
	onShowSuccessInfo,
	onShowShare,
	onFeedbackSubmit,
	existingFeedback,
	hasSubmittedFeedback,
	onVolunteerApply,
	onViewAllVolunteers,
	onDataRefresh,
}: EventRegistrationCardProps) {
	const locale = useLocale();
	const t = useTranslations("events");
	const router = useRouter();

	const [showContact, setShowContact] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const [showVolunteerModal, setShowVolunteerModal] = useState(false);

	// 使用统一的Hook
	const {
		isEventEnded,
		isEventDraft,
		canApplyVolunteer,
		isRegistering,
		getRegisterButtonText,
		getRegistrationStatusText,
		handleRegisterAction,
		handleCancelRegistrationAction,
		shouldShowCancelButton,
		getVolunteerStats,
		handleVolunteerApply,
	} = useUnifiedEventRegistration({
		event,
		user,
		existingRegistration,
		canRegister,
		pathname,
	});

	const volunteerStats = getVolunteerStats(event.volunteerRoles);

	return (
		<Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm gap-3">
			<CardHeader>
				<CardTitle>{t("registration.title")}</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				{/* 主要报名/状态信息区域 - 在移动端只显示状态，不显示操作按钮 */}
				{event.isExternalEvent ? (
					<div className="lg:block hidden">
						<Button asChild className="w-full">
							<a
								href={event.externalUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<ExternalLinkIcon className="w-4 h-4" />
								前往外部平台报名
							</a>
						</Button>
					</div>
				) : user ? (
					<div className="space-y-3">
						{existingRegistration ? (
							<div className="space-y-3">
								{existingRegistration.status === "APPROVED" && (
									<div className="space-y-4">
										{/* 状态展示区域 */}
										<div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center relative overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-emerald-100/20 animate-pulse" />
											<div className="relative">
												<div className="flex items-center justify-center gap-2">
													<span className="text-sm font-semibold text-green-800">
														🎉 报名成功
													</span>
												</div>
											</div>
										</div>

										{/* 次要按钮：重要信息 - 只在有内容时显示 */}
										{(event.registrationSuccessInfo?.trim() ||
											event.registrationSuccessImage?.trim()) && (
											<Button
												onClick={onShowSuccessInfo}
												variant="outline"
												className="w-full"
											>
												📋 查看重要信息
											</Button>
										)}

										{/* 签到二维码按钮只在桌面端显示 */}
										<div className="lg:block hidden">
											<Button
												onClick={onShowQRGenerator}
												className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
												size="lg"
											>
												📱 签到二维码
											</Button>
										</div>
									</div>
								)}

								{existingRegistration.status === "PENDING" && (
									<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
										<div className="flex items-center justify-center gap-2 mb-3">
											<div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
											<span className="text-sm font-medium text-yellow-800">
												报名申请已提交
											</span>
										</div>
										<p className="text-xs text-yellow-700 mb-3">
											正在等待组织者审核，审核通过后您将收到短信通知
										</p>

										{/* 审核期间的基础信息 - 如果有内容才显示 */}
										{(event.registrationPendingInfo?.trim() ||
											event.registrationPendingImage?.trim()) && (
											<Button
												onClick={onShowSuccessInfo}
												variant="outline"
												className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50"
												size="sm"
											>
												📋 查看活动须知
											</Button>
										)}
									</div>
								)}

								{existingRegistration.status ===
									"WAITLISTED" && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
										<div className="flex items-center justify-center gap-2 mb-2">
											<div className="w-2 h-2 bg-blue-500 rounded-full" />
											<span className="text-sm font-medium text-blue-800">
												已加入等待名单
											</span>
										</div>
										<p className="text-xs text-blue-700">
											如有名额空出会优先通知您
										</p>
									</div>
								)}

								{existingRegistration.status === "REJECTED" && (
									<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
										<div className="flex items-center justify-center gap-2 mb-2">
											<div className="w-2 h-2 bg-red-500 rounded-full" />
											<span className="text-sm font-medium text-red-800">
												报名未通过审核
											</span>
										</div>
									</div>
								)}

								{existingRegistration.status ===
									"CANCELLED" && (
									<div className="lg:block hidden">
										<Button
											onClick={() => {
												const result =
													handleRegisterAction();
												if (
													result === "SHOW_QR_CODE" &&
													onShowQRGenerator
												) {
													onShowQRGenerator();
												}
											}}
											disabled={isRegistering}
											className="w-full"
										>
											{isRegistering
												? "报名中..."
												: "重新报名"}
										</Button>
									</div>
								)}

								{/* 取消报名按钮将移到底部 */}
							</div>
						) : (
							<div className="lg:block hidden">
								{canRegister ? (
									<Button
										onClick={() => {
											const result =
												handleRegisterAction();
											if (
												result === "SHOW_QR_CODE" &&
												onShowQRGenerator
											) {
												onShowQRGenerator();
											}
										}}
										disabled={isRegistering}
										className="w-full"
									>
										{isRegistering
											? t("registration.registering")
											: t("registration.registerNow")}
									</Button>
								) : isEventEnded ? (
									// 活动结束后的特殊处理
									<div className="space-y-2">
										<Button
											disabled
											className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
										>
											🏁 活动已结束
										</Button>
										{/* 引导用户查看活动回顾或反馈 */}
										{onFeedbackSubmit && (
											<Button
												variant="outline"
												onClick={() =>
													setShowFeedback(true)
												}
												className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
											>
												💬 分享活动反馈
											</Button>
										)}
									</div>
								) : (
									<Button disabled className="w-full">
										{getRegistrationStatusText()}
									</Button>
								)}
							</div>
						)}
					</div>
				) : (
					<div className="lg:block hidden">
						<Button asChild className="w-full">
							<Link
								href={`/auth/login?redirectTo=${encodeURIComponent(pathname)}`}
							>
								{t("registration.logInToRegister")}
							</Link>
						</Button>
					</div>
				)}
				{event.registrationDeadline && (
					<div className="text-xs text-muted-foreground mt-3 text-center">
						{t("registration.deadline")}:{" "}
						{format(
							new Date(event.registrationDeadline),
							locale === "zh" ? "yyyy年M月d日 HH:mm" : "PPP p",
							{ locale: locale === "zh" ? zhCN : enUS },
						)}
					</div>
				)}
				{event.requireApproval && !event.isExternalEvent && (
					<p className="text-xs text-muted-foreground mt-4">
						* {t("registration.requiresApproval")}
					</p>
				)}

				{/* 志愿者招募区域 - 精简设计，降低视觉权重 */}
				{volunteerStats && canApplyVolunteer && (
					<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-blue-600" />
								<span className="text-sm font-medium text-blue-800">
									志愿者招募
								</span>
								<div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
									{volunteerStats.totalApplied}/
									{volunteerStats.totalNeeded}
								</div>
							</div>
						</div>
						<p className="text-xs text-blue-700 mb-3">
							📋 报名成为志愿者，亲手塑造你心目中理想的社区活动
						</p>
						<Button
							onClick={() => setShowVolunteerModal(true)}
							variant="outline"
							className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
							size="sm"
						>
							<Users className="h-4 w-4 mr-2" />
							了解详情
						</Button>
					</div>
				)}

				{/* 辅助操作区域 - 所有用户可见 */}
				<div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
					{/* 相册 - 只在桌面端显示 */}
					<div className="lg:block hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(
									`/${locale}/events/${event.id}/photos`,
								)
							}
							className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all"
						>
							<PhotoIcon className="w-4 h-4" />
							现场相册
						</Button>
					</div>

					{/* 分享活动 - 只在桌面端显示 */}
					<div className="lg:block hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={onShowShare}
							className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all"
						>
							<ShareIcon className="w-4 h-4" />
							分享活动
						</Button>
					</div>

					{/* 活动反馈 + 联系组织者 */}
					<div className="flex gap-2">
						{/* 活动反馈按钮 */}
						{onFeedbackSubmit && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowFeedback(true)}
								className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-gray-800 transition-all"
								data-testid="feedback-button"
							>
								💬{" "}
								{hasSubmittedFeedback ? "修改反馈" : "活动反馈"}
							</Button>
						)}

						{/* 联系组织者 */}
						{event.organizerContact && !event.isExternalEvent && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowContact(true)}
								className={`flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-all ${
									onFeedbackSubmit ? "flex-1" : "w-full"
								}`}
							>
								<ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
								联系组织者
							</Button>
						)}
					</div>

					{/* 取消报名按钮 - 危险操作，放在最底部 - 只在桌面端显示 */}
					{user &&
						existingRegistration &&
						(existingRegistration.status === "PENDING" ||
							existingRegistration.status === "WAITLISTED" ||
							existingRegistration.status === "APPROVED") && (
							<div className="lg:block pt-2 border-t border-gray-200">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCancelRegistrationAction}
									disabled={isRegistering}
									className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
								>
									{isRegistering
										? "取消中..."
										: existingRegistration.status ===
												"WAITLISTED"
											? "❌ 退出等待名单"
											: existingRegistration.status ===
													"PENDING"
												? "❌ 取消报名申请"
												: "❌ 取消报名"}
								</Button>
							</div>
						)}
				</div>

				{/* 对话框组件 */}
				{!event.isExternalEvent && (
					<ContactOrganizerDialog
						open={showContact}
						onOpenChange={setShowContact}
						organizerName={event.organizer?.name}
						organizerUsername={event.organizer?.username}
						email={
							event.organizerContact
								? undefined
								: event.organizer?.email
						}
						contact={event.organizerContact}
						wechatQr={undefined}
					/>
				)}

				{onFeedbackSubmit && (
					<SimpleEventFeedbackDialog
						open={showFeedback}
						onOpenChange={setShowFeedback}
						eventTitle={event.title}
						eventId={event.id}
						onSubmit={onFeedbackSubmit}
						existingFeedback={existingFeedback}
						isEditing={hasSubmittedFeedback}
					/>
				)}

				{/* 志愿者列表弹窗 */}
				<VolunteerListModal
					isOpen={showVolunteerModal}
					onClose={() => setShowVolunteerModal(false)}
					event={event}
					currentUserId={user?.id}
					onApplicationSuccess={(eventVolunteerRoleId?: string) => {
						if (eventVolunteerRoleId) {
							handleVolunteerApply(eventVolunteerRoleId);
							onDataRefresh?.();
						}
					}}
				/>
			</CardContent>
		</Card>
	);
}
