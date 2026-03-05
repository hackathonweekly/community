import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { SidebarContentLayout } from "@/modules/account/shared/components/SidebarContentLayout";
import { getSession } from "@shared/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { SettingsNav, SettingsMobileNav } from "./SettingsNav";

export default async function SettingsLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	return (
		<>
			<MobilePageHeader title={t("settings.account.title")} />
			<div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5 lg:py-6 pb-24">
				{/* Page Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 sm:mb-5 gap-3">
					<div>
						<h1 className="font-brand text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
							{t("settings.account.title")}
						</h1>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("settings.account.subtitle")}
						</p>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="lg:hidden">
					<SettingsMobileNav />
				</div>

				{/* Desktop: Sidebar + Content */}
				<SidebarContentLayout
					sidebar={<SettingsNav />}
					sidebarPosition="left"
					sidebarWidth={220}
					gap="md"
					wrapSidebar={true}
					hideSidebarOnMobile={true}
					sidebarInnerClassName="bg-card border-border"
				>
					{children}
				</SidebarContentLayout>
			</div>
		</>
	);
}
