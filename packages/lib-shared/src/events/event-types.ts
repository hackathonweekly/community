export const EVENT_TYPES = [
	{ value: "MEETUP", label: "常规活动" },
	{ value: "HACKATHON", label: "黑客马拉松" },
] as const;

export function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
	};
	return typeLabels[value] || value;
}

export function getHostTypeLabel(value: string, t: (key: string) => string) {
	const labels: Record<string, string> = {
		organization: t("events.filters.hostOrganizations"),
		individual: t("events.filters.hostIndividuals"),
		all: t("events.filters.hostAll"),
	};
	return labels[value] || value;
}
