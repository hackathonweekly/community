export interface FunctionalRoleLike {
	name?: string | null;
	organizationId?: string | null;
}

export type FunctionalRoleTranslator = (key: string) => string;

/**
 * Returns a locale-aware label for a functional role. System-level roles rely on translations
 * while organization-scoped roles should keep their custom name.
 */
export function resolveFunctionalRoleDisplayName(
	role: FunctionalRoleLike | null | undefined,
	translate?: FunctionalRoleTranslator,
): string {
	if (!role) {
		return "";
	}

	const fallback =
		typeof role.name === "string" && role.name.trim().length > 0
			? role.name
			: "";

	if (role.organizationId || !translate) {
		return fallback;
	}

	if (!fallback) {
		return "";
	}

	try {
		const translated = translate(fallback);
		if (typeof translated === "string" && translated.trim().length > 0) {
			return translated;
		}
	} catch (error) {
		// Silently fall back to the stored name when translation key is missing
	}

	return fallback;
}

export function createFunctionalRoleDisplayNameResolver(
	translate?: FunctionalRoleTranslator,
): (role: FunctionalRoleLike | null | undefined) => string {
	return (role) => resolveFunctionalRoleDisplayName(role, translate);
}
