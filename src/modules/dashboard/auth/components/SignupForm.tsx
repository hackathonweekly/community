"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { config } from "@/config";
import { authClient } from "@/lib/auth/client";
import { isPlaceholderInvitationEmail } from "@/lib/auth/invitations";
import { AppErrorHandler } from "@/lib/error/handler";
import { useAuthErrorMessages } from "@dashboard/auth/hooks/errors-messages";
import { OrganizationInvitationAlert } from "@dashboard/organizations/components/OrganizationInvitationAlert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormErrors } from "@/hooks/form-errors";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	MailboxIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
	name: z.string().min(1),
	acceptAgreements: z.boolean().refine((val) => val === true, {
		message:
			"You must accept the privacy policy and terms of service to continue",
	}),
});

type FormValues = z.infer<typeof formSchema>;

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();
	const { zodErrorMap } = useFormErrors();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();
	const normalizedPrefillEmail = prefillEmail?.trim() || undefined;
	const effectivePrefillEmail =
		normalizedPrefillEmail &&
		!isPlaceholderInvitationEmail(normalizedPrefillEmail)
			? normalizedPrefillEmail
			: undefined;

	const [showPassword, setShowPassword] = useState(false);
	const [emailAlreadyExistsError, setEmailAlreadyExistsError] =
		useState(false);
	const invitationId = searchParams.get("invitationId");
	const rawEmailParam = searchParams.get("email");
	const normalizedEmailParam = rawEmailParam?.trim() ?? undefined;
	const redirectTo = searchParams.get("redirectTo");
	const emailFromQuery =
		normalizedEmailParam &&
		!isPlaceholderInvitationEmail(normalizedEmailParam)
			? normalizedEmailParam
			: undefined;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		values: {
			name: "",
			email: effectivePrefillEmail ?? emailFromQuery ?? "",
			password: "",
			acceptAgreements: false,
		},
	});

	const invitationOnlyMode = !config.auth.enableSignup && invitationId;

	const redirectPath = invitationId
		? `/app/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	const onSubmit: SubmitHandler<FormValues> = async ({
		email,
		password,
		name,
		acceptAgreements,
	}) => {
		// 重置邮箱重复错误状态
		setEmailAlreadyExistsError(false);

		try {
			const { error, data } = await authClient.signUp.email({
				email,
				password,
				name,
				callbackURL: redirectPath,
			});

			if (error) {
				// Check if it's a rate limit error first
				const rateLimitError =
					AppErrorHandler.handleRateLimitError(error);
				if (rateLimitError) {
					AppErrorHandler.showErrorToast(rateLimitError);
					return;
				}

				throw error;
			}

			if (invitationOnlyMode && invitationId) {
				const response = await fetch(
					`/api/organizations/invitations/${invitationId}/accept`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
					},
				);

				const acceptResult = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(
						acceptResult.error || "接受组织邀请时出现问题",
					);
				}

				if (acceptResult.status === "needs_profile") {
					router.push(
						`/app/organization-invitation/${invitationId}/complete-profile`,
					);
					return;
				}

				if (acceptResult.organizationSlug) {
					router.push(`/app/${acceptResult.organizationSlug}`);
				} else {
					router.push(config.auth.redirectAfterSignIn);
				}
				return;
			}

			router.push(config.auth.redirectAfterSignIn);
		} catch (e) {
			if (e instanceof Error && e.message) {
				form.setError("root", { message: e.message });
				return;
			}

			const errorCode =
				e && typeof e === "object" && "code" in e
					? (e.code as string)
					: undefined;
			const errorMessage = getAuthErrorMessage(errorCode);

			form.setError("root", { message: errorMessage });

			// 如果是邮箱已存在的错误，显示额外的帮助信息
			if (errorCode === "USER_ALREADY_EXISTS") {
				setEmailAlreadyExistsError(true);
			} else {
				setEmailAlreadyExistsError(false);
			}
		}
	};

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("auth.signup.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("auth.signup.message")}
			</p>

			{form.formState.isSubmitSuccessful && !invitationOnlyMode ? (
				<Alert variant="default">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.signup.hints.verifyEmail")}
					</AlertTitle>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="flex flex-col items-stretch gap-4"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root && (
									<Alert variant="destructive">
										<AlertTriangleIcon />
										<AlertDescription>
											{form.formState.errors.root.message}
											{emailAlreadyExistsError && (
												<div className="mt-2">
													<Link
														href={withQuery(
															"/auth/login",
															Object.fromEntries(
																searchParams.entries(),
															),
														)}
														className="text-primary underline hover:no-underline"
													>
														{t(
															"auth.signup.goToSignIn",
														)}
													</Link>
												</div>
											)}
										</AlertDescription>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.name")}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
												readOnly={
													!!effectivePrefillEmail
												}
											/>
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
										<FormLabel>
											{t("auth.signup.password")}
										</FormLabel>
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
													autoComplete="new-password"
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
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="acceptAgreements"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel className="text-sm font-normal">
												{t(
													"auth.signup.acceptAgreements.label",
												)}{" "}
												<Link
													href={`/${locale}/legal/privacy-policy`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary underline hover:no-underline"
												>
													{t(
														"auth.signup.acceptAgreements.privacyPolicy",
													)}
												</Link>
												{t(
													"auth.signup.acceptAgreements.and",
												)}
												<Link
													href={`/${locale}/legal/terms`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary underline hover:no-underline"
												>
													{t(
														"auth.signup.acceptAgreements.terms",
													)}
												</Link>
											</FormLabel>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<Button disabled={form.formState.isSubmitting}>
								{t("auth.signup.submit")}
							</Button>
						</form>
					</Form>

					{config.auth.enableSignup &&
						config.auth.enableSocialLogin && (
							<>
								<div className="relative my-6 h-4">
									<hr className="relative top-2" />
									<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-card px-2 text-center font-medium text-foreground/60 text-sm leading-tight">
										{t("auth.login.continueWith")}
									</p>
								</div>

								{(() => {
									const socialProviders =
										Object.keys(oAuthProviders);
									const agreementsAccepted =
										form.watch("acceptAgreements");

									// Separate WeChat and other social login providers
									const wechatProvider = socialProviders.find(
										(p) => p === "wechat",
									);
									const otherProviders =
										socialProviders.filter(
											(p) => p !== "wechat",
										);

									// Other providers layout: single column for one item, two columns for multiple
									const gridCols =
										otherProviders.length <= 1
											? "grid-cols-1"
											: "grid-cols-1 sm:grid-cols-2";

									return (
										<div className="space-y-2">
											{/* Prompt user to agree to terms first */}
											{!agreementsAccepted && (
												<p className="text-sm text-muted-foreground text-center">
													{t(
														"auth.signup.hints.acceptAgreements",
													)}
												</p>
											)}

											{/* WeChat login takes a separate row */}
											{wechatProvider && (
												<SocialSigninButton
													provider="wechat"
													className="w-full h-10"
													acceptedAgreements={
														agreementsAccepted
													}
												/>
											)}

											{/* Other social login providers */}
											{otherProviders.length > 0 && (
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
															/>
														),
													)}
												</div>
											)}
										</div>
									);
								})()}
							</>
						)}
				</>
			)}

			<div className="mt-6 text-center text-sm">
				<span className="text-foreground/60">
					{t("auth.signup.alreadyHaveAccount")}{" "}
				</span>
				<Link
					href={withQuery(
						"/auth/login",
						Object.fromEntries(searchParams.entries()),
					)}
				>
					{t("auth.signup.signIn")}
					<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
				</Link>
			</div>
		</div>
	);
}
