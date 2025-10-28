import { config as appConfig } from "@/config";
import { routing } from "@i18n/routing";
import {
	getOrganizationsForSession,
	getSession,
} from "@/lib/middleware-helpers";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { withQuery } from "ufo";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	// Let next-intl middleware handle locale routing
	if (pathname === "/" && appConfig.i18n.enabled) {
		return intlMiddleware(req);
	}

	if (pathname.startsWith("/app")) {
		const response = NextResponse.next();

		const session = await getSession(req);
		let locale = req.cookies.get(appConfig.i18n.localeCookieName)?.value;

		if (!session) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		if (
			appConfig.users.enableOnboarding &&
			!session.user.onboardingComplete &&
			pathname !== "/app/onboarding"
		) {
			return NextResponse.redirect(
				new URL(
					withQuery("/app/onboarding", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		if (
			!locale ||
			(session.user.locale && locale !== session.user.locale)
		) {
			locale = session.user.locale ?? appConfig.i18n.defaultLocale;
			response.cookies.set(appConfig.i18n.localeCookieName, locale);
		}

		if (
			appConfig.organizations.enable &&
			appConfig.organizations.requireOrganization &&
			pathname === "/app"
		) {
			const organizations = await getOrganizationsForSession(req);
			const organization =
				organizations.find(
					(org) => org.id === session?.session.activeOrganizationId,
				) || organizations[0];

			return NextResponse.redirect(
				new URL(
					organization
						? `/app/${organization.slug}`
						: "/app/new-organization",
					origin,
				),
			);
		}

		// Subscription billing has been removed
		// Payment features are now focused on event ticketing

		return response;
	}

	if (pathname.startsWith("/auth")) {
		const session = await getSession(req);

		if (session && pathname !== "/auth/reset-password") {
			// 检查是否有 redirectTo 参数，如果有就重定向到指定页面
			const redirectTo = req.nextUrl.searchParams.get("redirectTo");
			const redirectUrl =
				redirectTo && redirectTo !== "/app" ? redirectTo : "/app";
			return NextResponse.redirect(new URL(redirectUrl, origin));
		}

		return NextResponse.next();
	}

	if (!appConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
