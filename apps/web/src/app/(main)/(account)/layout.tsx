"use client";

import { AppSidebar } from "@/modules/public/shared/components/AppSidebar";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { SidebarProvider } from "@community/ui/ui/sidebar";
import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export default function UserLayout({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const isSubmissionPage =
		typeof pathname === "string" &&
		/^\/events\/[^/]+\/submissions(?:\/.*)?$/.test(pathname);

	if (isSubmissionPage) {
		return <div className="min-h-screen bg-background">{children}</div>;
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex-1 min-h-screen min-w-0">{children}</main>
			<TabBar />
		</SidebarProvider>
	);
}
