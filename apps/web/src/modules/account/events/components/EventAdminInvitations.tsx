"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Calendar,
	MapPin,
	User,
	Check,
	X,
	Clock,
	ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";

interface EventAdminInvitation {
	id: string;
	eventId: string;
	email: string;
	role: "ADMIN" | "SUPER_ADMIN";
	status: "PENDING";
	canEditEvent: boolean;
	canManageRegistrations: boolean;
	canManageAdmins: boolean;
	invitedAt: string;
	event: {
		id: string;
		title: string;
		richContent: string;
		shortDescription?: string;
		startTime: string;
		endTime: string;
		isOnline: boolean;
		address?: string;
	};
	inviter: {
		id: string;
		name: string;
		username?: string;
	};
}

export function EventAdminInvitations() {
	const [invitations, setInvitations] = useState<EventAdminInvitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const toastsT = useTranslations("dashboard.events.adminInvitations.toasts");

	useEffect(() => {
		fetchInvitations();
	}, []);

	const fetchInvitations = async () => {
		try {
			const response = await fetch("/api/events/admin-invitations");
			if (response.ok) {
				const data = await response.json();
				setInvitations(data.data || []);
			} else {
				toast.error(toastsT("fetchFailed"));
			}
		} catch (error) {
			console.error("Failed to fetch invitations:", error);
			toast.error(toastsT("fetchFailed"));
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptInvitation = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			const response = await fetch(
				`/api/events/admin-invitations/${invitationId}/accept`,
				{
					method: "POST",
				},
			);

			if (response.ok) {
				toast.success(toastsT("acceptSuccess"));
				fetchInvitations();
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || toastsT("acceptFailed"));
			}
		} catch (error) {
			console.error("Error accepting invitation:", error);
			toast.error(toastsT("acceptFailed"));
		} finally {
			setProcessingId(null);
		}
	};

	const handleRejectInvitation = async (invitationId: string) => {
		setProcessingId(invitationId);
		try {
			const response = await fetch(
				`/api/events/admin-invitations/${invitationId}/reject`,
				{
					method: "POST",
				},
			);

			if (response.ok) {
				toast.success(toastsT("rejectSuccess"));
				fetchInvitations();
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || toastsT("rejectFailed"));
			}
		} catch (error) {
			console.error("Error rejecting invitation:", error);
			toast.error(toastsT("rejectFailed"));
		} finally {
			setProcessingId(null);
		}
	};

	const getRoleBadge = (role: EventAdminInvitation["role"]) => {
		return role === "SUPER_ADMIN"
			? { variant: "secondary" as const, text: "超级管理员" }
			: { variant: "outline" as const, text: "管理员" };
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<div className="animate-pulse space-y-3">
						<div className="h-6 bg-muted rounded w-40" />
						<div className="h-4 bg-muted rounded w-64" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse space-y-3">
						<div className="h-32 bg-muted rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<Clock className="w-5 h-5" />
					<span className="whitespace-nowrap">活动管理员邀请</span>
				</CardTitle>
				<CardDescription>
					您收到的活动管理员邀请，需要确认接受或拒绝
				</CardDescription>
			</CardHeader>
			<CardContent>
				{invitations.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
						<p>暂无待处理的管理员邀请</p>
					</div>
				) : (
					<div className="space-y-4">
						{invitations.map((invitation) => {
							const roleConfig = getRoleBadge(invitation.role);
							const isProcessing = processingId === invitation.id;

							return (
								<div
									key={invitation.id}
									className="border rounded-lg p-4 space-y-4"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center space-x-2 mb-2">
												<h3 className="font-semibold text-lg">
													{invitation.event.title}
												</h3>
												<Badge
													variant={roleConfig.variant}
												>
													{roleConfig.text}
												</Badge>
											</div>

											<p className="text-muted-foreground mb-3">
												{invitation.event
													.shortDescription ||
													"暂无描述"}
											</p>

											<div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
												<div className="flex items-center space-x-1">
													<Calendar className="w-4 h-4" />
													<span>
														{new Date(
															invitation.event
																.startTime,
														).toLocaleDateString()}
													</span>
												</div>
												<div className="flex items-center space-x-1">
													<MapPin className="w-4 h-4" />
													<span>
														{invitation.event
															.isOnline
															? "线上活动"
															: invitation.event
																	.address ||
																"待定"}
													</span>
												</div>
											</div>

											<div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
												<User className="w-4 h-4" />
												<span>
													由 {invitation.inviter.name}{" "}
													邀请
												</span>
												<span className="text-muted-foreground">
													{new Date(
														invitation.invitedAt,
													).toLocaleString()}
												</span>
											</div>

											<div className="space-y-2">
												<h4 className="font-medium text-sm">
													管理权限：
												</h4>
												<div className="flex flex-wrap gap-1">
													{invitation.canEditEvent && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															可编辑活动
														</Badge>
													)}
													{invitation.canManageRegistrations && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															可管理报名
														</Badge>
													)}
													{invitation.canManageAdmins && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															可管理管理员
														</Badge>
													)}
												</div>
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between pt-4 border-t">
										<Link
											href={`/events/${invitation.eventId}`}
											className="inline-flex items-center text-sm text-primary hover:text-primary/80"
										>
											<ExternalLink className="w-4 h-4 mr-1" />
											查看活动详情
										</Link>

										<div className="flex space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleRejectInvitation(
														invitation.id,
													)
												}
												disabled={isProcessing}
											>
												<X className="w-4 h-4 mr-1" />
												拒绝
											</Button>
											<Button
												size="sm"
												onClick={() =>
													handleAcceptInvitation(
														invitation.id,
													)
												}
												disabled={isProcessing}
											>
												<Check className="w-4 h-4 mr-1" />
												{isProcessing
													? "处理中..."
													: "接受"}
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
