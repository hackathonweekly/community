"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CheckCircleIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { LocaleLink } from "@i18n/routing";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Event {
	id: string;
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	address?: string;
	isOnline: boolean;
}

interface CheckInStatus {
	canCheckIn: boolean;
	isAlreadyCheckedIn: boolean;
	message: string;
	event?: Event;
}

export default function EventCheckInPage() {
	const params = useParams();
	const pathname = usePathname();
	const eventId = params.eventId as string;
	const t = useTranslations("events.checkIn");
	const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [isCheckingIn, setIsCheckingIn] = useState(false);

	useEffect(() => {
		fetchCheckInStatus();
	}, [eventId]);

	const fetchCheckInStatus = async () => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/checkin/status`,
			);
			if (response.ok) {
				const data = await response.json();
				setCheckInStatus(data.data);
			} else if (response.status === 401) {
				// User is not logged in
				toast.error(t("pleaseLoginFirst"));
				setCheckInStatus({
					canCheckIn: false,
					isAlreadyCheckedIn: false,
					message: t("loginRequiredMessage"),
				});
			} else {
				toast.error(t("errorLoadCheckInStatus"));
			}
		} catch (error) {
			console.error("Error fetching check-in status:", error);
			toast.error(t("errorLoadCheckInStatus"));
		} finally {
			setLoading(false);
		}
	};

	const handleCheckIn = async () => {
		if (!checkInStatus?.canCheckIn) {
			return;
		}

		setIsCheckingIn(true);
		try {
			const response = await fetch(`/api/events/${eventId}/checkin`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					eventId: eventId,
				}),
			});

			if (response.ok) {
				toast.success(t("successfullyCheckedIn"));
				// Refresh status
				fetchCheckInStatus();
			} else {
				const error = await response.json();
				toast.error(error.error || t("checkInError"));
			}
		} catch (error) {
			console.error("Error checking in:", error);
			toast.error(t("checkInError"));
		} finally {
			setIsCheckingIn(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-muted-foreground">
						{t("loadingCheckIn")}
					</p>
				</div>
			</div>
		);
	}

	if (!checkInStatus) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-red-600">
							{t("error")}
						</CardTitle>
						<CardDescription>
							{t("unableToLoadCheckIn")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<LocaleLink href="/events">
								{t("backToEvents")}
							</LocaleLink>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pt-20 pb-16">
			<div className="container mx-auto px-4">
				<div className="max-w-2xl mx-auto">
					{checkInStatus.event && (
						<div className="text-center mb-8 relative">
							<div className="absolute inset-0 bg-black/20 rounded-lg" />
							<div className="relative py-6 px-4">
								<h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
									{checkInStatus.event.title}
								</h1>
								<p className="text-white/90 drop-shadow-md">
									{t("eventCheckIn")}
								</p>
							</div>
						</div>
					)}

					<Card className="w-full">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4">
								{checkInStatus.isAlreadyCheckedIn ? (
									<CheckCircleIcon className="w-16 h-16 text-green-500" />
								) : checkInStatus.canCheckIn ? (
									<CheckCircleIcon className="w-16 h-16 text-blue-500" />
								) : (
									<ExclamationTriangleIcon className="w-16 h-16 text-yellow-500" />
								)}
							</div>
							<CardTitle className="text-2xl">
								{checkInStatus.isAlreadyCheckedIn
									? t("alreadyCheckedIn")
									: checkInStatus.canCheckIn
										? t("readyToCheckIn")
										: t("cannotCheckIn")}
							</CardTitle>
							<CardDescription className="text-base mt-2">
								{checkInStatus.message}
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{checkInStatus.event && (
								<div className="bg-muted rounded-lg p-4 space-y-2">
									<h3 className="font-medium text-foreground">
										{t("eventDetails")}
									</h3>
									<div className="text-sm text-muted-foreground space-y-1">
										<p>
											<strong>{t("date")}:</strong>{" "}
											{new Date(
												checkInStatus.event.startTime,
											).toLocaleDateString()}
										</p>
										<p>
											<strong>{t("time")}:</strong>{" "}
											{new Date(
												checkInStatus.event.startTime,
											).toLocaleTimeString()}{" "}
											-{" "}
											{new Date(
												checkInStatus.event.endTime,
											).toLocaleTimeString()}
										</p>
										<p>
											<strong>{t("location")}:</strong>{" "}
											{checkInStatus.event.isOnline
												? t("onlineEvent")
												: checkInStatus.event.address}
										</p>
									</div>
								</div>
							)}

							<div className="flex flex-col gap-3">
								{checkInStatus.canCheckIn &&
									!checkInStatus.isAlreadyCheckedIn && (
										<Button
											onClick={handleCheckIn}
											disabled={isCheckingIn}
											size="lg"
											className="w-full"
										>
											{isCheckingIn
												? t("checkingIn")
												: t("checkInNow")}
										</Button>
									)}

								{!checkInStatus.canCheckIn &&
									!checkInStatus.isAlreadyCheckedIn &&
									checkInStatus.message ===
										t("loginRequiredMessage") && (
										<Button
											size="lg"
											className="w-full"
											asChild
										>
											<Link
												href={`/auth/login?redirectTo=${encodeURIComponent(pathname)}`}
											>
												{t("goToLogin")}
											</Link>
										</Button>
									)}

								<Button
									variant="outline"
									size="lg"
									className="w-full"
									asChild
								>
									<LocaleLink href={`/events/${eventId}`}>
										{t("viewEventDetails")}
									</LocaleLink>
								</Button>

								<Button
									variant="ghost"
									size="lg"
									className="w-full"
									asChild
								>
									<LocaleLink href="/events">
										{t("backToEvents")}
									</LocaleLink>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
