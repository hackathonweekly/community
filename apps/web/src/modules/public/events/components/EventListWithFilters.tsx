"use client";

import { Button } from "@community/ui/ui/button";
import { useEventsListQuery } from "@community/lib-client/api/api-hooks";
import { CalendarIcon } from "@heroicons/react/24/outline";
import type { EventListItem } from "@community/lib-shared/api/api-fetchers";
import { useTranslations } from "next-intl";
import {
	useRouter,
	useSearchParams,
	type ReadonlyURLSearchParams,
} from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { EventCard } from "./EventCard";
import { EventCardCompact } from "./EventCardCompact";
import { CardSkeleton } from "@/modules/public/shared/components/CardSkeleton";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";

type Event = EventListItem;

interface EventFilters {
	selectedStatus: string;
	selectedHostType: "organization" | "individual" | "all";
}

const DEFAULT_FILTERS: EventFilters = {
	selectedStatus: "active",
	selectedHostType: "organization",
};

function getFiltersFromSearchParams(
	searchParams: ReadonlyURLSearchParams | null,
): EventFilters {
	const hostTypeParam = searchParams?.get("hostType");
	const selectedHostType =
		hostTypeParam === "individual"
			? "individual"
			: hostTypeParam === "all"
				? "all"
				: "organization";

	return {
		selectedStatus: searchParams?.get("status") || "active",
		selectedHostType,
	};
}

function buildSearchParams(filters: EventFilters) {
	const params = new URLSearchParams();

	if (filters.selectedStatus && filters.selectedStatus !== "active") {
		params.append("status", filters.selectedStatus);
	}
	if (
		filters.selectedHostType === "individual" ||
		filters.selectedHostType === "all"
	) {
		params.append("hostType", filters.selectedHostType);
	}

	return params;
}

function areFiltersEqual(a: EventFilters, b: EventFilters) {
	return (
		a.selectedStatus === b.selectedStatus &&
		a.selectedHostType === b.selectedHostType
	);
}

function LoadingSkeleton() {
	return (
		<CardSkeleton
			count={6}
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
		/>
	);
}

function EventListContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const t = useTranslations();

	const [filters, setFilters] = useState<EventFilters>(() =>
		getFiltersFromSearchParams(searchParams),
	);
	const [urlFilters, setUrlFilters] = useState<EventFilters>(filters);

	const filtersRef = useRef(filters);
	const searchParamsString = searchParams?.toString() ?? "";

	useEffect(() => {
		filtersRef.current = filters;
	}, [filters]);

	useEffect(() => {
		const nextFilters = getFiltersFromSearchParams(searchParams);
		if (!areFiltersEqual(nextFilters, filtersRef.current)) {
			filtersRef.current = nextFilters;
			setFilters(nextFilters);
			setUrlFilters(nextFilters);
		}
	}, [searchParamsString]);

	useEffect(() => {
		const params = buildSearchParams(urlFilters);
		const nextSearch = params.toString();
		const currentSearch = searchParamsString;

		if (nextSearch === currentSearch) return;

		const newURL = nextSearch ? `?${nextSearch}` : "";
		router.push(`/events${newURL}`);
	}, [router, searchParamsString, urlFilters]);

	const updateFilter = (key: keyof EventFilters, value: string) => {
		const nextFilters = { ...filtersRef.current, [key]: value };
		filtersRef.current = nextFilters;
		setFilters(nextFilters);
		setUrlFilters(nextFilters);
	};

	const handleStatusChange = (value: string) => {
		updateFilter("selectedStatus", value);
	};

	const eventsQueryParams = {
		status:
			filters.selectedStatus === "all"
				? undefined
				: filters.selectedStatus === "completed"
					? "COMPLETED"
					: "PUBLISHED",
		showExpired:
			filters.selectedStatus === "all" ||
			filters.selectedStatus === "completed"
				? true
				: undefined,
		hostType: (filters.selectedHostType === "individual"
			? "individual"
			: filters.selectedHostType === "organization"
				? "organization"
				: undefined) as "organization" | "individual" | undefined,
	};

	const { data: events = [], isLoading: eventsLoading } =
		useEventsListQuery(eventsQueryParams);

	const isActiveInsufficient =
		!eventsLoading &&
		events.length < 3 &&
		filters.selectedStatus === "active";

	const { data: pastEvents = [], isLoading: pastEventsLoading } =
		useEventsListQuery(
			{
				status: "COMPLETED",
				showExpired: true,
				hostType: eventsQueryParams.hostType,
			},
			{ enabled: isActiveInsufficient },
		);

	const statusOptions = [
		{ value: "active", label: t("events.status.active") },
		{ value: "completed", label: t("events.status.completed") },
	];

	const hostTypeOptions = [
		{ value: "organization", label: t("events.filters.hostOrganizations") },
		{ value: "individual", label: t("events.filters.hostIndividuals") },
		{ value: "all", label: t("events.filters.hostAll") },
	];

	const handleHostTypeChange = (value: string) => {
		updateFilter("selectedHostType", value);
	};

	const showPastFallback = isActiveInsufficient && pastEvents.length > 0;
	const pastFillCount = Math.max(0, 3 - events.length);
	const recentPastEvents = pastEvents.slice(0, pastFillCount);

	return (
		<div className="space-y-4">
			{/* Filter pills */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				{statusOptions.map((option) => (
					<Button
						key={option.value}
						variant={
							filters.selectedStatus === option.value
								? "default"
								: "outline"
						}
						size="sm"
						onClick={() => handleStatusChange(option.value)}
						className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
					>
						{option.label}
					</Button>
				))}
				<div className="mx-1 h-4 w-px bg-border" />
				{hostTypeOptions.map((option) => (
					<Button
						key={option.value}
						variant={
							filters.selectedHostType === option.value
								? "default"
								: "outline"
						}
						size="sm"
						onClick={() => handleHostTypeChange(option.value)}
						className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
					>
						{option.label}
					</Button>
				))}
			</div>

			{/* Event grid */}
			{eventsLoading ? (
				<LoadingSkeleton />
			) : events.length === 0 ? (
				<EmptyState
					icon={<CalendarIcon className="h-8 w-8" />}
					title={t("events.emptyState.title")}
					description={
						filters.selectedStatus !== "active"
							? t("events.emptyState.tryAdjustFilters")
							: t("events.emptyState.noEventsYet")
					}
				/>
			) : (
				<>
					{/* Desktop: grid cards */}
					<div className="hidden sm:grid grid-cols-2 gap-4 lg:grid-cols-3">
						{events.map((event: Event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
					{/* Mobile: compact list */}
					<div className="flex flex-col gap-3 sm:hidden">
						{events.map((event: Event) => (
							<EventCardCompact key={event.id} event={event} />
						))}
					</div>
				</>
			)}

			{/* Past events fallback when no upcoming events */}
			{showPastFallback && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{t("events.pastEventsFallback.title")}
						</p>
						<Button
							variant="outline"
							size="sm"
							className="flex-shrink-0 rounded-full text-xs"
							onClick={() => handleStatusChange("completed")}
						>
							{t("events.pastEventsFallback.viewAll")}
						</Button>
					</div>
					{pastEventsLoading ? (
						<LoadingSkeleton />
					) : (
						<>
							<div className="hidden sm:grid grid-cols-2 gap-4 lg:grid-cols-3">
								{recentPastEvents.map((event: Event) => (
									<EventCard key={event.id} event={event} />
								))}
							</div>
							<div className="flex flex-col gap-3 sm:hidden">
								{recentPastEvents.map((event: Event) => (
									<EventCardCompact
										key={event.id}
										event={event}
									/>
								))}
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}

export function EventListWithFilters() {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<EventListContent />
		</Suspense>
	);
}
