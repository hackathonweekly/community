"use client";

import { AppWrapper } from "@dashboard/shared/components/AppWrapper";
import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export default function UserLayout({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const isSubmissionPage =
		typeof pathname === "string" &&
		/^\/app\/events\/[^/]+\/submissions(?:\/.*)?$/.test(pathname);

	if (isSubmissionPage) {
		return <div className="min-h-screen bg-background">{children}</div>;
	}

	return <AppWrapper>{children}</AppWrapper>;
}
