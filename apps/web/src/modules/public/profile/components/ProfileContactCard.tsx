"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	ChevronDown,
	Copy,
	Handshake,
	MailIcon,
	MessageSquareIcon,
	Phone,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../types";
import { getImageUrl } from "../types";

interface ProfileContactCardProps {
	user: UserProfile;
	currentUserId?: string;
}

export function ProfileContactCard({
	user,
	currentUserId,
}: ProfileContactCardProps) {
	const [showContactInfo, setShowContactInfo] = useState(false);
	const isSelfProfile = currentUserId === user.id;
	const contactInfoUnlocked = user.canViewContacts;
	const contactAvailability = user.contactAvailability || {
		email: false,
		phone: false,
		wechat: false,
	};

	const resolvedWechatQr = user.wechatQrCode
		? getImageUrl(user.wechatQrCode) || undefined
		: null;

	const unlockedContactLabels = [
		user.wechatId || user.wechatQrCode ? "微信" : null,
		user.email ? "邮箱" : null,
		user.phoneNumber ? "电话" : null,
	].filter((label): label is string => Boolean(label));
	const lockedContactLabels = [
		contactAvailability.wechat ? "微信" : null,
		contactAvailability.email ? "邮箱" : null,
		contactAvailability.phone ? "电话" : null,
	].filter((label): label is string => Boolean(label));
	const hasUnlockedContactInfo = unlockedContactLabels.length > 0;
	const hasLockedContactInfo = lockedContactLabels.length > 0;

	const copyToClipboard = useCallback((value: string, label: string) => {
		if (!value) return;
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			toast.error(`复制${label}失败，请手动复制`);
			return;
		}
		navigator.clipboard
			.writeText(value)
			.then(() => toast.success(`${label}已复制`))
			.catch(() => toast.error(`复制${label}失败，请稍后重试`));
	}, []);

	if (isSelfProfile) return null;

	const CopyBtn = ({ value, label }: { value: string; label: string }) => (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				copyToClipboard(value, label);
			}}
			className="h-8 w-8 shrink-0 text-muted-foreground transition-colors hover:text-primary"
		>
			<Copy className="h-4 w-4" />
			<span className="sr-only">复制{label}</span>
		</Button>
	);

	return (
		<div className="mt-4">
			<div
				onClick={() =>
					contactInfoUnlocked && setShowContactInfo(!showContactInfo)
				}
				className={`rounded-lg border p-3 transition-all cursor-pointer ${
					contactInfoUnlocked
						? "bg-white border-gray-200 hover:shadow-md"
						: "bg-muted/50 border-dashed border-border cursor-not-allowed"
				}`}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<div
							className={`grid h-7 w-7 place-items-center rounded-lg ${
								contactInfoUnlocked
									? "bg-primary/10 text-primary"
									: "bg-muted text-muted-foreground"
							}`}
						>
							<Handshake className="h-3.5 w-3.5" />
						</div>
						<div>
							<p className="text-sm font-semibold text-foreground">
								{contactInfoUnlocked
									? "联系方式已解锁"
									: "互关可见联系方式"}
							</p>
							{contactInfoUnlocked && hasUnlockedContactInfo && (
								<p className="text-xs text-muted-foreground">
									{showContactInfo ? "点击收起" : "点击查看"}{" "}
									{unlockedContactLabels.join("、")}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant={
								contactInfoUnlocked ? "default" : "outline"
							}
							className={`text-xs ${!contactInfoUnlocked ? "border-border text-muted-foreground" : ""}`}
						>
							仅互关
						</Badge>
						{contactInfoUnlocked && hasUnlockedContactInfo && (
							<ChevronDown
								className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showContactInfo ? "rotate-180" : ""}`}
							/>
						)}
					</div>
				</div>

				<div
					className={`overflow-hidden transition-all duration-300 ${
						showContactInfo && contactInfoUnlocked
							? "max-h-96 opacity-100 mt-4"
							: "max-h-0 opacity-0"
					}`}
				>
					{contactInfoUnlocked && (
						<div className="space-y-3 text-sm text-foreground border-t border-border pt-4">
							{hasUnlockedContactInfo ? (
								<>
									{user.email && (
										<div className="flex items-center justify-between rounded-md bg-card/60 px-3 py-2">
											<a
												href={`mailto:${user.email}`}
												className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
												onClick={(e) =>
													e.stopPropagation()
												}
											>
												<MailIcon className="h-4 w-4 text-primary" />
												<span className="break-all">
													{user.email}
												</span>
											</a>
											<CopyBtn
												value={user.email}
												label="邮箱"
											/>
										</div>
									)}
									{user.phoneNumber && (
										<div className="flex items-center justify-between rounded-md bg-card/60 px-3 py-2">
											<a
												href={`tel:${user.phoneNumber}`}
												className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
												onClick={(e) =>
													e.stopPropagation()
												}
											>
												<Phone className="h-4 w-4 text-primary" />
												<span className="break-all">
													{user.phoneNumber}
												</span>
											</a>
											<CopyBtn
												value={user.phoneNumber}
												label="电话"
											/>
										</div>
									)}
									{(user.wechatId || resolvedWechatQr) && (
										<div className="space-y-2 rounded-md bg-card/60 px-3 py-3">
											{user.wechatId && (
												<div className="flex items-center justify-between gap-2 text-sm">
													<div className="flex items-center gap-2">
														<MessageSquareIcon className="h-4 w-4 text-primary" />
														<span className="font-medium text-foreground break-all">
															微信号：
															{user.wechatId}
														</span>
													</div>
													<CopyBtn
														value={user.wechatId!}
														label="微信号"
													/>
												</div>
											)}
											{resolvedWechatQr && (
												<div>
													<span className="text-xs text-muted-foreground">
														微信二维码
													</span>
													<div className="mt-2 w-32 overflow-hidden rounded border border-border bg-card p-2">
														<img
															src={
																resolvedWechatQr
															}
															alt="微信二维码"
															className="h-28 w-full object-contain"
														/>
													</div>
												</div>
											)}
										</div>
									)}
									{!contactAvailability.wechat && (
										<p className="text-xs text-muted-foreground">
											对方暂未填写微信。
										</p>
									)}
								</>
							) : (
								<p className="text-sm text-muted-foreground">
									对方暂未填写联系方式。
								</p>
							)}
						</div>
					)}
				</div>

				{!contactInfoUnlocked && (
					<div className="mt-2">
						<p className="text-xs text-muted-foreground">
							{user.isFollowed
								? `等待对方回关解锁${hasLockedContactInfo ? `：${lockedContactLabels.join("、")}` : ""}`
								: `关注后互相关注解锁${hasLockedContactInfo ? `：${lockedContactLabels.join("、")}` : ""}`}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
