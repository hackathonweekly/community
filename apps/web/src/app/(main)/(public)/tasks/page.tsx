import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSession } from "@shared/auth/lib/server";
import { TasksTabs } from "@/modules/public/tasks/components/TasksTabs";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("tasks");

	return {
		title: t("meta.title"),
		description: t("meta.description"),
	};
}

export default async function TasksPage() {
	const session = await getSession();

	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<TasksTabs isAuthenticated={!!session?.user} />
		</div>
	);
}
