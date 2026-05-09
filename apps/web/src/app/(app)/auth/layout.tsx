import { SessionProvider } from "@shared/auth/components/SessionProvider";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import type { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
	return (
		<SessionProvider>
			<AuthWrapper>{children}</AuthWrapper>
		</SessionProvider>
	);
}
