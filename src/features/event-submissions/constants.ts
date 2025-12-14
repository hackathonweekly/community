import type { RegistrationStatus } from "@prisma/client";

export const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
	"APPROVED",
	"PENDING",
];

const ACTIVE_STATUS_SET = new Set(ACTIVE_REGISTRATION_STATUSES);

export function isActiveRegistrationStatus(status?: RegistrationStatus | null) {
	if (!status) return false;
	return ACTIVE_STATUS_SET.has(status);
}
