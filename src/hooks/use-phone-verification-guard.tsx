import { useSession } from "@dashboard/auth/hooks/use-session";
import { config } from "@/config";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to enforce phone verification requirement on the client side
 * Automatically redirects users to phone verification if needed
 */
export function usePhoneVerificationGuard() {
	const { user, loaded } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	const isLoading = !loaded;

	const needsPhoneVerification =
		config.auth.requirePhoneVerification &&
		user &&
		(!user.phoneNumber || !user.phoneNumberVerified);

	// Skip verification for users who logged in via SMS
	const hasSmsLogin =
		user?.phoneNumber &&
		user.phoneNumberVerified &&
		user.email &&
		user.email.includes("@wechat.app");

	const shouldBypass =
		hasSmsLogin ||
		(!user?.email?.includes("@wechat.app") &&
			user?.phoneNumber &&
			user?.phoneNumberVerified);

	const finalNeedsVerification = needsPhoneVerification && !shouldBypass;

	useEffect(() => {
		if (isLoading) return;

		// Allow access to these paths even when phone verification is required
		const allowedPaths = ["/app/settings/security", "/auth/sign-out"];

		const isAllowedPath = allowedPaths.some((path) =>
			pathname?.includes(path),
		);

		if (finalNeedsVerification && !isAllowedPath) {
			router.push("/app/settings/security?tab=phone");
		}
	}, [finalNeedsVerification, isLoading, pathname, router]);

	return {
		needsPhoneVerification: finalNeedsVerification,
		isLoading,
		user,
	};
}

/**
 * Higher-order component to protect routes with phone verification
 */
export function withPhoneVerificationGuard<P extends object>(
	Component: React.ComponentType<P>,
) {
	return function ProtectedComponent(props: P) {
		const { needsPhoneVerification, isLoading } =
			usePhoneVerificationGuard();

		if (isLoading) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
				</div>
			);
		}

		if (needsPhoneVerification) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="max-w-md mx-auto text-center p-6">
						<h2 className="text-2xl font-bold mb-4">
							需要验证手机号
						</h2>
						<p className="text-muted-foreground mb-6">
							为了安全起见，请先验证您的手机号码后再继续使用。
						</p>
						<a
							href="/app/settings/security?tab=phone"
							className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
						>
							前往验证手机号
						</a>
					</div>
				</div>
			);
		}

		return <Component {...props} />;
	};
}
