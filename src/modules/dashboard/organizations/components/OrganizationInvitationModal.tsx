"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/client";
import { OrganizationLogo } from "@dashboard/organizations/components/OrganizationLogo";
import { organizationListQueryKey } from "@dashboard/organizations/lib/api";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ClockIcon, InfoIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ElementType } from "react";
import { toast } from "sonner";

type StatusDisplay = {
	label: string;
	icon: ElementType;
	variant: "default" | "secondary" | "destructive" | "outline";
};

const statusDisplayMap: Record<string, StatusDisplay> = {
	pending: {
		label: "待处理",
		icon: ClockIcon,
		variant: "outline",
	},
	accepted: {
		label: "已接受",
		icon: CheckIcon,
		variant: "secondary",
	},
	rejected: {
		label: "已拒绝",
		icon: XIcon,
		variant: "destructive",
	},
	cancelled: {
		label: "已撤回",
		icon: XIcon,
		variant: "secondary",
	},
	canceled: {
		label: "已撤回",
		icon: XIcon,
		variant: "secondary",
	},
};

interface OrganizationInvitationModalProps {
	invitationId: string;
	organizationName: string;
	organizationSlug: string;
	logoUrl?: string;
	status: string;
	expiresAt: string;
	canRespond?: boolean;
	infoMessage?: string;
	targetUserName?: string;
	targetUserEmail?: string;
}

export function OrganizationInvitationModal({
	invitationId,
	organizationName,
	organizationSlug,
	logoUrl,
	status,
	expiresAt,
	canRespond = true,
	infoMessage,
	targetUserName,
	targetUserEmail,
}: OrganizationInvitationModalProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [submitting, setSubmitting] = useState<false | "accept" | "reject">(
		false,
	);

	const expiryText = useMemo(() => {
		try {
			return new Intl.DateTimeFormat("zh-CN", {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(new Date(expiresAt));
		} catch (error) {
			return null;
		}
	}, [expiresAt]);

	const statusDisplay = useMemo<StatusDisplay | undefined>(() => {
		if (statusDisplayMap[status]) {
			return statusDisplayMap[status];
		}

		return {
			label: status,
			icon: InfoIcon,
			variant: "outline",
		};
	}, [status]);

	const handleResponse = async (accept: boolean) => {
		setSubmitting(accept ? "accept" : "reject");
		try {
			if (accept) {
				const response = await fetch(
					`/api/organizations/invitations/${invitationId}/accept`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				const data = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(data.error || "接受邀请失败");
				}

				if (data.status === "needs_profile") {
					const fields = Array.isArray(data.missingFields)
						? data.missingFields.join("、")
						: "资料信息";
					toast.info(`请先完善资料：${fields}`);
					router.replace(
						`/app/organization-invitation/${invitationId}/complete-profile`,
					);
					return;
				}

				await queryClient.invalidateQueries({
					queryKey: organizationListQueryKey,
				});

				router.replace(
					`/app/${data.organizationSlug ?? organizationSlug}`,
				);
				return;
			}

			const { error } = await authClient.organization.rejectInvitation({
				invitationId,
			});

			if (error) {
				throw error;
			}

			router.replace("/app");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "处理邀请时出错";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("organizations.invitationModal.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("organizations.invitationModal.description", {
					organizationName,
				})}
			</p>

			<div className="mb-6 flex items-center gap-3 rounded-lg border p-3">
				<OrganizationLogo
					name={organizationName}
					logoUrl={logoUrl}
					className="size-12"
				/>
				<div className="flex-1">
					<strong className="font-medium text-lg">
						{organizationName}
					</strong>
					<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						{statusDisplay ? (
							<Badge variant={statusDisplay.variant}>
								<statusDisplay.icon className="mr-1 h-3.5 w-3.5" />
								{statusDisplay.label}
							</Badge>
						) : null}
						{expiryText ? (
							<span>过期时间：{expiryText}</span>
						) : null}
					</div>
					{(targetUserName || targetUserEmail) && (
						<p className="mt-2 text-sm text-muted-foreground">
							此邀请针对：
							<span className="font-medium text-foreground">
								{targetUserName || targetUserEmail}
							</span>
							{targetUserName && targetUserEmail ? (
								<span className="ml-1 text-muted-foreground">
									({targetUserEmail})
								</span>
							) : null}
						</p>
					)}
				</div>
			</div>

			{infoMessage ? (
				<Alert
					className={
						canRespond
							? "mb-6"
							: "mb-6 border-amber-200 bg-amber-50 text-amber-900"
					}
				>
					<AlertDescription className="flex items-start gap-2 text-sm">
						<InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
						<span>{infoMessage}</span>
					</AlertDescription>
				</Alert>
			) : null}

			{canRespond ? (
				<div className="flex gap-2">
					<Button
						className="flex-1"
						variant="outline"
						onClick={() => handleResponse(false)}
						disabled={submitting === "reject"}
					>
						<XIcon className="mr-1.5 size-4" />
						{t("organizations.invitationModal.decline")}
					</Button>
					<Button
						className="flex-1"
						onClick={() => handleResponse(true)}
						disabled={submitting === "accept"}
					>
						<CheckIcon className="mr-1.5 size-4" />
						{t("organizations.invitationModal.accept")}
					</Button>
				</div>
			) : (
				<div className="flex justify-end">
					<Button
						variant="secondary"
						onClick={() => router.replace("/app")}
					>
						返回社区
					</Button>
				</div>
			)}
		</div>
	);
}
