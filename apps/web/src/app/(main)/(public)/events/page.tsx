import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSession } from "@shared/auth/lib/server";
import { EventsTabs } from "@/modules/public/events/components/EventsTabs";

// 禁用缓存，确保活动列表始终展示最新数据
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("tab_nav.events"),
	};
}

export default async function EventsPage() {
	const session = await getSession();

	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<EventsTabs isAuthenticated={!!session?.user} />
		</div>
	);
}
