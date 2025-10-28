"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getProjectStageLabel } from "@/lib/project-stage";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
	CheckCircleIcon,
	ClockIcon,
	ArrowDownTrayIcon as DownloadIcon,
	ExclamationTriangleIcon,
	UsersIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RegistrationMobileCard } from "./RegistrationMobileCard";
import type { EventRegistration } from "./RegistrationDetailsDialog";
import { RegistrationDetailsDialog } from "./RegistrationDetailsDialog";

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
	style: "currency",
	currency: "CNY",
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

const registrationDateFormat = "yyyy-MM-dd HH:mm";

interface EventRegistrationsTabProps {
	registrations: EventRegistration[];
	loading: boolean;
	statusFilter: string;
	requireProjectSubmission?: boolean;
	eventQuestions?: Array<{
		id: string;
		question: string;
		type: string;
		required: boolean;
		options?: string[];
	}>;
	onStatusFilterChange: (status: string) => void;
	onUpdateRegistrationStatus: (userId: string, status: string) => void;
	onCancelRegistration: (userId: string, reason: string) => void;
	onExportRegistrations: () => void;
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
	PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: ClockIcon },
	WAITLISTED: {
		bg: "bg-blue-100",
		text: "text-blue-800",
		icon: ExclamationTriangleIcon,
	},
	REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircleIcon },
	CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircleIcon },
};

export function EventRegistrationsTab({
	registrations,
	loading,
	statusFilter,
	requireProjectSubmission,
	eventQuestions,
	onStatusFilterChange,
	onUpdateRegistrationStatus,
	onCancelRegistration,
	onExportRegistrations,
}: EventRegistrationsTabProps) {
	const t = useTranslations("events.manage");
	const safeRegistrations = registrations || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<div>
						<CardTitle>{t("registrations.title")}</CardTitle>
						<CardDescription>
							{t("registrations.subtitle")}
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Select
							value={statusFilter}
							onValueChange={onStatusFilterChange}
						>
							<SelectTrigger className="w-32">
								<SelectValue
									placeholder={t(
										"registrations.filter.status",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("registrations.filter.all")}
								</SelectItem>
								<SelectItem value="PENDING">
									{t("registrations.filter.pending")}
								</SelectItem>
								<SelectItem value="APPROVED">
									{t("registrations.filter.confirmed")}
								</SelectItem>
								<SelectItem value="WAITLISTED">
									{t("registrations.filter.waitlisted")}
								</SelectItem>
								<SelectItem value="REJECTED">
									{t("registrations.filter.rejected")}
								</SelectItem>
								<SelectItem value="CANCELLED">
									{t("registrations.filter.cancelled")}
								</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							size="sm"
							onClick={onExportRegistrations}
						>
							<DownloadIcon className="w-4 h-4 mr-2" />
							{t("registrations.export")}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className="flex items-center space-x-4"
							>
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="space-y-2 flex-1">
									<Skeleton className="h-4 w-1/3" />
									<Skeleton className="h-3 w-1/2" />
								</div>
								<Skeleton className="h-6 w-20" />
							</div>
						))}
					</div>
				) : safeRegistrations.length === 0 ? (
					<div className="text-center py-8">
						<UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium mb-2">
							{t("registrations.noRegistrations")}
						</h3>
						<p className="text-muted-foreground">
							{t("registrations.noRegistrationsDesc")}
						</p>
					</div>
				) : (
					<>
						{/* Desktop Table Layout */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t(
												"registrations.table.participant",
											)}
										</TableHead>
										{requireProjectSubmission && (
											<TableHead>关联作品</TableHead>
										)}
										<TableHead>
											{t(
												"registrations.table.ticketType",
											)}
										</TableHead>
										<TableHead>
											{t("registrations.table.status")}
										</TableHead>
										<TableHead>
											{t(
												"registrations.table.registered",
											)}
										</TableHead>
										<TableHead>
											{t("registrations.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{safeRegistrations.map((registration) => {
										const statusInfo =
											registrationStatusColors[
												registration.status
											];
										const StatusIcon = statusInfo.icon;

										return (
											<TableRow key={registration.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<UserAvatar
															name={
																registration
																	.user.name
															}
															avatarUrl={
																registration
																	.user.image
															}
															className="w-8 h-8"
														/>
														<div>
															<Link
																href={`/u/${registration.user.username || registration.user.id}`}
																className="font-medium hover:text-blue-600 hover:underline"
															>
																{
																	registration
																		.user
																		.name
																}
															</Link>
															<p className="text-sm text-muted-foreground">
																{
																	registration
																		.user
																		.email
																}
															</p>
														</div>
													</div>
												</TableCell>
												{requireProjectSubmission && (
													<TableCell>
														{registration.projectSubmission ? (
															<div className="flex items-start gap-2">
																{registration
																	.projectSubmission
																	.project
																	.screenshots?.[0] ? (
																	<img
																		src={
																			registration
																				.projectSubmission
																				.project
																				.screenshots[0]
																		}
																		alt={
																			registration
																				.projectSubmission
																				.project
																				.title
																		}
																		className="w-8 h-8 rounded object-cover flex-shrink-0"
																	/>
																) : (
																	<div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
																		<span className="text-blue-600 text-xs">
																			📁
																		</span>
																	</div>
																)}
																<div className="flex-1 min-w-0">
																	<Link
																		href={`/app/projects/${registration.projectSubmission.project.id}`}
																		className="text-sm font-medium text-blue-900 hover:text-blue-700 truncate block"
																	>
																		{
																			registration
																				.projectSubmission
																				.project
																				.title
																		}
																	</Link>
																	{registration
																		.projectSubmission
																		.project
																		.stage && (
																		<div className="text-xs text-gray-600 truncate">
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
															<span className="text-sm text-muted-foreground">
																无关联作品
															</span>
														)}
													</TableCell>
												)}
												<TableCell>
													{registration.ticketType ? (
														<div className="flex flex-col">
															<span className="font-medium text-sm">
																{
																	registration
																		.ticketType
																		.name
																}
															</span>
															{typeof registration
																.ticketType
																.price ===
																"number" && (
																<span className="text-xs text-muted-foreground">
																	{currencyFormatter.format(
																		registration
																			.ticketType
																			.price,
																	)}
																</span>
															)}
														</div>
													) : (
														<span className="text-sm text-muted-foreground">
															{t(
																"registrations.table.noTicketType",
															)}
														</span>
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={`${statusInfo.bg} ${statusInfo.text} flex items-center gap-1 w-fit`}
													>
														<StatusIcon className="w-3 h-3" />
														{registration.status}
													</Badge>
												</TableCell>
												<TableCell>
													{format(
														new Date(
															registration.registeredAt,
														),
														registrationDateFormat,
													)}
												</TableCell>
												<TableCell>
													<div className="flex gap-1">
														{/* 查看按钮 - 放在最前面 */}
														<Dialog>
															<DialogTrigger
																asChild
															>
																<Button
																	size="sm"
																	variant="ghost"
																>
																	{t(
																		"registrations.table.view",
																	)}
																</Button>
															</DialogTrigger>
															<RegistrationDetailsDialog
																registration={
																	registration
																}
																eventQuestions={
																	eventQuestions
																}
																onUpdateStatus={
																	onUpdateRegistrationStatus
																}
																onCancelRegistration={
																	onCancelRegistration
																}
															/>
														</Dialog>

														{/* 审核按钮 */}
														{registration.status ===
															"PENDING" && (
															<>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		onUpdateRegistrationStatus(
																			registration
																				.user
																				.id,
																			"APPROVED",
																		)
																	}
																>
																	{t(
																		"registrations.table.approve",
																	)}
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		onUpdateRegistrationStatus(
																			registration
																				.user
																				.id,
																			"REJECTED",
																		)
																	}
																>
																	{t(
																		"registrations.table.reject",
																	)}
																</Button>
															</>
														)}
														{registration.status ===
															"REJECTED" && (
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	onUpdateRegistrationStatus(
																		registration
																			.user
																			.id,
																		"APPROVED",
																	)
																}
															>
																{t(
																	"registrations.table.undoReject",
																)}
															</Button>
														)}
														{(registration.status ===
															"APPROVED" ||
															registration.status ===
																"PENDING") && (
															<Button
																size="sm"
																variant="destructive"
																onClick={() => {
																	const reason =
																		prompt(
																			"请输入取消原因：",
																		);
																	if (
																		reason?.trim()
																	) {
																		onCancelRegistration(
																			registration
																				.user
																				.id,
																			reason,
																		);
																	}
																}}
															>
																取消
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{/* Mobile Card Layout */}
						<div className="md:hidden space-y-4">
							{safeRegistrations.map((registration) => (
								<RegistrationMobileCard
									key={registration.id}
									registration={registration}
									requireProjectSubmission={
										requireProjectSubmission
									}
									eventQuestions={eventQuestions}
									onUpdateStatus={onUpdateRegistrationStatus}
									onCancelRegistration={onCancelRegistration}
								/>
							))}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
