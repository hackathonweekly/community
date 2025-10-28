"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MyEventsTabsClientProps {
	initialSubTab: string;
	organizedEvents: any[];
	registrations: any[];
	organizedContent: React.ReactNode;
	registeredContent: React.ReactNode;
}

export function MyEventsTabsClient({
	initialSubTab,
	organizedEvents,
	registrations,
	organizedContent,
	registeredContent,
}: MyEventsTabsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

	// 处理子标签页切换
	const handleSubTabChange = (value: string) => {
		setActiveSubTab(value);
		const params = new URLSearchParams(searchParams?.toString() || "");

		if (value === "organized") {
			params.delete("subtab");
		} else {
			params.set("subtab", value);
		}

		// 保持 tab=myEvents
		params.set("tab", "myEvents");

		const newURL = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.push(newURL);
	};

	// 同步 URL 变化
	useEffect(() => {
		const subtab = searchParams?.get("subtab") || "organized";
		setActiveSubTab(subtab);
	}, [searchParams]);

	return (
		<Tabs
			value={activeSubTab}
			onValueChange={handleSubTabChange}
			className="w-full"
		>
			{/* 子标签页选择器 */}
			<TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
				<TabsTrigger value="organized" id="organized">
					我管理的活动
					{organizedEvents.length > 0 && (
						<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
							{organizedEvents.length}
						</span>
					)}
				</TabsTrigger>
				<TabsTrigger value="registered" id="registered">
					我参与的活动
					{registrations.length > 0 && (
						<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
							{registrations.length}
						</span>
					)}
				</TabsTrigger>
			</TabsList>

			<TabsContent value="organized" className="mt-6">
				{organizedContent}
			</TabsContent>

			<TabsContent value="registered" className="mt-6">
				{registeredContent}
			</TabsContent>
		</Tabs>
	);
}
