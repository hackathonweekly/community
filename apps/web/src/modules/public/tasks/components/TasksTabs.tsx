"use client";
import { Button } from "@community/ui/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MyTasks } from "./MyTasks";
import { TaskHall } from "./TaskHall";

interface TasksTabsProps {
	isAuthenticated: boolean;
}

function MobileCreateButton() {
	return (
		<Button
			asChild
			size="icon"
			className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg md:hidden"
		>
			<Link href="/tasks/create">
				<PlusIcon className="h-5 w-5" />
			</Link>
		</Button>
	);
}

export function TasksTabs({ isAuthenticated }: TasksTabsProps) {
	const t = useTranslations("tasks");
	const tGlobal = useTranslations();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const resolveTab = (tabValue?: string | null) =>
		tabValue === "my" ? "my" : "all";

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
				<div className="mb-3 hidden lg:block sm:mb-5">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						{t("title")}
					</h1>
				</div>
				<TaskHall />
				{/* <MobileCreateButton /> */}
			</div>
		);
	}

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="w-full"
		>
			<div className="mb-3 hidden lg:flex flex-col gap-2 sm:mb-5 sm:gap-3 md:flex-row md:items-end md:justify-between">
				<div className="flex items-center gap-3">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						{t("title")}
					</h1>
					<Button
						asChild
						size="sm"
						variant="pill"
						className="hidden md:inline-flex"
					>
						<Link href="/tasks/create">
							<PlusIcon className="mr-1 h-3.5 w-3.5" />
							发布任务
						</Link>
					</Button>
				</div>
				<TabsList className="w-full max-w-sm md:w-auto">
					<TabsTrigger value="all">{t("allTasks")}</TabsTrigger>
					<TabsTrigger value="my">{t("myTasks.title")}</TabsTrigger>
				</TabsList>
			</div>

			{activeTab !== "all" && (
				<div className="mb-3 flex items-center justify-between rounded-full bg-muted/60 px-3 py-1.5 lg:hidden">
					<span className="text-sm font-medium text-foreground">
						{t("myTasks.title")}
					</span>
					<button
						type="button"
						onClick={() => handleTabChange("all")}
						className="text-sm font-medium text-primary"
					>
						{tGlobal("mePage.viewAll")}
					</button>
				</div>
			)}

			<TabsContent value="all" className="mt-0">
				<TaskHall />
			</TabsContent>

			<TabsContent value="my" className="mt-0">
				<MyTasks />
			</TabsContent>

			{/* <MobileCreateButton /> */}
		</Tabs>
	);
}
