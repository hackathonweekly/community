import { ProjectsTabs } from "@/modules/public/projects/components/ProjectsTabs";
import { getSession } from "@shared/auth/lib/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("projects");

	return {
		title: t("meta.title"),
		description: t("meta.description"),
	};
}

export default async function ProjectsPage() {
	const session = await getSession();

	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<ProjectsTabs isAuthenticated={!!session?.user} />
		</div>
	);
}
