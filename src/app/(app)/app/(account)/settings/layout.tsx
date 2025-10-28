import { getSession } from "@dashboard/auth/lib/server";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	return (
		<>
			<PageHeader
				title={t("settings.account.title")}
				subtitle={t("settings.account.subtitle")}
			/>
			<div className="container max-w-6xl py-8">{children}</div>
		</>
	);
}
