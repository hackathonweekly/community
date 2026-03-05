"use client";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clearCache } from "@/actions/clear-cache";
import { useRouter } from "@/hooks/router";
import { authClient } from "@community/lib-client/auth/client";
import { PROFILE_LIMITS } from "@community/lib-shared/utils/profile-limits";
import { Button } from "@community/ui/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import { useSession } from "@account/auth/hooks/use-session";
import { UserRoleInput } from "@account/profile/components/UserRoleInput";
import { UserAvatarUpload } from "@account/settings/components/UserAvatarUpload";

const formSchema = z.object({
	username: z
		.string()
		.min(2, "用户名至少需要2个字符")
		.max(20, "用户名不能超过20个字符")
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
			"用户名只能包含字母、数字和下划线，且不能以下划线开头或结尾",
		)
		.optional(),
	userRoleString: z
		.string()
		.min(1, "请选择或输入您的主要角色")
		.max(PROFILE_LIMITS.userRoleStringMax, "个人角色不能超过7个字"),
	bio: z.string().max(200, "个人简介不能超过200字").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingForm() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useSession();

	const redirectTo = searchParams.get("redirectTo");

	// 检测是否为微信登录用户
	const isWechatUser = useMemo(() => {
		return user?.wechatId || user?.wechatOpenId || user?.wechatUnionId;
	}, [user]);

	// 检测是否有头像（社交登录通常已有头像）
	const hasAvatar = useMemo(() => {
		return user?.image && user.image !== "";
	}, [user]);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: user?.username ?? "",
			userRoleString: user?.userRoleString ?? "",
			bio: user?.bio ?? "",
		},
	});

	useEffect(() => {
		if (user) {
			form.setValue("username", user.username ?? "");
			form.setValue("userRoleString", user.userRoleString ?? "");
			form.setValue("bio", user.bio ?? "");
		}
	}, [user, form]);

	const onSubmit: SubmitHandler<FormValues> = async ({
		username,
		userRoleString,
		bio,
	}) => {
		form.clearErrors("root");

		try {
			const updateData: Record<string, any> = {
				userRoleString,
				bio: bio || null,
				onboardingComplete: true,
			};

			// 只有非微信用户或没有用户名的用户才更新用户名
			if (!isWechatUser && username) {
				updateData.username = username;
			}

			await authClient.updateUser(updateData as any);

			await clearCache();
			router.replace(redirectTo ?? "/");
		} catch (e) {
			form.setError("root", {
				type: "server",
				message: "保存失败，请重试",
			});
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<div className="text-center mb-8">
				<h1 className="font-bold text-2xl md:text-3xl mb-2">
					欢迎加入周周黑客松社区！
				</h1>
				<p className="text-muted-foreground">
					欢迎 {user?.name}！完善您的个人资料，让社区成员更好地了解您
				</p>
			</div>

			<Form {...form}>
				<form
					className="flex flex-col items-stretch gap-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					{/* 用户名字段 - 仅对非微信用户显示 */}
					{!isWechatUser && (
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-base font-medium">
										用户名（可选）
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="设置一个简短的用户名，如：zhang_san"
											className="text-base"
										/>
									</FormControl>
									<FormDescription>
										用户名将作为您的个人页面链接，如：/u/your_username。如果不设置，将使用默认的用户ID
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* 头像字段 - 仅对没有头像的用户显示 */}
					{!hasAvatar && (
						<FormItem>
							<FormLabel className="text-base font-medium">
								头像（可选）
							</FormLabel>
							<FormDescription className="mb-4">
								设置一个头像可以让其他成员更容易记住您
							</FormDescription>
							<FormControl>
								<div className="flex justify-center">
									<UserAvatarUpload
										onSuccess={() => {
											return;
										}}
										onError={() => {
											return;
										}}
									/>
								</div>
							</FormControl>
						</FormItem>
					)}

					{/* 个人角色 - 必填 */}
					<UserRoleInput
						control={form.control}
						name="userRoleString"
						required
					/>

					{/* 个人简介 */}
					<FormField
						control={form.control}
						name="bio"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-base font-medium">
									个人简介（可选）
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="简单介绍一下您自己、您的经验或当前在做的事情..."
										rows={4}
										maxLength={200}
									/>
								</FormControl>
								<FormDescription>
									让社区成员了解您的背景和兴趣
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 表单错误信息 */}
					{form.formState.errors.root && (
						<div className="text-sm text-destructive">
							{form.formState.errors.root.message}
						</div>
					)}

					{/* 提交按钮 */}
					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						size="lg"
						className="w-full"
					>
						{form.formState.isSubmitting ? "保存中..." : "完成设置"}
						<CheckIcon className="ml-2 size-4" />
					</Button>

					{/* 跳过选项 */}
					<div className="text-center">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={async () => {
								try {
									await authClient.updateUser({
										onboardingComplete: true,
									} as any);
									await clearCache();
									router.replace(redirectTo ?? "/");
								} catch {
									// 静默处理错误，用户可以重试
								}
							}}
							className="text-muted-foreground"
						>
							暂时跳过，稍后设置
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
