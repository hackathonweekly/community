import { getSession } from "@dashboard/auth/lib/server";
import { ProjectManager } from "@dashboard/profile/components/ProjectManager";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { LocaleLink } from "@i18n/routing";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.managementTitle"),
	};
}

export default async function ProjectsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const t = await getTranslations();

	return (
		<>
			<PageHeader
				title={t("projects.managementTitle")}
				subtitle={t("projects.managementSubtitle")}
				action={
					<LocaleLink href="/projects">
						<Button variant="outline" size="sm">
							<ExternalLinkIcon className="h-4 w-4 mr-2" />
							{t("projects.viewAllProjects")}
						</Button>
					</LocaleLink>
				}
			/>
			<SettingsList>
				<ProjectManager />
			</SettingsList>
		</>
	);
}
