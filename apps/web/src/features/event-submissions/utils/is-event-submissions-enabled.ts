export type SubmissionsEnabledEventLike = {
	type?: string | null;
	requireProjectSubmission?: boolean | null;
	submissionsEnabled?: boolean | null;
};

export function isEventSubmissionsEnabled(
	event: SubmissionsEnabledEventLike | null | undefined,
) {
	if (!event) return false;

	if (
		event.submissionsEnabled !== undefined &&
		event.submissionsEnabled !== null
	) {
		return Boolean(event.submissionsEnabled);
	}

	if (event.type === "HACKATHON") return true;
	if (event.requireProjectSubmission) return true;

	return false;
}
