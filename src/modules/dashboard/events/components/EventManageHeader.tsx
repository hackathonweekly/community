"use client";

import { Button } from "@/components/ui/button";
import { useConfirmationAlert } from "@/modules/dashboard/shared/components/ConfirmationAlertProvider";
import {
	ArrowPathIcon,
	PencilIcon,
	QrCodeIcon,
	ShareIcon,
	TrashIcon,
	StopIcon,
	PlayIcon,
} from "@heroicons/react/24/outline";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface EventManageHeaderProps {
	event: {
		id: string;
		title: string;
		status: string;
	};
	onQRScannerOpen: () => void;
	onEventQRGeneratorOpen: () => void;
	onShareOpen: () => void;
	onRefresh: () => void;
	onDelete: () => void;
	onToggleRegistration: (action: "close" | "open") => void;
}

export function EventManageHeader({
	event,
	onQRScannerOpen,
	onEventQRGeneratorOpen,
	onShareOpen,
	onRefresh,
	onDelete,
	onToggleRegistration,
}: EventManageHeaderProps) {
	const t = useTranslations("events.manage");
	const { confirm } = useConfirmationAlert();

	const handleDelete = () => {
		confirm({
			title: "确认删除活动",
			message: `您确定要删除活动"${event.title}"吗？此操作无法撤消，将删除所有相关数据包括报名信息、签到记录等。`,
			confirmLabel: "删除",
			cancelLabel: "取消",
			destructive: true,
			onConfirm: onDelete,
		});
	};

	const handleToggleRegistration = () => {
		const isRegistrationClosed = event.status === "REGISTRATION_CLOSED";
		const action = isRegistrationClosed ? "open" : "close";
		const actionText = isRegistrationClosed ? "开启" : "关闭";

		confirm({
			title: `确认${actionText}报名`,
			message: `您确定要${actionText}活动"${event.title}"的报名吗？${!isRegistrationClosed ? "关闭后用户将无法继续报名。" : "开启后用户可以继续报名。"}`,
			confirmLabel: actionText,
			cancelLabel: "取消",
			destructive: !isRegistrationClosed,
			onConfirm: () => onToggleRegistration(action),
		});
	};

	return (
		<div className="mb-4 md:mb-8">
			<div className="flex items-center gap-2 mb-2">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/app/events">{t("backToEvents")}</Link>
				</Button>
			</div>
			<div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
						{event.title}
					</h1>
					<p className="text-muted-foreground mt-2">
						{t("manageEvent")}
					</p>
				</div>
				<div className="flex flex-col gap-2 md:flex-shrink-0">
					{/* Mobile layout: single column */}
					<div className="flex flex-col sm:flex-row gap-2 lg:hidden">
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onRefresh}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								<ArrowPathIcon className="w-4 h-4" />
								<span className="sm:inline">
									{t("refresh")}
								</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onShareOpen}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								<ShareIcon className="w-4 h-4" />
								<span className="sm:inline">{t("share")}</span>
							</Button>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onQRScannerOpen}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								<QrCodeIcon className="w-4 h-4" />
								<span className="sm:inline">
									{t("scanUserQR")}
								</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onEventQRGeneratorOpen}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								<QrCodeIcon className="w-4 h-4" />
								{t("eventQRCode")}
								<span className="sm:inline" />
							</Button>
						</div>
						<div className="flex gap-2">
							<Button
								variant={
									event.status === "REGISTRATION_CLOSED"
										? "outline"
										: "destructive"
								}
								size="sm"
								onClick={handleToggleRegistration}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								{event.status === "REGISTRATION_CLOSED" ? (
									<PlayIcon className="w-4 h-4" />
								) : (
									<StopIcon className="w-4 h-4" />
								)}
								<span className="hidden sm:inline">
									{event.status === "REGISTRATION_CLOSED"
										? "开启报名"
										: "停止报名"}
								</span>
								<span className="sm:hidden">
									{event.status === "REGISTRATION_CLOSED"
										? "开启"
										: "停止"}
								</span>
							</Button>
							{/* 暂时隐藏发送通知按钮 */}
							{false && (
								<Button
									variant="outline"
									size="sm"
									asChild
									className="flex items-center gap-1 flex-1 sm:flex-none"
								>
									<Link
										href={`/app/events/${event.id}/communications`}
									>
										<MessageSquare className="w-4 h-4" />
										<span className="sm:inline">
											发送通知
										</span>
									</Link>
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								asChild
								className="flex-1 sm:flex-none"
							>
								<Link href={`/events/${event.id}`}>
									<span className="hidden sm:inline">
										{t("viewPublicPage")}
									</span>
									<span className="sm:hidden">查看</span>
								</Link>
							</Button>
							<Button
								size="sm"
								asChild
								className="flex-1 sm:flex-none"
							>
								<Link href={`/app/events/${event.id}/edit`}>
									<PencilIcon className="w-4 h-4 sm:mr-2" />
									<span className="hidden sm:inline">
										{t("editEvent")}
									</span>
									<span className="sm:hidden">编辑</span>
								</Link>
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDelete}
								className="flex items-center gap-1 flex-1 sm:flex-none"
							>
								<TrashIcon className="w-4 h-4" />
								<span className="hidden sm:inline">
									删除活动
								</span>
								<span className="sm:hidden">删除</span>
							</Button>
						</div>
					</div>

					{/* Desktop layout: two rows */}
					<div className="hidden lg:flex flex-col gap-2">
						{/* First row: refresh, share, QR codes */}
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onRefresh}
								className="flex items-center gap-1"
							>
								<ArrowPathIcon className="w-4 h-4" />
								<span>{t("refresh")}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onShareOpen}
								className="flex items-center gap-1"
							>
								<ShareIcon className="w-4 h-4" />
								<span>{t("share")}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onQRScannerOpen}
								className="flex items-center gap-1"
							>
								<QrCodeIcon className="w-4 h-4" />
								<span>{t("scanUserQR")}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onEventQRGeneratorOpen}
								className="flex items-center gap-1"
							>
								<QrCodeIcon className="w-4 h-4" />
								{t("eventQRCode")}
							</Button>
						</div>

						{/* Second row: registration controls, notifications, view, edit, delete */}
						<div className="flex gap-2">
							<Button
								variant={
									event.status === "REGISTRATION_CLOSED"
										? "outline"
										: "destructive"
								}
								size="sm"
								onClick={handleToggleRegistration}
								className="flex items-center gap-1"
							>
								{event.status === "REGISTRATION_CLOSED" ? (
									<PlayIcon className="w-4 h-4" />
								) : (
									<StopIcon className="w-4 h-4" />
								)}
								<span>
									{event.status === "REGISTRATION_CLOSED"
										? "开启报名"
										: "停止报名"}
								</span>
							</Button>
							{/* 暂时隐藏发送通知按钮 */}
							{false && (
								<Button
									variant="outline"
									size="sm"
									asChild
									className="flex items-center gap-1"
								>
									<Link
										href={`/app/events/${event.id}/communications`}
									>
										<MessageSquare className="w-4 h-4" />
										<span>发送通知</span>
									</Link>
								</Button>
							)}
							<Button variant="outline" size="sm" asChild>
								<Link href={`/events/${event.id}`}>
									<span>{t("viewPublicPage")}</span>
								</Link>
							</Button>
							<Button size="sm" asChild>
								<Link href={`/app/events/${event.id}/edit`}>
									<PencilIcon className="w-4 h-4 mr-2" />
									<span>{t("editEvent")}</span>
								</Link>
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDelete}
								className="flex items-center gap-1"
							>
								<TrashIcon className="w-4 h-4" />
								<span>删除活动</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
