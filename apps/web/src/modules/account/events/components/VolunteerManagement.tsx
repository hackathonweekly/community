"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { Label } from "@community/ui/ui/label";
import { Textarea } from "@community/ui/ui/textarea";
import {
	CheckIcon,
	ClockIcon,
	EllipsisVerticalIcon,
	StarIcon,
	UserGroupIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";

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

interface VolunteerRegistration {
	id: string;
	status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
	appliedAt: string;
	approvedAt?: string;
	note?: string;
	completed: boolean;
	completedAt?: string;
	cpAwarded: boolean;
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
	requireApproval?: boolean; // Make optional to handle both cases
	isRequired?: boolean; // Legacy field for backward compatibility
	description?: string;
	volunteerRole: {
		id: string;
		name: string;
		description: string;
		iconUrl?: string;
		cpPoints: number;
	};
	registrations: VolunteerRegistration[];
}

interface VolunteerManagementProps {
	eventId: string;
	volunteerRoles: EventVolunteerRole[];
	isOrganizer?: boolean;
	onRefresh?: () => void;
}

export function VolunteerManagement({
	eventId,
	volunteerRoles,
	isOrganizer = false,
	onRefresh,
}: VolunteerManagementProps) {
	const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
	const [selectedRegistration, setSelectedRegistration] =
		useState<VolunteerRegistration | null>(null);
	const [approvalNote, setApprovalNote] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleApproval = async (
		registration: VolunteerRegistration,
		approved: boolean,
	) => {
		setSelectedRegistration(registration);
		setApprovalNote("");
		if (!approved) {
			setIsApprovalDialogOpen(true);
		} else {
			await submitApproval(registration.id, approved, "");
		}
	};

	const submitApproval = async (
		registrationId: string,
		approved: boolean,
		note: string,
	) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/volunteer-admin/approve`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						volunteerRegistrationId: registrationId,
						approved,
						note,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "操作失败");
			}

			const result = await response.json();
			toast.success(result.message);
			onRefresh?.();
		} catch (error) {
			console.error("审核失败:", error);
			toast.error(error instanceof Error ? error.message : "审核失败");
		} finally {
			setIsLoading(false);
			setIsApprovalDialogOpen(false);
			setSelectedRegistration(null);
		}
	};

	const handleCompleteWork = async (
		registration: VolunteerRegistration,
		completed: boolean,
	) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/volunteer-admin/complete`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						volunteerRegistrationId: registration.id,
						completed,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "操作失败");
			}

			const result = await response.json();
			toast.success(result.message);
			onRefresh?.();
		} catch (error) {
			console.error("标记完成状态失败:", error);
			toast.error(error instanceof Error ? error.message : "操作失败");
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusBadge = (
		status: string,
		completed: boolean,
		cpAwarded: boolean,
	) => {
		if (status === "APPROVED" && completed) {
			return (
				<Badge className="bg-green-600">
					已完成 {cpAwarded && "✨"}
				</Badge>
			);
		}

		switch (status) {
			case "APPLIED":
				return (
					<Badge variant="outline" className="text-yellow-600">
						待审核
					</Badge>
				);
			case "APPROVED":
				return (
					<Badge variant="default" className="bg-blue-600">
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

	const getPendingCount = (registrations: VolunteerRegistration[]) => {
		return registrations.filter((r) => r.status === "APPLIED").length;
	};

	const getApprovedCount = (registrations: VolunteerRegistration[]) => {
		return registrations.filter((r) => r.status === "APPROVED").length;
	};

	const getCompletedCount = (registrations: VolunteerRegistration[]) => {
		return registrations.filter(
			(r) => r.status === "APPROVED" && r.completed,
		).length;
	};

	if (!isOrganizer) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserGroupIcon className="w-5 h-5" />
						志愿者管理
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						只有活动组织者才能管理志愿者申请。
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserGroupIcon className="w-5 h-5" />
						志愿者管理 ({volunteerRoles.length} 个角色)
					</CardTitle>
					<CardDescription>
						审核志愿者申请并管理工作完成情况
					</CardDescription>
				</CardHeader>
				<CardContent>
					{volunteerRoles.length === 0 ? (
						<p className="text-muted-foreground">
							此活动暂无志愿者角色招募。
						</p>
					) : (
						<div className="space-y-6">
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
								const pendingCount =
									getPendingCount(registrations);
								const approvedCount =
									getApprovedCount(registrations);
								const completedCount =
									getCompletedCount(registrations);

								return (
									<Card
										key={eventVolunteerRole.id}
										className="border-l-4 border-l-blue-500"
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-start gap-3">
													<div className="w-8 h-8 mt-1 flex items-center justify-center text-lg">
														{getIconForRole(
															volunteerRole.name,
														)}
													</div>
													<div>
														<div className="flex items-center gap-2 mb-1">
															<h4 className="font-medium">
																{
																	volunteerRole.name
																}
															</h4>
															{approvalRequired && (
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	需审批
																</Badge>
															)}
															{!approvalRequired && (
																<Badge
																	variant="secondary"
																	className="text-xs"
																>
																	免审批
																</Badge>
															)}
															<Badge
																variant="outline"
																className="text-xs"
															>
																{
																	volunteerRole.cpPoints
																}{" "}
																积分
															</Badge>
														</div>
														<p className="text-sm text-muted-foreground">
															{
																volunteerRole.description
															}
														</p>
														{eventVolunteerRole.description && (
															<p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
																📝{" "}
																{
																	eventVolunteerRole.description
																}
															</p>
														)}
													</div>
												</div>
												<div className="text-right">
													<div className="text-sm font-medium">
														{approvedCount} /{" "}
														{recruitCount} 已确认
													</div>
													<div className="text-xs text-muted-foreground">
														{completedCount} 已完成
													</div>
													{pendingCount > 0 && (
														<Badge
															variant="outline"
															className="text-yellow-600 mt-1"
														>
															{pendingCount}{" "}
															待审核
														</Badge>
													)}
												</div>
											</div>
										</CardHeader>

										{registrations.length > 0 && (
											<CardContent>
												<div className="space-y-3">
													{registrations.map(
														(registration) => (
															<div
																key={
																	registration.id
																}
																className="flex items-center justify-between p-3 border rounded-lg"
															>
																<div className="flex items-center gap-3">
																	<Avatar className="w-10 h-10">
																		<AvatarImage
																			src={
																				registration
																					.user
																					.image
																			}
																		/>
																		<AvatarFallback>
																			{registration.user.name.charAt(
																				0,
																			)}
																		</AvatarFallback>
																	</Avatar>
																	<div>
																		<div className="font-medium">
																			{
																				registration
																					.user
																					.name
																			}
																		</div>
																		{registration
																			.user
																			.userRoleString && (
																			<div className="text-sm text-muted-foreground">
																				{
																					registration
																						.user
																						.userRoleString
																				}
																			</div>
																		)}
																		<div className="flex items-center gap-2 mt-1">
																			{getStatusBadge(
																				registration.status,
																				registration.completed,
																				registration.cpAwarded,
																			)}
																			<span className="text-xs text-muted-foreground">
																				申请时间：
																				{new Date(
																					registration.appliedAt,
																				).toLocaleDateString()}
																			</span>
																		</div>
																		{registration.note && (
																			<div className="text-sm text-muted-foreground mt-1">
																				申请备注：
																				{
																					registration.note
																				}
																			</div>
																		)}
																	</div>
																</div>

																<DropdownMenu>
																	<DropdownMenuTrigger
																		asChild
																	>
																		<Button
																			variant="ghost"
																			size="sm"
																			disabled={
																				isLoading
																			}
																		>
																			<EllipsisVerticalIcon className="w-4 h-4" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end">
																		{registration.status ===
																			"APPLIED" && (
																			<>
																				<DropdownMenuItem
																					onClick={() =>
																						handleApproval(
																							registration,
																							true,
																						)
																					}
																					className="text-green-600"
																				>
																					<CheckIcon className="w-4 h-4 mr-2" />
																					通过申请
																				</DropdownMenuItem>
																				<DropdownMenuItem
																					onClick={() =>
																						handleApproval(
																							registration,
																							false,
																						)
																					}
																					className="text-red-600"
																				>
																					<XMarkIcon className="w-4 h-4 mr-2" />
																					拒绝申请
																				</DropdownMenuItem>
																			</>
																		)}
																		{registration.status ===
																			"APPROVED" && (
																			<DropdownMenuItem
																				onClick={() =>
																					handleCompleteWork(
																						registration,
																						!registration.completed,
																					)
																				}
																				className={
																					registration.completed
																						? "text-orange-600"
																						: "text-green-600"
																				}
																			>
																				{registration.completed ? (
																					<>
																						<ClockIcon className="w-4 h-4 mr-2" />
																						取消完成
																					</>
																				) : (
																					<>
																						<StarIcon className="w-4 h-4 mr-2" />
																						标记完成
																					</>
																				)}
																			</DropdownMenuItem>
																		)}
																	</DropdownMenuContent>
																</DropdownMenu>
															</div>
														),
													)}
												</div>
											</CardContent>
										)}
									</Card>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* 拒绝申请对话框 */}
			<Dialog
				open={isApprovalDialogOpen}
				onOpenChange={setIsApprovalDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>拒绝志愿者申请</DialogTitle>
						<DialogDescription>
							您确定要拒绝 {selectedRegistration?.user.name}{" "}
							的志愿者申请吗？
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="note">拒绝原因（可选）</Label>
							<Textarea
								id="note"
								placeholder="请输入拒绝原因，这将发送给申请者..."
								value={approvalNote}
								onChange={(e) =>
									setApprovalNote(e.target.value)
								}
								className="mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsApprovalDialogOpen(false)}
							disabled={isLoading}
						>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								selectedRegistration &&
								submitApproval(
									selectedRegistration.id,
									false,
									approvalNote,
								)
							}
							disabled={isLoading}
						>
							{isLoading ? "处理中..." : "确认拒绝"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
