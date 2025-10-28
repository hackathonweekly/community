import type { ProjectSearchParams } from "@/lib/api/api-fetchers";
import { db } from "@/lib/database";
import { getServerQueryClient } from "@/lib/server";
import { ProjectsTabs } from "@/modules/public/projects/components/ProjectsTabs";
import { getSession } from "@dashboard/auth/lib/server";
import { ProjectStage } from "@prisma/client";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "projects" });

	return {
		title: t("meta.title"),
		description: t("meta.description"),
	};
}

async function getInitialData(
	stage?: ProjectStage | ProjectStage[],
	search?: string,
	organizationSlug?: string,
	sortBy?: string,
	sortOrder?: "asc" | "desc",
	userId?: string,
	isRecruiting?: boolean,
	isFeatured?: boolean,
) {
	const where: any = {
		user: {
			profilePublic: true,
		},
		isComplete: true,
	};

	if (isRecruiting) {
		where.isRecruiting = true;
	}

	if (isFeatured) {
		where.featured = true;
	}

	if (stage) {
		if (Array.isArray(stage)) {
			where.stage = {
				in: stage,
			};
		} else {
			where.stage = stage;
		}
	}

	if (search) {
		where.OR = [
			{
				title: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				projectTags: {
					hasSome: [search],
				},
			},
		];
	}

	if (organizationSlug) {
		where.user = {
			...where.user,
			members: {
				some: {
					organization: {
						slug: organizationSlug,
					},
				},
			},
		};
	}

	const orderBy: any = [{ featured: "desc" }];
	const direction = sortOrder === "asc" ? "asc" : "desc";
	if (sortBy === "latest") {
		orderBy.push({ createdAt: direction });
	} else if (sortBy === "popular") {
		orderBy.push({ likeCount: direction });
	} else if (sortBy === "views") {
		orderBy.push({ viewCount: direction });
	} else {
		orderBy.push({ createdAt: direction });
	}

	const [projects, stats, totalProjects, organizations] = await Promise.all([
		db.project.findMany({
			where,
			select: {
				id: true,
				title: true,
				description: true,
				subtitle: true,
				stage: true,
				featured: true,
				projectTags: true,
				url: true,
				screenshots: true,
				viewCount: true,
				likeCount: true,
				commentCount: true,
				createdAt: true,
				isRecruiting: true,
				recruitmentTags: true,
				recruitmentStatus: true,
				likes: userId
					? {
							where: {
								userId,
							},
							select: {
								id: true,
							},
						}
					: false,
				bookmarks: userId
					? {
							where: {
								userId,
							},
							select: {
								id: true,
							},
						}
					: false,
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						userRoleString: true,
						image: true,
						members: {
							include: {
								organization: {
									select: {
										id: true,
										name: true,
										slug: true,
										logo: true,
									},
								},
							},
						},
					},
				},
			},
			orderBy,
		}),
		db.project.groupBy({
			by: ["stage"],
			_count: {
				stage: true,
			},
			where: {
				user: {
					profilePublic: true,
				},
				isComplete: true,
			},
		}),
		db.project.count({
			where: {
				user: {
					profilePublic: true,
				},
				isComplete: true,
			},
		}),
		db.organization.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
			},
			orderBy: {
				name: "asc",
			},
		}),
	]);

	return { projects, stats: { stats, totalProjects }, organizations };
}

interface ProjectsPageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{
		stage?: ProjectStage | string;
		search?: string;
		organization?: string;
		sort?: string;
		sortOrder?: "asc" | "desc";
	}>;
}

export default async function ProjectsPage({
	params,
	searchParams,
}: ProjectsPageProps) {
	const { locale } = await params;
	const {
		stage: stageParam,
		search,
		organization,
		sort,
		sortOrder,
	} = await searchParams;
	const session = await getSession();

	// Parse stage parameter to handle multiple stages and grouped filters
	let stage: ProjectStage | ProjectStage[] | undefined;
	if (stageParam === "early") {
		stage = [
			ProjectStage.IDEA_VALIDATION,
			ProjectStage.DEVELOPMENT,
			ProjectStage.LAUNCH,
		];
	} else if (stageParam === "mature") {
		stage = [
			ProjectStage.GROWTH,
			ProjectStage.MONETIZATION,
			ProjectStage.FUNDING,
			ProjectStage.COMPLETED,
		];
	} else if (stageParam === "recruiting") {
		stage = undefined;
	} else if (stageParam === "featured") {
		stage = undefined;
	} else if (
		stageParam &&
		Object.values(ProjectStage).includes(stageParam as ProjectStage)
	) {
		stage = stageParam as ProjectStage;
	}

	// 获取初始数据用于 SSR 和 TanStack Query 的 initialData
	const { projects, stats, organizations } = await getInitialData(
		stage,
		search,
		organization,
		sort,
		sortOrder,
		session?.user?.id,
		stageParam === "recruiting",
		stageParam === "featured",
	);

	const initialSearchParams = {
		stage: stageParam,
		search,
		organization,
		sort,
		sortOrder,
	};

	const currentQueryParams: ProjectSearchParams = {
		stage: initialSearchParams.stage ?? undefined,
		search: initialSearchParams.search ?? undefined,
		organization: initialSearchParams.organization ?? undefined,
		sort: initialSearchParams.sort ?? undefined,
		sortOrder: initialSearchParams.sortOrder ?? undefined,
	};

	const headerObject = Object.fromEntries((await headers()).entries());
	const queryClient = getServerQueryClient();

	// 只设置当前查询的数据，不预取其他筛选条件
	queryClient.setQueryData(["projects", currentQueryParams], {
		projects,
		stats,
		organizations,
	});

	// 注释掉预取其他筛选条件的代码，改为按需加载
	// await Promise.all(
	// 	commonProjectFilters
	// 		.filter((filter) => filter.stage !== currentQueryParams.stage)
	// 		.map((filter) =>
	// 			queryClient.prefetchQuery({
	// 				queryKey: ["projects", filter],
	// 				queryFn: () =>
	// 					fetchPublicProjects(filter, { headers: headerObject }),
	// 			}),
	// 		),
	// );

	const dehydratedState = dehydrate(queryClient);

	return (
		<HydrationBoundary state={dehydratedState}>
			<div className="container max-w-6xl pt-6 md:pt-24 pb-20 md:pb-16">
				<ProjectsTabs
					isAuthenticated={!!session?.user}
					locale={locale}
					initialProjects={projects}
					initialStats={stats}
					initialOrganizations={organizations}
					searchParams={initialSearchParams}
				/>
			</div>
		</HydrationBoundary>
	);
}
