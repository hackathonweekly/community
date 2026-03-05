import { SessionProvider } from "@shared/auth/components/SessionProvider";
import { AuthWrapper } from "@shared/components/AuthWrapper";
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
