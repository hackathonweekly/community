"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	cpPoints: number;
}

interface EventVolunteerRole {
	id: string;
	recruitCount: number;
	description?: string;
	volunteerRole: VolunteerRole;
}

interface VolunteerApplicationModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
	eventVolunteerRole: EventVolunteerRole;
	onSuccess?: () => void;
	eventContactInfo?: string;
	eventWechatQrCode?: string;
}

// 根据角色名称获取对应的emoji图标
const getIconForRole = (roleName: string): string => {
	const iconMap: Record<string, string> = {
		主持人: "🎤",
		签到接待: "👋",
		签到接待组: "👋",
		技术支持: "🔧",
		技术支持组: "🔧",
		记录摄影: "📸",
		记录摄影组: "📸",
		计时员: "⏰",
		物料管理: "📦",
		物料管理员: "📦",
	};

	return iconMap[roleName] || "👤";
};

export function VolunteerApplicationModal({
	isOpen,
	onClose,
	eventId,
	eventVolunteerRole,
	onSuccess,
	eventContactInfo,
	eventWechatQrCode,
}: VolunteerApplicationModalProps) {
	const [note, setNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const t = useTranslations("events.volunteer.application");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!note.trim()) {
			toast.error(t("noteRequired"));
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(
				`/api/events/${eventId}/volunteers/apply`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						eventVolunteerRoleId: eventVolunteerRole.id,
						note: note.trim(),
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || t("applyError"));
			}

			const result = await response.json();
			toast.success(result.message || t("applySuccess"));
			setIsSubmitted(true);
			onSuccess?.();
		} catch (error) {
			console.error("Error applying for volunteer role:", error);
			toast.error(
				error instanceof Error ? error.message : t("applyError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setNote("");
		setIsSubmitting(false);
		setIsSubmitted(false);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>申请志愿者角色</DialogTitle>
					<DialogDescription>
						请填写您的申请信息，组织者将会审核您的申请。
					</DialogDescription>
				</DialogHeader>

				{!isSubmitted ? (
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* 角色信息 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<div className="w-8 h-8 flex items-center justify-center text-lg">
										{getIconForRole(
											eventVolunteerRole.volunteerRole
												.name,
										)}
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span>
												{
													eventVolunteerRole
														.volunteerRole.name
												}
											</span>
											<Badge
												variant="outline"
												className="text-xs"
											>
												{
													eventVolunteerRole
														.volunteerRole.cpPoints
												}{" "}
												CP
											</Badge>
										</div>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<Label className="text-sm font-medium">
										角色描述
									</Label>
									<p className="text-sm text-muted-foreground mt-1">
										{
											eventVolunteerRole.volunteerRole
												.description
										}
									</p>
								</div>

								{eventVolunteerRole.volunteerRole
									.detailDescription && (
									<div>
										<Label className="text-sm font-medium">
											详细说明
										</Label>
										<div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
											{
												eventVolunteerRole.volunteerRole
													.detailDescription
											}
										</div>
									</div>
								)}

								{eventVolunteerRole.description && (
									<div>
										<Label className="text-sm font-medium">
											本次活动特殊要求
										</Label>
										<p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
											📝 {eventVolunteerRole.description}
										</p>
									</div>
								)}

								<div>
									<Label className="text-sm font-medium">
										招募人数
									</Label>
									<p className="text-sm text-muted-foreground mt-1">
										需要 {eventVolunteerRole.recruitCount}{" "}
										人
									</p>
								</div>
							</CardContent>
						</Card>

						{/* 申请表单 */}
						<div className="space-y-4">
							<div>
								<Label
									htmlFor="note"
									className="text-sm font-medium"
								>
									申请说明{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Textarea
									id="note"
									placeholder="请介绍您的相关经验、技能或申请这个志愿者角色的原因..."
									value={note}
									onChange={(e) => setNote(e.target.value)}
									className="mt-1"
									rows={4}
									required
								/>
								<p className="text-xs text-muted-foreground mt-1">
									请详细说明您申请这个角色的原因和相关经验，这将帮助组织者更好地了解您。
								</p>
							</div>
						</div>

						{/* 提交按钮 */}
						<div className="flex gap-3 justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
							>
								取消
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting || !note.trim()}
							>
								{isSubmitting ? "申请中..." : "提交申请"}
							</Button>
						</div>
					</form>
				) : (
					<div className="space-y-6">
						{/* 申请成功提示 */}
						<div className="text-center space-y-3 py-6">
							<div className="text-6xl">✅</div>
							<div>
								<h3 className="text-lg font-medium text-green-600">
									申请已提交
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									您的志愿者申请已成功提交，请等待活动组织者审核。
								</p>
							</div>
						</div>

						{/* 联系信息 */}
						{(eventContactInfo || eventWechatQrCode) && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										活动联系方式
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										申请期间如有疑问，可通过以下方式联系活动组织者：
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{eventContactInfo && (
										<div>
											<Label className="text-sm font-medium">
												联系方式
											</Label>
											<p className="text-sm text-muted-foreground mt-1">
												{eventContactInfo}
											</p>
										</div>
									)}

									{eventWechatQrCode && (
										<div>
											<Label className="text-sm font-medium">
												志愿者微信群
											</Label>
											<div className="mt-2">
												<img
													src={eventWechatQrCode}
													alt="志愿者微信群二维码"
													className="w-32 h-32 border rounded"
												/>
												<p className="text-xs text-muted-foreground mt-1">
													扫码加入志愿者微信群
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						<div className="flex justify-end">
							<Button onClick={handleClose}>关闭</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
