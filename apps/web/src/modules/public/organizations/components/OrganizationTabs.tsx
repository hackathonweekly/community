"use client";

import { cn } from "@community/lib-shared/utils";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
	type OrganizationTabKey,
	isOrganizationTabKey,
} from "./organization-tabs-shared";

export type { OrganizationTabKey } from "./organization-tabs-shared";

interface OrganizationTabsProps {
	slug: string;
	defaultTab: OrganizationTabKey;
}

export function OrganizationTabs({ slug, defaultTab }: OrganizationTabsProps) {
	const t = useTranslations("organizations.tabs");
	const router = useRouter();
	const searchParams = useSearchParams();
	const rawTab = searchParams.get("tab");
	const activeTab = isOrganizationTabKey(rawTab) ? rawTab : defaultTab;

	const tabs: Array<{ key: OrganizationTabKey; label: string }> = [
		{ key: "overview", label: t("overview") },
		{ key: "events", label: t("events") },
		{ key: "members", label: t("members") },
	];

	const handleTabChange = (nextTab: OrganizationTabKey) => {
		if (nextTab === activeTab) return;
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", nextTab);
		router.push(`/orgs/${slug}?${params.toString()}`, { scroll: false });
	};

	return (
		<>
			<div className="hidden border-b border-border lg:flex lg:gap-1">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => handleTabChange(tab.key)}
						className={cn(
							"px-4 py-3 text-sm font-medium transition-colors",
							activeTab === tab.key
								? "-mb-px border-b-2 border-foreground text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div className="sticky top-0 z-30 border-b border-border bg-background lg:hidden">
				<div className="flex gap-2 bg-muted/50 p-2">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => handleTabChange(tab.key)}
							className={cn(
								"flex-1 rounded-full px-3 py-2 text-sm font-medium transition-all",
								activeTab === tab.key
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>
		</>
	);
}
