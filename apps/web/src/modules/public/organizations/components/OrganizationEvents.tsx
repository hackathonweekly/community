"use client";

import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Calendar, Users, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatEventDateShort } from "@/modules/shared/lib/format-event-date";

interface Event {
	id: string;
	shortId?: string;
	title: string;
	description: string;
	shortDescription?: string | null;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	_count: {
		registrations: number;
	};
}

interface OrganizationEventsProps {
	organizationId: string;
	organizationSlug: string;
}

const statusStyles: Record<string, { label: string; className: string }> = {
	PUBLISHED: {
		label: "Open",
		className:
			"text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30",
	},
	ONGOING: {
		label: "Live",
		className:
			"text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30",
	},
	REGISTRATION_CLOSED: {
		label: "Closed",
		className:
			"text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30",
	},
	COMPLETED: {
		label: "Ended",
		className:
			"text-gray-500 bg-gray-100 border-gray-200 dark:bg-[#1F1F1F] dark:text-muted-foreground dark:border-border",
	},
	CANCELLED: {
		label: "Cancelled",
		className:
			"text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
	},
};

function getEventTypeLabel(
	value: string,
	t: ReturnType<typeof useTranslations>,
) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
	};
	return typeLabels[value] || value;
}

export function OrganizationEvents({
	organizationId,
	organizationSlug,
}: OrganizationEventsProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [showExpired, setShowExpired] = useState(false);
	const t = useTranslations();
	const locale = useLocale();

	const limit = 6;

	useEffect(() => {
		fetchEvents();
	}, [currentPage, showExpired, organizationId]);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				organizationId,
				page: currentPage.toString(),
				limit: limit.toString(),
				status: "PUBLISHED",
			});

			if (showExpired) {
				params.append("showExpired", "true");
			}

			const response = await fetch(`/api/events?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				setEvents(data.data.events || []);
				setTotalPages(Math.ceil((data.data.total || 0) / limit));
			}
		} catch (error) {
			console.error("Error fetching organization events:", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleExpiredEvents = () => {
		setShowExpired(!showExpired);
		setCurrentPage(1);
	};

	const formatEventDate = (dateString: string) =>
		formatEventDateShort(dateString, locale);

	if (loading && currentPage === 1) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="animate-pulse bg-card rounded-lg border border-border p-3"
					>
						<div className="flex gap-3">
							<div className="w-20 h-14 bg-accent rounded-md shrink-0" />
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-accent rounded w-3/4" />
								<div className="h-3 bg-gray-50 dark:bg-secondary rounded w-1/2" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!loading && events.length === 0 && currentPage === 1 && !showExpired) {
		return (
			<div className="text-center py-8">
				<Calendar className="h-8 w-8 mx-auto mb-3 text-gray-300 dark:text-muted-foreground" />
				<p className="text-xs text-muted-foreground mb-3">
					暂无即将到来的活动
				</p>
				<button
					type="button"
					onClick={toggleExpiredEvents}
					className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors"
				>
					查看所有活动
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Filter toggle */}
			<div className="flex items-center gap-2 mb-3">
				<button
					type="button"
					onClick={toggleExpiredEvents}
					className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
						showExpired
							? "bg-black dark:bg-white text-white dark:text-black"
							: "bg-card text-muted-foreground border border-border hover:bg-muted"
					}`}
				>
					{showExpired ? "仅显示未来活动" : "显示所有活动"}
				</button>
			</div>

			{/* Event list */}
			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="animate-pulse bg-card rounded-lg border border-border p-3"
						>
							<div className="flex gap-3">
								<div className="w-20 h-14 bg-accent rounded-md shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-accent rounded w-3/4" />
									<div className="h-3 bg-gray-50 dark:bg-secondary rounded w-1/2" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : events.length === 0 ? (
				<div className="text-center py-8">
					<Calendar className="h-8 w-8 mx-auto mb-3 text-gray-300 dark:text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						没有找到活动
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{events.map((event) => {
						const status = statusStyles[event.status];
						const venue = event.isOnline
							? "线上活动"
							: event.address || "地点待定";

						return (
							<Link
								key={event.id}
								href={`/events/${event.shortId || event.id}`}
								className="block group"
							>
								<div className="bg-card rounded-lg border border-border p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
									<div className="flex items-start gap-3">
										{/* Date block */}
										<div className="w-14 h-14 bg-gray-50 dark:bg-secondary rounded-md flex flex-col items-center justify-center shrink-0 border border-gray-100 dark:border-border">
											<span className="text-[10px] font-mono text-gray-400 dark:text-muted-foreground uppercase">
												{format(
													new Date(event.startTime),
													"MMM",
												)}
											</span>
											<span className="font-brand text-lg font-bold leading-none text-foreground">
												{format(
													new Date(event.startTime),
													"d",
												)}
											</span>
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2 mb-1">
												<h4 className="font-brand text-sm font-bold leading-tight text-foreground group-hover:text-gray-600 dark:group-hover:text-[#A3A3A3] transition-colors line-clamp-1">
													{event.title}
												</h4>
												<div className="flex items-center gap-1.5 shrink-0">
													{event.featured && (
														<span className="px-2 py-0.5 bg-black/80 text-white rounded-md text-[10px] font-bold uppercase tracking-tight">
															Featured
														</span>
													)}
													{status && (
														<span
															className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${status.className}`}
														>
															{status.label}
														</span>
													)}
												</div>
											</div>

											{/* Meta */}
											<div className="text-[11px] font-mono text-muted-foreground mb-1.5">
												{formatEventDate(
													event.startTime,
												)}{" "}
												· {venue}
											</div>

											{/* Footer stats */}
											<div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-muted-foreground">
												<span className="flex items-center gap-1 font-bold">
													<Users className="h-3 w-3" />
													{event._count.registrations}
												</span>
												<span className="flex items-center gap-1">
													<Eye className="h-3 w-3" />
													{event.viewCount}
												</span>
												<span className="flex items-center gap-1">
													<UserAvatar
														name={
															event.organizer.name
														}
														avatarUrl={
															event.organizer
																.image
														}
														className="h-3.5 w-3.5"
													/>
													<span className="truncate max-w-[80px]">
														{event.organizer.name}
													</span>
												</span>
											</div>
										</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-center items-center gap-2 pt-3">
					<button
						type="button"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(currentPage - 1)}
						className="bg-card border border-border text-foreground px-3 py-1 rounded-full text-xs font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						上一页
					</button>
					<span className="text-[11px] font-mono text-muted-foreground">
						{currentPage} / {totalPages}
					</span>
					<button
						type="button"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(currentPage + 1)}
						className="bg-card border border-border text-foreground px-3 py-1 rounded-full text-xs font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						下一页
					</button>
				</div>
			)}
		</div>
	);
}
