import { config as appConfig } from "@community/config";
import {
	getOrganizationsForSession,
	getSession,
} from "@community/lib-shared/middleware-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { withQuery } from "ufo";

const localePrefixPattern = new RegExp(
	`^/(${Object.keys(appConfig.i18n.locales).join("|")})(?=/|$)`,
);

const protectedRouteMatchers = [
	/^\/me(\/|$)/,
	/^\/settings(\/|$)/,
	/^\/admin(\/|$)/,
	/^\/notifications(\/|$)/,
	/^\/events\/create(\/|$)/,
	/^\/events\/[^/]+\/(edit|manage)(\/|$)/,
	/^\/projects\/create(\/|$)/,
	/^\/projects\/[^/]+\/edit(\/|$)/,
	/^\/orgs\/[^/]+\/manage(\/|$)/,
];

function stripLocalePrefix(pathname: string) {
	const stripped = pathname.replace(localePrefixPattern, "");
	return stripped === "" ? "/" : stripped;
}

function mapLegacyAppPath(pathname: string) {
	if (!pathname.startsWith("/app")) {
		return null;
	}

	if (pathname === "/app" || pathname === "/app/") {
		return { pathname: "/" };
	}

	if (pathname === "/app/events") {
		return { pathname: "/events", query: { tab: "my" } };
	}

	if (pathname === "/app/projects") {
		return { pathname: "/projects", query: { tab: "my" } };
	}

	if (pathname === "/app/tasks") {
		return { pathname: "/tasks", query: { tab: "my" } };
	}

	if (pathname.startsWith("/app/profile")) {
		return { pathname: pathname.replace("/app/profile", "/me") };
	}

	if (pathname.startsWith("/app/settings")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/admin")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/notifications")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/events/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/projects/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/tasks/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	const orgMatch = pathname.match(/^\/app\/([^/]+)(\/.*)?$/);
	if (orgMatch) {
		const slug = orgMatch[1];
		const rest = orgMatch[2] ?? "";
		return { pathname: `/orgs/${slug}/manage${rest}` };
	}

	return { pathname: pathname.replace("/app", "") };
}

export default async function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	const response = NextResponse.next();

	if (localePrefixPattern.test(pathname)) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = stripLocalePrefix(pathname);
		return NextResponse.redirect(redirectUrl, 301);
	}

	const legacyAppRedirect = mapLegacyAppPath(pathname);
	if (legacyAppRedirect) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = legacyAppRedirect.pathname;
		if (legacyAppRedirect.query) {
			for (const [key, value] of Object.entries(
				legacyAppRedirect.query,
			)) {
				redirectUrl.searchParams.set(key, value);
			}
		}
		return NextResponse.redirect(redirectUrl, 301);
	}

	const requiresAuth = protectedRouteMatchers.some((matcher) =>
		matcher.test(pathname),
	);

	const shouldFetchSession =
		pathname.startsWith("/auth") ||
		requiresAuth ||
		(appConfig.organizations.requireOrganization && pathname === "/");
	const session = shouldFetchSession ? await getSession(req) : null;

	if (pathname.startsWith("/auth")) {
		if (session && pathname !== "/auth/reset-password") {
			const redirectTo =
				req.nextUrl.searchParams.get("redirectTo") ??
				req.nextUrl.searchParams.get("callbackUrl");
			const redirectUrl =
				redirectTo && redirectTo !== "/app"
					? redirectTo
					: appConfig.auth.redirectAfterSignIn;
			return NextResponse.redirect(new URL(redirectUrl, origin));
		}

		return response;
	}

	if (requiresAuth) {
		if (!session) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: `${pathname}${req.nextUrl.search}`,
					}),
					origin,
				),
			);
		}

		if (
			appConfig.users.enableOnboarding &&
			!session.user.onboardingComplete &&
			pathname !== "/onboarding"
		) {
			return NextResponse.redirect(
				new URL(
					withQuery("/onboarding", {
						redirectTo: `${pathname}${req.nextUrl.search}`,
					}),
					origin,
				),
			);
		}
	}

	if (session) {
		let locale = req.cookies.get(appConfig.i18n.localeCookieName)?.value;
		if (
			!locale ||
			(session.user.locale && locale !== session.user.locale)
		) {
			locale = session.user.locale ?? appConfig.i18n.defaultLocale;
			response.cookies.set(appConfig.i18n.localeCookieName, locale);
		}
	}

	if (!appConfig.ui.public.enabled) {
		return NextResponse.redirect(new URL("/", origin));
	}

	if (
		appConfig.organizations.enable &&
		appConfig.organizations.requireOrganization &&
		session &&
		pathname === "/"
	) {
		const organizations = await getOrganizationsForSession(req);
		const organization =
			organizations.find(
				(org) => org.id === session.session.activeOrganizationId,
			) || organizations[0];

		return NextResponse.redirect(
			new URL(
				organization
					? `/orgs/${organization.slug}/manage`
					: "/orgs/new-organization",
				origin,
			),
		);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
