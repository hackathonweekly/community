import {
	AdminPermission,
	hasPermission,
	isAdmin,
} from "@community/lib-shared/auth/permissions";
import { getSession } from "@shared/auth/lib/server";
import { SidebarContentLayout } from "@/modules/account/shared/components/SidebarContentLayout";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AdminNav, AdminMobileNav } from "./AdminNav";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		redirect("/");
	}

	const isSuper = hasPermission(session.user, AdminPermission.MANAGE_SYSTEM);
	const pageTitle = isSuper ? "超级管理员" : "运营管理员";
	const pageSubtitle = isSuper ? "社区管理与运营中心" : "社区运营管理中心";

	return (
		<div className="max-w-7xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-24">
			{/* Page Header */}
			<div className="mb-6">
				<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
					{pageTitle}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{pageSubtitle}
				</p>
			</div>

			{/* Mobile Navigation */}
			<div className="lg:hidden">
				<AdminMobileNav />
			</div>

			{/* Desktop: Sidebar + Content */}
			<SidebarContentLayout
				sidebar={<AdminNav />}
				sidebarPosition="left"
				sidebarWidth={220}
				gap="lg"
				wrapSidebar={false}
				hideSidebarOnMobile={true}
			>
				{children}
			</SidebarContentLayout>
		</div>
	);
}
