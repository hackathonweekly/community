"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

interface ConditionalFooterProps {
	locale: string;
}

export function ConditionalFooter({ locale }: ConditionalFooterProps) {
	const pathname = usePathname();

	// Only show footer on home page
	const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

	if (!isHomePage) {
		return null;
	}

	return <Footer />;
}
