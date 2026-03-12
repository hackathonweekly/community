export const ORGANIZATION_TABS = ["overview", "events", "members"] as const;

export type OrganizationTabKey = (typeof ORGANIZATION_TABS)[number];

export function isOrganizationTabKey(
	value: string | null | undefined,
): value is OrganizationTabKey {
	return (
		typeof value === "string" &&
		ORGANIZATION_TABS.includes(value as OrganizationTabKey)
	);
}
