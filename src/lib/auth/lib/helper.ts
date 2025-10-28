import type { ActiveOrganization } from "../auth";

export function isOrganizationAdmin(
	organization?: ActiveOrganization | null,
	user?: {
		id: string;
		role?: string | null;
	} | null,
) {
	const userOrganizationRole = organization?.members?.find((member: any) => {
		if ("userId" in member && typeof member.userId === "string") {
			return member.userId === user?.id;
		}
		return false;
	})?.role;

	return (
		["owner", "admin"].includes(userOrganizationRole ?? "") ||
		user?.role === "admin" ||
		user?.role === "super_admin"
	);
}
