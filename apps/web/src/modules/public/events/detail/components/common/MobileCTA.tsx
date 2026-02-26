"use client";

import type React from "react";
import { useState } from "react";

import { Button } from "@community/ui/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@community/ui/ui/sheet";
import { cn } from "@community/lib-shared/utils";
import { LayoutDashboard, ScanLine, Share2, Trophy } from "lucide-react";

type MoreAction = {
	key: string;
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	show?: boolean;
	disabled?: boolean;
};

export function MobileCTA({
	locale,
	eventId,
	isEventAdmin,
	registerLabel,
	onRegister,
	onCancel,
	onShare,
	onFeedback,
	onContact,
	onShowQR,
	onShowSuccessInfo,
	canCancel,
	hasPhotos,
	registerDisabled,
	canShowQr,
	submissionsEnabled = true,
	canContact = true,
	canFeedback = true,
	hasImportantInfo = true,
}: {
	locale: string;
	eventId: string;
	isEventAdmin?: boolean;
	registerLabel: string;
	onRegister: () => void;
	onCancel: () => void;
	onShare: () => void;
	onFeedback: () => void;
	onContact: () => void;
	onShowQR: () => void;
	canCancel: boolean;
	hasPhotos: boolean;
	registerDisabled?: boolean;
	canShowQr?: boolean;
	submissionsEnabled?: boolean;
	canContact?: boolean;
	canFeedback?: boolean;
	onShowSuccessInfo?: () => void;
	hasImportantInfo?: boolean;
}) {
	const [isMoreOpen, setIsMoreOpen] = useState(false);

	const moreActions = (
		[
			canCancel
				? {
						key: "cancel",
						label: "取消报名",
						onClick: onCancel,
					}
				: null,
			{
				key: "works",
				label: "提交/查看作品",
				onClick: () =>
					window.location.assign(`/events/${eventId}/submissions`),
				show: submissionsEnabled,
			},
			hasPhotos
				? {
						key: "album",
						label: "查看相册",
						onClick: () =>
							window.location.assign(`/events/${eventId}/photos`),
					}
				: null,
			{
				key: "feedback",
				label: "反馈",
				onClick: onFeedback,
				show: canFeedback,
			},
			{
				key: "contact",
				label: "联系组织者",
				onClick: onContact,
				show: canContact,
			},
			{
				key: "scan",
				label: "扫码验票",
				icon: <ScanLine className="mr-2 h-4 w-4" />,
				onClick: () =>
					window.location.assign(`/events/${eventId}/manage?scan=1`),
				show: isEventAdmin,
			},
			{
				key: "manage",
				label: "后台管理",
				icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
				onClick: () =>
					window.location.assign(`/events/${eventId}/manage`),
				show: isEventAdmin,
			},
			{
				key: "awards",
				label: "颁奖模式",
				icon: <Trophy className="mr-2 h-4 w-4" />,
				onClick: () =>
					window.location.assign(
						`/events/${eventId}/awards-ceremony`,
					),
				show: isEventAdmin,
			},
		] as (MoreAction | null)[]
	)
		.filter((item): item is MoreAction => Boolean(item))
		.filter((item) => item.show !== false);

	return (
		<>
			<div
				className={cn(
					"fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 shadow-lift lg:hidden",
				)}
				style={{
					paddingBottom:
						"max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
				}}
			>
				<div className="container max-w-6xl py-3">
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="h-11 px-3"
							onClick={() => setIsMoreOpen(true)}
						>
							更多
						</Button>
						<Button
							variant="outline"
							className="h-11 w-11 px-0 shrink-0"
							onClick={onShare}
						>
							<Share2 className="h-5 w-5" />
						</Button>
						<Button
							className="h-11 flex-1 text-sm font-semibold"
							onClick={onRegister}
							disabled={registerDisabled}
						>
							{registerLabel}
						</Button>
					</div>
				</div>
			</div>

			<Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
				<SheetContent side="bottom" className="rounded-t-lg pb-6">
					<SheetHeader className="text-left">
						<SheetTitle>更多操作</SheetTitle>
					</SheetHeader>
					<div className="mt-4 space-y-2">
						{moreActions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								暂无更多操作
							</p>
						) : (
							moreActions.map((action) => (
								<Button
									key={action.key}
									variant="ghost"
									className={cn(
										"w-full justify-start rounded-md border border-border text-sm",
										action.key === "cancel" &&
											"text-destructive hover:bg-destructive/10 hover:text-destructive",
									)}
									disabled={action.disabled}
									onClick={() => {
										setIsMoreOpen(false);
										action.onClick();
									}}
								>
									{action.icon}
									{action.label}
								</Button>
							))
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
