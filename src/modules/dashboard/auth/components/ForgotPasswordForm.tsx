"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangleIcon, ArrowLeftIcon, MailboxIcon } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { useAuthErrorMessages } from "@dashboard/auth/hooks/errors-messages";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			const redirectTo = new URL(
				"/auth/reset-password",
				window.location.origin,
			).toString();

			const { error } = await authClient.forgetPassword({
				email,
				redirectTo,
			});

			if (error) {
				throw error;
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
	});

	return (
		<>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("auth.forgotPassword.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("auth.forgotPassword.message")}{" "}
			</p>

			{form.formState.isSubmitSuccessful ? (
				<Alert variant="default">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.forgotPassword.hints.linkSent.title")}
					</AlertTitle>
					<AlertDescription>
						{t("auth.forgotPassword.hints.linkSent.message")}
					</AlertDescription>
				</Alert>
			) : (
				<Form {...form}>
					<form
						className="flex flex-col items-stretch gap-4"
						onSubmit={onSubmit}
					>
						{form.formState.errors.root && (
							<Alert variant="destructive">
								<AlertTriangleIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("auth.forgotPassword.email")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											autoComplete="email"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={form.formState.isSubmitting}>
							{t("auth.forgotPassword.submit")}
						</Button>
					</form>
				</Form>
			)}

			<div className="mt-6 text-center text-sm">
				<Link href="/auth/login">
					<ArrowLeftIcon className="mr-1 inline size-4 align-middle" />
					{t("auth.forgotPassword.backToSignin")}
				</Link>
			</div>
		</>
	);
}
