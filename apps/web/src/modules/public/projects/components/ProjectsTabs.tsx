"use client";

import { MyProjectsListContent } from "@/modules/public/projects/components/MyProjectsListContent";
import { ProjectListWithFilters } from "@/modules/public/projects/components/ProjectListWithFilters";
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

interface ProjectsTabsProps {
	isAuthenticated: boolean;
}

export function ProjectsTabs({ isAuthenticated }: ProjectsTabsProps) {
	const t = useTranslations();
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
				<div className="mb-5 hidden lg:block">
					<h1 className="font-brand text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
						{t("projects.title")}
					</h1>
				</div>
				<ProjectListWithFilters />
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
						{t("projects.title")}
					</h1>
					<Button
						asChild
						size="sm"
						variant="pill"
						className="hidden md:inline-flex"
					>
						<Link href="/projects/create">
							<PlusIcon className="mr-1 h-3.5 w-3.5" />
							{t("projects.addProject")}
						</Link>
					</Button>
				</div>
				<TabsList className="w-full max-w-sm md:w-auto">
					<TabsTrigger value="all">
						{t("projects.filters.allProjects")}
					</TabsTrigger>
					<TabsTrigger value="my">
						{t("projects.myProjects.title")}
					</TabsTrigger>
				</TabsList>
			</div>

			{activeTab !== "all" && (
				<div className="mb-3 flex items-center justify-between rounded-full bg-muted/60 px-3 py-1.5 lg:hidden">
					<span className="text-sm font-medium text-foreground">
						{t("projects.myProjects.title")}
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
				<ProjectListWithFilters />
			</TabsContent>

			<TabsContent value="my" className="mt-0">
				<MyProjectsListContent />
			</TabsContent>
		</Tabs>
	);
}
