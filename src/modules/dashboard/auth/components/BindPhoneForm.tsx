"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import { config } from "@/config";
import { sendPhoneOTP, verifyPhoneOTP } from "@/lib/auth/phone-api";
import { AppErrorHandler, ErrorType } from "@/lib/error/handler";
import { sessionQueryKey } from "@dashboard/auth/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckCircleIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "../hooks/use-session";

const formSchema = z.object({
	phoneNumber: z.string().min(1, "手机号不能为空"),
	otp: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BindPhoneForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded, reloadSession } = useSession();

	const [isOtpSent, setIsOtpSent] = useState(false);
	const [otpCountdown, setOtpCountdown] = useState(0);
	const [bindingSuccess, setBindingSuccess] = useState(false);

	const redirectTo = searchParams.get("redirectTo");
	const redirectPath = redirectTo ?? config.auth.redirectAfterSignIn;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			phoneNumber: "",
			otp: "",
		},
	});

	// 检查用户是否已登录且已绑定手机号
	useEffect(() => {
		if (sessionLoaded && user) {
			if (user.phoneNumber && user.phoneNumberVerified) {
				// 已绑定手机号，跳转
				router.replace(redirectPath);
			}
		} else if (sessionLoaded && !user) {
			// 未登录，跳转到登录页
			router.replace("/auth/login");
		}
	}, [user, sessionLoaded, redirectPath, router]);

	// 验证码倒计时
	useEffect(() => {
		let timer: NodeJS.Timeout | undefined;
		if (otpCountdown > 0) {
			timer = setTimeout(() => {
				setOtpCountdown((prev) => prev - 1);
			}, 1000);
		}
		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [otpCountdown]);

	// 发送手机验证码
	const sendPhoneOtp = async (fullPhoneNumber: string) => {
		const result = await sendPhoneOTP(fullPhoneNumber, "VERIFY");

		if (result.error) {
			let friendlyMessage = t("auth.bindPhone.errors.sendCodeFailed");

			// Check if it's a rate limit error
			if (
				result.error.message?.includes("rate limit") ||
				result.error.message?.includes("TOO_MANY_REQUESTS") ||
				result.error.message?.includes("请求过于频繁") ||
				result.error.message?.includes("Too Many Requests")
			) {
				const retryAfter = result.error.retryAfter;
				if (retryAfter) {
					friendlyMessage = `${t("auth.bindPhone.errors.sendCodeTooFrequent")}，请等待 ${retryAfter} 秒后再试`;
				} else {
					friendlyMessage = t(
						"auth.bindPhone.errors.sendCodeTooFrequent",
					);
				}

				const rateLimitError = AppErrorHandler.createError(
					ErrorType.RATE_LIMIT,
					"Rate limit exceeded",
					friendlyMessage,
					429,
					{ retryAfter },
				);
				AppErrorHandler.showErrorToast(rateLimitError);
				return false;
			}
			if (result.error.message?.includes("INVALID_PHONE_NUMBER")) {
				friendlyMessage = t("auth.bindPhone.errors.invalidPhoneNumber");
			} else if (
				result.error.message?.includes(
					"Missing required environment variable",
				)
			) {
				friendlyMessage = t(
					"auth.bindPhone.errors.smsServiceNotConfigured",
				);
			} else {
				friendlyMessage = result.error.message;
			}

			form.setError("root", {
				message: friendlyMessage,
			});
			return false;
		}

		setIsOtpSent(true);
		setOtpCountdown(60);
		return true;
	};

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		form.clearErrors("root");

		try {
			if (!isOtpSent) {
				// 发送验证码
				await sendPhoneOtp(values.phoneNumber);
			} else {
				// 验证手机验证码并绑定
				if (!values.otp || values.otp.length !== 6) {
					form.setError("otp", {
						message: t("auth.bindPhone.errors.enterSixDigitCode"),
					});
					return;
				}

				// 验证手机号验证码
				const { data, error } = await verifyPhoneOTP(
					values.phoneNumber,
					values.otp,
					"VERIFY",
				);

				if (error) {
					let friendlyMessage = t(
						"auth.bindPhone.errors.codeExpiredOrIncorrect",
					);

					if (
						error.message?.includes("INVALID_OTP") ||
						error.message?.includes("OTP_EXPIRED") ||
						error.message?.includes("验证码错误或已过期")
					) {
						friendlyMessage = t(
							"auth.bindPhone.errors.codeExpiredOrIncorrect",
						);
					} else {
						friendlyMessage = error.message;
					}

					form.setError("root", {
						message: friendlyMessage,
					});
					return;
				}

				// 绑定成功，显示成功提示
				setBindingSuccess(true);

				// 绑定后强制刷新会话，确保跨页面/SSR 的 user 字段（如 phoneNumberVerified）立即生效
				try {
					await reloadSession();
				} catch {
					// ignore - 绑定已成功，允许继续跳转；后续页面会自动刷新会话
				}
				queryClient.invalidateQueries({ queryKey: sessionQueryKey });

				// 延迟跳转，让用户看到成功提示
				setTimeout(() => {
					router.replace(redirectPath);
				}, 1500);
			}
		} catch (e: any) {
			form.setError("root", {
				message: e?.message || t("auth.bindPhone.errors.bindingFailed"),
			});
		}
	};

	// 如果正在加载或未登录，显示加载状态
	if (!sessionLoaded || !user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto">
			<h1 className="font-bold text-xl md:text-2xl">
				{t("auth.bindPhone.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("auth.bindPhone.subtitle")}
			</p>

			{/* 绑定成功提示 */}
			{bindingSuccess && (
				<Alert
					variant="default"
					className="mb-6 border-green-200 bg-green-50 text-green-800"
				>
					<CheckCircleIcon />
					<div>
						<div className="font-medium text-sm">
							{t("auth.bindPhone.bindingSuccess")}
						</div>
						<p className="text-sm text-green-700 mt-1">
							{t("auth.bindPhone.redirecting")}
						</p>
					</div>
				</Alert>
			)}

			<Form {...form}>
				<form
					className="space-y-4"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					{form.formState.isSubmitted &&
						form.formState.errors.root?.message && (
							<Alert variant="destructive">
								<AlertTriangleIcon />
								<div>
									{typeof form.formState.errors.root
										.message === "string" ? (
										<div className="text-sm font-medium">
											{form.formState.errors.root.message}
										</div>
									) : (
										form.formState.errors.root.message
									)}
								</div>
							</Alert>
						)}

					{!isOtpSent && (
						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("auth.bindPhone.phoneNumber")}
									</FormLabel>
									<FormControl>
										<PhoneInput
											{...field}
											defaultCountry="+86"
											placeholder={t(
												"auth.bindPhone.phoneInputPlaceholder",
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{isOtpSent && (
						<>
							{/* Back button */}
							<div className="flex items-center justify-start mb-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setIsOtpSent(false);
										setOtpCountdown(0);
										form.setValue("otp", "");
									}}
									className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
								>
									{t("auth.bindPhone.backToModifyPhone")}
								</Button>
							</div>

							{/* Verification code prompt */}
							<div className="text-center mb-8">
								<div className="text-xl font-semibold mb-3 text-foreground">
									{t("auth.bindPhone.enterVerificationCode")}
								</div>
								<div className="text-sm text-muted-foreground">
									{t("auth.bindPhone.verificationCodeSentTo")}{" "}
									<span className="font-medium text-foreground">
										{form.watch("phoneNumber")}
									</span>
								</div>
							</div>

							{/* Verification code input */}
							<FormField
								control={form.control}
								name="otp"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<div className="flex justify-center">
												<InputOTP
													value={field.value || ""}
													onChange={field.onChange}
													maxLength={6}
												>
													<InputOTPGroup className="gap-2">
														<InputOTPSlot
															index={0}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
														<InputOTPSlot
															index={1}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
														<InputOTPSlot
															index={2}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
														<InputOTPSlot
															index={3}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
														<InputOTPSlot
															index={4}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
														<InputOTPSlot
															index={5}
															className="w-12 h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
														/>
													</InputOTPGroup>
												</InputOTP>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Resend verification code */}
							<div className="text-center mt-6">
								{otpCountdown > 0 ? (
									<div className="text-sm text-muted-foreground">
										{otpCountdown}
										{t("auth.bindPhone.resendCodeIn")}
									</div>
								) : (
									<Button
										variant="link"
										size="sm"
										onClick={() =>
											sendPhoneOtp(
												form.watch("phoneNumber"),
											)
										}
										disabled={form.formState.isSubmitting}
										className="text-sm"
									>
										{t(
											"auth.bindPhone.resendVerificationCode",
										)}
									</Button>
								)}
							</div>
						</>
					)}

					<Button
						className="w-full"
						type="submit"
						variant="secondary"
						disabled={form.formState.isSubmitting || bindingSuccess}
					>
						{form.formState.isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						{!isOtpSent
							? t("auth.bindPhone.sendVerificationCode")
							: t("auth.bindPhone.verifyAndBind")}
					</Button>

					{/* 跳过按钮 - 可选 */}
					<Button
						variant="ghost"
						type="button"
						className="w-full"
						onClick={() => router.replace(redirectPath)}
						disabled={form.formState.isSubmitting || bindingSuccess}
					>
						{t("auth.bindPhone.skipForNow")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
