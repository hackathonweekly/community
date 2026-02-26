"use client";

import { Button } from "@community/ui/ui/button";
import { Checkbox } from "@community/ui/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@community/ui/ui/form";
import { config } from "@community/config";
import { useRouter } from "@/hooks/router";
import { OrganizationInvitationAlert } from "@account/organizations/components/OrganizationInvitationAlert";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
	acceptAgreements: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginMethodSelector() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
	const [agreementDialogMeta, setAgreementDialogMeta] = useState<{
		providerName?: string;
	} | null>(null);

	type AgreementAction = () => Promise<unknown>;
	const pendingAgreementActionRef = useRef<AgreementAction | null>(null);

	const invitationId = searchParams.get("invitationId");

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			acceptAgreements: false,
		},
	});

	const agreementsAccepted = form.watch("acceptAgreements");

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

	const handlePhoneLogin = async () => {
		const queryString = searchParams.toString();
		router.push(`/auth/login/phone${queryString ? `?${queryString}` : ""}`);
	};

	const handleEmailLogin = async () => {
		const queryString = searchParams.toString();
		router.push(`/auth/login/email${queryString ? `?${queryString}` : ""}`);
	};

	const agreementDialogTitle = t("auth.agreementDialog.defaultTitle");
	const agreementDialogDescription = t("auth.agreementDialog.description");

	return (
		<div>
			<h1 className="font-brand font-bold text-2xl tracking-tight text-foreground">
				{t("auth.login.title")}
			</h1>
			<p className="mt-1 mb-6 text-sm text-muted-foreground">
				{t("auth.login.subtitle")}
			</p>

			{invitationId && <OrganizationInvitationAlert className="mb-6" />}

			<Form {...form}>
				<div className="space-y-3">
					{/* 微信登录 */}
					{config.auth.enableSocialLogin && oAuthProviders.wechat && (
						<SocialSigninButton
							provider="wechat"
							className="w-full h-12 bg-card border border-border text-foreground hover:bg-muted hover:border-[#07c160] transition-colors text-sm font-bold shadow-sm"
							acceptedAgreements={agreementsAccepted}
							onAgreementRequired={handleSocialAgreementRequired}
						/>
					)}

					{/* 手机号登录 */}
					{config.auth.enablePhoneLogin && (
						<Button
							type="button"
							variant="outline"
							className="w-full h-12 bg-card border border-border text-foreground hover:bg-muted transition-colors text-sm font-bold shadow-sm"
							onClick={() => {
								void ensureAgreementsBefore(handlePhoneLogin);
							}}
						>
							<PhoneIcon className="mr-2 size-5" />
							{t("auth.login.phoneLogin")}
						</Button>
					)}

					{/* 邮箱登录 */}
					{config.auth.enablePasswordLogin && (
						<Button
							type="button"
							variant="outline"
							className="w-full h-12 bg-card border border-border text-foreground hover:bg-muted transition-colors text-sm font-bold shadow-sm"
							onClick={() => {
								void ensureAgreementsBefore(handleEmailLogin);
							}}
						>
							<MailIcon className="mr-2 size-5" />
							{t("auth.login.emailLogin")}
						</Button>
					)}

					{/* 协议勾选 */}
					<FormField
						control={form.control}
						name="acceptAgreements"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
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
											href="/legal/privacy-policy"
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
											href="/legal/terms"
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline hover:no-underline"
										>
											{t(
												"auth.login.acceptAgreements.terms",
											)}
										</Link>
									</FormLabel>
								</div>
							</FormItem>
						)}
					/>
				</div>
			</Form>

			{/* 注册链接 */}
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

			{/* 协议确认对话框 */}
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
								href="/legal/privacy-policy"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline hover:no-underline"
							>
								{t("auth.login.acceptAgreements.privacyPolicy")}
							</Link>
							{t("auth.login.acceptAgreements.and")}{" "}
							<Link
								href="/legal/terms"
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
