"use client";

import { EventListWithFilters } from "@/modules/public/events/components/EventListWithFilters";
import { MyEventsListContent } from "@/modules/public/events/components/MyEventsListContent";
import { Button } from "@community/ui/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface EventsTabsProps {
	isAuthenticated: boolean;
}

export function EventsTabs({ isAuthenticated }: EventsTabsProps) {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const resolveTab = (tabValue?: string | null) => {
		if (tabValue === "my") return "my";
		if (tabValue === "manage") return "manage";
		return "all";
	};

	const [activeTab, setActiveTab] = useState(
		resolveTab(searchParams?.get("tab")),
	);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		const params = new URLSearchParams(searchParams?.toString() || "");

		if (value === "all") {
			params.delete("tab");
		} else {
			params.set("tab", value);
		}

		const newURL = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.push(newURL);
	};

	useEffect(() => {
		setActiveTab(resolveTab(searchParams?.get("tab")));
	}, [searchParams]);

	if (!isAuthenticated) {
		return (
			<div className="w-full">
				<div className="mb-5 hidden lg:block">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						{t("tab_nav.events")}
					</h1>
				</div>
				<EventListWithFilters />
			</div>
		);
	}

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="w-full"
		>
			<div className="mb-5 hidden lg:flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div className="flex items-center gap-3">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						{t("tab_nav.events")}
					</h1>
					<Button
						asChild
						size="sm"
						variant="pill"
						className="hidden md:inline-flex"
					>
						<Link href="/events/create">
							<PlusIcon className="mr-1 h-3.5 w-3.5" />
							{t("eventManagement.createEvent")}
						</Link>
					</Button>
				</div>
				<TabsList className="w-full max-w-sm md:w-auto">
					<TabsTrigger value="all">
						{t("eventManagement.allEvents")}
					</TabsTrigger>
					<TabsTrigger value="my">
						{t("eventManagement.registeredEvents")}
					</TabsTrigger>
					<TabsTrigger value="manage">
						{t("eventManagement.organizedEvents")}
					</TabsTrigger>
				</TabsList>
			</div>

			{activeTab !== "all" && (
				<div className="mb-3 flex items-center justify-between rounded-full bg-muted/60 px-3 py-1.5 lg:hidden">
					<span className="text-sm font-medium text-foreground">
						{activeTab === "my"
							? t("eventManagement.registeredEvents")
							: t("eventManagement.organizedEvents")}
					</span>
					<button
						type="button"
						onClick={() => handleTabChange("all")}
						className="text-sm font-medium text-primary"
					>
						{t("mePage.viewAll")}
					</button>
				</div>
			)}

			<TabsContent value="all" className="mt-0">
				<EventListWithFilters />
			</TabsContent>

			<TabsContent value="my" className="mt-0">
				<MyEventsListContent defaultTab="registered" showTabs={false} />
			</TabsContent>

			<TabsContent value="manage" className="mt-0">
				<MyEventsListContent defaultTab="organized" showTabs={false} />
			</TabsContent>
		</Tabs>
	);
}
