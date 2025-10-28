"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandHeart, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const resourceMatchingSchema = z.object({
	whatICanOffer: z.string().max(500, "能提供的帮助不能超过500字").optional(),
	whatIAmLookingFor: z
		.string()
		.max(500, "寻找的合作不能超过500字")
		.optional(),
});

type ResourceMatchingFormValues = z.infer<typeof resourceMatchingSchema>;

interface ResourceMatchingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData: {
		whatICanOffer?: string | null;
		whatIAmLookingFor?: string | null;
	};
	onSave: (data: ResourceMatchingFormValues) => Promise<boolean>;
	isLoading?: boolean;
}

export function ResourceMatchingDialog({
	open,
	onOpenChange,
	initialData,
	onSave,
	isLoading,
}: ResourceMatchingDialogProps) {
	const form = useForm<ResourceMatchingFormValues>({
		resolver: zodResolver(resourceMatchingSchema),
		defaultValues: {
			whatICanOffer: initialData.whatICanOffer || "",
			whatIAmLookingFor: initialData.whatIAmLookingFor || "",
		},
	});

	const handleSave = async (data: ResourceMatchingFormValues) => {
		const success = await onSave(data);
		if (success) {
			onOpenChange(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onOpenChange(false);
	};

	const watchedValues = form.watch();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HandHeart className="h-5 w-5" />
						编辑资源匹配信息
					</DialogTitle>
					<DialogDescription>
						清晰地描述您能提供的帮助和正在寻找的合作，促进资源互换和精准匹配
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSave)}
						className="space-y-6"
					>
						<FormField
							control={form.control}
							name="whatICanOffer"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										<HandHeart className="h-4 w-4 text-primary" />
										我能提供什么
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="例如：5年React经验，可提供技术指导和代码审查。有SaaS产品开发经验，可分享产品规划和用户增长实践。"
											rows={4}
											className="resize-none"
										/>
									</FormControl>
									<FormDescription className="flex justify-between">
										<span>
											描述您的专业技能、经验和愿意提供的帮助类型
										</span>
										<span className="text-xs">
											{
												(
													watchedValues.whatICanOffer ||
													""
												).length
											}
											/500
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="whatIAmLookingFor"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										<Search className="h-4 w-4 text-primary" />
										我在寻找什么帮助 + 合作偏好
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="例如：寻找AI背景的技术伙伴，开发智能客服产品。偏好远程协作，可股权合作。也欢迎相关导师提供产品建议。"
											rows={4}
											className="resize-none"
										/>
									</FormControl>
									<FormDescription className="flex justify-between">
										<span>
											描述您需要的帮助类型、合作方式和具体需求
										</span>
										<span className="text-xs">
											{
												(
													watchedValues.whatIAmLookingFor ||
													""
												).length
											}
											/500
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="bg-muted/30 p-4 rounded-lg">
							<h4 className="text-sm font-medium mb-2">
								💡 填写建议
							</h4>
							<div className="space-y-1 text-xs text-muted-foreground">
								<p>
									• <strong>我能提供</strong>：具体技能 +
									经验年限 + 提供方式
								</p>
								<p>
									• <strong>我在寻找</strong>：需求类型 +
									合作方式 + 具体期待
								</p>
								<p>• 信息越具体，匹配效果越好</p>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								取消
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "保存中..." : "保存"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
