"use client";

import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { sendPhoneOTP, verifyPhoneOTP } from "@/lib/auth/phone-api";
import { AppErrorHandler, ErrorType } from "@/lib/error/handler";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const phoneBindingSchema = z.object({
	phoneNumber: z.string().min(1, "请输入手机号"),
	otp: z.string().optional(),
});

type PhoneBindingFormValues = z.infer<typeof phoneBindingSchema>;

export function PhoneNumberBindingBlock() {
	const t = useTranslations();
	const { user, reloadSession } = useSession();
	const { toast } = useToast();

	const [isOtpSent, setIsOtpSent] = useState(false);
	const [otpCountdown, setOtpCountdown] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<PhoneBindingFormValues>({
		resolver: zodResolver(phoneBindingSchema),
		defaultValues: {
			phoneNumber: "",
			otp: "",
		},
	});

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

	// 发送验证码
	const sendOTP = async (phoneNumber: string) => {
		setIsSubmitting(true);
		const result = await sendPhoneOTP(phoneNumber, "REGISTRATION");

		if (result.error) {
			// Check if it's a rate limit error and show enhanced toast
			if (
				result.error.message?.includes("rate limit") ||
				result.error.message?.includes("TOO_MANY_REQUESTS") ||
				result.error.message?.includes("请求过于频繁") ||
				result.error.message?.includes("Too Many Requests")
			) {
				const retryAfter = result.error.retryAfter;
				const rateLimitError = AppErrorHandler.createError(
					ErrorType.RATE_LIMIT,
					"Rate limit exceeded",
					retryAfter
						? `发送验证码过于频繁，请等待 ${retryAfter} 秒后再试`
						: "发送验证码过于频繁，请稍后再试",
					429,
					{ retryAfter },
				);
				AppErrorHandler.showErrorToast(rateLimitError);
			} else {
				let friendlyMessage = "发送验证码失败，请重试";

				if (result.error.message?.includes("INVALID_PHONE_NUMBER")) {
					friendlyMessage = "手机号格式不正确";
				} else {
					friendlyMessage = result.error.message;
				}

				form.setError("root", { message: friendlyMessage });
			}

			setIsSubmitting(false);
			return false;
		}

		setIsOtpSent(true);
		setOtpCountdown(60);
		setIsSubmitting(false);
		return true;
	};

	// 验证验证码并绑定手机号
	const verifyAndBind = async (phoneNumber: string, code: string) => {
		setIsSubmitting(true);
		const result = await verifyPhoneOTP(
			phoneNumber,
			code,
			"REGISTRATION",
			true,
		);

		if (result.error) {
			// Check if it's a rate limit error and show enhanced toast
			if (
				result.error.message?.includes("rate limit") ||
				result.error.message?.includes("请求过于频繁") ||
				result.error.message?.includes("Too Many Requests")
			) {
				const retryAfter = result.error.retryAfter;
				const rateLimitError = AppErrorHandler.createError(
					ErrorType.RATE_LIMIT,
					"Rate limit exceeded",
					retryAfter
						? `验证请求过于频繁，请等待 ${retryAfter} 秒后再试`
						: "验证请求过于频繁，请稍后再试",
					429,
					{ retryAfter },
				);
				AppErrorHandler.showErrorToast(rateLimitError);
			} else {
				let friendlyMessage = "验证码错误，请重试";

				if (
					result.error.message?.includes("INVALID_OTP") ||
					result.error.message?.includes("OTP_EXPIRED") ||
					result.error.message?.includes("验证码错误或已过期")
				) {
					friendlyMessage = "验证码错误或已过期，请重新获取";
				} else {
					friendlyMessage = result.error.message;
				}

				form.setError("root", { message: friendlyMessage });
			}

			setIsSubmitting(false);
			return false;
		}

		// 绑定成功，刷新会话信息
		await reloadSession();

		// 重置表单状态
		form.reset();
		setIsOtpSent(false);
		setOtpCountdown(0);
		setIsSubmitting(false);
		return true;
	};

	// 解绑手机号
	const unbindPhone = async () => {
		// 确认对话框
		if (!confirm("确定要解绑手机号吗？解绑后将无法使用手机号登录。")) {
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/profile/update", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					phoneNumber: null,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "解绑失败");
			}

			// 解绑成功，刷新会话信息
			await reloadSession();

			toast({
				title: "手机号解绑成功",
				description: "您已成功解绑手机号，需要时可以重新绑定",
			});
		} catch (error) {
			console.error("Unbind phone error:", error);
			toast({
				title: "解绑手机号失败",
				description:
					error instanceof Error
						? error.message
						: "解绑手机号失败，请重试",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const onSubmit = async (values: PhoneBindingFormValues) => {
		if (!isOtpSent) {
			// 发送验证码
			await sendOTP(values.phoneNumber);
		} else {
			// 验证验证码并绑定
			if (!values.otp || values.otp.length !== 6) {
				form.setError("otp", { message: "请输入6位验证码" });
				return;
			}
			await verifyAndBind(values.phoneNumber, values.otp);
		}
	};

	// 需要从数据库获取完整的用户信息（包含phoneNumber字段）
	const [userPhone, setUserPhone] = useState<{
		phoneNumber?: string;
		phoneNumberVerified?: boolean;
	}>({});

	useEffect(() => {
		if (user?.id) {
			// 直接使用 session 中的手机号信息，无需额外API调用
			setUserPhone({
				phoneNumber: user.phoneNumber || undefined,
				phoneNumberVerified: user.phoneNumberVerified || undefined,
			});
		}
	}, [user?.id, user?.phoneNumber, user?.phoneNumberVerified]);

	const isPhoneBound = userPhone.phoneNumber && userPhone.phoneNumberVerified;

	return (
		<SettingsItem
			title="手机号绑定"
			description="绑定手机号可以使用短信验证码登录"
		>
			{isPhoneBound ? (
				// 已绑定手机号的状态
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<CheckCircle2Icon className="size-5 text-success" />
						<div>
							<div className="text-sm font-medium">
								已绑定手机号
							</div>
							<div className="text-sm text-muted-foreground">
								{userPhone.phoneNumber}
							</div>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={unbindPhone}
						disabled={isSubmitting}
					>
						{isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						解绑
					</Button>
				</div>
			) : (
				// 绑定手机号表单
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						{!isOtpSent ? (
							// 第一步：输入手机号
							<FormField
								control={form.control}
								name="phoneNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>手机号</FormLabel>
										<FormControl>
											<PhoneInput
												{...field}
												defaultCountry="+86"
												placeholder="输入手机号"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : (
							// 第二步：输入验证码
							<>
								{/* 返回按钮 */}
								<div className="flex items-center justify-start mb-4">
									<Button
										variant="ghost"
										size="sm"
										type="button"
										onClick={() => {
											setIsOtpSent(false);
											setOtpCountdown(0);
											form.setValue("otp", "");
										}}
										className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
									>
										← 返回修改手机号
									</Button>
								</div>

								{/* 验证码提示信息 */}
								<div className="text-center mb-6">
									<div className="text-lg font-medium mb-2">
										请输入验证码
									</div>
									<div className="text-sm text-muted-foreground">
										验证码已发送至{" "}
										{form.watch("phoneNumber")}
									</div>
								</div>

								{/* 验证码输入框 */}
								<FormField
									control={form.control}
									name="otp"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="flex justify-center">
													<InputOTP
														value={
															field.value || ""
														}
														onChange={
															field.onChange
														}
														maxLength={6}
													>
														<InputOTPGroup className="gap-3">
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

								{/* 重新发送验证码 */}
								<div className="text-center">
									{otpCountdown > 0 ? (
										<div className="text-sm text-muted-foreground">
											{otpCountdown}秒后可重新发送
										</div>
									) : (
										<Button
											variant="link"
											size="sm"
											type="button"
											onClick={() => {
												sendOTP(
													form.watch("phoneNumber"),
												);
											}}
											disabled={isSubmitting}
											className="text-sm"
										>
											重新发送验证码
										</Button>
									)}
								</div>
							</>
						)}

						{/* 错误信息 */}
						{form.formState.errors.root?.message && (
							<div className="text-sm text-destructive">
								{form.formState.errors.root.message}
							</div>
						)}

						{/* 提交按钮 */}
						<Button
							type="submit"
							className="w-full"
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2Icon className="mr-2 size-4 animate-spin" />
							)}
							{!isOtpSent ? "发送验证码" : "验证并绑定"}
						</Button>
					</form>
				</Form>
			)}
		</SettingsItem>
	);
}
