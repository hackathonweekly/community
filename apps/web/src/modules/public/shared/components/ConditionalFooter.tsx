"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@shared/auth/hooks/use-session";
import { Footer } from "@shared/components/Footer";

export function ConditionalFooter() {
	const pathname = usePathname();
	const { user } = useSession();

	// Only show footer on landing page (home page for unauthenticated users)
	const isHomePage = pathname === "/" || pathname === "";

	if (!isHomePage || user) {
		return null;
	}

	return <Footer />;
}
