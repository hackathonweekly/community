export type InvitationRequiredFieldKey =
	| "email"
	| "phoneNumber"
	| "userRoleString"
	| "bio"
	| "currentWorkOn"
	| "lifeStatus";

export const INVITATION_REQUIRED_FIELD_LABELS: Record<
	InvitationRequiredFieldKey,
	string
> = {
	email: "邮箱",
	phoneNumber: "手机号",
	userRoleString: "主要角色",
	bio: "个人简介",
	currentWorkOn: "当前在做",
	lifeStatus: "人生状态",
};

type InvitationProfileSnapshot = {
	email?: string | null;
	phoneNumber?: string | null;
	userRoleString?: string | null;
	bio?: string | null;
	currentWorkOn?: string | null;
	lifeStatus?: string | null;
};

const isMissing = (value: string | null | undefined) =>
	!value || value.trim().length === 0;

export function getInvitationMissingFieldKeys(
	user: InvitationProfileSnapshot,
): InvitationRequiredFieldKey[] {
	const missing: InvitationRequiredFieldKey[] = [];

	if (isMissing(user.email)) {
		missing.push("email");
	}

	if (isMissing(user.phoneNumber)) {
		missing.push("phoneNumber");
	}

	if (isMissing(user.userRoleString)) {
		missing.push("userRoleString");
	}

	if (isMissing(user.bio)) {
		missing.push("bio");
	}

	if (isMissing(user.currentWorkOn)) {
		missing.push("currentWorkOn");
	}

	if (isMissing(user.lifeStatus)) {
		missing.push("lifeStatus");
	}

	return missing;
}

export function getInvitationMissingFieldLabels(
	user: InvitationProfileSnapshot,
): string[] {
	return getInvitationMissingFieldKeys(user).map(
		(key) => INVITATION_REQUIRED_FIELD_LABELS[key],
	);
}
