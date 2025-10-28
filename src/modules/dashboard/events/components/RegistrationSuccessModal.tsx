"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import type { EventFormData } from "./types";

interface RegistrationSuccessModalProps {
	control: Control<EventFormData>;
	successInfo?: string;
	successImage?: string;
	children: ReactNode;
}

export function RegistrationSuccessModal({
	control,
	successInfo,
	successImage,
	children,
}: RegistrationSuccessModalProps) {
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
						<CheckCircleIcon className="w-5 h-5 text-green-600" />
						报名成功提示设置
					</DialogTitle>
					<DialogDescription>
						设置参与者报名成功后显示的额外信息，如准备清单、注意事项、微信群二维码等。
						<br />
						<span className="text-amber-600 font-medium">
							注意：如开启审核制度，此信息在审核中和审核通过后都会显示，但只有审核通过的用户才能生成签到二维码。
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<FormField
						control={control}
						name="registrationSuccessInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>文字信息（可选）</FormLabel>
								<FormControl>
									<Textarea
										value={field.value || ""}
										onChange={field.onChange}
										placeholder="例如：准备清单、注意事项、微信群信息等..."
										className="min-h-[100px] resize-none"
									/>
								</FormControl>
								<FormDescription>
									审核中显示活动须知，审核通过后显示重要信息（如微信群等）
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="registrationSuccessImage"
						render={({ field }) => (
							<FormItem>
								<ImageUpload
									label="图片信息（可选）"
									value={field.value || ""}
									onChange={field.onChange}
									onRemove={() => field.onChange("")}
									description="如微信群二维码、活动地图等重要信息"
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

export function RegistrationSuccessSummary({
	successInfo,
	successImage,
}: {
	successInfo?: string;
	successImage?: string;
}) {
	const hasContent = successInfo || successImage;

	if (!hasContent) {
		return (
			<p className="text-xs text-muted-foreground mt-1">
				点击设置报名成功后的提示信息
			</p>
		);
	}

	const items = [];
	if (successInfo) items.push("文字提示");
	if (successImage) items.push("图片信息");

	return (
		<p className="text-xs text-muted-foreground mt-1">
			已设置: {items.join("、")}
		</p>
	);
}
