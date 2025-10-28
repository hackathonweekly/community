import { isOrganizationAdmin } from "@/lib/auth/lib/helper";
import { getActiveOrganization, getSession } from "@dashboard/auth/lib/server";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const t = await getTranslations();
	const session = await getSession();
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	const userIsOrganizationAdmin = isOrganizationAdmin(
		organization,
		session?.user,
	);

	// 只有管理员可以访问设置页面
	if (!userIsOrganizationAdmin) {
		redirect(`/app/${organizationSlug}`);
	}

	return (
		<>
			<PageHeader
				title={t("organizations.settings.title")}
				subtitle={t("organizations.settings.subtitle")}
			/>
			<div className="container max-w-6xl py-8">{children}</div>
		</>
	);
}
