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
import { PhoneInput } from "@community/ui/ui/phone-input";
import { useRouter } from "@/hooks/router";
import { sendPhoneOTP } from "@community/lib-client/auth/phone-api";
import {
	AppErrorHandler,
	ErrorType,
} from "@community/lib-client/error/handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon, ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	phoneNumber: z.string().min(1, "手机号不能为空"),
});

type FormValues = z.infer<typeof formSchema>;

export function PhoneLoginForm() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			phoneNumber: "",
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		form.clearErrors("root");

		const result = await sendPhoneOTP(values.phoneNumber, "LOGIN");

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
			return;
		}

		// 成功发送验证码，跳转到验证码页面
		const queryString = searchParams.toString();
		router.push(
			`/auth/login/phone/verify?phoneNumber=${encodeURIComponent(values.phoneNumber)}${queryString ? `&${queryString}` : ""}`,
		);
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
				{t("auth.login.phoneLogin")}
			</h1>
			<p className="mt-1 mb-6 text-sm text-muted-foreground">
				{t("auth.login.phoneLoginSubtitle")}
			</p>

			<Form {...form}>
				<form
					className="space-y-4"
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

					<Button
						className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-sm shadow-sm transition-colors"
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting && (
							<Loader2Icon className="mr-2 size-4 animate-spin" />
						)}
						{t("auth.login.sendVerificationCode")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
