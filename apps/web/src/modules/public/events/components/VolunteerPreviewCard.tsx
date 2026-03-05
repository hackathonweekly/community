"use client";

import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Users, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface VolunteerRole {
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
}

interface VolunteerPreviewCardProps {
	eventId: string;
	volunteerRoles: VolunteerRole[];
	currentUserId?: string;
	onVolunteerApply: (eventVolunteerRoleId: string) => void;
	onViewAllVolunteers: () => void;
	eventContactInfo?: string;
	eventWechatQrCode?: string;
}

export function VolunteerPreviewCard({
	volunteerRoles,
	currentUserId,
	onViewAllVolunteers,
}: VolunteerPreviewCardProps) {
	const t = useTranslations();

	if (!volunteerRoles || volunteerRoles.length === 0) {
		return null;
	}

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

	// 计算用户申请状态
	const userApplications = currentUserId
		? volunteerRoles.reduce(
				(acc, role) => {
					const userApp = role.registrations.find(
						(reg) => reg.user.id === currentUserId,
					);
					if (userApp) {
						acc.push({
							role: role.volunteerRole.name,
							status: userApp.status,
						});
					}
					return acc;
				},
				[] as Array<{ role: string; status: string }>,
			)
		: [];

	// 检查是否有未满员的角色
	const hasAvailableRoles = volunteerRoles.some((role) => {
		const approvedCount = role.registrations.filter(
			(reg) => reg.status === "APPROVED",
		).length;
		return approvedCount < role.recruitCount;
	});

	return (
		<Card className="border-dashed border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
			<CardContent className="p-4">
				{/* 标题区域 */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-orange-600" />
						<span className="font-medium text-orange-800">
							{t("events.volunteerRecruitment")}
						</span>
						<Badge
							variant="secondary"
							className="bg-orange-100 text-orange-700"
						>
							{totalApplied}/{totalNeeded}人
						</Badge>
					</div>
				</div>

				{/* 招募概览 */}
				<div className="space-y-3">
					<div className="grid grid-cols-3 gap-4 text-center">
						<div className="bg-white/80 rounded-lg p-3">
							<div className="text-lg font-semibold text-orange-600">
								{totalRoles}
							</div>
							<div className="text-xs text-gray-600">
								招募角色
							</div>
						</div>
						<div className="bg-white/80 rounded-lg p-3">
							<div className="text-lg font-semibold text-orange-600">
								{totalNeeded}
							</div>
							<div className="text-xs text-gray-600">
								需要人数
							</div>
						</div>
						<div className="bg-white/80 rounded-lg p-3">
							<div className="text-lg font-semibold text-orange-600">
								{totalApplied}
							</div>
							<div className="text-xs text-gray-600">
								已申请人数
							</div>
						</div>
					</div>

					{/* 用户申请状态提示 */}
					{userApplications.length > 0 && (
						<div className="bg-white/80 rounded-lg p-3 border border-orange-200">
							<div className="text-sm font-medium text-orange-800 mb-2">
								您的申请状态
							</div>
							<div className="space-y-1">
								{userApplications.map((app, index) => (
									<div
										key={index}
										className="flex items-center justify-between text-sm"
									>
										<span className="text-gray-700">
											{app.role}
										</span>
										<Badge
											variant={
												app.status === "APPROVED"
													? "default"
													: app.status === "APPLIED"
														? "secondary"
														: "destructive"
											}
											className="text-xs"
										>
											{app.status === "APPROVED" &&
												"已通过"}
											{app.status === "APPLIED" &&
												"申请中"}
											{app.status === "REJECTED" &&
												"已拒绝"}
										</Badge>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 主要操作按钮 */}
					<Button
						onClick={onViewAllVolunteers}
						className="w-full bg-orange-600 hover:bg-orange-700 text-white"
						size="lg"
					>
						<Users className="h-4 w-4 mr-2" />
						{hasAvailableRoles
							? userApplications.length > 0
								? "查看申请详情"
								: "查看招募详情并申请"
							: "查看志愿者名单"}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>

					{/* 底部提示 */}
					<div className="text-xs text-orange-600 text-center">
						💡 志愿者可获得社区积分
						{volunteerRoles.length > 0 && (
							<span className="ml-1">
								(
								{Math.min(
									...volunteerRoles.map(
										(role) => role.volunteerRole.cpPoints,
									),
								)}
								-
								{Math.max(
									...volunteerRoles.map(
										(role) => role.volunteerRole.cpPoints,
									),
								)}
								分)
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
