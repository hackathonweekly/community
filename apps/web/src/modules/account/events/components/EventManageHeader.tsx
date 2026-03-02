"use client";

import { Button } from "@community/ui/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import {
	ArrowPathIcon,
	PencilIcon,
	QrCodeIcon,
	ShareIcon,
	TrashIcon,
	StopIcon,
	PlayIcon,
	EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface EventManageHeaderProps {
	event: {
		id: string;
		shortId?: string;
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
		<div className="mb-5 md:mb-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
						{event.title}
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground md:mt-2 md:text-base">
						{t("manageEvent")}
					</p>
				</div>
				<div className="flex flex-col gap-2 md:shrink-0">
					{/* Mobile layout: simplified with dropdown */}
					<div className="grid grid-cols-[1.15fr_1fr_auto] items-center gap-2 rounded-xl bg-muted/35 p-1.5 lg:hidden">
						<Button
							size="sm"
							onClick={onEventQRGeneratorOpen}
							className="h-9 touch-manipulation"
						>
							<QrCodeIcon className="w-4 h-4 mr-1" />
							签到二维码
						</Button>
						<Button
							variant="secondary"
							size="sm"
							asChild
							className="h-9 touch-manipulation shadow-none"
						>
							<Link
								href={`/events/${event.shortId || event.id}/edit`}
							>
								<PencilIcon className="w-4 h-4 mr-1" />
								编辑
							</Link>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="h-9 w-9 touch-manipulation"
								>
									<EllipsisVerticalIcon className="w-5 h-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-52">
								<DropdownMenuItem onClick={onRefresh}>
									<ArrowPathIcon className="w-4 h-4 mr-2" />
									{t("refresh")}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onShareOpen}>
									<ShareIcon className="w-4 h-4 mr-2" />
									{t("share")}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onQRScannerOpen}>
									<QrCodeIcon className="w-4 h-4 mr-2" />
									扫码签到
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={onEventQRGeneratorOpen}
								>
									<QrCodeIcon className="w-4 h-4 mr-2" />
									{t("eventQRCode")}
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										href={`/events/${event.shortId || event.id}`}
									>
										{t("viewPublicPage")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleToggleRegistration}
								>
									{event.status === "REGISTRATION_CLOSED" ? (
										<>
											<PlayIcon className="w-4 h-4 mr-2" />
											开启报名
										</>
									) : (
										<>
											<StopIcon className="w-4 h-4 mr-2" />
											停止报名
										</>
									)}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-destructive focus:text-destructive"
								>
									<TrashIcon className="w-4 h-4 mr-2" />
									删除活动
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Desktop layout: two rows */}
					<div className="hidden lg:flex flex-col items-end gap-2">
						{/* First row: refresh, share, QR codes */}
						<div className="flex flex-wrap justify-end gap-2">
							<Button
								size="sm"
								onClick={onEventQRGeneratorOpen}
								className="h-9 px-3"
							>
								<QrCodeIcon className="w-4 h-4" />
								<span>签到二维码</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onRefresh}
								className="h-9 px-3"
							>
								<ArrowPathIcon className="w-4 h-4" />
								<span>{t("refresh")}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onShareOpen}
								className="h-9 px-3"
							>
								<ShareIcon className="w-4 h-4" />
								<span>{t("share")}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onQRScannerOpen}
								className="h-9 px-3"
							>
								<QrCodeIcon className="w-4 h-4" />
								<span>{t("scanUserQR")}</span>
							</Button>
						</div>

						{/* Second row: registration controls, notifications, view, edit, delete */}
						<div className="flex flex-wrap justify-end gap-2">
							<Button
								variant={
									event.status === "REGISTRATION_CLOSED"
										? "outline"
										: "destructive"
								}
								size="sm"
								onClick={handleToggleRegistration}
								className="h-9 px-3"
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
									className="h-9 px-3"
								>
									<Link
										href={`/events/${event.shortId || event.id}/communications`}
									>
										<MessageSquare className="w-4 h-4" />
										<span>发送通知</span>
									</Link>
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								asChild
								className="h-9 px-3"
							>
								<Link
									href={`/events/${event.shortId || event.id}`}
								>
									<span>{t("viewPublicPage")}</span>
								</Link>
							</Button>
							<Button size="sm" asChild className="h-9 px-3">
								<Link
									href={`/events/${event.shortId || event.id}/edit`}
								>
									<PencilIcon className="w-4 h-4 mr-2" />
									<span>{t("editEvent")}</span>
								</Link>
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDelete}
								className="h-9 px-3"
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
