"use client";

import { Button } from "@/components/ui/button";
import { ProjectListWithFilters } from "@/modules/public/projects/components/ProjectListWithFilters";
import { PageHero } from "@/modules/public/shared/components/PageHero";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProjectsTabsProps {
	isAuthenticated: boolean;
	locale: string;
	initialProjects: any[];
	initialStats: { stats: any[]; totalProjects: number };
	initialOrganizations: any[];
	searchParams: {
		stage?: string;
		search?: string;
		organization?: string;
		sort?: string;
	};
}

export function ProjectsTabs({
	isAuthenticated,
	locale,
	initialProjects,
	initialStats,
	initialOrganizations,
	searchParams: initialSearchParams,
}: ProjectsTabsProps) {
	const t = useTranslations();

	return (
		<>
			{/* 社区作品的头部 */}
			<PageHero
				title={t("projects.title")}
				description={t("projects.description")}
				actions={
					isAuthenticated ? (
						<Button asChild size="lg">
							<a href="/app/projects/create">
								<PlusIcon className="h-4 w-4 mr-2" />
								{t("projects.addProject")}
							</a>
						</Button>
					) : undefined
				}
			/>
			{/* 社区作品的内容 */}
			<ProjectListWithFilters
				initialProjects={initialProjects}
				initialStats={initialStats}
				initialOrganizations={initialOrganizations}
				searchParams={initialSearchParams}
			/>
		</>
	);
}
