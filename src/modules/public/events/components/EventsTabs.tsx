"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventListWithFilters } from "@/modules/public/events/components/EventListWithFilters";
import { MyEventsListContent } from "@/modules/public/events/components/MyEventsListContent";
import { PageHero } from "@/modules/public/shared/components/PageHero";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface EventsTabsProps {
	isAuthenticated: boolean;
	locale: string;
}

export function EventsTabs({ isAuthenticated, locale }: EventsTabsProps) {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	// Get tab from URL or default to discover
	const [activeTab, setActiveTab] = useState(
		searchParams?.get("tab") || "discover",
	);

	// Update URL when tab changes
	const handleTabChange = (value: string) => {
		setActiveTab(value);
		const params = new URLSearchParams(searchParams?.toString() || "");

		if (value === "discover") {
			params.delete("tab");
		} else {
			params.set("tab", value);
		}

		const newURL = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.push(newURL);
	};

	// Sync state with URL changes
	useEffect(() => {
		const tab = searchParams?.get("tab") || "discover";
		setActiveTab(tab);
	}, [searchParams]);

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="w-full"
		>
			{/* Tab 选择器在最上面 */}
			<TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 rounded-xl bg-gray-100 p-1">
				<TabsTrigger
					value="discover"
					className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
				>
					发现活动
				</TabsTrigger>
				<TabsTrigger
					value="myEvents"
					className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
				>
					我的活动
				</TabsTrigger>
			</TabsList>

			{/* Tab 1 - 发现活动 */}
			<TabsContent value="discover" className="mt-0">
				<PageHero
					title={t("tab_nav.events")}
					description={t("events.pageDescription")}
				/>
				<EventListWithFilters />
			</TabsContent>

			{/* Tab 2 - 我的活动 */}
			<TabsContent value="myEvents" className="mt-0">
				{isAuthenticated ? (
					<>
						<PageHero
							title={t("eventManagement.myEvents")}
							description={t(
								"eventManagement.myEventsDescription",
							)}
							actions={
								<Button asChild className="rounded-xl">
									<Link href="/app/events/create">
										<PlusIcon className="w-4 h-4 mr-2" />
										{t("eventManagement.createEvent")}
									</Link>
								</Button>
							}
						/>
						<MyEventsListContent />
					</>
				) : (
					<div className="text-center py-16 px-4">
						<div className="max-w-md mx-auto">
							<h3 className="text-xl font-semibold mb-4">
								{t("events.myEvents.emptyState.title")}
							</h3>
							<p className="text-muted-foreground mb-6">
								请先登录以查看您的活动
							</p>
						</div>
					</div>
				)}
			</TabsContent>
		</Tabs>
	);
}
