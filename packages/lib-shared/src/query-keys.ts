export const queryKeys = {
	profile: () => ["profile"] as const,
	projects: (params?: { userId?: string }) =>
		params ? ["projects", params] : (["projects"] as const),
	participatedProjects: () => ["projects", "participated"] as const,
	organizations: () => ["organizations"] as const,
	events: {
		list: (params?: {
			search?: string;
			type?: string;
			organizationId?: string;
			isOnline?: string;
			status?: string;
			showExpired?: boolean;
			hostType?: "organization" | "individual";
			seriesId?: string;
			seriesSlug?: string;
		}) =>
			params ? ["events", "list", params] : (["events", "list"] as const),
		organizations: () => ["events", "organizations"] as const,
		series: {
			list: (params?: {
				page?: number;
				limit?: number;
				search?: string;
				mine?: boolean;
				includeInactive?: boolean;
				organizationId?: string;
			}) =>
				params
					? (["events", "series", "list", params] as const)
					: (["events", "series", "list"] as const),
			detail: (identifier: string) =>
				["events", "series", "detail", identifier] as const,
			subscription: (identifier: string, userId?: string) =>
				[
					"events",
					"series",
					"subscription",
					identifier,
					userId,
				] as const,
		},
	},
	notifications: {
		all: () => ["notifications"] as const,
		list: (page: number, limit: number) =>
			["notifications", "list", page, limit] as const,
		unreadCount: () => ["notifications", "unread-count"] as const,
	},
	following: {
		users: () => ["following", "users"] as const,
		followers: () => ["following", "followers"] as const,
	},
	bookmarks: {
		projects: () => ["bookmarks", "projects"] as const,
		events: () => ["bookmarks", "events"] as const,
	},
	user: {
		registrations: () => ["user", "registrations"] as const,
		events: () => ["user", "events"] as const,
		interactiveUsers: (limit?: number) =>
			limit
				? ["user", "interactive-users", limit]
				: (["user", "interactive-users"] as const),
		mutualFriends: (limit?: number) =>
			limit
				? ["user", "mutual-friends", limit]
				: (["user", "mutual-friends"] as const),
	},
} as const;

export type QueryKeyOf<T extends (...args: any[]) => readonly unknown[]> =
	ReturnType<T>;
