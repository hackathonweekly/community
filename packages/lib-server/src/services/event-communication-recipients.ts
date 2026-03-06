export const COMMUNICATION_RECIPIENT_SCOPE = {
	ALL: "ALL",
	APPROVED_ONLY: "APPROVED_ONLY",
	UNCHECKED_IN_ONLY: "UNCHECKED_IN_ONLY",
	SELECTED: "SELECTED",
} as const;

export type CommunicationRecipientScope =
	(typeof COMMUNICATION_RECIPIENT_SCOPE)[keyof typeof COMMUNICATION_RECIPIENT_SCOPE];

interface RecipientStatusLike {
	userId: string;
	status: string;
	checkedIn: boolean;
}

interface ResolveScopedRecipientsInput<TRecipient extends RecipientStatusLike> {
	recipients: TRecipient[];
	scope?: CommunicationRecipientScope;
	selectedRecipientIds?: string[] | null;
}

interface ResolveScopedRecipientsResult<
	TRecipient extends RecipientStatusLike,
> {
	recipients: TRecipient[];
	scopeExcludedCount: number;
	unmatchedSelectedCount: number;
}

export function resolveScopedRecipients<
	TRecipient extends RecipientStatusLike,
>({
	recipients,
	scope = COMMUNICATION_RECIPIENT_SCOPE.ALL,
	selectedRecipientIds,
}: ResolveScopedRecipientsInput<TRecipient>): ResolveScopedRecipientsResult<TRecipient> {
	const selectedValues = selectedRecipientIds ?? [];
	const normalizedSelectedIds = Array.from(
		new Set(
			selectedValues
				.map((id) => id?.trim())
				.filter((id): id is string => Boolean(id)),
		),
	);

	let filteredRecipients = recipients;
	let unmatchedSelectedCount = 0;

	if (scope === COMMUNICATION_RECIPIENT_SCOPE.APPROVED_ONLY) {
		filteredRecipients = recipients.filter(
			(recipient) => recipient.status === "APPROVED",
		);
	}

	if (scope === COMMUNICATION_RECIPIENT_SCOPE.UNCHECKED_IN_ONLY) {
		filteredRecipients = recipients.filter(
			(recipient) =>
				recipient.status === "APPROVED" &&
				recipient.checkedIn === false,
		);
	}

	if (scope === COMMUNICATION_RECIPIENT_SCOPE.SELECTED) {
		if (normalizedSelectedIds.length === 0) {
			throw new Error("请选择至少 1 位参与者");
		}

		const selectedIdSet = new Set(normalizedSelectedIds);
		filteredRecipients = recipients.filter((recipient) =>
			selectedIdSet.has(recipient.userId),
		);
		unmatchedSelectedCount = Math.max(
			normalizedSelectedIds.length - filteredRecipients.length,
			0,
		);
	}

	return {
		recipients: filteredRecipients,
		scopeExcludedCount: Math.max(
			recipients.length - filteredRecipients.length,
			0,
		),
		unmatchedSelectedCount,
	};
}
