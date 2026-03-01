"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Dialog, DialogTrigger } from "@community/ui/ui/dialog";
import { getProjectStageLabel } from "@community/lib-shared/project-stage";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import {
	CheckCircleIcon,
	ClockIcon,
	XCircleIcon,
	ExclamationTriangleIcon,
	BanknotesIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { EventRegistration } from "./RegistrationDetailsDialog";
import { RegistrationDetailsDialog } from "./RegistrationDetailsDialog";
import { canShowDirectCancellation } from "./registration-workflow";

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
	style: "currency",
	currency: "CNY",
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

const registrationDateFormat = "yyyy-MM-dd HH:mm";

interface RegistrationMobileCardProps {
	registration: EventRegistration;
	requireProjectSubmission?: boolean;
	eventQuestions?: Array<{
		id: string;
		question: string;
		type: string;
		required: boolean;
		options?: string[];
	}>;
	onUpdateStatus: (userId: string, status: string) => void;
	onCancelRegistration: (userId: string, reason: string) => void;
	onRefundOrder: (orderId: string, reason: string) => Promise<boolean>;
	allRegistrations?: EventRegistration[];
	currentIndex?: number | null;
	onNavigate?: (direction: "prev" | "next") => void;
	setCurrentIndex?: (index: number | null) => void;
}

const registrationStatusColors: Record<
	string,
	{ bg: string; text: string; icon: any }
> = {
	APPROVED: {
		bg: "bg-green-100",
		text: "text-green-800",
		icon: CheckCircleIcon,
	},
	PENDING_PAYMENT: {
		bg: "bg-orange-100",
		text: "text-orange-800",
		icon: BanknotesIcon,
	},
	PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: ClockIcon },
	WAITLISTED: {
		bg: "bg-blue-100",
		text: "text-blue-800",
		icon: ExclamationTriangleIcon,
	},
	REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircleIcon },
	CANCELLED: { bg: "bg-muted", text: "text-foreground", icon: XCircleIcon },
};

export function RegistrationMobileCard({
	registration,
	requireProjectSubmission,
	eventQuestions,
	onUpdateStatus,
	onCancelRegistration,
	onRefundOrder,
	allRegistrations,
	currentIndex = null,
	onNavigate,
	setCurrentIndex,
}: RegistrationMobileCardProps) {
	const t = useTranslations("events.manage");
	const statusLabels: Record<string, string> = {
		PENDING_PAYMENT: t("registrations.filter.pendingPayment"),
		PENDING: t("registrations.filter.pending"),
		APPROVED: t("registrations.filter.confirmed"),
		WAITLISTED: t("registrations.filter.waitlisted"),
		REJECTED: t("registrations.filter.rejected"),
		CANCELLED: t("registrations.filter.cancelled"),
	};
	const statusInfo =
		registrationStatusColors[registration.status] ||
		registrationStatusColors.PENDING;
	const StatusIcon = statusInfo.icon;
	const canDirectCancelRegistration = canShowDirectCancellation(
		registration.order?.status,
	);

	return (
		<div className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
			<div className="flex items-start gap-3">
				<UserAvatar
					name={registration.user.name}
					avatarUrl={registration.user.image}
					className="w-10 h-10"
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0">
							<Link
								href={`/u/${registration.user.username || registration.user.id}`}
								className="font-medium hover:text-primary hover:underline block truncate"
							>
								{registration.user.name}
							</Link>
							<p className="text-sm text-muted-foreground truncate">
								{registration.user.email}
							</p>
						</div>
						<Badge
							variant="outline"
							className={`${statusInfo.bg} ${statusInfo.text} flex items-center gap-1 ml-2 flex-shrink-0`}
						>
							<StatusIcon className="w-3 h-3" />
							<span className="text-xs">
								{statusLabels[registration.status] ||
									registration.status}
							</span>
						</Badge>
					</div>

					<div className="mt-2 space-y-1">
						{registration.ticketType && (
							<div className="text-sm">
								<span className="text-muted-foreground">
									票种：
								</span>
								<span className="font-medium">
									{registration.ticketType.name}
								</span>
								{typeof registration.ticketType.price ===
									"number" && (
									<span className="text-muted-foreground ml-1">
										{currencyFormatter.format(
											registration.ticketType.price,
										)}
									</span>
								)}
							</div>
						)}

						{requireProjectSubmission && (
							<div className="text-sm">
								<span className="text-muted-foreground">
									关联作品：
								</span>
								{registration.projectSubmission ? (
									<div className="flex items-center gap-2 mt-1">
										{registration.projectSubmission.project
											.screenshots?.[0] ? (
											<img
												src={
													registration
														.projectSubmission
														.project.screenshots[0]
												}
												alt={
													registration
														.projectSubmission
														.project.title
												}
												className="w-6 h-6 rounded object-cover flex-shrink-0"
											/>
										) : (
											<div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
												<span className="text-blue-600 text-xs">
													📁
												</span>
											</div>
										)}
										<div className="flex-1 min-w-0">
											<Link
												href={`/projects/${registration.projectSubmission.project.shortId || registration.projectSubmission.project.id}`}
												className="font-medium text-foreground hover:text-primary text-sm truncate block"
											>
												{
													registration
														.projectSubmission
														.project.title
												}
											</Link>
											{registration.projectSubmission
												.project.stage && (
												<div className="text-xs text-muted-foreground truncate">
													{getProjectStageLabel(
														registration
															.projectSubmission
															.project
															.stage as any,
														t,
													)}
												</div>
											)}
										</div>
									</div>
								) : (
									<span className="text-muted-foreground">
										无关联作品
									</span>
								)}
							</div>
						)}

						<div className="text-sm text-muted-foreground">
							注册时间：
							{format(
								new Date(registration.registeredAt),
								registrationDateFormat,
							)}
						</div>
					</div>

					<div className="flex gap-1 mt-3">
						{/* 查看按钮 - 放在最前面 */}
						<Dialog>
							<DialogTrigger asChild>
								<Button
									size="sm"
									variant="ghost"
									className="text-xs px-2"
									onClick={() =>
										setCurrentIndex?.(
											allRegistrations?.findIndex(
												(r) => r.id === registration.id,
											) ?? null,
										)
									}
								>
									{t("registrations.table.view")}
								</Button>
							</DialogTrigger>
							{currentIndex !== null &&
								allRegistrations?.[currentIndex] && (
									<RegistrationDetailsDialog
										registration={
											allRegistrations[currentIndex]
										}
										eventQuestions={eventQuestions}
										onUpdateStatus={onUpdateStatus}
										onCancelRegistration={
											onCancelRegistration
										}
										onRefundOrder={onRefundOrder}
										allRegistrations={allRegistrations}
										currentIndex={currentIndex}
										onNavigate={onNavigate}
										setCurrentIndex={setCurrentIndex}
									/>
								)}
						</Dialog>

						{/* 审核按钮 */}
						{registration.status === "PENDING" && (
							<>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 text-xs"
									onClick={() =>
										onUpdateStatus(
											registration.user.id,
											"APPROVED",
										)
									}
								>
									批准
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 text-xs"
									onClick={() =>
										onUpdateStatus(
											registration.user.id,
											"REJECTED",
										)
									}
								>
									拒绝
								</Button>
							</>
						)}
						{registration.status === "REJECTED" && (
							<Button
								size="sm"
								variant="outline"
								className="flex-1 text-xs"
								onClick={() =>
									onUpdateStatus(
										registration.user.id,
										"APPROVED",
									)
								}
							>
								撤销拒绝
							</Button>
						)}
						{(registration.status === "APPROVED" ||
							registration.status === "PENDING") &&
							canDirectCancelRegistration && (
								<Button
									size="sm"
									variant="destructive"
									className="text-xs px-2"
									onClick={() => {
										const reason =
											prompt("请输入取消原因：");
										if (reason?.trim()) {
											onCancelRegistration(
												registration.user.id,
												reason,
											);
										}
									}}
								>
									取消
								</Button>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}
