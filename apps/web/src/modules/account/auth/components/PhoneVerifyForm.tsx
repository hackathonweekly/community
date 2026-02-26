"use client";

import { Alert } from "@community/ui/ui/alert";
import { Button } from "@community/ui/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@community/ui/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@community/ui/ui/input-otp";
import { config } from "@community/config";
import { useRouter } from "@/hooks/router";
import {
	sendPhoneOTP,
	verifyPhoneOTP,
} from "@community/lib-client/auth/phone-api";
import {
	AppErrorHandler,
	ErrorType,
} from "@community/lib-client/error/handler";
import { sessionQueryKey } from "@account/auth/lib/api";
import { useSession } from "@account/auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@community/lib-client/auth/client";

const formSchema = z.object({
	otp: z.string().length(6, "请输入6位验证码"),
});

type FormValues = z.infer<typeof formSchema>;

export function PhoneVerifyForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [otpCountdown, setOtpCountdown] = useState(60);
	const phoneNumber = searchParams.get("phoneNumber");
	const invitationId = searchParams.get("invitationId");
	const redirectTo = searchParams.get("redirectTo");
	const sendCardBack = searchParams.get("sendCardBack");
	const targetUser = searchParams.get("targetUser");

	const redirectPath = invitationId
		? `/orgs/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			otp: "",
		},
	});

	// 如果没有手机号，返回上一页
	useEffect(() => {
		if (!phoneNumber) {
			const queryString = searchParams.toString();
			router.replace(
				`/auth/login/phone${queryString ? `?${queryString}` : ""}`,
			);
		}
	}, [phoneNumber, router, searchParams]);

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

	const handleResendCode = async () => {
		if (!phoneNumber) return;

		form.clearErrors("root");

		const result = await sendPhoneOTP(phoneNumber, "LOGIN");

		if (result.error) {
			let friendlyMessage = t("auth.login.errors.sendCodeFailed");

			if (
				result.error.message?.includes("rate limit") ||
				result.error.message?.includes("TOO_MANY_REQUESTS") ||
				result.error.message?.includes("请求过于频繁") ||
				result.error.message?.includes("Too Many Requests")
			) {
				const retryAfter = result.error.retryAfter;
				if (retryAfter) {
					friendlyMessage = `${t("auth.login.errors.sendCodeTooFrequent")}，请等待 ${retryAfter} 秒后再试`;
				} else {
					friendlyMessage = t(
						"auth.login.errors.sendCodeTooFrequent",
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
				return;
			}

			form.setError("root", {
				message: friendlyMessage,
			});
			return;
		}

		setOtpCountdown(60);
	};

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		if (!phoneNumber) return;

		form.clearErrors("root");

		const { data, error } = await verifyPhoneOTP(
			phoneNumber,
			values.otp,
			"LOGIN",
		);

		if (error) {
			let friendlyMessage = t("auth.login.errors.codeExpiredOrIncorrect");

			if (
				error.message?.includes("INVALID_OTP") ||
				error.message?.includes("OTP_EXPIRED") ||
				error.message?.includes("验证码错误或已过期")
			) {
				friendlyMessage = t("auth.login.errors.codeExpiredOrIncorrect");
			} else {
				friendlyMessage = error.message;
			}

			form.setError("root", {
				message: friendlyMessage,
			});
			return;
		}

		queryClient.invalidateQueries({
			queryKey: sessionQueryKey,
		});

		// 处理回发名片的特殊逻辑
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
	};

	if (!phoneNumber) {
		return null;
	}

	return (
		<div>
			<div className="mb-6">
				<Link
					href={`/auth/login/phone${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
					className="inline-flex items-center text-sm text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
				>
					<ArrowLeftIcon className="mr-1 size-4" />
					{t("auth.login.backToModifyPhone")}
				</Link>
			</div>

			<div className="text-center mb-8">
				<h1 className="font-brand font-bold text-2xl tracking-tight text-foreground mb-3">
					{t("auth.login.enterVerificationCode")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{t("auth.login.verificationCodeSentTo")}{" "}
					<span className="font-medium text-foreground">
						{phoneNumber}
					</span>
				</p>
			</div>

			<Form {...form}>
				<form
					className="space-y-6"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					{form.formState.errors.root?.message && (
						<Alert variant="destructive">
							<AlertTriangleIcon />
							<div className="text-sm font-medium">
								{form.formState.errors.root.message}
							</div>
						</Alert>
					)}

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
											<InputOTPGroup className="gap-1.5 sm:gap-2">
												<InputOTPSlot
													index={0}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
												<InputOTPSlot
													index={1}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
												<InputOTPSlot
													index={2}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
												<InputOTPSlot
													index={3}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
												<InputOTPSlot
													index={4}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
												<InputOTPSlot
													index={5}
													className="w-10 h-10 sm:w-12 sm:h-12 text-lg border-2 border-input focus-within:border-ring rounded-md shadow-sm"
												/>
											</InputOTPGroup>
										</InputOTP>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="text-center">
						{otpCountdown > 0 ? (
							<div className="text-sm text-muted-foreground">
								{otpCountdown}
								{t("auth.login.resendCodeIn")}
							</div>
						) : (
							<Button
								variant="link"
								size="sm"
								type="button"
								onClick={handleResendCode}
								disabled={form.formState.isSubmitting}
								className="text-sm"
							>
								{t("auth.login.resendVerificationCode")}
							</Button>
						)}
					</div>

					<Button
						className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-sm shadow-sm transition-colors"
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						{t("auth.login.verifyAndLogin")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
