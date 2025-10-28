import { PageHero } from "@/modules/public/shared/components/PageHero";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EventsFiltersClient } from "./EventsFiltersClient";
import { EventsServerList } from "./EventsServerList";

interface EventsServerTabsProps {
	isAuthenticated: boolean;
	locale: string;
	searchParams: Record<string, string | string[] | undefined>;
	organizations: any[];
	events: any[];
}

export async function EventsServerTabs({
	isAuthenticated,
	locale,
	searchParams,
	organizations,
	events,
}: EventsServerTabsProps) {
	const t = await getTranslations();

	return (
		<>
			<PageHero
				title={t("tab_nav.events")}
				description={t("events.pageDescription")}
				actions={
					isAuthenticated ? (
						<Button asChild className="rounded-xl">
							<Link href="/app/events/create">
								<PlusIcon className="w-4 h-4 mr-2" />
								{t("eventManagement.createEvent")}
							</Link>
						</Button>
					) : undefined
				}
			/>
			<div className="space-y-4 md:space-y-8">
				<EventsFiltersClient
					searchParams={searchParams}
					organizations={organizations}
				/>
				<EventsServerList events={events} />
			</div>
		</>
	);
}
