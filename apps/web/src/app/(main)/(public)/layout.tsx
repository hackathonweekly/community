import { ConditionalFooter } from "@/modules/public/shared/components/ConditionalFooter";
import { AppSidebar } from "@/modules/public/shared/components/AppSidebar";
import { MobileCategoryNav } from "@/modules/public/shared/components/MobileCategoryNav";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { SidebarProvider } from "@community/ui/ui/sidebar";
import type { PropsWithChildren } from "react";

export default async function MarketingLayout({ children }: PropsWithChildren) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex-1 min-h-screen w-full">
				<MobileCategoryNav />
				{children}
				<ConditionalFooter />
			</main>
			<TabBar />
		</SidebarProvider>
	);
}
