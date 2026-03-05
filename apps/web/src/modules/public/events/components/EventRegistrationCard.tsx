"use client";

import { useEventProjectSubmissions } from "../detail/hooks/useEventQueries";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	ChatBubbleLeftEllipsisIcon,
	LinkIcon as ExternalLinkIcon,
	PhotoIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Timer, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnifiedEventRegistration } from "../detail/hooks/useUnifiedEventRegistration";
import { VolunteerListModal } from "./VolunteerListModal";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";

interface EventRegistrationCardProps {
	event: {
		id: string;
		shortId?: string;
		title: string;
		type?: string;
		status: string;
		endTime: string;
		registrationDeadline?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		requireApproval: boolean;
		requireProjectSubmission?: boolean;
		submissionsEnabled?: boolean | null;
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
		isEventAdmin?: boolean;
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
	hasSubmittedFeedback?: boolean;
	onVolunteerApply?: (eventVolunteerRoleId: string) => void;
	onViewAllVolunteers?: () => void;
	onDataRefresh?: () => void;
	onShowContact?: () => void;
	onShowFeedback?: () => void;
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
	hasSubmittedFeedback,
	onVolunteerApply,
	onViewAllVolunteers,
	onDataRefresh,
	onShowContact,
	onShowFeedback,
}: EventRegistrationCardProps) {
	const locale = useLocale();
	const t = useTranslations("events");
	const router = useRouter();
	const canShowCountdownTool =
		locale.startsWith("zh") && Boolean(event.isEventAdmin);

	const [showVolunteerModal, setShowVolunteerModal] = useState(false);

	// 使用统一的Hook
	const {
		isEventEnded,
		isEventDraft,
		canApplyVolunteer,
		isRegistering,
		isCancellingRegistration,
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

	const submissionsEnabled = isEventSubmissionsEnabled(event);

	// 获取当前活动的作品提交，用于判断用户是否已有提交
	const { projectSubmissions } = useEventProjectSubmissions(
		event.id,
		submissionsEnabled,
	);
	const getSubmissionOwnerId = (submission?: any) =>
		submission?.submitter?.id ??
		submission?.user?.id ??
		submission?.submitterId ??
		submission?.userId ??
		null;
	const hasUserSubmitted =
		user && projectSubmissions
			? projectSubmissions.some(
					(submission: any) =>
						getSubmissionOwnerId(submission) === user.id,
				)
			: false;
	const submissionHref = hasUserSubmitted
		? `/events/${event.shortId || event.id}/submissions`
		: `/events/${event.shortId || event.id}/submissions/new`;

	return (
		<Card className="gap-3 rounded-lg border border-border bg-card shadow-subtle">
			<CardHeader className="border-b border-border pb-3">
				<CardTitle>{t("registration.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 pt-3">
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
										{/* 报名成功后的主要操作按钮 - 提交/修改作品 */}
										{submissionsEnabled ? (
											<Button
												asChild
												className="h-10 w-full font-semibold"
												size="sm"
											>
												<Link href={submissionHref}>
													{hasUserSubmitted
														? "修改作品"
														: "提交作品"}
												</Link>
											</Button>
										) : (
											<Button
												onClick={() => {
													const result =
														handleRegisterAction();
													if (
														result ===
															"SHOW_QR_CODE" &&
														onShowQRGenerator
													) {
														onShowQRGenerator();
													}
												}}
												className="h-10 w-full font-semibold"
												size="sm"
											>
												查看报名二维码
											</Button>
										)}

										{/* 次要按钮：重要信息 - 只在有内容时显示 */}
										{(event.registrationSuccessInfo?.trim() ||
											event.registrationSuccessImage?.trim()) && (
											<Button
												onClick={onShowSuccessInfo}
												variant="outline"
												className="w-full"
												size="sm"
											>
												查看重要信息
											</Button>
										)}
									</div>
								)}

								{existingRegistration.status === "PENDING" && (
									<div className="rounded-md border border-border bg-muted/60 p-3 text-center">
										<div className="flex items-center justify-center gap-2 mb-3">
											<div className="h-2 w-2 animate-pulse rounded-full bg-foreground/70" />
											<span className="text-sm font-medium text-foreground">
												报名申请已提交
											</span>
										</div>
										<p className="mb-3 text-xs text-muted-foreground">
											正在等待组织者审核，审核通过后您将收到短信通知
										</p>

										{/* 审核期间的基础信息 - 如果有内容才显示 */}
										{(event.registrationPendingInfo?.trim() ||
											event.registrationPendingImage?.trim()) && (
											<Button
												onClick={onShowSuccessInfo}
												variant="outline"
												className="w-full"
												size="sm"
											>
												查看活动须知
											</Button>
										)}
									</div>
								)}

								{existingRegistration.status ===
									"WAITLISTED" && (
									<div className="rounded-md border border-border bg-muted/60 p-3 text-center">
										<div className="flex items-center justify-center gap-2 mb-2">
											<div className="h-2 w-2 rounded-full bg-foreground/70" />
											<span className="text-sm font-medium text-foreground">
												已加入等待名单
											</span>
										</div>
										<p className="text-xs text-muted-foreground">
											如有名额空出会优先通知您
										</p>
									</div>
								)}

								{existingRegistration.status === "REJECTED" && (
									<div className="rounded-md border border-border bg-muted/60 p-3 text-center">
										<div className="flex items-center justify-center gap-2 mb-2">
											<div className="h-2 w-2 rounded-full bg-foreground/70" />
											<span className="text-sm font-medium text-foreground">
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
											className="w-full cursor-not-allowed bg-muted text-muted-foreground"
										>
											活动已结束
										</Button>
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
					<div className="rounded-md border border-border bg-muted/60 p-3">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium text-foreground">
									志愿者招募
								</span>
								<div className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
									{volunteerStats.totalApplied}/
									{volunteerStats.totalNeeded}
								</div>
							</div>
						</div>
						<p className="mb-3 text-xs text-muted-foreground">
							报名成为志愿者，亲手塑造你心目中理想的社区活动
						</p>
						<Button
							onClick={() => setShowVolunteerModal(true)}
							variant="outline"
							className="w-full"
							size="sm"
						>
							<Users className="h-4 w-4 mr-2" />
							了解详情
						</Button>
					</div>
				)}

				{/* 辅助操作区域 - 所有用户可见 */}
				<div className="mt-3 space-y-2 border-t border-border pt-3">
					{/* 现场相册入口 - 桌面优先 */}
					<div className="lg:block hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(
									`/events/${event.shortId || event.id}/photos`,
								)
							}
							className="w-full"
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
							className="w-full"
						>
							<ShareIcon className="w-4 h-4" />
							分享活动
						</Button>
					</div>

					{/* 签到二维码 - 只在桌面端显示，移动到更多菜单 */}
					{existingRegistration?.status === "APPROVED" && (
						<div className="lg:block hidden">
							<Button
								variant="outline"
								size="sm"
								onClick={onShowQRGenerator}
								className="w-full"
							>
								签到二维码
							</Button>
						</div>
					)}

					{/* 倒计时大屏 - 管理员工具（桌面端） */}
					{canShowCountdownTool ? (
						<div className="lg:block hidden">
							<Button
								asChild
								variant="outline"
								size="sm"
								className="w-full"
							>
								<Link
									href={`/events/${event.shortId || event.id}/countdown`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Timer className="h-4 w-4" />
									倒计时大屏
								</Link>
							</Button>
						</div>
					) : null}

					{/* 活动反馈 + 联系组织者 */}
					<div className="flex gap-2">
						{/* 活动反馈按钮 */}
						{onFeedbackSubmit &&
							existingRegistration?.status === "APPROVED" && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onShowFeedback?.()}
									className="flex-1"
									data-testid="feedback-button"
								>
									{hasSubmittedFeedback
										? "修改反馈"
										: "活动反馈"}
								</Button>
							)}

						{/* 联系组织者 */}
						{event.organizerContact && !event.isExternalEvent && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onShowContact?.()}
								className={`${
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
							<div className="lg:block border-t border-border pt-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCancelRegistrationAction}
									disabled={isCancellingRegistration}
									className="w-full text-xs text-destructive"
								>
									{isCancellingRegistration
										? "取消中..."
										: existingRegistration.status ===
												"WAITLISTED"
											? "退出等待名单"
											: existingRegistration.status ===
													"PENDING"
												? "取消报名申请"
												: "取消报名"}
								</Button>
							</div>
						)}
				</div>

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
