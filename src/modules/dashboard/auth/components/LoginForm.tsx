"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { config } from "@/config";
import { authClient } from "@/lib/auth/client";
import { sendPhoneOTP, verifyPhoneOTP } from "@/lib/auth/phone-api";
import { isWechatBrowser } from "@/lib/auth/providers/wechat";
import { AppErrorHandler, ErrorType } from "@/lib/error/handler";
import { useAuthErrorMessages } from "@dashboard/auth/hooks/errors-messages";
import { sessionQueryKey } from "@dashboard/auth/lib/api";
import { OrganizationInvitationAlert } from "@dashboard/organizations/components/OrganizationInvitationAlert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	KeyIcon,
	Loader2Icon,
	MailboxIcon,
	UserIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { useSession } from "../hooks/use-session";
import { SocialSigninButton } from "./SocialSigninButton";

const passwordFormSchema = z.object({
	mode: z.literal("password"),
	identifier: z.string().min(1),
	password: z.string().min(1),
	acceptAgreements: z.boolean().optional(),
});

const phoneFormSchema = z.object({
	mode: z.literal("phone"),
	phoneNumber: z.string().min(1, "手机号不能为空"),
	otp: z.string().optional(),
	acceptAgreements: z.boolean().optional(),
});

const formSchema = z.union([passwordFormSchema, phoneFormSchema]);

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
	const t = useTranslations();
	const locale = useLocale();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	// 手机号模式相关状态
	const [identifierType, setIdentifierType] = useState<"email" | "username">(
		"email",
	);
	const [isOtpSent, setIsOtpSent] = useState(false);
	const [otpCountdown, setOtpCountdown] = useState(0);
	const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
	const [agreementDialogMeta, setAgreementDialogMeta] = useState<{
		providerName?: string;
	} | null>(null);
	// 邮箱验证相关状态
	const [isResendingVerification, setIsResendingVerification] =
		useState(false);
	const [verificationEmailSent, setVerificationEmailSent] = useState(false);
	const [emailNotVerifiedError, setEmailNotVerifiedError] = useState<{
		email: string;
	} | null>(null);
	type AgreementAction = () => Promise<unknown>;
	const pendingAgreementActionRef = useRef<AgreementAction | null>(null);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");
	const sendCardBack = searchParams.get("sendCardBack");
	const targetUser = searchParams.get("targetUser");

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			identifier: email ?? "",
			password: "",
			mode: "password" as const,
			acceptAgreements: false,
		} as any,
	});
	const agreementsAccepted = form.watch("acceptAgreements");

	const redirectPath = invitationId
		? `/app/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			// 检查是否有回发名片的特殊逻辑
			if (sendCardBack === "true" && targetUser) {
				// 检查用户信息是否完善
				const isProfileComplete =
					user.name && user.bio && user.userRoleString;

				if (!isProfileComplete) {
					// 用户信息不完善，跳转到个人资料页面，并传递回发名片的参数
					router.replace(
						`/app/profile?redirectAfterProfile=${targetUser}`,
					);
					return;
				}

				// 用户信息完善，直接跳转到用户自己的名片页面
				if (user.username) {
					router.replace(`/zh/u/${user.username}`);
					return;
				}
			}

			router.replace(redirectPath);
		}
	}, [user, sessionLoaded, sendCardBack, targetUser]);

	// 智能识别输入类型（仅邮箱和用户名）
	const identifyInputType = (input: string): "email" | "username" => {
		if (input.includes("@")) {
			return "email";
		}
		return "username";
	};

	// 监听输入变化并更新识别类型
	useEffect(() => {
		const mode = form.watch("mode");
		if (mode === "password") {
			const identifier = form.watch("identifier");
			const newType = identifyInputType(identifier);
			if (newType !== identifierType) {
				setIdentifierType(newType);
			}
		}
	}, [form.watch("identifier"), form.watch("mode")]);

	// 当输入内容变化时清除验证邮件发送状态
	useEffect(() => {
		const identifier = form.watch("identifier");
		if (identifier) {
			setVerificationEmailSent(false);
		}
	}, [form.watch("identifier")]);

	// 当表单重置时清除相关状态
	useEffect(() => {
		const subscription = form.watch(() => {
			if (!form.formState.isDirty) {
				setVerificationEmailSent(false);
			}
		});
		return () => subscription.unsubscribe();
	}, [form]);

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
		const result = await sendPhoneOTP(fullPhoneNumber, "LOGIN");

		if (result.error) {
			let friendlyMessage = t("auth.login.errors.sendCodeFailed");

			// Check if it's a rate limit error
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

				// Show enhanced toast for rate limit
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
				friendlyMessage = t("auth.login.errors.invalidPhoneNumber");
			} else if (
				result.error.message?.includes(
					"Missing required environment variable",
				)
			) {
				friendlyMessage = t(
					"auth.login.errors.smsServiceNotConfigured",
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
		console.log("🔧 [SUCCESS] isOtpSent 已设置为 true");
		return true;
	};

	// 重发邮箱验证邮件
	const handleResendVerificationEmail = async (email: string) => {
		if (!email || !email.includes("@")) {
			form.setError("root", {
				message: "请输入有效的邮箱地址",
			});
			return;
		}

		setIsResendingVerification(true);
		setVerificationEmailSent(false);

		try {
			const { error } = await authClient.sendVerificationEmail({
				email,
			});

			if (error) {
				// Check if it's a rate limit error
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
				// 成功发送验证邮件
				setVerificationEmailSent(true);
				// 清除之前的错误信息
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

	const submitWithoutAgreementCheck = async (values: FormValues) => {
		// 清除邮箱未验证错误和验证邮件发送状态
		setEmailNotVerifiedError(null);
		setVerificationEmailSent(false);
		form.clearErrors("root");

		try {
			if (values.mode === "phone") {
				// 手机号验证码登录
				if (!isOtpSent) {
					// 发送验证码
					const success = await sendPhoneOtp(values.phoneNumber);
					if (!success) {
						return;
					}
				} else {
					// 验证手机验证码并登录
					if (!values.otp || values.otp.length !== 6) {
						form.setError("otp", {
							message: t("auth.login.errors.enterSixDigitCode"),
						});
						return;
					}

					const { data, error } = await verifyPhoneOTP(
						values.phoneNumber,
						values.otp,
						"LOGIN",
					);

					if (error) {
						let friendlyMessage = t(
							"auth.login.errors.codeExpiredOrIncorrect",
						);

						if (
							error.message?.includes("INVALID_OTP") ||
							error.message?.includes("OTP_EXPIRED") ||
							error.message?.includes("验证码错误或已过期")
						) {
							friendlyMessage = t(
								"auth.login.errors.codeExpiredOrIncorrect",
							);
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
							const updatedSession =
								await authClient.getSession();
							const sessionUser = updatedSession.data?.user;

							if (sessionUser) {
								const isProfileComplete =
									sessionUser.name &&
									sessionUser.bio &&
									sessionUser.userRoleString;

								if (!isProfileComplete) {
									router.replace(
										`/app/profile?redirectAfterProfile=${targetUser}`,
									);
								} else {
									if (sessionUser.username) {
										router.replace(
											`/zh/u/${sessionUser.username}`,
										);
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
				}
				return;
			}

			// 邮箱/用户名 + 密码登录模式
			if (values.mode === "password") {
				// Better Auth 原生支持邮箱或用户名登录
				const isEmail = identifierType === "email";
				let data: any;
				let error: any;

				if (isEmail) {
					const result = await authClient.signIn.email({
						email: values.identifier,
						password: values.password,
					});
					data = result.data;
					error = result.error;
				} else {
					const result = await authClient.signIn.username({
						username: values.identifier,
						password: values.password,
					});
					data = result.data;
					error = result.error;
				}

				if (error) {
					// Check if it's a rate limit error first
					const rateLimitError =
						AppErrorHandler.handleRateLimitError(error);
					if (rateLimitError) {
						AppErrorHandler.showErrorToast(rateLimitError);
						return;
					}

					// 提供更友好和具体的错误提示
					let friendlyMessage: string;

					// 根据错误类型和登录方式提供更具体的错误信息
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
						friendlyMessage = t(
							"auth.login.errors.accountNotExist",
						);
					} else if (
						error.code === "EMAIL_NOT_VERIFIED" ||
						error.message?.toLowerCase().includes("email") ||
						error.message?.toLowerCase().includes("验证") ||
						error.message?.toLowerCase().includes("verify")
					) {
						// 邮箱未验证，设置状态变量以显示重发验证邮件选项
						// 清除之前的错误信息，避免重复显示
						form.clearErrors("root");
						setEmailNotVerifiedError({ email: values.identifier });
						return; // 不设置表单错误，避免重复显示
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
						// For unknown errors, provide a more useful default message
						friendlyMessage = t(
							"auth.login.errors.loginFailedGeneral",
						);
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

				// 处理回发名片的特殊逻辑
				if (sendCardBack === "true" && targetUser) {
					// 检查用户信息是否完善（需要在session更新后重新获取用户信息）
					const checkProfileAndRedirect = async () => {
						const updatedSession = await authClient.getSession();
						const sessionUser = updatedSession.data?.user;

						if (sessionUser) {
							const isProfileComplete =
								sessionUser.name &&
								sessionUser.bio &&
								sessionUser.userRoleString;

							if (!isProfileComplete) {
								// 用户信息不完善，跳转到个人资料页面
								router.replace(
									`/app/profile?redirectAfterProfile=${targetUser}`,
								);
							} else {
								// 用户信息完善，跳转到用户自己的名片页面
								if (sessionUser.username) {
									router.replace(
										`/zh/u/${sessionUser.username}`,
									);
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

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		const executed = await ensureAgreementsBefore(() =>
			submitWithoutAgreementCheck(values),
		);
		if (!executed) {
			return;
		}
	};

	const signInWithPasskey = async () => {
		try {
			const result = await authClient.signIn.passkey();
			const { data, error } = result || { data: null, error: null };

			if (error) {
				// Check if it's a rate limit error first
				const rateLimitError =
					AppErrorHandler.handleRateLimitError(error);
				if (rateLimitError) {
					AppErrorHandler.showErrorToast(rateLimitError);
					return;
				}

				// 提供更友好和具体的错误提示
				let friendlyMessage: string;

				if (error.message?.toLowerCase().includes("not supported")) {
					friendlyMessage =
						"您的浏览器不支持密钥登录，请使用其他方式登录";
				} else if (
					error.message?.toLowerCase().includes("cancelled") ||
					error.message?.toLowerCase().includes("aborted")
				) {
					friendlyMessage = "密钥登录已取消";
				} else if (error.message?.toLowerCase().includes("not found")) {
					friendlyMessage =
						"未找到可用的密钥，请先在安全设置中添加密钥";
				} else if (
					error.message?.toLowerCase().includes("verification failed")
				) {
					friendlyMessage = "密钥验证失败，请重试";
				} else if (
					error.message?.toLowerCase().includes("network") ||
					error.message?.toLowerCase().includes("fetch") ||
					error.message?.toLowerCase().includes("connection") ||
					(error as any)?.name === "NetworkError"
				) {
					friendlyMessage = "网络连接异常，请检查网络后重试";
				} else if (
					error.message?.toLowerCase().includes("server") ||
					error.message?.toLowerCase().includes("internal") ||
					error.status >= 500
				) {
					friendlyMessage = "服务器暂时无法响应，请稍后重试";
				} else {
					// 对于未知错误，提供更有用的默认提示
					friendlyMessage = "密钥登录失败，请重试或使用其他方式登录";
				}

				form.setError("root", {
					message: friendlyMessage,
				});
				return;
			}

			// 更新会话缓存
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
								`/app/profile?redirectAfterProfile=${targetUser}`,
							);
						} else {
							if (sessionUser.username) {
								router.replace(`/zh/u/${sessionUser.username}`);
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
				// 成功登录后跳转
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

	const getAgreementProviderName = (provider: OAuthProvider) => {
		if (provider === "wechat") {
			return t("auth.login.wechatLogin");
		}
		return provider;
	};

	const handleSocialAgreementRequired = ({
		provider,
		trigger,
	}: {
		provider: OAuthProvider;
		trigger: AgreementAction;
	}) => {
		void ensureAgreementsBefore(trigger, {
			providerName: getAgreementProviderName(provider),
		});
	};

	const requestAgreement = (
		action: AgreementAction,
		meta?: { providerName?: string },
	) => {
		pendingAgreementActionRef.current = action;
		setAgreementDialogMeta(meta ?? null);
		setAgreementDialogOpen(true);
	};

	const ensureAgreementsBefore = async (
		action: AgreementAction,
		meta?: { providerName?: string },
	) => {
		if (form.getValues("acceptAgreements")) {
			await action();
			return true;
		}

		requestAgreement(action, meta);
		return false;
	};

	const handleAgreementConfirm = async () => {
		form.setValue("acceptAgreements", true);
		setAgreementDialogOpen(false);
		const action = pendingAgreementActionRef.current;
		pendingAgreementActionRef.current = null;
		setAgreementDialogMeta(null);
		if (action) {
			await action();
		}
	};

	const handleAgreementCancel = () => {
		setAgreementDialogOpen(false);
		pendingAgreementActionRef.current = null;
		setAgreementDialogMeta(null);
	};

	const signinMode = form.watch("mode");
	const isWechat = isWechatBrowser();
	const agreementDialogTitle = agreementDialogMeta?.providerName
		? t("auth.agreementDialog.title", {
				provider: agreementDialogMeta.providerName,
			})
		: t("auth.agreementDialog.defaultTitle");
	const agreementDialogDescription = t("auth.agreementDialog.description");

	// 手机号模式切换
	const switchToPhoneMode = () => {
		form.reset({
			mode: "phone" as const,
			phoneNumber: "",
			otp: "",
			acceptAgreements: form.getValues("acceptAgreements"),
		} as any);
		setIsOtpSent(false);
		setVerificationEmailSent(false);
		setEmailNotVerifiedError(null);
		form.clearErrors("root");
	};

	const switchToPasswordMode = () => {
		form.reset({
			mode: "password" as const,
			identifier: email ?? "",
			password: "",
			acceptAgreements: form.getValues("acceptAgreements"),
		} as any);
		setIsOtpSent(false);
		setVerificationEmailSent(false);
		setEmailNotVerifiedError(null);
		form.clearErrors("root");
	};

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("auth.login.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("auth.login.subtitle")}
			</p>

			{invitationId && <OrganizationInvitationAlert className="mb-6" />}

			<Form {...form}>
				<form
					className="space-y-4"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="mb-4 flex gap-2">
						<Button
							type="button"
							variant={
								signinMode === "password"
									? "secondary"
									: "outline"
							}
							size="sm"
							onClick={switchToPasswordMode}
							className="flex-1"
						>
							{t("auth.login.emailUsernameLogin")}
						</Button>
						<Button
							type="button"
							variant={
								signinMode === "phone" ? "secondary" : "outline"
							}
							size="sm"
							onClick={switchToPhoneMode}
							className="flex-1"
						>
							{t("auth.login.phoneLogin")}
						</Button>
					</div>

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

					{/* 验证邮件发送成功提示 */}
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

					{/* 邮箱未验证错误提示 - 只显示一次 */}
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

					{signinMode === "password" && (
						<>
							<FormField
								control={form.control}
								name="identifier"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{identifierType === "email" &&
												t("auth.login.email")}
											{identifierType === "username" &&
												t("auth.login.username")}
										</FormLabel>
										<FormControl>
											<div className="relative">
												{identifierType === "email" && (
													<MailboxIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												)}
												{identifierType ===
													"username" && (
													<UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												)}
												<Input
													{...field}
													className="pl-10"
													placeholder={t(
														"auth.login.emailUsernameInputPlaceholder",
													)}
													autoComplete={
														identifierType ===
														"email"
															? "email"
															: "username"
													}
												/>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* 密码输入框 */}
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
														setShowPassword(
															!showPassword,
														)
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
									</FormItem>
								)}
							/>
						</>
					)}

					{signinMode === "phone" && !isOtpSent && (
						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("auth.login.phoneNumber")}
									</FormLabel>
									<FormControl>
										<PhoneInput
											{...field}
											defaultCountry="+86"
											placeholder={t(
												"auth.login.phoneInputPlaceholder",
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{signinMode === "phone" && isOtpSent && (
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
									{t("auth.login.backToModifyPhone")}
								</Button>
							</div>

							{/* Verification code prompt */}
							<div className="text-center mb-8">
								<div className="text-xl font-semibold mb-3 text-foreground">
									{t("auth.login.enterVerificationCode")}
								</div>
								<div className="text-sm text-muted-foreground">
									{t("auth.login.verificationCodeSentTo")}{" "}
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
										{t("auth.login.resendCodeIn")}
									</div>
								) : (
									<Button
										variant="link"
										size="sm"
										onClick={() => {
											void ensureAgreementsBefore(() =>
												sendPhoneOtp(
													form.watch("phoneNumber"),
												),
											);
										}}
										disabled={form.formState.isSubmitting}
										className="text-sm"
									>
										{t("auth.login.resendVerificationCode")}
									</Button>
								)}
							</div>
						</>
					)}

					<FormField
						control={form.control}
						name="acceptAgreements"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0">
								<FormControl>
									<Checkbox
										checked={!!field.value}
										onCheckedChange={(checked) =>
											field.onChange(checked === true)
										}
									/>
								</FormControl>
								<div className="space-y-1 leading-none text-left">
									<FormLabel className="text-sm font-normal text-foreground">
										{t("auth.login.acceptAgreements.label")}{" "}
										<Link
											href={`/${locale}/legal/privacy-policy`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline hover:no-underline"
										>
											{t(
												"auth.login.acceptAgreements.privacyPolicy",
											)}
										</Link>
										{t("auth.login.acceptAgreements.and")}{" "}
										<Link
											href={`/${locale}/legal/terms`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline hover:no-underline"
										>
											{t(
												"auth.login.acceptAgreements.terms",
											)}
										</Link>
									</FormLabel>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>

					<Button
						className="w-full"
						type="submit"
						variant="secondary"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						{signinMode === "phone" && !isOtpSent
							? t("auth.login.sendVerificationCode")
							: signinMode === "phone" && isOtpSent
								? t("auth.login.verifyAndLogin")
								: t("auth.login.submit")}
					</Button>
				</form>
			</Form>

			{(config.auth.enablePasskeys ||
				(config.auth.enableSignup &&
					config.auth.enableSocialLogin)) && (
				<>
					<div className="relative my-6 h-4">
						<hr className="relative top-2" />
						<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-card px-2 text-center font-medium text-foreground/60 text-sm leading-tight">
							{t("auth.login.continueWith")}
						</p>
					</div>

					{/* WeChat login gets priority in WeChat environment */}
					{isWechat && (
						<div className="mb-4">
							<SocialSigninButton
								provider="wechat"
								className="w-full h-10"
								acceptedAgreements={agreementsAccepted}
								onAgreementRequired={
									handleSocialAgreementRequired
								}
							/>
							<details className="mt-4 text-sm text-foreground/60">
								<summary className="cursor-pointer select-none">
									{t("auth.login.otherLoginMethods")}
								</summary>
								<div className="mt-2 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2">
									{config.auth.enableSignup &&
										config.auth.enableSocialLogin &&
										Object.keys(oAuthProviders)
											.filter((key) => key !== "wechat")
											.map((providerId) => (
												<SocialSigninButton
													key={providerId}
													provider={
														providerId as OAuthProvider
													}
													className="w-full h-10"
													acceptedAgreements={
														agreementsAccepted
													}
													onAgreementRequired={
														handleSocialAgreementRequired
													}
												/>
											))}
									{config.auth.enablePasskeys && (
										<Button
											variant="outline"
											className="w-full h-10 sm:col-span-2"
											onClick={() =>
												void ensureAgreementsBefore(
													() => signInWithPasskey(),
													{
														providerName: t(
															"auth.login.loginWithPasskey",
														),
													},
												)
											}
										>
											<KeyIcon className="mr-1.5 size-4 text-primary" />
											{t("auth.login.loginWithPasskey")}
										</Button>
									)}
								</div>
							</details>
						</div>
					)}

					{/* 非微信环境的正常布局 */}
					{!isWechat &&
						(() => {
							const socialProviders =
								config.auth.enableSignup &&
								config.auth.enableSocialLogin
									? Object.keys(oAuthProviders)
									: [];
							const totalItems =
								socialProviders.length +
								(config.auth.enablePasskeys ? 1 : 0);

							// Separate WeChat and other social login providers
							const wechatProvider = socialProviders.find(
								(p) => p === "wechat",
							);
							const otherProviders = socialProviders.filter(
								(p) => p !== "wechat",
							);

							// Other providers layout: single column for one item, two columns for multiple
							const otherProvidersCount =
								otherProviders.length +
								(config.auth.enablePasskeys ? 1 : 0);
							const gridCols =
								otherProvidersCount <= 1
									? "grid-cols-1"
									: "grid-cols-1 sm:grid-cols-2";

							return (
								<div className="space-y-2">
									{/* WeChat login takes a separate row */}
									{wechatProvider && (
										<SocialSigninButton
											provider="wechat"
											className="w-full h-10"
											acceptedAgreements={
												agreementsAccepted
											}
											onAgreementRequired={
												handleSocialAgreementRequired
											}
										/>
									)}

									{/* Other social login providers */}
									{(otherProviders.length > 0 ||
										config.auth.enablePasskeys) && (
										<div
											className={`grid items-stretch gap-2 ${gridCols}`}
										>
											{otherProviders.map(
												(providerId) => (
													<SocialSigninButton
														key={providerId}
														provider={
															providerId as OAuthProvider
														}
														className="w-full h-10"
														acceptedAgreements={
															agreementsAccepted
														}
														onAgreementRequired={
															handleSocialAgreementRequired
														}
													/>
												),
											)}

											{config.auth.enablePasskeys && (
												<Button
													variant="outline"
													className={`w-full h-10 ${otherProvidersCount > 1 ? "sm:col-span-2" : ""}`}
													onClick={() =>
														void ensureAgreementsBefore(
															() =>
																signInWithPasskey(),
															{
																providerName: t(
																	"auth.login.loginWithPasskey",
																),
															},
														)
													}
												>
													<KeyIcon className="mr-1.5 size-4 text-primary" />
													{t(
														"auth.login.loginWithPasskey",
													)}
												</Button>
											)}
										</div>
									)}
								</div>
							);
						})()}
				</>
			)}

			{config.auth.enableSignup && (
				<div className="mt-6 text-center text-sm">
					<span className="text-foreground/60">
						{t("auth.login.dontHaveAnAccount")}{" "}
					</span>
					<Link
						href={withQuery(
							"/auth/signup",
							Object.fromEntries(searchParams.entries()),
						)}
					>
						{t("auth.login.createAnAccount")}
						<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
					</Link>
				</div>
			)}

			<Dialog
				open={agreementDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						handleAgreementCancel();
					} else {
						setAgreementDialogOpen(true);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{agreementDialogTitle}</DialogTitle>
						<DialogDescription>
							{agreementDialogDescription}{" "}
							<Link
								href={`/${locale}/legal/privacy-policy`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline hover:no-underline"
							>
								{t("auth.login.acceptAgreements.privacyPolicy")}
							</Link>
							{t("auth.login.acceptAgreements.and")}{" "}
							<Link
								href={`/${locale}/legal/terms`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline hover:no-underline"
							>
								{t("auth.login.acceptAgreements.terms")}
							</Link>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleAgreementCancel}
						>
							{t("auth.agreementDialog.cancel")}
						</Button>
						<Button onClick={handleAgreementConfirm}>
							{t("auth.agreementDialog.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
