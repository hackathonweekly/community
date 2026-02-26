"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { ImageUpload } from "@community/ui/ui/image-upload";
import { Textarea } from "@community/ui/ui/textarea";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import type { EventFormData } from "./types";

interface RegistrationPendingModalProps {
	control: Control<EventFormData>;
	pendingInfo?: string;
	pendingImage?: string;
	children: ReactNode;
}

export function RegistrationPendingModal({
	control,
	pendingInfo,
	pendingImage,
	children,
}: RegistrationPendingModalProps) {
	const [open, setOpen] = useState(false);

	const handleSave = () => {
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ClockIcon className="w-5 h-5 text-amber-600" />
						审核中提示设置
					</DialogTitle>
					<DialogDescription>
						设置参与者提交报名申请后立即显示的审核中信息，如活动须知、咨询群二维码等。
						<br />
						<span className="text-primary font-medium">
							注意：此信息在用户报名后立即显示，用于告知用户报名正在审核中。
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<FormField
						control={control}
						name="registrationPendingInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>审核中文字信息（可选）</FormLabel>
								<FormControl>
									<Textarea
										value={field.value || ""}
										onChange={field.onChange}
										placeholder="例如：您的报名在审核中，如果通过会通过短信联系您。可以先加入咨询群了解更多信息..."
										className="min-h-[100px] resize-none"
									/>
								</FormControl>
								<FormDescription>
									用户报名后立即显示此信息，说明当前审核状态和后续流程
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="registrationPendingImage"
						render={({ field }) => (
							<FormItem>
								<ImageUpload
									label="审核中图片信息（可选）"
									value={field.value || ""}
									onChange={field.onChange}
									onRemove={() => field.onChange("")}
									description="如咨询群二维码、活动准备清单等审核期间可查看的信息"
									maxSizeInMB={5}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* <DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						关闭
					</Button>
				</DialogFooter> */}
			</DialogContent>
		</Dialog>
	);
}

export function RegistrationPendingSummary({
	pendingInfo,
	pendingImage,
}: {
	pendingInfo?: string;
	pendingImage?: string;
}) {
	const hasContent = pendingInfo || pendingImage;

	if (!hasContent) {
		return (
			<p className="text-xs text-muted-foreground mt-1">
				点击设置审核中的提示信息
			</p>
		);
	}

	const items = [];
	if (pendingInfo) items.push("审核文字提示");
	if (pendingImage) items.push("审核图片信息");

	return (
		<p className="text-xs text-muted-foreground mt-1">
			已设置: {items.join("、")}
		</p>
	);
}
