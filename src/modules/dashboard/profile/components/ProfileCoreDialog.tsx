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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LIFE_STATUS_OPTIONS } from "@/lib/utils/life-status";

const profileCoreSchema = z.object({
	bio: z.string().max(500, "个人简介不能超过500字").optional(),
	userRoleString: z
		.string()
		.min(1, "请填写您的主要角色")
		.max(50, "角色描述不能超过50字"),
	currentWorkOn: z.string().max(200, "当前在做信息不能超过200字").optional(),
	lifeStatus: z.string().max(20, "当前状态不能超过20字").optional(),
});

type ProfileCoreFormValues = z.infer<typeof profileCoreSchema>;

interface ProfileCoreDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData: {
		bio?: string | null;
		userRoleString?: string | null;
		currentWorkOn?: string | null;
		lifeStatus?: string | null;
	};
	onSave: (data: ProfileCoreFormValues) => Promise<boolean>;
	isLoading?: boolean;
}

export function ProfileCoreDialog({
	open,
	onOpenChange,
	initialData,
	onSave,
	isLoading,
}: ProfileCoreDialogProps) {
	const form = useForm<ProfileCoreFormValues>({
		resolver: zodResolver(profileCoreSchema),
		defaultValues: {
			bio: initialData.bio || "",
			userRoleString: initialData.userRoleString || "",
			currentWorkOn: initialData.currentWorkOn || "",
			lifeStatus: initialData.lifeStatus || "",
		},
	});

	const handleSave = async (data: ProfileCoreFormValues) => {
		const success = await onSave(data);
		if (success) {
			onOpenChange(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onOpenChange(false);
	};

	// 监听字段值以计算字数
	const bioValue = form.watch("bio") || "";
	const userRoleStringValue = form.watch("userRoleString") || "";
	const currentWorkOnValue = form.watch("currentWorkOn") || "";

	// 字数限制
	const BIO_MAX = 500;
	const ROLE_MAX = 50;
	const CURRENT_WORK_MAX = 200;

	// 判断是否超出限制
	const isBioExceeded = bioValue.length > BIO_MAX;
	const isRoleExceeded = userRoleStringValue.length > ROLE_MAX;
	const isCurrentWorkExceeded = currentWorkOnValue.length > CURRENT_WORK_MAX;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						编辑核心档案
					</DialogTitle>
					<DialogDescription>
						完善您的个人简介和角色信息，让其他人更好地了解您
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSave)}
						className="space-y-6"
					>
						<FormField
							control={form.control}
							name="bio"
							render={({ field }) => (
								<FormItem>
									<FormLabel>个人简介 *</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="请简要介绍一下您自己，包括技能背景、经验、兴趣等..."
											className="min-h-[120px]"
										/>
									</FormControl>
									<div className="flex items-center justify-between">
										<FormDescription>
											向其他人展示您的背景和特长，建议包含您的技术栈、工作经验、兴趣爱好等
										</FormDescription>
										<span
											className={`text-sm ${
												isBioExceeded
													? "text-red-500 font-medium"
													: "text-muted-foreground"
											}`}
										>
											{bioValue.length}/{BIO_MAX}
										</span>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="userRoleString"
								render={({ field }) => (
									<FormItem>
										<FormLabel>主要角色 *</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="如：前端工程师、产品经理、设计师..."
											/>
										</FormControl>
										<div className="flex items-center justify-between">
											<FormDescription>
												您当前的主要职业角色
											</FormDescription>
											<span
												className={`text-sm ${
													isRoleExceeded
														? "text-red-500 font-medium"
														: "text-muted-foreground"
												}`}
											>
												{userRoleStringValue.length}/
												{ROLE_MAX}
											</span>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="lifeStatus"
								render={({ field }) => (
									<FormItem>
										<FormLabel>当前状态</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="请选择当前状态" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{LIFE_STATUS_OPTIONS.map(
													(option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
										<FormDescription>
											您当前的生活/工作状态
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="currentWorkOn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>当前在做</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="如：正在开发XX产品、在XX公司做前端、创业做AI工具..."
										/>
									</FormControl>
									<div className="flex items-center justify-between">
										<FormDescription>
											您目前正在做的事情，可以是产品、项目、工作或创业等
										</FormDescription>
										<span
											className={`text-sm ${
												isCurrentWorkExceeded
													? "text-red-500 font-medium"
													: "text-muted-foreground"
											}`}
										>
											{currentWorkOnValue.length}/
											{CURRENT_WORK_MAX}
										</span>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

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
