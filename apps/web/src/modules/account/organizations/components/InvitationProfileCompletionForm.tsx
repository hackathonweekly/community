"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@community/ui/ui/alert";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";
import { UserRoleInput } from "@account/profile/components/UserRoleInput";
import { SimpleLifeStatusSelector } from "@account/profile/components/SimpleLifeStatusSelector";
import { cn } from "@community/lib-shared/utils";
import { ArrowLeftIcon, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { PROFILE_LIMITS } from "@community/lib-shared/utils/profile-limits";

const profileSchema = z.object({
	email: z.string().trim().min(1, "请输入邮箱").email("请输入有效的邮箱地址"),
	phoneNumber: z
		.string()
		.trim()
		.min(6, "请输入有效的手机号")
		.max(30, "手机号长度过长"),
	userRoleString: z
		.string()
		.trim()
		.min(1, "请填写您的主要角色")
		.max(PROFILE_LIMITS.userRoleStringMax, "个人角色不能超过7个字"),
	bio: z
		.string()
		.trim()
		.min(10, "个人简介至少需要10个字")
		.max(500, "个人简介不能超过500字"),
	currentWorkOn: z
		.string()
		.trim()
		.min(1, "请填写当前在做的事情")
		.max(PROFILE_LIMITS.currentWorkOnMax, "个人状态不能超过10个字"),
	lifeStatus: z
		.string()
		.trim()
		.min(1, "请选择或输入您的人生状态")
		.max(40, "人生状态过长"),
	wechatId: z
		.string()
		.trim()
		.max(50, "微信号不能超过50字")
		.optional()
		.nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface InvitationProfileCompletionFormProps {
	invitationId: string;
	organizationName: string;
	organizationSlug: string;
	organizationLogo?: string;
	defaultValues: {
		email: string;
		phoneNumber: string;
		userRoleString: string;
		bio: string;
		currentWorkOn: string;
		lifeStatus: string;
		wechatId: string;
	};
	initialMissingFields: string[];
	invitationPath: string;
	shareUrl: string;
	expiresAt: string;
}

export function InvitationProfileCompletionForm({
	invitationId,
	organizationName,
	organizationSlug,
	organizationLogo,
	defaultValues,
	initialMissingFields,
	invitationPath,
	shareUrl,
	expiresAt,
}: InvitationProfileCompletionFormProps) {
	const router = useRouter();
	const [missingFields, setMissingFields] = useState(initialMissingFields);
	const [serverError, setServerError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAccepting, setIsAccepting] = useState(false);
	const [autoAttempted, setAutoAttempted] = useState(false);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues,
	});

	const formattedExpiry = useMemo(() => {
		try {
			return new Intl.DateTimeFormat("zh-CN", {
				dateStyle: "long",
				timeStyle: "short",
			}).format(new Date(expiresAt));
		} catch (error) {
			return null;
		}
	}, [expiresAt]);

	const triggerAccept = useCallback(
		async (options: { showSuccessToast?: boolean } = {}) => {
			const { showSuccessToast = true } = options;
			setServerError(null);
			setIsAccepting(true);
			try {
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

				const data = await response.json().catch(() => ({}));

				if (!response.ok) {
					const message = data.error || "加入组织失败，请稍后再试";
					if (Array.isArray(data.missingFields)) {
						setMissingFields(data.missingFields);
					}
					setServerError(message);
					toast.error(message);
					return false;
				}

				if (data.status === "needs_profile") {
					const nextMissing = Array.isArray(data.missingFields)
						? data.missingFields
						: missingFields;
					setMissingFields(nextMissing);
					const hint =
						nextMissing.length > 0
							? `请先完善：${nextMissing.join("、")}`
							: "请完善个人资料后再尝试加入组织";
					toast.info(hint);
					return false;
				}

				if (showSuccessToast) {
					toast.success("已成功加入组织");
				}

				router.replace(
					`/orgs/${data.organizationSlug ?? organizationSlug}`,
				);
				return true;
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "加入组织失败，请稍后再试";
				setServerError(message);
				toast.error(message);
				return false;
			} finally {
				setIsAccepting(false);
			}
		},
		[invitationId, organizationSlug, router, missingFields],
	);

	useEffect(() => {
		if (!autoAttempted && initialMissingFields.length === 0) {
			setAutoAttempted(true);
			void triggerAccept();
		}
	}, [autoAttempted, initialMissingFields.length, triggerAccept]);

	const onSubmit = useCallback(
		async (values: ProfileFormValues) => {
			setServerError(null);
			setIsSubmitting(true);
			try {
				const payload = {
					email: values.email.trim(),
					phoneNumber: values.phoneNumber.trim(),
					userRoleString: values.userRoleString.trim(),
					bio: values.bio.trim(),
					currentWorkOn: values.currentWorkOn.trim(),
					lifeStatus: values.lifeStatus.trim(),
					wechatId:
						values.wechatId && values.wechatId.trim().length > 0
							? values.wechatId.trim()
							: null,
				};

				const response = await fetch("/api/profile/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify(payload),
				});

				const data = await response.json().catch(() => ({}));

				if (!response.ok || data?.success === false) {
					const message = data?.error || "资料保存失败，请稍后再试";
					toast.error(message);
					setServerError(message);
					return;
				}

				toast.success("资料已保存");
				const accepted = await triggerAccept();
				if (!accepted) {
					// Keep latest missing fields so user can补充
					setMissingFields((prev) => prev);
				}
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "资料保存失败，请稍后再试";
				toast.error(message);
				setServerError(message);
			} finally {
				setIsSubmitting(false);
			}
		},
		[triggerAccept],
	);

	return (
		<div className="space-y-6">
			<div>
				<Link
					href={invitationPath}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeftIcon className="h-4 w-4" /> 返回邀请详情
				</Link>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<OrganizationLogo
								name={organizationName}
								logoUrl={organizationLogo}
								className="size-12"
							/>
							<div className="flex-1">
								<CardTitle className="text-xl">
									完善资料以加入 {organizationName}
								</CardTitle>
							</div>
						</div>
						{formattedExpiry && (
							<div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground w-fit">
								<ClockIcon className="h-4 w-4" />
								邀请有效期至 {formattedExpiry}
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{missingFields.length > 0 && (
						<Alert className="border-amber-200 bg-amber-50 text-amber-900">
							<AlertTitle className="flex items-center gap-2 text-sm font-medium">
								<UserCheck className="h-4 w-4" />
								完善以下信息即可完成加入
							</AlertTitle>
							<AlertDescription className="mt-2 flex flex-wrap gap-2 text-sm">
								{missingFields.map((field) => (
									<Badge
										key={field}
										variant="outline"
										className="border-amber-200 bg-white/70 text-amber-900"
									>
										{field}
									</Badge>
								))}
							</AlertDescription>
						</Alert>
					)}

					{serverError && (
						<Alert variant="destructive">
							<AlertTitle>提交失败</AlertTitle>
							<AlertDescription>{serverError}</AlertDescription>
						</Alert>
					)}

					<Form {...form}>
						<form
							className="space-y-6"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												邮箱{" "}
												<span className="text-destructive">
													*
												</span>
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

								<FormField
									control={form.control}
									name="phoneNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												手机号{" "}
												<span className="text-destructive">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													inputMode="tel"
													autoComplete="tel"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-6">
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div>
										<UserRoleInput
											control={form.control}
											name="userRoleString"
											required
										/>
									</div>
									<FormField
										control={form.control}
										name="lifeStatus"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													人生状态{" "}
													<span className="text-destructive">
														*
													</span>
												</FormLabel>
												<FormControl>
													<div className="rounded-md border border-input p-3">
														<SimpleLifeStatusSelector
															lifeStatus={
																field.value
															}
															onStatusChange={(
																status,
															) =>
																field.onChange(
																	status,
																)
															}
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="bio"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												个人简介{" "}
												<span className="text-destructive">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Textarea
													{...field}
													className="min-h-[140px]"
													placeholder="介绍一下您的背景、经验与兴趣..."
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="currentWorkOn"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												当前在做{" "}
												<span className="text-destructive">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Textarea
													{...field}
													className="min-h-[90px]"
													placeholder="例如：在做AI产品"
													maxLength={
														PROFILE_LIMITS.currentWorkOnMax
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="wechatId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												微信号（选填）
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													value={field.value ?? ""}
													placeholder="用于管理员快速联系你"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="flex items-center gap-2 text-sm text-muted-foreground">
									<ShieldCheck className="h-4 w-4" />
									手机号和微信默认不会公开展示，其他信息会在个人资料中展示。您可以随时在
									<Link
										href="/settings/privacy"
										className="text-primary hover:underline mx-1"
									>
										隐私设置
									</Link>
									中调整这些选项。
								</p>
								<Button
									type="submit"
									className={cn("min-w-40", {
										"opacity-80":
											isSubmitting || isAccepting,
									})}
									disabled={isSubmitting || isAccepting}
								>
									{isSubmitting || isAccepting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											处理中...
										</>
									) : (
										"保存并加入组织"
									)}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

function ClockIcon(props: ComponentProps<"svg">) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			stroke="currentColor"
			{...props}
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	);
}
