export function getResourceNavItemKeys(isAuthenticated: boolean) {
	return isAuthenticated
		? (["docs", "about"] as const)
		: (["docs", "organizations", "about"] as const);
}
