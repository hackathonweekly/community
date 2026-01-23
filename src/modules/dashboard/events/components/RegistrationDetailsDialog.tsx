"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
	style: "currency",
	currency: "CNY",
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

const registrationDateFormat = "yyyy-MM-dd HH:mm";

export interface EventRegistration {
	id: string;
	status:
		| "PENDING_PAYMENT"
		| "PENDING"
		| "APPROVED"
		| "WAITLISTED"
		| "REJECTED"
		| "CANCELLED";
	eventId: string;
	registeredAt: string;
	note?: string;
	reviewedAt?: string;
	reviewNote?: string;
	allowDigitalCardDisplay?: boolean; // 是否愿意在现场屏幕公开数字名片
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
		username?: string;
		userRole?: string;
		userRoleString?: string;
		currentWorkOn?: string;
		lifeStatus?: string;
		city?: string;
		bio?: string;
		phoneNumber?: string;
		wechatId?: string;
	};
	ticketType?: {
		id: string;
		name: string;
		description?: string;
		price?: number;
	};
	answers: Array<{
		id: string;
		answer: string;
		question: {
			id: string;
			question: string;
			type: string;
			required: boolean;
			options?: string[];
		};
	}>;
	projectSubmission?: {
		id: string;
		title: string;
		description: string;
		status: string;
		project: {
			id: string;
			title: string;
			description?: string;
			screenshots?: string[];
			stage: string;
			projectTags?: string[];
			url?: string;
		};
	} | null;
	order?: {
		id: string;
		orderNo: string;
		status:
			| "PENDING"
			| "PAID"
			| "CANCELLED"
			| "REFUND_PENDING"
			| "REFUNDED";
		totalAmount: number;
		expiredAt: string;
		paidAt?: string | null;
		paymentMethod?: string | null;
	} | null;
}

interface RegistrationDetailsDialogProps {
	registration: EventRegistration;
	eventQuestions?: Array<{
		id: string;
		question: string;
		type: string;
		required: boolean;
		options?: string[];
	}>;
	onUpdateStatus: (userId: string, status: string) => void;
	onCancelRegistration: (userId: string, reason: string) => void;
	allRegistrations?: EventRegistration[];
	currentIndex?: number;
	onNavigate?: (direction: "prev" | "next") => void;
	setCurrentIndex?: (index: number | null) => void;
}

export function RegistrationDetailsDialog({
	registration,
	eventQuestions,
	onUpdateStatus,
	onCancelRegistration,
	allRegistrations,
	currentIndex,
	onNavigate,
	setCurrentIndex,
}: RegistrationDetailsDialogProps) {
	const t = useTranslations("events.manage");
	const [cancelReason, setCancelReason] = useState("");
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [markingPaid, setMarkingPaid] = useState(false);
	const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);

	// Create a map of questionId -> answer for quick lookup
	const answersMap = new Map(
		registration.answers?.map((a) => [a.question.id, a.answer]) || [],
	);

	// Get all questions to display (either from eventQuestions prop or from registration.answers)
	const questionsToDisplay =
		eventQuestions || registration.answers?.map((a) => a.question) || [];

	const orderStatusLabels = {
		PENDING: t("registrations.dialog.order.status.pending"),
		PAID: t("registrations.dialog.order.status.paid"),
		CANCELLED: t("registrations.dialog.order.status.cancelled"),
		REFUND_PENDING: t("registrations.dialog.order.status.refundPending"),
		REFUNDED: t("registrations.dialog.order.status.refunded"),
	} as const;

	const paymentMethodLabels = {
		WECHAT_NATIVE: t(
			"registrations.dialog.order.paymentMethod.wechatNative",
		),
		WECHAT_JSAPI: t("registrations.dialog.order.paymentMethod.wechatJsapi"),
		STRIPE: t("registrations.dialog.order.paymentMethod.stripe"),
		FREE: t("registrations.dialog.order.paymentMethod.free"),
	} as const;

	const resolveOrderStatusLabel = (
		status?: NonNullable<EventRegistration["order"]>["status"],
	) => (status ? orderStatusLabels[status] || status : "-");

	const resolvePaymentMethodLabel = (
		method?: NonNullable<EventRegistration["order"]>["paymentMethod"],
	) => (method ? paymentMethodLabels[method] || method : "-");

	const handleManualMarkPaid = async () => {
		if (!registration.order) return;
		setShowMarkPaidDialog(false);
		setMarkingPaid(true);
		try {
			const response = await fetch(
				`/api/events/${registration.eventId}/orders/${registration.order.id}/mark-paid`,
				{ method: "POST" },
			);
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload?.error ||
						t("registrations.dialog.order.markPaidFailed"),
				);
			}
			toast.success(t("registrations.dialog.order.markPaidSuccess"));
			if (payload?.data?.registrationStatus) {
				onUpdateStatus(
					registration.user.id,
					payload.data.registrationStatus,
				);
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: t("registrations.dialog.order.markPaidFailed");
			toast.error(message);
		} finally {
			setMarkingPaid(false);
		}
	};

	return (
		<>
			<DialogContent className="max-w-2xl">
				<div className="max-h-[90vh] overflow-y-auto">
					{/* Navigation buttons */}
					{allRegistrations &&
						allRegistrations.length > 1 &&
						currentIndex !== undefined &&
						currentIndex !== null && (
							<div className="flex justify-between items-center mb-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onNavigate?.("prev")}
									disabled={currentIndex === 0}
								>
									← 上一个
								</Button>
								<span className="text-sm text-muted-foreground">
									{currentIndex + 1} /{" "}
									{allRegistrations.length}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onNavigate?.("next")}
									disabled={
										currentIndex ===
										allRegistrations.length - 1
									}
								>
									下一个 →
								</Button>
							</div>
						)}
					<DialogHeader>
						<DialogTitle>{registration.user.name}</DialogTitle>
						<DialogDescription>
							{t("registrations.dialog.title")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">
								{t("registrations.dialog.contactInformation")}
							</h4>
							<div className="space-y-1 text-sm">
								<p>
									<strong>
										{t("registrations.dialog.email")}
									</strong>{" "}
									{registration.user.email}
								</p>
								{registration.user.phoneNumber && (
									<p>
										<strong>手机号</strong>{" "}
										{registration.user.phoneNumber}
									</p>
								)}
								{registration.user.wechatId && (
									<p>
										<strong>微信号</strong>{" "}
										{registration.user.wechatId}
									</p>
								)}
								{registration.user.city && (
									<p>
										<strong>
											{t("registrations.dialog.city")}
										</strong>{" "}
										{registration.user.city}
									</p>
								)}
							</div>
						</div>

						<div>
							<h4 className="font-medium mb-2">用户详情</h4>
							<div className="space-y-1 text-sm">
								{registration.user.userRoleString && (
									<p>
										<strong>用户角色</strong>{" "}
										{registration.user.userRoleString}
									</p>
								)}
								{registration.user.currentWorkOn && (
									<p>
										<strong>当前在做</strong>{" "}
										{registration.user.currentWorkOn}
									</p>
								)}
								{registration.user.lifeStatus && (
									<p>
										<strong>当前状态</strong>{" "}
										{getLifeStatusLabel(
											registration.user.lifeStatus,
										)}
									</p>
								)}
								{registration.user.bio && (
									<p>
										<strong>
											{t("registrations.dialog.bio")}
										</strong>{" "}
										{registration.user.bio}
									</p>
								)}
							</div>
						</div>

						<div>
							<h4 className="font-medium mb-2">屏幕展示偏好</h4>
							<div className="space-y-1 text-sm">
								<p>
									<strong>允许屏幕展示自我介绍</strong>{" "}
									<span
										className={
											registration.allowDigitalCardDisplay
												? "text-green-600"
												: "text-gray-500"
										}
									>
										{registration.allowDigitalCardDisplay ===
										true
											? "✓ 是"
											: registration.allowDigitalCardDisplay ===
													false
												? "✗ 否"
												: "未设置"}
									</span>
								</p>
							</div>
						</div>

						{registration.order && (
							<div>
								<h4 className="font-medium mb-2">
									{t("registrations.dialog.order.title")}
								</h4>
								<div className="space-y-1 text-sm">
									<p>
										<strong>
											{t(
												"registrations.dialog.order.number",
											)}
										</strong>{" "}
										{registration.order.orderNo}
									</p>
									<p>
										<strong>
											{t(
												"registrations.dialog.order.amount",
											)}
										</strong>{" "}
										{currencyFormatter.format(
											registration.order.totalAmount,
										)}
									</p>
									<p>
										<strong>
											{t(
												"registrations.dialog.order.statusLabel",
											)}
										</strong>{" "}
										{resolveOrderStatusLabel(
											registration.order.status,
										)}
									</p>
									<p>
										<strong>
											{t(
												"registrations.dialog.order.paymentMethodLabel",
											)}
										</strong>{" "}
										{resolvePaymentMethodLabel(
											registration.order.paymentMethod ??
												undefined,
										)}
									</p>
									<p>
										<strong>
											{t(
												"registrations.dialog.order.expiredAt",
											)}
										</strong>{" "}
										{format(
											new Date(
												registration.order.expiredAt,
											),
											registrationDateFormat,
										)}
									</p>
									{registration.order.paidAt && (
										<p>
											<strong>
												{t(
													"registrations.dialog.order.paidAt",
												)}
											</strong>{" "}
											{format(
												new Date(
													registration.order.paidAt,
												),
												registrationDateFormat,
											)}
										</p>
									)}
								</div>
								{registration.order.status === "PENDING" && (
									<div className="pt-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setShowMarkPaidDialog(true)
											}
											disabled={markingPaid}
										>
											{t(
												"registrations.dialog.order.markPaid",
											)}
										</Button>
									</div>
								)}
							</div>
						)}

						{questionsToDisplay.length > 0 && (
							<div>
								<h4 className="font-medium mb-2">
									{t("registrations.dialog.questionAnswers")}
								</h4>
								<div className="space-y-3">
									{questionsToDisplay.map((question) => {
										const answer = answersMap.get(
											question.id,
										);
										return (
											<div
												key={question.id}
												className="border rounded-lg p-3"
											>
												<p className="font-medium text-sm">
													{question.question}
													{question.required && (
														<span className="text-red-500 ml-1">
															*
														</span>
													)}
												</p>
												<p
													className={`mt-1 text-sm ${answer ? "text-muted-foreground" : "text-gray-400 italic"}`}
												>
													{answer || "未回答"}
												</p>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* 操作按钮 */}
					<div className="flex justify-end gap-2 pt-4 border-t">
						{registration.status === "PENDING" && (
							<>
								<Button
									onClick={() =>
										onUpdateStatus(
											registration.user.id,
											"APPROVED",
										)
									}
								>
									{t(
										"registrations.dialog.approveRegistration",
									)}
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										onUpdateStatus(
											registration.user.id,
											"REJECTED",
										)
									}
								>
									{t(
										"registrations.dialog.rejectRegistration",
									)}
								</Button>
							</>
						)}
						{registration.status === "REJECTED" && (
							<Button
								onClick={() =>
									onUpdateStatus(
										registration.user.id,
										"APPROVED",
									)
								}
							>
								{t("registrations.dialog.undoRejectApprove")}
							</Button>
						)}
						{(registration.status === "APPROVED" ||
							registration.status === "PENDING") && (
							<Button
								variant="destructive"
								onClick={() => setShowCancelDialog(true)}
							>
								取消报名
							</Button>
						)}
					</div>
				</div>
			</DialogContent>

			{/* 取消报名确认对话框 */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>取消报名确认</DialogTitle>
						<DialogDescription>
							您确定要取消 {registration.user.name} 的报名吗？
							参与者将收到取消通知。
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="cancel-reason">取消原因 *</Label>
							<Input
								id="cancel-reason"
								value={cancelReason}
								onChange={(e) =>
									setCancelReason(e.target.value)
								}
								placeholder="请输入取消原因（必填）"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowCancelDialog(false);
								setCancelReason("");
							}}
						>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (cancelReason.trim()) {
									onCancelRegistration(
										registration.user.id,
										cancelReason,
									);
									setShowCancelDialog(false);
									setCancelReason("");
								}
							}}
							disabled={!cancelReason.trim()}
						>
							确认取消
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 手动标记已支付确认对话框 */}
			<AlertDialog
				open={showMarkPaidDialog}
				onOpenChange={setShowMarkPaidDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("registrations.dialog.order.markPaid")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("registrations.dialog.order.markPaidConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleManualMarkPaid}>
							确认
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
