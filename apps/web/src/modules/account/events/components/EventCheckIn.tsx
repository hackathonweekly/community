"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";

import { Badge } from "@community/ui/ui/badge";
import { Input } from "@community/ui/ui/input";
import {
	CheckCircleIcon,
	MagnifyingGlassIcon,
	QrCodeIcon,
	UserIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRScanner } from "./QRScanner";

interface CheckIn {
	id: string;
	checkedInAt: string;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	operator?: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface EventCheckInProps {
	eventId: string;
	eventStatus: string;
	startTime?: string;
	endTime?: string;
	registrationsCount?: number;
}

export function EventCheckIn({
	eventId,
	eventStatus,
	registrationsCount,
}: EventCheckInProps) {
	const t = useTranslations("events.checkIn");
	const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [checkingIn, setCheckingIn] = useState(false);
	const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
	const [registeredParticipants, setRegisteredParticipants] = useState<any[]>(
		[],
	);
	const [loadingParticipants, setLoadingParticipants] = useState(false);
	const [cancelingCheckIn, setCancelingCheckIn] = useState<string | null>(
		null,
	);

	const fetchCheckIns = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}/checkin`);
			if (response.ok) {
				const data = await response.json();
				setCheckIns(data.data);
			} else {
				toast.error(t("fetchCheckInsError"));
			}
		} catch (error) {
			console.error("Error fetching check-ins:", error);
			toast.error(t("fetchCheckInsError"));
		} finally {
			setLoading(false);
		}
	};

	const fetchRegisteredParticipants = async () => {
		setLoadingParticipants(true);
		try {
			const limit = Math.max(registrationsCount ?? 0, 50);
			const params = new URLSearchParams({
				status: "APPROVED",
				limit: limit.toString(),
			});
			const response = await fetch(
				`/api/events/${eventId}/registrations?${params.toString()}`,
			);
			if (response.ok) {
				const data = await response.json();
				setRegisteredParticipants(data.data?.registrations || []);
			} else {
				toast.error(t("fetchParticipantsError"));
				setRegisteredParticipants([]);
			}
		} catch (error) {
			console.error("Error fetching registered participants:", error);
			toast.error(t("fetchParticipantsError"));
			setRegisteredParticipants([]);
		} finally {
			setLoadingParticipants(false);
		}
	};

	const handleManualCheckIn = async (userId: string) => {
		setCheckingIn(true);
		try {
			const response = await fetch(`/api/events/${eventId}/checkin`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					eventId,
					userId,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				const checkInTime = new Date();
				const statusPrefix =
					eventStatus === "UPCOMING" ? `${t("preEvent")} ` : "";
				toast.success(
					t("checkInSuccess", {
						name: result.data?.user?.name || t("user"),
						statusPrefix,
						time: checkInTime.toLocaleTimeString(),
					}),
					{
						description: t("totalCheckIns", {
							count: checkIns.length + 1,
						}),
						duration: 5000,
					},
				);
				fetchCheckIns(); // Refresh the list
			} else {
				const error = await response.json();
				toast.error(error.error || t("checkInError"));
			}
		} catch (error) {
			console.error("Error checking in user:", error);
			toast.error(t("checkInError"));
		} finally {
			setCheckingIn(false);
		}
	};

	const handleQRScanSuccess = async (userId: string) => {
		await handleManualCheckIn(userId);
		setIsQRScannerOpen(false);
	};

	const handleCancelCheckIn = async (userId: string) => {
		setCancelingCheckIn(userId);
		try {
			const response = await fetch(`/api/events/${eventId}/checkin`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					eventId,
					userId,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success(t("cancelCheckInSuccess"));
				await fetchCheckIns();
			} else {
				toast.error(result.error || t("cancelCheckInError"));
			}
		} catch (error) {
			console.error("Error canceling check-in:", error);
			toast.error(t("cancelCheckInError"));
		} finally {
			setCancelingCheckIn(null);
		}
	};

	useEffect(() => {
		if (eventId) {
			fetchCheckIns();
			fetchRegisteredParticipants();
		}
	}, [eventId]);

	const filteredCheckIns = checkIns.filter(
		(checkIn) =>
			checkIn.user.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			checkIn.user.username
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()),
	);

	// For management interface, always allow check-ins regardless of event timing
	const isEventActive = true;

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-muted rounded-full" />
									<div className="space-y-2 flex-1">
										<div className="h-4 bg-muted rounded w-1/3" />
										<div className="h-3 bg-muted rounded w-1/4" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				{/* Check-in Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<CheckCircleIcon className="h-8 w-8 text-green-600" />
								<div>
									<p className="text-2xl font-bold">
										{checkIns.length}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("totalCheckInsLabel")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<UserIcon className="h-8 w-8 text-blue-600" />
								<div>
									<p className="text-2xl font-bold">
										{
											checkIns.filter(
												(c) =>
													new Date(c.checkedInAt) >
													new Date(
														Date.now() -
															60 * 60 * 1000,
													),
											).length
										}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("lastHour")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<QrCodeIcon className="h-8 w-8 text-purple-600" />
								<div>
									<p className="text-sm font-medium">
										{t("checkInStatus")}
									</p>
									<Badge
										variant={
											isEventActive
												? "default"
												: "secondary"
										}
										className="mt-1"
									>
										{t("active")}
									</Badge>
									<p className="text-xs text-muted-foreground mt-1">
										{t("adminCanCheckInAnytime")}
									</p>
									<p className="text-xs text-muted-foreground">
										{t("userCanCheckInTwoHoursBefore")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Check-in Management */}
				<Card>
					<CardHeader>
						<CardTitle>{t("checkInManagement")}</CardTitle>
						<CardDescription>
							{t("checkInManagementDesc")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-2">
								<div className="relative flex-1">
									<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder={t("searchParticipants")}
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										className="pl-10"
									/>
								</div>
								<Button
									variant="outline"
									onClick={() =>
										fetchRegisteredParticipants()
									}
									className="flex items-center space-x-2"
								>
									<span>{t("refreshParticipants")}</span>
								</Button>
							</div>

							{/* Checked-in Participants */}
							<div className="border-t pt-4">
								<h3 className="font-medium mb-3">
									{t("checkedInList", {
										count: filteredCheckIns.length,
									})}
								</h3>
								{filteredCheckIns.length === 0 ? (
									<div className="text-center py-4">
										<UserIcon className="mx-auto h-8 w-8 text-muted-foreground" />
										<p className="text-sm text-muted-foreground mt-2">
											{t("noCheckInsYet")}
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{filteredCheckIns.map((checkIn) => (
											<div
												key={checkIn.id}
												className="flex items-center justify-between p-3 border rounded-lg"
											>
												<div className="flex items-center space-x-3">
													<Avatar className="h-10 w-10">
														<AvatarImage
															src={
																checkIn.user
																	.image
															}
														/>
														<AvatarFallback>
															{checkIn.user.name?.charAt(
																0,
															) || "U"}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">
															{checkIn.user.name}
														</p>
														<p className="text-sm text-muted-foreground">
															{t("checkedInAt", {
																time: new Date(
																	checkIn.checkedInAt,
																).toLocaleString(),
															})}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<CheckCircleIcon className="h-5 w-5 text-green-500" />
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleCancelCheckIn(
																checkIn.user.id,
															)
														}
														disabled={
															cancelingCheckIn ===
															checkIn.user.id
														}
														className="text-red-600 hover:text-red-700"
													>
														<XMarkIcon className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Pending Check-ins */}
								{registeredParticipants.length > 0 && (
									<div className="border-t pt-4">
										<h3 className="font-medium mb-3">
											{t("pendingCheckIn", {
												count: registeredParticipants.filter(
													(p) =>
														!checkIns.some(
															(c) =>
																c.user.id ===
																p.user.id,
														),
												).length,
											})}
										</h3>
										<div className="space-y-2">
											{registeredParticipants
												.filter(
													(participant) =>
														!checkIns.some(
															(checkIn) =>
																checkIn.user
																	.id ===
																participant.user
																	.id,
														) &&
														(participant.user.name
															.toLowerCase()
															.includes(
																searchTerm.toLowerCase(),
															) ||
															participant.user.email
																.toLowerCase()
																.includes(
																	searchTerm.toLowerCase(),
																)),
												)
												.map((participant) => (
													<div
														key={participant.id}
														className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted"
													>
														<div className="flex items-center space-x-3">
															<Avatar className="h-10 w-10">
																<AvatarImage
																	src={
																		participant
																			.user
																			.image
																	}
																/>
																<AvatarFallback>
																	{participant.user.name?.charAt(
																		0,
																	) || "U"}
																</AvatarFallback>
															</Avatar>
															<div>
																<p className="font-medium">
																	{
																		participant
																			.user
																			.name
																	}
																</p>
																<p className="text-sm text-muted-foreground">
																	{
																		participant
																			.user
																			.email
																	}
																</p>
															</div>
														</div>
														<Button
															size="sm"
															onClick={() =>
																handleManualCheckIn(
																	participant
																		.user
																		.id,
																)
															}
															disabled={
																checkingIn
															}
														>
															{checkingIn
																? t("checking")
																: t("checkIn")}
														</Button>
													</div>
												))}
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* QR Scanner Modal */}
			<QRScanner
				isOpen={isQRScannerOpen}
				onClose={() => setIsQRScannerOpen(false)}
				onScanSuccess={handleQRScanSuccess}
				eventId={eventId}
			/>
		</>
	);
}
