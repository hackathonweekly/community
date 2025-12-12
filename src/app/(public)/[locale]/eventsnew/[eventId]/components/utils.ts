export const getEventTypeLabels = (t: any): Record<string, string> => ({
	MEETUP: t("events.types.meetup"),
	HACKATHON: t("events.types.hackathon"),
	BUILDING_PUBLIC: t("events.types.buildingPublic"),
});

export const formatTimezoneDisplay = (timezone?: string) => {
	if (!timezone) return undefined;
	try {
		const parts = new Intl.DateTimeFormat("en", {
			timeZone: timezone,
			timeZoneName: "short",
		}).formatToParts(new Date());
		const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
		if (tzName) return tzName.replace("GMT", "GMT");
	} catch {
		// ignore and fall through
	}
	return timezone;
};
