import { getSession } from "@dashboard/auth/lib/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
	fetchEventsListServer,
	fetchEventsOrganizationsServer,
} from "@/lib/api/server-fetchers";
import { EventsServerTabs } from "@/modules/public/events/components/EventsServerTabs";

type EventsPageSearchParams = Record<string, string | string[] | undefined>;

// 页面级缓存策略：5分钟重新生成
export const revalidate = 300;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale });

	return {
		title: t("tab_nav.events"),
	};
}

export default async function EventsPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<EventsPageSearchParams>;
}) {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;
	const session = await getSession();

	// 解析筛选参数
	const hostTypeParam = Array.isArray(resolvedSearchParams.hostType)
		? resolvedSearchParams.hostType[0]
		: resolvedSearchParams.hostType;

	const initialHostType =
		hostTypeParam === "individual"
			? "individual"
			: hostTypeParam === "all"
				? "all"
				: "organization";

	const eventsParams = {
		search: Array.isArray(resolvedSearchParams.search)
			? resolvedSearchParams.search[0]
			: resolvedSearchParams.search,
		type: Array.isArray(resolvedSearchParams.type)
			? resolvedSearchParams.type[0]
			: resolvedSearchParams.type,
		organizationId: undefined, // 将在组件内部解析
		isOnline: Array.isArray(resolvedSearchParams.isOnline)
			? resolvedSearchParams.isOnline[0]
			: resolvedSearchParams.isOnline,
		status: (() => {
			const status = Array.isArray(resolvedSearchParams.status)
				? resolvedSearchParams.status[0]
				: resolvedSearchParams.status || "upcoming";

			if (status === "all") return undefined;
			if (status === "ongoing") return "ONGOING";
			if (status === "completed") return "COMPLETED";
			return "PUBLISHED";
		})(),
		showExpired: (() => {
			const status = Array.isArray(resolvedSearchParams.status)
				? resolvedSearchParams.status[0]
				: resolvedSearchParams.status || "upcoming";
			return status === "all" || status === "completed";
		})(),
		hostType:
			initialHostType === "individual"
				? ("individual" as const)
				: initialHostType === "organization"
					? ("organization" as const)
					: undefined,
	};

	// 并行获取数据
	const [organizations, events] = await Promise.all([
		fetchEventsOrganizationsServer(),
		fetchEventsListServer(eventsParams),
	]);

	return (
		<div className="container max-w-6xl pt-6 md:pt-24 pb-20 md:pb-16">
			<EventsServerTabs
				isAuthenticated={!!session?.user}
				locale={locale}
				searchParams={resolvedSearchParams}
				organizations={organizations}
				events={events}
			/>
		</div>
	);
}
