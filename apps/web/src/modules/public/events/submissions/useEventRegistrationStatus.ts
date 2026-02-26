"use client";

import { useQuery } from "@tanstack/react-query";

export type EventRegistrationStatus = {
	status?: string | null;
} | null;

export function useEventRegistrationStatus(eventId?: string, userId?: string) {
	return useQuery<EventRegistrationStatus>({
		queryKey: ["event-registration-status", eventId, userId],
		enabled: Boolean(eventId && userId),
		staleTime: 60 * 1000,
		queryFn: async () => {
			const response = await fetch(
				`/api/events/${eventId}/registration`,
				{
					credentials: "include",
				},
			);

			if (!response.ok) {
				return null;
			}

			const result = await response.json();
			return (result?.data as EventRegistrationStatus) ?? null;
		},
	});
}
