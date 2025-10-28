import type { OrganizationMemberRole } from "@/lib/auth";
import { useTranslations } from "next-intl";

export function useOrganizationMemberRoles() {
	const t = useTranslations();

	return {
		member: t("organizations.roles.member"),
		owner: t("organizations.roles.owner"),
		admin: t("organizations.roles.admin"),
	} satisfies Record<OrganizationMemberRole, string>;
}
