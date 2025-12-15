"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MoreAction = {
	key: string;
	label: string;
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
	canCancel,
	hasPhotos,
	registerDisabled,
	canShowQr,
	canContact = true,
	canFeedback = true,
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
	canContact?: boolean;
	canFeedback?: boolean;
}) {
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const canShowCountdownTool =
		locale.startsWith("zh") && Boolean(isEventAdmin);

	const moreActions: MoreAction[] = [
		canCancel
			? {
					key: "cancel",
					label: "取消报名",
					onClick: onCancel,
				}
			: null,
		canShowCountdownTool
			? {
					key: "countdown",
					label: "倒计时大屏",
					onClick: () =>
						window.open(
							`/${locale}/events/${eventId}/countdown`,
							"_blank",
							"noopener,noreferrer",
						),
				}
			: null,
		{
			key: "works",
			label: "提交/查看作品",
			onClick: () =>
				window.location.assign(
					`/${locale}/events/${eventId}/submissions`,
				),
		},
		hasPhotos
			? {
					key: "album",
					label: "查看相册",
					onClick: () =>
						window.location.assign(
							`/${locale}/events/${eventId}/photos`,
						),
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
		canShowQr
			? {
					key: "qr",
					label: "签到码",
					onClick: onShowQR,
					show: true,
				}
			: null,
	]
		.filter((item): item is MoreAction => Boolean(item))
		.filter((item) => item.show !== false);

	return (
		<>
			<div
				className={cn(
					"fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-lg shadow-black/5 border-t lg:hidden",
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
							className="h-11 px-3"
							onClick={onShare}
						>
							分享
						</Button>
						<Button
							className="flex-1 h-11 text-base"
							onClick={onRegister}
							disabled={registerDisabled}
						>
							{registerLabel}
						</Button>
					</div>
				</div>
			</div>

			<Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
				<SheetContent side="bottom" className="rounded-t-3xl pb-8">
					<SheetHeader className="text-left">
						<SheetTitle>更多操作</SheetTitle>
					</SheetHeader>
					<div className="mt-4 space-y-2">
						{moreActions.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								暂无更多操作
							</p>
						) : (
							moreActions.map((action) => (
								<Button
									key={action.key}
									variant="ghost"
									className="w-full justify-start rounded-2xl border text-base"
									disabled={action.disabled}
									onClick={() => {
										setIsMoreOpen(false);
										action.onClick();
									}}
								>
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
