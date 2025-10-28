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
import { PhoneInput } from "@/components/ui/phone-input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	MailIcon,
	MapPinIcon,
	MessageSquare,
	PhoneIcon,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounceCallback } from "usehooks-ts";
import { z } from "zod";
import { WechatQrCodeUpload } from "./WechatQrCodeUpload";

// 性别选项配置
const GENDER_OPTIONS = [
	{ value: "MALE", label: "男", icon: "👨" },
	{ value: "FEMALE", label: "女", icon: "👩" },
	{ value: "OTHER", label: "其他", icon: "🌈" },
	{ value: "NOT_SPECIFIED", label: "不愿透露", icon: "🤐" },
] as const;

const basicInfoSchema = z.object({
	name: z.string().min(1, "姓名不能为空").max(100, "姓名不能超过100个字符"),
	username: z
		.string()
		.min(2, "用户名至少需要2个字符")
		.max(20, "用户名不能超过20个字符")
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
			"用户名只能包含字母、数字和下划线，不能以下划线开头或结尾",
		),
	region: z.string().max(50, "地区名称不能超过50个字符").optional(),
	gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]).optional(),
	phoneNumber: z
		.string()
		.regex(/^\+?[1-9]\d{1,14}|1[3-9]\d{9}$|^$/, "手机号格式不正确")
		.optional(),
	wechatId: z.string().max(50, "微信号不能超过50个字符").optional(),
	wechatQrCode: z.string().optional(),
	email: z.string().email("邮箱格式不正确").optional(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string; // 添加 userId 参数
	initialData: {
		name?: string | null;
		username?: string | null;
		region?: string | null;
		gender?: string | null;
		phoneNumber?: string | null;
		wechatId?: string | null;
		wechatQrCode?: string | null;
		email?: string | null;
	};
	onSave: (data: BasicInfoFormValues) => Promise<boolean>;
	isLoading?: boolean;
}

export function BasicInfoDialog({
	open,
	onOpenChange,
	userId,
	initialData,
	onSave,
	isLoading,
}: BasicInfoDialogProps) {
	const t = useTranslations();
	const [usernameStatus, setUsernameStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");
	const [usernameMessage, setUsernameMessage] = useState("");

	const form = useForm<BasicInfoFormValues>({
		resolver: zodResolver(basicInfoSchema),
		defaultValues: {
			name: initialData.name || "",
			username: initialData.username || "",
			region: initialData.region || "",
			gender: (initialData.gender as any) || undefined,
			phoneNumber: initialData.phoneNumber || "",
			wechatId: initialData.wechatId || "",
			wechatQrCode: initialData.wechatQrCode || "",
			email: initialData.email || "",
		},
	});

	const checkUsername = useCallback(async (username: string) => {
		if (!username || username.length < 2) {
			setUsernameStatus("idle");
			setUsernameMessage("");
			return;
		}

		setUsernameStatus("checking");

		try {
			const response = await fetch(
				`/api/profile/check-username?username=${encodeURIComponent(username)}`,
			);
			const data = await response.json();

			if (response.ok) {
				setUsernameStatus(data.available ? "available" : "taken");
				setUsernameMessage(data.message);
			} else {
				setUsernameStatus("invalid");
				setUsernameMessage(data.error || "检查用户名时出错");
			}
		} catch (error) {
			setUsernameStatus("invalid");
			setUsernameMessage("检查用户名时出错");
		}
	}, []);

	const debouncedCheckUsername = useDebounceCallback(checkUsername, 500);

	const handleSave = async (data: BasicInfoFormValues) => {
		const success = await onSave(data);
		if (success) {
			onOpenChange(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						编辑基本信息
					</DialogTitle>
					<DialogDescription>
						完善您的基本信息，让其他人更好地了解您
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSave)}
						className="space-y-6"
					>
						{/* 基础身份信息 */}
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("profile.name.label")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder={t(
														"profile.name.placeholder",
													)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t(
													"profile.basicInfo.username.label",
												)}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														{...field}
														placeholder={t(
															"profile.basicInfo.username.placeholder",
														)}
														className="pr-8"
														onChange={(e) => {
															field.onChange(e);
															debouncedCheckUsername(
																e.target.value,
															);
														}}
													/>
													<div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4">
														{usernameStatus ===
															"checking" && (
															<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
														)}
														{usernameStatus ===
															"available" && (
															<div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
																<div className="w-2 h-2 bg-white rounded-full" />
															</div>
														)}
														{usernameStatus ===
															"taken" && (
															<div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
																<div className="w-2 h-2 bg-white rounded-full" />
															</div>
														)}
													</div>
												</div>
											</FormControl>
											<FormDescription>
												独特的用户名，用于个人主页链接，如：/u/yourname
											</FormDescription>
											{usernameMessage && (
												<div
													className={`text-xs mt-1 ${
														usernameStatus ===
														"available"
															? "text-green-600"
															: usernameStatus ===
																		"taken" ||
																	usernameStatus ===
																		"invalid"
																? "text-red-600"
																: "text-muted-foreground"
													}`}
												>
													{usernameMessage}
												</div>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* 地区和性别信息 */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* 地区信息 */}
							<FormField
								control={form.control}
								name="region"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<MapPinIcon className="h-4 w-4" />
											所在地区
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="如：北京、上海、深圳、远程等"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* 性别信息 */}
							<FormField
								control={form.control}
								name="gender"
								render={({ field }) => (
									<FormItem>
										<FormLabel>性别</FormLabel>
										<FormControl>
											<div className="flex flex-wrap gap-2">
												{GENDER_OPTIONS.map(
													(option) => (
														<Button
															key={option.value}
															type="button"
															variant={
																field.value ===
																option.value
																	? "default"
																	: "outline"
															}
															size="sm"
															className="h-8 px-3 text-sm"
															onClick={() =>
																field.onChange(
																	option.value,
																)
															}
														>
															<span className="mr-1 text-sm">
																{option.icon}
															</span>
															{option.label}
														</Button>
													),
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* 联系方式信息 */}
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="phoneNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<PhoneIcon className="h-4 w-4" />
												手机号
											</FormLabel>
											<FormControl>
												<PhoneInput
													value={field.value || ""}
													onChange={(value) =>
														field.onChange(value)
													}
													defaultCountry="+86"
													placeholder="请输入手机号"
													showValidation={false}
												/>
											</FormControl>
											<FormDescription>
												手机号将用于联系方式和账号安全，仅互关可见
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="wechatId"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<MessageSquare className="h-4 w-4" />
												微信号
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													value={field.value || ""}
													placeholder="请输入微信号"
												/>
											</FormControl>
											<FormDescription>
												微信号仅互相关注的成员可见
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<MailIcon className="h-4 w-4" />
												邮箱
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													value={field.value || ""}
													placeholder="请输入常用邮箱"
													type="email"
												/>
											</FormControl>
											<FormDescription>
												邮箱用于活动通知与联系，仅互关可见，修改后将重新验证
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 微信二维码上传 */}
							<div className="mt-6">
								<FormField
									control={form.control}
									name="wechatQrCode"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<WechatQrCodeUpload
													userId={userId}
													currentQrCode={field.value}
													onSuccess={(imageUrl) => {
														field.onChange(
															imageUrl,
														);
													}}
													onRemove={() => {
														field.onChange("");
													}}
													disabled={isLoading}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
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
