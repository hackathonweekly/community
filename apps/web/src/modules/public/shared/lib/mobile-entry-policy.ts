export const CATEGORY_PREFIXES = [
	"/events",
	"/projects",
	"/orgs",
	"/tasks",
	"/posts",
	"/members",
] as const;

export function getMobileHomeHref(_isAuthenticated: boolean) {
	return "/" as const;
}

export function getGuestTabKeys() {
	return ["home", "events", "create", "notifications", "login"] as const;
}

export function getUserTabKeys() {
	return ["home", "events", "create", "notifications", "me"] as const;
}

export function isDiscoveryRoute(pathname: string) {
	return CATEGORY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function shouldShowVisitorLoginBanner(isAuthenticated: boolean) {
	return !isAuthenticated;
}
