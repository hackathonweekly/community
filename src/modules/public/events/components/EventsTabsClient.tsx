"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface EventsTabsClientProps {
	initialTab: string;
	discoverContent: React.ReactNode;
	myEventsContent: React.ReactNode;
}

export function EventsTabsClient({
	initialTab,
	discoverContent,
	myEventsContent,
}: EventsTabsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState(initialTab);

	// 处理标签页切换
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

	// 同步 URL 变化
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
			{/* Tab 选择器 */}
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

			<TabsContent value="discover" className="mt-0">
				{discoverContent}
			</TabsContent>

			<TabsContent value="myEvents" className="mt-0">
				{myEventsContent}
			</TabsContent>
		</Tabs>
	);
}
