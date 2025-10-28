"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantAvatars } from "@/components/ui/participant-avatars";
import { ParticipantInterests } from "@/modules/public/events/components/participant-interests";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { OrganizationLogo } from "@/modules/dashboard/organizations/components/OrganizationLogo";
import { EventHostSubscriptionButton } from "@/components/shared/EventHostSubscriptionButton";
import {
	CalendarIcon,
	ClockIcon,
	GlobeAltIcon,
	MapPinIcon,
	UsersIcon,
	UserIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface EventInfoCardProps {
	event: {
		id: string;
		title: string;
		type: string;
		startTime: string;
		endTime: string;
		timezone: string;
		isOnline: boolean;
		address?: string;
		onlineUrl?: string;
		maxAttendees?: number;
		tags: string[];
		requireProjectSubmission?: boolean;
		organizer: {
			id: string;
			name: string;
			email: string;
			image?: string;
			username?: string;
			bio?: string;
			userRoleString?: string;
			city?: string;
		};
		organization?: {
			id: string;
			name: string;
			slug?: string;
			logo?: string;
		};
		_count: {
			registrations: number;
		};
		registrations?: Array<{
			id: string;
			status: string;
			registeredAt: string;
			allowDigitalCardDisplay?: boolean;
			user: {
				id: string;
				name: string;
				image?: string;
				username?: string;
				userRoleString?: string;
				currentWorkOn?: string;
				bio?: string;
				email?: string;
				skills?: string[];
				region?: string | null;
				// 联系方式
				showEmail?: boolean;
				showWechat?: boolean;
				githubUrl?: string | null;
				twitterUrl?: string | null;
				websiteUrl?: string | null;
				wechatId?: string | null;
				// 等级字段
				membershipLevel?: string | null;
				creatorLevel?: string | null;
				mentorLevel?: string | null;
				contributorLevel?: string | null;
			};
		}>;
	};
	currentUserId?: string; // 新增：当前用户ID
	projectSubmissions?: Array<{
		id: string;
		title: string;
		description: string;
		project: {
			id: string;
			title: string;
			description?: string;
			screenshots: string[];
			stage: string;
			projectTags: string[];
			url?: string;
			user: {
				id: string;
				name: string;
				image?: string;
				username?: string;
				userRoleString?: string;
			};
			_count: {
				likes: number;
				bookmarks: number;
				members: number;
			};
		};
		user: {
			id: string;
			name: string;
			image?: string;
			username?: string;
			userRoleString?: string;
		};
	}>;
}

export function EventInfoCard({
	event,
	currentUserId,
	projectSubmissions,
}: EventInfoCardProps) {
	const t = useTranslations();
	const locale = useLocale();
	const [showMembersSearch, setShowMembersSearch] = useState(false);

	const formatEventDate = (dateString: string) => {
		const date = new Date(dateString);
		const dateLocale = locale === "zh" ? zhCN : enUS;

		if (locale === "zh") {
			return format(date, "M月d日EEEE", { locale: dateLocale });
		}
		return format(date, "MMMM d, EEEE", { locale: dateLocale });
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const dateLocale = locale === "zh" ? zhCN : enUS;

		if (locale === "zh") {
			return format(date, "H:mm", { locale: dateLocale });
		}
		return format(date, "h:mm a", { locale: dateLocale });
	};

	const getTimezone = () => {
		// Return empty string to hide timezone display
		return "";
	};

	const isSameDay = (start: string, end: string) => {
		const startDate = new Date(start);
		const endDate = new Date(end);
		return startDate.toDateString() === endDate.toDateString();
	};

	const formatVenue = () => {
		if (event.isOnline) {
			return t("events.onlineEvent");
		}
		return event.address || t("events.addressTBD");
	};

	return (
		<Card className="gap-0">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<CalendarIcon className="w-4 h-4" />
					{t("events.eventInfoTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0 space-y-3">
				{/* Date and Time - Compact */}
				<div className="flex items-center gap-3">
					<ClockIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium truncate">
							{formatEventDate(event.startTime)}
						</div>
						<div className="text-xs text-muted-foreground">
							{formatTime(event.startTime)}
							{isSameDay(event.startTime, event.endTime) ? (
								<span> - {formatTime(event.endTime)}</span>
							) : (
								<span>
									{" "}
									→ {formatEventDate(event.endTime)}{" "}
									{formatTime(event.endTime)}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Location - Compact */}
				<div className="flex items-center gap-3">
					{event.isOnline ? (
						<GlobeAltIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					) : (
						<MapPinIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					)}
					<div className="text-sm font-medium truncate">
						{formatVenue()}
					</div>
				</div>

				{/* Attendees - Compact */}
				<div className="flex items-center gap-3">
					<UsersIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					<div className="text-sm font-medium">
						{event._count.registrations}
						{event.maxAttendees && (
							<span className="text-muted-foreground">
								/{event.maxAttendees}
							</span>
						)}
						<span className="text-xs text-muted-foreground ml-1">
							{t("events.attendeesLabel")}
						</span>
					</div>
				</div>

				{/* Participants - Show avatar stack with full functionality */}
				{event.registrations && event.registrations.length > 0 && (
					<ParticipantAvatars
						participants={event.registrations.map((reg) => ({
							...reg.user,
							status: reg.status,
							registeredAt: reg.registeredAt,
							allowDigitalCardDisplay:
								reg.allowDigitalCardDisplay,
							user: reg.user,
						}))}
						totalCount={event._count.registrations}
						eventId={event.id}
						currentUserId={currentUserId}
						showInterestButtons={!!currentUserId}
						projectSubmissions={
							event.requireProjectSubmission
								? projectSubmissions
								: undefined
						}
					/>
				)}

				{/* Tags - Compact */}
				{event.tags && event.tags.length > 0 && (
					<div className="pt-2 border-t">
						<div className="flex flex-wrap gap-1">
							{event.tags.slice(0, 4).map((tag, index) => (
								<Badge
									key={index}
									variant="secondary"
									className="text-xs px-2 py-0.5"
								>
									{tag}
								</Badge>
							))}
							{event.tags.length > 4 && (
								<Badge
									variant="outline"
									className="text-xs px-2 py-0.5"
								>
									+{event.tags.length - 4}
								</Badge>
							)}
						</div>
					</div>
				)}

				{/* Participant Interests - Show interests section for logged-in users */}
				{currentUserId && (
					<ParticipantInterests
						eventId={event.id}
						currentUserId={currentUserId}
						showIfEmpty={false}
					/>
				)}

				{/* Organizer Info - Mobile Only */}
				<div className="lg:hidden pt-2 border-t">
					<div className="space-y-3">
						{/* Organizer/Organization Info */}
						<div className="flex items-start gap-3">
							<UserIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								{event.organization ? (
									<div className="space-y-2">
										{/* Organization */}
										<div className="flex items-center gap-2">
											<OrganizationLogo
												name={event.organization.name}
												logoUrl={
													event.organization.logo
												}
												className="h-5 w-5"
											/>
											<span className="text-sm font-medium truncate">
												{event.organization.name}
											</span>
										</div>
										{/* Organizer */}
										<div className="flex items-center gap-2 ml-1">
											<UserAvatar
												name={event.organizer.name}
												avatarUrl={
													event.organizer.image
												}
												className="h-4 w-4"
											/>
											<span className="text-xs text-muted-foreground truncate">
												{t("events.organizer")}:{" "}
												{event.organizer.name}
											</span>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<UserAvatar
											name={event.organizer.name}
											avatarUrl={event.organizer.image}
											className="h-5 w-5"
										/>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate">
												{event.organizer.name}
											</div>
											{event.organizer.userRoleString && (
												<div className="text-xs text-muted-foreground truncate">
													{
														event.organizer
															.userRoleString
													}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Subscribe Button - Mobile */}
						<div className="flex justify-center">
							<EventHostSubscriptionButton
								{...(event.organization
									? { organizationId: event.organization.id }
									: { hostUserId: event.organizer.id })}
								hostName={
									event.organization?.name ||
									event.organizer.name
								}
								size="sm"
								variant="outline"
							/>
						</div>
					</div>
				</div>

				{/* Event Project Submissions - This is now handled by ParticipantAvatars view buttons */}
				{/* Keeping this section commented out as reference - functionality moved to ParticipantAvatars
				{event.requireProjectSubmission && (
					<EventProjectsList
						eventId={event.id}
						projectSubmissions={projectSubmissions || []}
					/>
				)}
				*/}
			</CardContent>
		</Card>
	);
}
