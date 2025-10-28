import {
	AdminPermission,
	hasPermission,
	isAdmin,
} from "@/lib/auth/permissions";
import { getSession } from "@dashboard/auth/lib/server";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		redirect("/app");
	}

	// 根据用户角色显示不同的标题
	const isSuper = hasPermission(session.user, AdminPermission.MANAGE_SYSTEM);
	const pageTitle = isSuper ? "超级管理员" : "运营管理员";
	const pageSubtitle = isSuper ? "社区管理与运营中心" : "社区运营管理中心";

	return (
		<>
			<PageHeader title={pageTitle} subtitle={pageSubtitle} />
			<div className="container max-w-6xl py-8">{children}</div>
		</>
	);
}
