"use client";

import { format } from "date-fns";
import { CalendarClock, Contact, QrCode, Share2, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

type RegistrationSectionProps = {
	event: EventData;
	locale: string;
	existingRegistration?: EventData["registrations"][number] | null;
	registerLabel: string;
	registerDisabled?: boolean;
	onRegister: () => void;
	onCancel?: () => void;
	onShowQR?: () => void;
	onShowShare?: () => void;
	onShowSuccessInfo?: () => void;
	onContact?: () => void;
	onFeedback?: () => void;
	canContact?: boolean;
	canFeedback?: boolean;
	canCancel?: boolean;
	registrationDisabledReason?: string | null;
	isEventEnded?: boolean;
	isRegistrationClosed?: boolean;
	isEventFull?: boolean;
};

export function RegistrationSection({
	event,
	locale,
	existingRegistration,
	registerLabel,
	registerDisabled,
	onRegister,
	onCancel,
	onShowQR,
	onShowShare,
	onShowSuccessInfo,
	onContact,
	onFeedback,
	canContact = true,
	canFeedback = true,
	canCancel,
	registrationDisabledReason,
	isEventEnded,
	isRegistrationClosed,
	isEventFull,
}: RegistrationSectionProps) {
	const canShowCountdownTool =
		locale.startsWith("zh") && Boolean(event.isEventAdmin);
	const registrationDeadline = event.registrationDeadline
		? format(new Date(event.registrationDeadline), "M月d日 HH:mm")
		: null;
	const hasImportantInfo = Boolean(
		event.registrationSuccessInfo ||
			event.registrationSuccessImage ||
			event.registrationPendingInfo ||
			event.registrationPendingImage,
	);

	const renderStatusBadge = () => {
		if (event.isExternalEvent) {
			return <Badge variant="secondary">外部报名</Badge>;
		}
		if (!existingRegistration) {
			if (registrationDisabledReason) {
				return (
					<Badge variant="outline">
						{registrationDisabledReason}
					</Badge>
				);
			}
			return <Badge variant="outline">尚未报名</Badge>;
		}

		switch (existingRegistration.status) {
			case "APPROVED":
				return (
					<Badge className="bg-emerald-100 text-emerald-800">
						已报名
					</Badge>
				);
			case "PENDING":
				return (
					<Badge className="bg-amber-100 text-amber-800">
						审核中
					</Badge>
				);
			case "WAITLISTED":
				return (
					<Badge className="bg-blue-100 text-blue-800">等待中</Badge>
				);
			case "REJECTED":
				return (
					<Badge className="bg-red-100 text-red-800">未通过</Badge>
				);
			case "CANCELLED":
				return <Badge variant="secondary">已取消</Badge>;
			default:
				return (
					<Badge variant="secondary">
						{existingRegistration.status}
					</Badge>
				);
		}
	};

	const renderStatusText = () => {
		if (event.isExternalEvent) {
			return "本活动在外部平台报名，点击上方按钮跳转。";
		}
		if (!existingRegistration) {
			if (isEventEnded) return "活动已结束，报名入口关闭。";
			if (isRegistrationClosed) return "报名已截止。";
			if (isEventFull) return "名额已满，如有空位会及时通知。";
			return "点击立即报名，完成基本信息后即可锁定席位。";
		}

		switch (existingRegistration.status) {
			case "APPROVED":
				return "报名成功，可现场签到并提交/修改作品。";
			case "PENDING":
				return "报名审核中，通过后会以短信或站内信通知。";
			case "WAITLISTED":
				return "已加入等待名单，空位开放后会优先通知你。";
			case "REJECTED":
				return "报名未通过，若信息有更新可尝试重新报名。";
			case "CANCELLED":
				return "已取消报名，如需参加可重新提交。";
			default:
				return "";
		}
	};

	return (
		<SectionCard
			id="registration"
			title="报名与进度"
			ctaLabel={hasImportantInfo ? "查看报名须知" : undefined}
			ctaOnClick={hasImportantInfo ? onShowSuccessInfo : undefined}
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					{renderStatusBadge()}
					{registrationDeadline ? (
						<div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
							<CalendarClock className="h-4 w-4" />
							报名截止：{registrationDeadline}
						</div>
					) : null}
				</div>

				<p className="text-sm text-muted-foreground">
					{renderStatusText()}
				</p>

				<div className="flex flex-wrap gap-2">
					<Button
						onClick={onRegister}
						disabled={
							registerDisabled &&
							!event.isExternalEvent &&
							existingRegistration?.status !== "CANCELLED"
						}
					>
						{registerLabel}
					</Button>

					{existingRegistration?.status === "APPROVED" ? (
						<Button variant="outline" onClick={onShowQR}>
							<QrCode className="mr-2 h-4 w-4" />
							签到二维码
						</Button>
					) : null}

					{hasImportantInfo ? (
						<Button variant="ghost" onClick={onShowSuccessInfo}>
							查看重要信息
						</Button>
					) : null}

					{canCancel ? (
						<Button variant="outline" onClick={onCancel}>
							取消报名
						</Button>
					) : null}
				</div>

				<Separator />

				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={onShowShare}>
						<Share2 className="mr-2 h-4 w-4" />
						分享活动
					</Button>
					{canShowCountdownTool ? (
						<Button variant="outline" asChild>
							<a
								href={`/${locale}/events/${event.id}/countdown`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Timer className="mr-2 h-4 w-4" />
								倒计时大屏
							</a>
						</Button>
					) : null}
					{canContact ? (
						<Button variant="outline" onClick={onContact}>
							<Contact className="mr-2 h-4 w-4" />
							联系组织者
						</Button>
					) : null}
					{canFeedback ? (
						<Button variant="outline" onClick={onFeedback}>
							📝 提交反馈
						</Button>
					) : null}
					<Button variant="outline" asChild>
						<a href={`/${locale}/events/${event.id}/photos`}>
							现场相册
						</a>
					</Button>
				</div>
			</div>
		</SectionCard>
	);
}
