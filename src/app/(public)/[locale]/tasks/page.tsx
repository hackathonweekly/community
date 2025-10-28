import { TaskHall } from "@/modules/public/tasks/components/TaskHall";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "tasks" });

	return {
		title: t("meta.title"),
		description: t("meta.description"),
	};
}

export default async function TasksPage() {
	const t = await getTranslations("tasks");

	return (
		<div className="container max-w-6xl pt-32 pb-16">
			{/* 标题区域 */}
			<div className="mb-12 pt-8 text-center">
				<h1 className="mb-2 font-bold text-5xl">{t("title")}</h1>
				<p className="text-lg opacity-50">{t("description")}</p>
			</div>

			{/* 任务大厅 */}
			<TaskHall />
		</div>
	);
}
