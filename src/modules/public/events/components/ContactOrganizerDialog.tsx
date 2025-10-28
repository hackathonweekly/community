"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, Copy, Check, MessageCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ContactOrganizerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizerName?: string;
	organizerUsername?: string;
	email?: string;
	contact?: string | null; // free-form contact string, e.g. phone/wechat/email
	wechatQr?: string | null;
}

export function ContactOrganizerDialog({
	open,
	onOpenChange,
	organizerName,
	organizerUsername,
	email,
	contact,
	wechatQr,
}: ContactOrganizerDialogProps) {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const toastsT = useTranslations("events.organizerContact");

	// 如果有 organizerContact，直接使用，不解析
	// 如果没有 organizerContact，显示发起人的邮箱和手机号码
	const hasOrganizerContact = contact?.trim();

	const copy = async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedKey(key);
			toast.success(toastsT("copySuccess"));
			setTimeout(() => setCopiedKey(null), 1500);
		} catch {
			toast.error(toastsT("copyFailed"));
		}
	};

	const Title = organizerName
		? `联系组织者 · ${organizerName}`
		: "联系组织者";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-center">{Title}</DialogTitle>
					<DialogDescription className="text-center">
						如有问题或沟通协作，请通过以下方式联系组织者
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{hasOrganizerContact ? (
						// 显示 organizerContact 原始内容
						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
								<div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
									<MessageCircle className="w-4 h-4 text-gray-700" />
								</div>
								<div className="flex-1 min-w-0">
									<Label className="text-xs text-muted-foreground">
										主办方联系方式
									</Label>
									<div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
										{contact}
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => copy(contact!, "contact")}
								>
									{copiedKey === "contact" ? (
										<Check className="w-4 h-4" />
									) : (
										<Copy className="w-4 h-4" />
									)}
								</Button>
							</div>
						</div>
					) : email ? (
						// 显示发起人的邮箱（作为备用联系方式）
						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
								<div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
									<Mail className="w-4 h-4 text-gray-700" />
								</div>
								<div className="flex-1 min-w-0">
									<Label className="text-xs text-muted-foreground">
										发起人邮箱
									</Label>
									<div className="text-sm text-gray-900 truncate">
										{email}
									</div>
								</div>
								<div className="flex gap-2">
									<Button asChild variant="outline" size="sm">
										<a href={`mailto:${email}`}>发邮件</a>
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => copy(email!, "email")}
									>
										{copiedKey === "email" ? (
											<Check className="w-4 h-4" />
										) : (
											<Copy className="w-4 h-4" />
										)}
									</Button>
								</div>
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground text-center py-2">
							暂无直达联系方式，请稍后重试或通过活动页留言
						</div>
					)}

					{wechatQr && (
						<div className="text-center space-y-3">
							<p className="text-sm text-gray-700">
								或扫码添加/进群
							</p>
							<div className="inline-block p-3 bg-white rounded-lg border">
								{/* next/image handles optimization; ensure public URL is valid */}
								<Image
									src={wechatQr}
									alt="微信二维码"
									width={160}
									height={160}
									className="rounded"
								/>
							</div>
						</div>
					)}

					{(hasOrganizerContact || email) && (
						<div className="flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									copy(
										hasOrganizerContact ? contact! : email!,
										"all",
									)
								}
							>
								{copiedKey === "all"
									? "已复制全部"
									: "复制全部"}
							</Button>
						</div>
					)}

					{organizerUsername && (
						<p className="text-xs text-muted-foreground text-center">
							组织者：{organizerName || organizerUsername}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default ContactOrganizerDialog;
