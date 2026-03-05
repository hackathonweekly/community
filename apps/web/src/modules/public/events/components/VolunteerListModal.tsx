"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import {
	ClockIcon,
	StarIcon,
	UserGroupIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { VolunteerApplicationModal } from "./VolunteerApplicationModal";
import { parseRegistrationError } from "./registrationErrorUtils";

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

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

interface VolunteerRegistration {
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
}

interface EventVolunteerRole {
	id: string;
	recruitCount: number;
	requireApproval?: boolean;
	isRequired?: boolean;
	description?: string;
	volunteerRole: VolunteerRole;
	registrations: VolunteerRegistration[];
}

interface Event {
	id: string;
	title: string;
	status: string;
	endTime: string;
	volunteerRoles?: EventVolunteerRole[];
	volunteerContactInfo?: string;
	volunteerWechatQrCode?: string;
}

interface VolunteerListModalProps {
	isOpen: boolean;
	onClose: () => void;
	event: Event;
	currentUserId?: string;
	onApplicationSuccess?: (eventVolunteerRoleId?: string) => void;
}

export function VolunteerListModal({
	isOpen,
	onClose,
	event,
	currentUserId,
	onApplicationSuccess,
}: VolunteerListModalProps) {
	const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
	const [showApplicationForm, setShowApplicationForm] = useState(false);
	const [selectedRole, setSelectedRole] = useState<EventVolunteerRole | null>(
		null,
	);
	const t = useTranslations("events.volunteer.list");

	const volunteerRoles = event.volunteerRoles || [];

	const handleOpenApplicationForm = (
		eventVolunteerRole: EventVolunteerRole,
	) => {
		setSelectedRole(eventVolunteerRole);
		setShowApplicationForm(true);
	};

	const handleApplicationSuccess = () => {
		setShowApplicationForm(false);
		setSelectedRole(null);
		onApplicationSuccess?.();
		toast.success(t("applicationSuccess"));
	};

	const handleCancelApplication = async (
		eventVolunteerRole: EventVolunteerRole,
	) => {
		try {
			const response = await fetch(
				`/api/events/${event.id}/volunteers/cancel`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						eventVolunteerRoleId: eventVolunteerRole.id,
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				toast.success(result.message || t("cancelSuccess"));
				onApplicationSuccess?.();
			} else {
				const message = await parseRegistrationError(
					response,
					t("cancelError"),
				);
				toast.error(message);
			}
		} catch (error) {
			console.error("Error cancelling application:", error);
			toast.error(t("cancelRetry"));
		}
	};

	const toggleRoleExpansion = (roleId: string) => {
		const newExpanded = new Set(expandedRoles);
		if (newExpanded.has(roleId)) {
			newExpanded.delete(roleId);
		} else {
			newExpanded.add(roleId);
		}
		setExpandedRoles(newExpanded);
	};

	const getApprovalStatusBadge = (status: string) => {
		switch (status) {
			case "APPLIED":
				return (
					<Badge variant="outline" className="text-yellow-600">
						申请中
					</Badge>
				);
			case "APPROVED":
				return (
					<Badge variant="default" className="bg-green-600">
						已通过
					</Badge>
				);
			case "REJECTED":
				return <Badge variant="destructive">已拒绝</Badge>;
			case "CANCELLED":
				return <Badge variant="secondary">已取消</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const getUserApplicationStatus = (
		roleRegistrations: VolunteerRegistration[],
	) => {
		if (!currentUserId || !roleRegistrations) {
			return null;
		}
		return roleRegistrations.find((reg) => reg.user.id === currentUserId);
	};

	const getApprovedVolunteers = (
		roleRegistrations: VolunteerRegistration[],
	) => {
		if (!roleRegistrations) {
			return [];
		}
		return roleRegistrations.filter((reg) => reg.status === "APPROVED");
	};

	const canApplyForRole = (eventVolunteerRole: EventVolunteerRole) => {
		if (!currentUserId) {
			return false;
		}

		const userApplication = getUserApplicationStatus(
			eventVolunteerRole.registrations,
		);
		const approvedVolunteers = getApprovedVolunteers(
			eventVolunteerRole.registrations,
		);

		// 用户已经申请过这个角色
		if (
			userApplication &&
			userApplication.status !== "REJECTED" &&
			userApplication.status !== "CANCELLED"
		) {
			return false;
		}

		// 角色已满员
		if (approvedVolunteers.length >= eventVolunteerRole.recruitCount) {
			return false;
		}

		return true;
	};

	// 计算统计数据
	const totalRoles = volunteerRoles.length;
	const totalNeeded = volunteerRoles.reduce(
		(sum, role) => sum + role.recruitCount,
		0,
	);
	const totalApplied = volunteerRoles.reduce(
		(sum, role) =>
			sum +
			role.registrations.filter((reg) => reg.status !== "CANCELLED")
				.length,
		0,
	);

	if (volunteerRoles.length === 0) {
		return null;
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<UserGroupIcon className="w-5 h-5" />
							志愿者招募 - {event.title}
						</DialogTitle>
						<DialogDescription>
							共 {totalRoles} 个角色，需要 {totalNeeded} 人，已有{" "}
							{totalApplied} 人申请
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{volunteerRoles.map((eventVolunteerRole) => {
							const {
								volunteerRole,
								registrations,
								recruitCount,
								requireApproval,
								isRequired,
							} = eventVolunteerRole;
							const approvalRequired =
								requireApproval ?? isRequired ?? true;
							const approvedVolunteers =
								getApprovedVolunteers(registrations);
							const userApplication =
								getUserApplicationStatus(registrations);
							const isExpanded = expandedRoles.has(
								eventVolunteerRole.id,
							);

							return (
								<div
									key={eventVolunteerRole.id}
									className="border rounded-lg p-4 transition-all duration-300 border-gray-200 hover:border-gray-300"
								>
									{/* 角色头部信息 */}
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-start gap-3">
											<div className="w-8 h-8 mt-1 flex items-center justify-center text-lg">
												{getIconForRole(
													volunteerRole.name,
												)}
											</div>
											<div>
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium">
														{volunteerRole.name}
													</h4>
													<Badge
														variant="outline"
														className="text-xs"
													>
														{volunteerRole.cpPoints}{" "}
														积分
													</Badge>
												</div>
												<p className="text-sm text-muted-foreground mb-2">
													{volunteerRole.description}
												</p>
												{eventVolunteerRole.description && (
													<p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
														📝 本次活动特殊说明：
														{
															eventVolunteerRole.description
														}
													</p>
												)}
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-medium">
												{approvedVolunteers.length} /{" "}
												{recruitCount}
											</div>
											<div className="text-xs text-muted-foreground">
												{approvedVolunteers.length >=
												recruitCount
													? "已满员"
													: "招募中"}
											</div>
										</div>
									</div>

									{/* 用户申请状态 */}
									{userApplication && (
										<div className="mb-3 p-2 bg-gray-50 rounded-lg">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<ClockIcon className="w-4 h-4" />
													<span className="text-sm">
														您的申请状态：
													</span>
													{getApprovalStatusBadge(
														userApplication.status,
													)}
												</div>
												<div className="flex items-center gap-2">
													{userApplication.appliedAt && (
														<span className="text-xs text-muted-foreground">
															申请时间：
															{new Date(
																userApplication.appliedAt,
															).toLocaleDateString()}
														</span>
													)}
													{(userApplication.status ===
														"APPLIED" ||
														userApplication.status ===
															"APPROVED") && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																handleCancelApplication(
																	eventVolunteerRole,
																)
															}
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
														>
															<XMarkIcon className="w-4 h-4 mr-1" />
															取消申请
														</Button>
													)}
												</div>
											</div>
											{userApplication.note && (
												<p className="text-sm text-muted-foreground mt-1">
													申请备注：
													{userApplication.note}
												</p>
											)}
										</div>
									)}

									{/* 申请按钮 */}
									{canApplyForRole(eventVolunteerRole) && (
										<div className="mb-3">
											<Button
												size="sm"
												onClick={() =>
													handleOpenApplicationForm(
														eventVolunteerRole,
													)
												}
												className="w-full transition-all duration-300 bg-primary hover:bg-primary/90"
											>
												申请成为{volunteerRole.name}
											</Button>
										</div>
									)}

									{/* 已通过的志愿者列表 */}
									{approvedVolunteers.length > 0 && (
										<div>
											<div
												className="flex items-center justify-between cursor-pointer"
												onClick={() =>
													toggleRoleExpansion(
														eventVolunteerRole.id,
													)
												}
											>
												<span className="text-sm font-medium">
													已确认志愿者 (
													{approvedVolunteers.length})
												</span>
												<Button
													variant="ghost"
													size="sm"
												>
													{isExpanded
														? "收起"
														: "展开"}
												</Button>
											</div>

											{isExpanded && (
												<div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
													{approvedVolunteers.map(
														(registration) => (
															<Link
																key={
																	registration
																		.user.id
																}
																href={`/u/${
																	registration
																		.user
																		.username ||
																	registration
																		.user.id
																}`}
																className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
															>
																<UserAvatar
																	name={
																		registration
																			.user
																			.name
																	}
																	avatarUrl={
																		registration
																			.user
																			.image
																	}
																	className="w-8 h-8"
																/>
																<div className="flex-1 min-w-0">
																	<div className="font-medium text-sm truncate">
																		{
																			registration
																				.user
																				.name
																		}
																	</div>
																	{registration
																		.user
																		.userRoleString && (
																		<div className="text-xs text-muted-foreground truncate">
																			{
																				registration
																					.user
																					.userRoleString
																			}
																		</div>
																	)}
																</div>
																{registration.approvedAt && (
																	<div className="text-xs text-green-600">
																		<StarIcon className="w-3 h-3" />
																	</div>
																)}
															</Link>
														),
													)}
												</div>
											)}
										</div>
									)}

									{/* 联系信息 */}
									{userApplication &&
										userApplication.status !== "REJECTED" &&
										userApplication.status !==
											"CANCELLED" &&
										(event.volunteerContactInfo ||
											event.volunteerWechatQrCode) && (
											<div className="mt-3 pt-3 border-t">
												<div className="text-sm font-medium mb-2">
													📞 活动联系方式
												</div>
												<div className="space-y-2">
													{event.volunteerContactInfo && (
														<div className="text-sm text-muted-foreground">
															<span className="font-medium">
																联系方式：
															</span>
															{
																event.volunteerContactInfo
															}
														</div>
													)}
													{event.volunteerWechatQrCode && (
														<div>
															<div className="text-sm text-muted-foreground mb-1">
																<span className="font-medium">
																	志愿者微信群：
																</span>
															</div>
															<img
																src={
																	event.volunteerWechatQrCode
																}
																alt="志愿者微信群二维码"
																className="w-24 h-24 border rounded"
															/>
														</div>
													)}
												</div>
											</div>
										)}
								</div>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>

			{/* 志愿者申请表单弹窗 */}
			{showApplicationForm && selectedRole && (
				<VolunteerApplicationModal
					isOpen={showApplicationForm}
					onClose={() => {
						setShowApplicationForm(false);
						setSelectedRole(null);
					}}
					eventId={event.id}
					eventVolunteerRole={selectedRole}
					onSuccess={handleApplicationSuccess}
					eventContactInfo={event.volunteerContactInfo}
					eventWechatQrCode={event.volunteerWechatQrCode}
				/>
			)}
		</>
	);
}
