"use client";

import { Alert } from "@community/ui/ui/alert";
import { Button } from "@community/ui/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { config } from "@community/config";
import { useRouter } from "@/hooks/router";
import { authClient } from "@community/lib-client/auth/client";
import { AppErrorHandler } from "@community/lib-client/error/handler";
import { useAuthErrorMessages } from "@account/auth/hooks/errors-messages";
import { sessionQueryKey } from "@account/auth/lib/api";
import { useSession } from "@account/auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	ArrowLeftIcon,
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	MailboxIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";

const formSchema = z.object({
	email: z.string().email("请输入有效的邮箱地址"),
	password: z.string().min(1, "请输入密码"),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailLoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const [isResendingVerification, setIsResendingVerification] =
		useState(false);
	const [verificationEmailSent, setVerificationEmailSent] = useState(false);
	const [emailNotVerifiedError, setEmailNotVerifiedError] = useState<{
		email: string;
	} | null>(null);

	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");
	const sendCardBack = searchParams.get("sendCardBack");
	const targetUser = searchParams.get("targetUser");

	const redirectPath = invitationId
		? `/orgs/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
		},
	});

	// 登录成功后的重定向逻辑
	useEffect(() => {
		if (sessionLoaded && user) {
			if (sendCardBack === "true" && targetUser) {
				const isProfileComplete =
					user.name && user.bio && user.userRoleString;

				if (!isProfileComplete) {
					router.replace(
						`/me/edit?redirectAfterProfile=${targetUser}`,
					);
					return;
				}

				if (user.username) {
					router.replace(`/u/${user.username}`);
					return;
				}
			}

			router.replace(redirectPath);
		}
	}, [user, sessionLoaded, sendCardBack, targetUser, redirectPath, router]);

	// 当输入内容变化时清除验证邮件发送状态
	useEffect(() => {
		const subscription = form.watch(() => {
			setVerificationEmailSent(false);
		});
		return () => subscription.unsubscribe();
	}, [form]);

	const handleResendVerificationEmail = async (emailAddr: string) => {
		if (!emailAddr || !emailAddr.includes("@")) {
			form.setError("root", {
				message: "请输入有效的邮箱地址",
			});
			return;
		}

		setIsResendingVerification(true);
		setVerificationEmailSent(false);

		try {
			const { error } = await authClient.sendVerificationEmail({
				email: emailAddr,
			});

			if (error) {
				const rateLimitError =
					AppErrorHandler.handleRateLimitError(error);
				if (rateLimitError) {
					AppErrorHandler.showErrorToast(rateLimitError);
					return;
				}

				let friendlyMessage = "发送验证邮件失败";

				if (
					error.message?.toLowerCase().includes("rate limit") ||
					error.message
						?.toLowerCase()
						.includes("too many requests") ||
					error.message?.includes("请求过于频繁")
				) {
					friendlyMessage = "发送验证邮件过于频繁，请稍后再试";
				} else if (
					error.message?.toLowerCase().includes("user not found") ||
					error.message?.toLowerCase().includes("not found")
				) {
					friendlyMessage = "该邮箱地址尚未注册";
				} else if (error.message) {
					friendlyMessage = error.message;
				}

				form.setError("root", {
					message: friendlyMessage,
				});
			} else {
				setVerificationEmailSent(true);
				form.clearErrors("root");
				setEmailNotVerifiedError(null);
			}
		} catch (error: any) {
			form.setError("root", {
				message: error?.message || "发送验证邮件失败，请重试",
			});
		} finally {
			setIsResendingVerification(false);
		}
	};

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		setEmailNotVerifiedError(null);
		setVerificationEmailSent(false);
		form.clearErrors("root");

		try {
			const { data, error } = await authClient.signIn.email({
				email: values.email,
				password: values.password,
			});

			if (error) {
				const rateLimitError =
					AppErrorHandler.handleRateLimitError(error);
				if (rateLimitError) {
					AppErrorHandler.showErrorToast(rateLimitError);
					return;
				}

				let friendlyMessage: string;

				if (
					error.code === "INVALID_EMAIL_OR_PASSWORD" ||
					error.code === "INVALID_PASSWORD" ||
					error.code === "INVALID_CREDENTIALS" ||
					error.message?.toLowerCase().includes("invalid") ||
					error.message?.toLowerCase().includes("incorrect") ||
					error.message?.toLowerCase().includes("wrong")
				) {
					friendlyMessage = t(
						"auth.login.errors.emailUsernameOrPasswordIncorrect",
					);
				} else if (
					error.code === "USER_NOT_FOUND" ||
					error.code === "CREDENTIAL_ACCOUNT_NOT_FOUND" ||
					error.code === "ACCOUNT_NOT_FOUND" ||
					error.message?.toLowerCase().includes("not found") ||
					error.message?.toLowerCase().includes("does not exist")
				) {
					friendlyMessage = t("auth.login.errors.accountNotExist");
				} else if (
					error.code === "EMAIL_NOT_VERIFIED" ||
					error.message?.toLowerCase().includes("email") ||
					error.message?.toLowerCase().includes("验证") ||
					error.message?.toLowerCase().includes("verify")
				) {
					form.clearErrors("root");
					setEmailNotVerifiedError({ email: values.email });
					return;
				} else if (error.code === "SESSION_EXPIRED") {
					friendlyMessage = t("auth.login.errors.sessionExpired");
				} else if (
					error.message?.toLowerCase().includes("network") ||
					error.message?.toLowerCase().includes("fetch") ||
					error.message?.toLowerCase().includes("connection") ||
					(error as any)?.name === "NetworkError"
				) {
					friendlyMessage = t("auth.login.errors.networkError");
				} else if (
					error.message?.toLowerCase().includes("server") ||
					error.message?.toLowerCase().includes("internal") ||
					error.status >= 500
				) {
					friendlyMessage = t("auth.login.errors.serverError");
				} else {
					friendlyMessage = t("auth.login.errors.loginFailedGeneral");
				}

				form.setError("root", {
					message: friendlyMessage,
				});
				return;
			}

			if ((data as any).twoFactorRedirect) {
				router.replace(
					withQuery(
						"/auth/verify",
						Object.fromEntries(searchParams.entries()),
					),
				);
				return;
			}

			queryClient.invalidateQueries({
				queryKey: sessionQueryKey,
			});

			if (sendCardBack === "true" && targetUser) {
				const checkProfileAndRedirect = async () => {
					const updatedSession = await authClient.getSession();
					const sessionUser = updatedSession.data?.user;

					if (sessionUser) {
						const isProfileComplete =
							sessionUser.name &&
							sessionUser.bio &&
							sessionUser.userRoleString;

						if (!isProfileComplete) {
							router.replace(
								`/me/edit?redirectAfterProfile=${targetUser}`,
							);
						} else {
							if (sessionUser.username) {
								router.replace(`/u/${sessionUser.username}`);
							} else {
								router.replace(redirectPath);
							}
						}
					} else {
						router.replace(redirectPath);
					}
				};

				checkProfileAndRedirect();
			} else {
				router.replace(redirectPath);
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	};

	return (
		<div>
			<div className="mb-6">
				<Link
					href={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
					className="inline-flex items-center text-sm text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
				>
					<ArrowLeftIcon className="mr-1 size-4" />
					{t("auth.login.backToLoginMethods")}
				</Link>
			</div>

			<h1 className="font-brand font-bold text-2xl tracking-tight text-foreground">
				{t("auth.login.emailLogin")}
			</h1>
			<p className="mt-1 mb-6 text-sm text-muted-foreground">
				{t("auth.login.emailLoginSubtitle")}
			</p>

			<Form {...form}>
				<form
					className="space-y-4"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					{form.formState.isSubmitted &&
						form.formState.errors.root?.message && (
							<Alert variant="destructive">
								<AlertTriangleIcon />
								<div className="text-sm font-medium">
									{form.formState.errors.root.message}
								</div>
							</Alert>
						)}

					{verificationEmailSent && (
						<Alert
							variant="default"
							className="border-green-200 bg-green-50 text-green-800"
						>
							<MailboxIcon />
							<div>
								<div className="font-medium text-sm">
									验证邮件已发送！
								</div>
								<p className="text-sm text-green-700 mt-1">
									请检查您的邮箱（包括垃圾邮件文件夹），点击验证链接完成验证后即可登录。
								</p>
							</div>
						</Alert>
					)}

					{emailNotVerifiedError &&
						!form.formState.errors.root?.message && (
							<Alert variant="destructive">
								<AlertTriangleIcon />
								<div className="space-y-3">
									<p className="text-sm">
										请先验证您的邮箱后再登录
									</p>
									<Button
										variant="outline"
										size="sm"
										type="button"
										onClick={() =>
											handleResendVerificationEmail(
												emailNotVerifiedError.email,
											)
										}
										disabled={isResendingVerification}
										className="h-8 text-xs"
									>
										{isResendingVerification ? (
											<>
												<Loader2Icon className="mr-1 size-3 animate-spin" />
												发送中...
											</>
										) : (
											<>
												<MailboxIcon className="mr-1 size-3" />
												重新发送验证邮件
											</>
										)}
									</Button>
								</div>
							</Alert>
						)}

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.login.email")}</FormLabel>
								<FormControl>
									<div className="relative">
										<MailboxIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
										<Input
											{...field}
											className="pl-10"
											placeholder={t(
												"auth.login.emailInputPlaceholder",
											)}
											autoComplete="email"
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between gap-4">
									<FormLabel>
										{t("auth.signup.password")}
									</FormLabel>
									<Link
										href="/auth/forgot-password"
										className="text-foreground/60 text-xs"
									>
										{t("auth.login.forgotPassword")}
									</Link>
								</div>
								<FormControl>
									<div className="relative">
										<Input
											type={
												showPassword
													? "text"
													: "password"
											}
											className="pr-10"
											{...field}
											autoComplete="current-password"
										/>
										<button
											type="button"
											onClick={() =>
												setShowPassword(!showPassword)
											}
											className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary text-xl"
										>
											{showPassword ? (
												<EyeOffIcon className="size-4" />
											) : (
												<EyeIcon className="size-4" />
											)}
										</button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-sm shadow-sm transition-colors"
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						{t("auth.login.submit")}
					</Button>
				</form>
			</Form>

			{config.auth.enableSignup && (
				<div className="mt-6 text-center text-sm">
					<span className="text-muted-foreground">
						{t("auth.login.dontHaveAnAccount")}{" "}
					</span>
					<Link
						href={withQuery(
							"/auth/signup",
							Object.fromEntries(searchParams.entries()),
						)}
						className="font-bold text-foreground hover:underline"
					>
						{t("auth.login.createAnAccount")}
					</Link>
				</div>
			)}
		</div>
	);
}
