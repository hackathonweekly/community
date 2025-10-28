import { SessionProvider } from "@dashboard/auth/components/SessionProvider";
import { AuthWrapper } from "@dashboard/shared/components/AuthWrapper";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthLayout({ children }: PropsWithChildren) {
	return (
		<SessionProvider>
			<AuthWrapper>{children}</AuthWrapper>
		</SessionProvider>
	);
}
