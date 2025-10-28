"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EventInviteWithStats } from "@/lib/database";
import { useLocale, useTranslations } from "next-intl";
import {
	Copy as CopyIcon,
	Loader2,
	QrCode as QrCodeIcon,
	RefreshCw,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface EventInvitesTabProps {
	eventId: string;
}

type InviteRecord = EventInviteWithStats & {
	createdAt: Date;
	lastUsedAt?: Date | null;
	stats: EventInviteWithStats["stats"] & {
		lastRegistrationAt: Date | null;
	};
};

const NEW_USER_THRESHOLD_DISPLAY_CLASS = "text-emerald-600";

export function EventInvitesTab({ eventId }: EventInvitesTabProps) {
	const t = useTranslations("events.manage.invites");
	const locale = useLocale();
	const [invites, setInvites] = useState<InviteRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [channelLabel, setChannelLabel] = useState("");
	const [creating, setCreating] = useState(false);
	const [qrInvite, setQrInvite] = useState<InviteRecord | null>(null);
	const qrRef = useRef<HTMLDivElement>(null);

	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
		[locale],
	);

	const origin = typeof window !== "undefined" ? window.location.origin : "";

	const buildShareUrl = useCallback(
		(code: string) =>
			`${origin}/${locale}/events/${eventId}?invite=${code}`,
		[eventId, locale, origin],
	);

	const normalizeInvites = useCallback(
		(rawInvites: EventInviteWithStats[]): InviteRecord[] =>
			rawInvites.map((invite) => ({
				...invite,
				createdAt: new Date(invite.createdAt),
				lastUsedAt: invite.lastUsedAt
					? new Date(invite.lastUsedAt)
					: null,
				stats: {
					...invite.stats,
					lastRegistrationAt: invite.stats.lastRegistrationAt
						? new Date(invite.stats.lastRegistrationAt)
						: null,
				},
			})),
		[],
	);

	const fetchInvites = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`/api/events/${eventId}/invites`, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			setInvites(normalizeInvites(data?.data?.invites ?? []));
		} catch (err) {
			console.error("Failed to load invites:", err);
			setError(t("error"));
		} finally {
			setLoading(false);
		}
	}, [eventId, normalizeInvites, t]);

	useEffect(() => {
		void fetchInvites();
	}, [fetchInvites]);

	const handleCreateChannelInvite = async () => {
		if (!channelLabel.trim()) {
			toast.error(t("channelNameRequired"));
			return;
		}

		setCreating(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/invites/channel`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({ label: channelLabel.trim() }),
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			toast.success(t("createSuccess"));
			setChannelLabel("");
			await fetchInvites();
		} catch (err) {
			console.error("Failed to create channel invite:", err);
			toast.error(t("error"));
		} finally {
			setCreating(false);
		}
	};

	const handleCopyLink = async (invite: InviteRecord) => {
		try {
			await navigator.clipboard.writeText(buildShareUrl(invite.code));
			toast.success(t("copySuccess"));
		} catch (err) {
			console.error("Failed to copy invite link:", err);
			toast.error(t("copyFailed"));
		}
	};

	const handleDownloadQr = () => {
		if (!qrRef.current) return;
		const svg = qrRef.current.querySelector("svg");
		if (!svg) return;

		const serializer = new XMLSerializer();
		const svgData = serializer.serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		canvas.width = 300;
		canvas.height = 300;

		img.onload = () => {
			if (!ctx) return;
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			const link = document.createElement("a");
			link.download = `${qrInvite?.code ?? "invite"}-qr.png`;
			link.href = canvas.toDataURL();
			link.click();
			toast.success(t("downloadQr"));
		};

		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	};

	const channelInvites = invites.filter(
		(invite) => invite.type === "CHANNEL",
	);
	const personalInvites = invites.filter(
		(invite) => invite.type === "USER_SHARE",
	);

	const renderInviteRows = (records: InviteRecord[]) => {
		if (records.length === 0) {
			return (
				<TableRow>
					<TableCell
						colSpan={6}
						className="text-center text-sm text-muted-foreground py-8"
					>
						{t("noData")}
					</TableCell>
				</TableRow>
			);
		}

		return records.map((invite) => {
			const shareUrl = buildShareUrl(invite.code);
			const displayLabel =
				invite.type === "CHANNEL"
					? invite.label || invite.code
					: invite.issuedByUser?.name || invite.label || invite.code;
			const createdLabel = t("createdAt", {
				date: dateFormatter.format(invite.createdAt),
			});
			return (
				<TableRow key={invite.id} className="align-top">
					<TableCell>
						<Badge variant="secondary">
							{t(`type.${invite.type}`)}
						</Badge>
					</TableCell>
					<TableCell>
						<div className="font-medium">{displayLabel}</div>
						<div className="text-xs text-muted-foreground">
							{createdLabel}
						</div>
						<div className="text-xs text-muted-foreground break-all">
							{shareUrl}
						</div>
					</TableCell>
					<TableCell>{invite.stats.totalRegistrations}</TableCell>
					<TableCell>
						{invite.stats.newUserRegistrations > 0 ? (
							<span className={NEW_USER_THRESHOLD_DISPLAY_CLASS}>
								{t("newUserTag", {
									count: invite.stats.newUserRegistrations,
								})}
							</span>
						) : (
							<span className="text-muted-foreground">0</span>
						)}
					</TableCell>
					<TableCell>
						{invite.stats.lastRegistrationAt ? (
							dateFormatter.format(
								invite.stats.lastRegistrationAt,
							)
						) : (
							<span className="text-muted-foreground">
								{t("noRegistrations")}
							</span>
						)}
					</TableCell>
					<TableCell>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => void handleCopyLink(invite)}
								className="flex items-center gap-1"
							>
								<CopyIcon className="w-4 h-4" />
								{t("copyLink")}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setQrInvite(invite)}
								className="flex items-center gap-1"
							>
								<QrCodeIcon className="w-4 h-4" />
								{t("viewQr")}
							</Button>
						</div>
					</TableCell>
				</TableRow>
			);
		});
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-lg font-semibold">
							{t("title")}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{t("description")}
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => void fetchInvites()}
							className="flex items-center gap-1"
						>
							{loading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<RefreshCw className="w-4 h-4" />
							)}
							{t("refresh")}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<h3 className="text-sm font-semibold">
							{t("channelSectionTitle")}
						</h3>
						<p className="text-sm text-muted-foreground">
							{t("channelSectionDescription")}
						</p>
						<div className="flex flex-col sm:flex-row gap-2">
							<Input
								value={channelLabel}
								onChange={(event) =>
									setChannelLabel(event.target.value)
								}
								placeholder={t("channelNamePlaceholder")}
							/>
							<Button
								onClick={() => void handleCreateChannelInvite()}
								disabled={creating}
								className="flex items-center gap-1"
							>
								{creating && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								{t("createButton")}
							</Button>
						</div>
					</div>

					{error && (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{t("channelSectionTitle")}
								</CardTitle>
							</CardHeader>
							<CardContent className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("table.type")}
											</TableHead>
											<TableHead>
												{t("table.label")}
											</TableHead>
											<TableHead>
												{t("table.registrations")}
											</TableHead>
											<TableHead>
												{t("table.newUsers")}
											</TableHead>
											<TableHead>
												{t("table.lastRegistration")}
											</TableHead>
											<TableHead>
												{t("table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loading ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-6 text-center text-sm text-muted-foreground"
												>
													<Loader2 className="mx-auto mb-2 w-4 h-4 animate-spin" />
													{t("loading")}
												</TableCell>
											</TableRow>
										) : (
											renderInviteRows(channelInvites)
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{t("type.USER_SHARE")}
								</CardTitle>
							</CardHeader>
							<CardContent className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("table.type")}
											</TableHead>
											<TableHead>
												{t("table.label")}
											</TableHead>
											<TableHead>
												{t("table.registrations")}
											</TableHead>
											<TableHead>
												{t("table.newUsers")}
											</TableHead>
											<TableHead>
												{t("table.lastRegistration")}
											</TableHead>
											<TableHead>
												{t("table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loading ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-6 text-center text-sm text-muted-foreground"
												>
													<Loader2 className="mx-auto mb-2 w-4 h-4 animate-spin" />
													{t("loading")}
												</TableCell>
											</TableRow>
										) : (
											renderInviteRows(personalInvites)
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={!!qrInvite}
				onOpenChange={(open) => !open && setQrInvite(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("qrTitle")}</DialogTitle>
						<DialogDescription>
							{t("qrDescription")}
						</DialogDescription>
					</DialogHeader>
					{qrInvite && (
						<div className="flex flex-col items-center gap-4">
							<div
								ref={qrRef}
								className="bg-white p-4 rounded border"
							>
								<QRCode
									value={buildShareUrl(qrInvite.code)}
									size={220}
									className="max-w-full h-auto"
								/>
							</div>
							<div className="text-sm text-muted-foreground break-all text-center">
								{buildShareUrl(qrInvite.code)}
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="secondary"
							onClick={() =>
								qrInvite && void handleCopyLink(qrInvite)
							}
							className="flex items-center gap-1"
						>
							<CopyIcon className="w-4 h-4" />
							{t("copyLink")}
						</Button>
						<Button
							onClick={() => void handleDownloadQr()}
							className="flex items-center gap-1"
						>
							<QrCodeIcon className="w-4 h-4" />
							{t("downloadQr")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
