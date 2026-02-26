import { AuthWrapper } from "@shared/components/AuthWrapper";
import type { PropsWithChildren } from "react";

export default function WithoutOrganizationSlugLayout({
	children,
}: PropsWithChildren) {
	return (
		<AuthWrapper contentClass="w-full !max-w-none p-0 border-0 bg-transparent shadow-none">
			{children}
		</AuthWrapper>
	);
}
