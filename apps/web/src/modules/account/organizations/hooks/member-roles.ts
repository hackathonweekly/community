import type { OrganizationMemberRole } from "@community/lib-server/auth";
import { useTranslations } from "next-intl";

export function useOrganizationMemberRoles() {
	const t = useTranslations();

	return {
		member: t("organizations.roles.member"),
		owner: t("organizations.roles.owner"),
		admin: t("organizations.roles.admin"),
	} satisfies Record<OrganizationMemberRole, string>;
}
