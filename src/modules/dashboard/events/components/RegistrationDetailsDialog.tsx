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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import { useTranslations } from "next-intl";

export interface EventRegistration {
	id: string;
	status: "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "CANCELLED";
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
}

export function RegistrationDetailsDialog({
	registration,
	eventQuestions,
	onUpdateStatus,
	onCancelRegistration,
}: RegistrationDetailsDialogProps) {
	const t = useTranslations("events.manage");
	const [cancelReason, setCancelReason] = useState("");
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	// Create a map of questionId -> answer for quick lookup
	const answersMap = new Map(
		registration.answers?.map((a) => [a.question.id, a.answer]) || [],
	);

	// Get all questions to display (either from eventQuestions prop or from registration.answers)
	const questionsToDisplay =
		eventQuestions || registration.answers?.map((a) => a.question) || [];

	return (
		<>
			<DialogContent className="max-w-2xl">
				<div className="max-h-[90vh] overflow-y-auto">
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
		</>
	);
}
