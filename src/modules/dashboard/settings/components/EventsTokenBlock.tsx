"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import {
	eventsTokenQueryKey,
	generateEventsToken,
	revokeEventsTokenRequest,
	useEventsTokenQuery,
} from "@dashboard/settings/lib/events-token";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	CheckIcon,
	CopyIcon,
	InfoIcon,
	RefreshCcwIcon,
	ShieldAlertIcon,
	TrashIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatTimestamp(
	formatter: ReturnType<typeof useFormatter>,
	value?: string | null,
) {
	if (!value) {
		return null;
	}

	return formatter.dateTime(new Date(value), {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function EventsTokenBlock() {
	const t = useTranslations();
	const formatter = useFormatter();
	const queryClient = useQueryClient();
	const [revealedToken, setRevealedToken] = useState<string | null>(null);

	const { data, isPending } = useEventsTokenQuery();
	const summary = data?.summary;
	const eligibility = data?.eligibility ?? { allowed: true };

	const hasActiveToken = summary?.status === "active";
	const lastUsedLabel = useMemo(() => {
		if (!summary) {
			return null;
		}

		if (!summary.lastUsedAt) {
			return t("settings.account.security.eventsToken.status.neverUsed");
		}

		return t("settings.account.security.eventsToken.status.lastUsed", {
			date: formatTimestamp(formatter, summary.lastUsedAt),
		});
	}, [summary, formatter, t]);

	const createdLabel = useMemo(() => {
		if (!summary?.createdAt) {
			return null;
		}

		return t("settings.account.security.eventsToken.status.createdAt", {
			date: formatTimestamp(formatter, summary.createdAt),
		});
	}, [summary, formatter, t]);

	const generateMutation = useMutation({
		mutationKey: ["events-token-generate"],
		mutationFn: async () => generateEventsToken(),
		onMutate: () => {
			setRevealedToken(null);
		},
		onSuccess: async (result) => {
			setRevealedToken(result.token ?? null);
			toast.success(
				t(
					"settings.account.security.eventsToken.notifications.generate.success",
				),
			);
			await queryClient.invalidateQueries({
				queryKey: eventsTokenQueryKey,
			});
		},
		onError: (error: Error) => {
			toast.error(
				error.message ||
					t(
						"settings.account.security.eventsToken.notifications.generate.error",
					),
			);
		},
	});

	const revokeMutation = useMutation({
		mutationKey: ["events-token-revoke"],
		mutationFn: async () => revokeEventsTokenRequest(),
		onSuccess: async () => {
			setRevealedToken(null);
			toast.success(
				t(
					"settings.account.security.eventsToken.notifications.revoke.success",
				),
			);
			await queryClient.invalidateQueries({
				queryKey: eventsTokenQueryKey,
			});
		},
		onError: (error: Error) => {
			toast.error(
				error.message ||
					t(
						"settings.account.security.eventsToken.notifications.revoke.error",
					),
			);
		},
	});

	const copyToken = async () => {
		if (!revealedToken) {
			return;
		}

		await navigator.clipboard.writeText(revealedToken);
		toast.success(
			t("settings.account.security.eventsToken.actions.copied"),
		);
	};

	const renderStatus = () => {
		if (isPending) {
			return (
				<div className="space-y-3">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-10 w-32" />
				</div>
			);
		}

		if (hasActiveToken) {
			return (
				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="default">
							{t(
								"settings.account.security.eventsToken.status.active",
								{
									lastFour: summary?.tokenLastFour ?? "****",
								},
							)}
						</Badge>
						{lastUsedLabel && (
							<span className="text-sm text-muted-foreground">
								{lastUsedLabel}
							</span>
						)}
					</div>
					<Card className="border-muted bg-muted/40 p-4 text-sm">
						<ul className="space-y-1 text-muted-foreground">
							{createdLabel && <li>{createdLabel}</li>}
							{summary?.lastUsedIp && (
								<li>
									{t(
										"settings.account.security.eventsToken.status.lastUsedIp",
										{ ip: summary.lastUsedIp },
									)}
								</li>
							)}
						</ul>
					</Card>
				</div>
			);
		}

		return (
			<div className="flex items-start gap-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
				<InfoIcon className="mt-1 size-4 text-primary" />
				<div>
					<p className="text-sm font-semibold">
						{t("settings.account.security.eventsToken.empty.title")}
					</p>
					<p className="text-sm text-muted-foreground">
						{t(
							"settings.account.security.eventsToken.empty.description",
						)}
					</p>
				</div>
			</div>
		);
	};

	const renderTokenReveal = () => {
		if (!revealedToken) {
			return null;
		}

		return (
			<Alert className="bg-amber-50">
				<div className="flex items-start">
					<div className="flex-1 space-y-1">
						<AlertTitle className="flex items-center gap-2 text-amber-900">
							<ShieldAlertIcon className="size-4" />
							{t(
								"settings.account.security.eventsToken.tokenReveal.title",
							)}
						</AlertTitle>
						<AlertDescription className="space-y-3">
							<p className="text-sm text-amber-900">
								{t(
									"settings.account.security.eventsToken.tokenReveal.description",
								)}
							</p>
							<div className="flex items-center justify-between rounded-md border border-dashed border-amber-500 bg-white px-3 py-2 font-mono text-sm text-amber-900">
								<span className="truncate">
									{revealedToken}
								</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={copyToken}
								>
									<CopyIcon className="size-4" />
								</Button>
							</div>
						</AlertDescription>
					</div>
				</div>
			</Alert>
		);
	};

	const renderUsageDocs = () => (
		<Card className="space-y-3 border-muted bg-muted/30 p-4 text-sm">
			<div className="flex items-center gap-2 font-medium">
				<AlertCircleIcon className="size-4 text-primary" />
				<span>
					{t(
						"settings.account.security.eventsToken.actions.usageHeading",
					)}
				</span>
			</div>
			<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
				<li>
					{t(
						"settings.account.security.eventsToken.actions.usageSteps.post",
					)}
				</li>
				<li>
					{t(
						"settings.account.security.eventsToken.actions.usageSteps.header",
					)}
				</li>
				<li>
					{t(
						"settings.account.security.eventsToken.actions.usageSteps.personalOnly",
					)}
				</li>
				<li>
					{t(
						"settings.account.security.eventsToken.actions.usageSteps.limit",
					)}
				</li>
			</ul>
			<pre className="rounded-md bg-background p-3 font-mono text-xs">
				{`curl -X POST https://your-domain/api/events \\
  -H "Authorization: EventsToken <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "...", "type": "MEETUP", ... }'`}
			</pre>
		</Card>
	);

	return (
		<SettingsItem
			title={t("settings.account.security.eventsToken.title")}
			description={t("settings.account.security.eventsToken.description")}
		>
			<div className="space-y-4">
				{renderStatus()}

				{!eligibility.allowed && (
					<Card className="flex items-start gap-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
						<ShieldAlertIcon className="size-4 shrink-0" />
						<p>
							{eligibility.reason ??
								t(
									"settings.account.security.eventsToken.eligibility.blocked",
								)}
						</p>
					</Card>
				)}

				<div className="flex flex-wrap gap-2">
					<Button
						variant="default"
						onClick={() => generateMutation.mutate()}
						disabled={
							generateMutation.isPending || !eligibility.allowed
						}
					>
						{hasActiveToken ? (
							<>
								<RefreshCcwIcon className="mr-2 size-4" />
								{t(
									"settings.account.security.eventsToken.actions.regenerate",
								)}
							</>
						) : (
							<>
								<CheckIcon className="mr-2 size-4" />
								{t(
									"settings.account.security.eventsToken.actions.generate",
								)}
							</>
						)}
					</Button>
					<Button
						variant="outline"
						onClick={() => revokeMutation.mutate()}
						disabled={
							revokeMutation.isPending ||
							!hasActiveToken ||
							!eligibility.allowed
						}
					>
						<TrashIcon className="mr-2 size-4" />
						{t(
							"settings.account.security.eventsToken.actions.revoke",
						)}
					</Button>
				</div>

				{renderTokenReveal()}

				{renderUsageDocs()}
			</div>
		</SettingsItem>
	);
}
