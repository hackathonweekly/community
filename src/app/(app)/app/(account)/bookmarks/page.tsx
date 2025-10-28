"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Heart, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ProjectBookmarkButton } from "@/components/ui/project-bookmark-button";
import { projectStageLabels, projectStageColors } from "@/lib/project-stage";
import { EventBookmarksTab } from "@/modules/public/events/components/event-bookmarks-tab";
import { useTranslations } from "next-intl";
import {
	useProjectBookmarksQuery,
	useEventBookmarksQuery,
} from "@/lib/api/api-hooks";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { redirect } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BookmarksPageContent() {
	const t = useTranslations("bookmarks");
	const { user, isLoading: authLoading } = useAuthStatus();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState("projects");

	// 使用 TanStack Query hooks 获取数据
	const {
		data: projectBookmarks = [],
		isLoading: projectsLoading,
		error: projectsError,
	} = useProjectBookmarksQuery();

	const {
		data: eventBookmarks = [],
		isLoading: eventsLoading,
		error: eventsError,
	} = useEventBookmarksQuery();

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab && ["projects", "events"].includes(tab)) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	// 如果用户未登录，重定向
	if (authLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
					<div className="space-y-2">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!user) {
		redirect("/auth/signin");
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t("title")}</h1>
				<p className="text-muted-foreground mt-2">{t("description")}</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="projects">
						{t("projectBookmarks")} ({projectBookmarks.length})
					</TabsTrigger>
					<TabsTrigger value="events">
						{t("eventBookmarks")} ({eventBookmarks.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="projects" className="mt-6">
					{projectsLoading ? (
						<div className="space-y-4">
							{[...Array(3)].map((_, i) => (
								<Card key={i}>
									<CardContent className="p-6">
										<div className="space-y-4">
											<Skeleton className="h-6 w-2/3" />
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-4 w-3/4" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : projectBookmarks.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground text-center">
									{t("noProjectBookmarks")}
								</p>
								<Button asChild className="mt-4">
									<Link href="/projects">
										{t("discoverProjects")}
									</Link>
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{projectBookmarks.map((project: any) => (
								<Card
									key={project.id}
									className="hover:shadow-lg transition-shadow"
								>
									<CardHeader>
										<CardTitle className="text-lg">
											{project.title}
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											{project.subtitle}
										</p>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 mb-4">
											<div className="flex items-center text-sm">
												<span className="font-medium mr-2">
													{t("stage")}:
												</span>
												{project.stage &&
													projectStageLabels[
														project.stage as keyof typeof projectStageLabels
													] && (
														<Badge
															variant="outline"
															className={
																projectStageColors[
																	project.stage as keyof typeof projectStageColors
																] ||
																"bg-gray-100 text-gray-800 border-gray-200"
															}
														>
															{
																projectStageLabels[
																	project.stage as keyof typeof projectStageLabels
																]
															}
														</Badge>
													)}
											</div>

											<div className="flex items-center justify-between text-sm text-muted-foreground">
												<div className="flex items-center space-x-4">
													<div className="flex items-center">
														<Eye className="h-4 w-4 mr-1" />
														{project.viewCount}
													</div>
													<div className="flex items-center">
														<Heart className="h-4 w-4 mr-1" />
														{project.likeCount}
													</div>
													<div className="flex items-center">
														<MessageCircle className="h-4 w-4 mr-1" />
														{project.commentCount}
													</div>
												</div>
											</div>

											<div className="text-sm text-muted-foreground">
												{t("createdAt")}:{" "}
												{new Date(
													project.createdAt,
												).toLocaleDateString()}
											</div>
										</div>

										<div className="flex items-center justify-between">
											<Button
												asChild
												size="sm"
												variant="outline"
											>
												<Link
													href={`/projects/${project.id}`}
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													{t("viewProject")}
												</Link>
											</Button>

											<ProjectBookmarkButton
												projectId={project.id}
												initialBookmarked={true}
												isLoggedIn={true}
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="events" className="mt-6">
					<EventBookmarksTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function BookmarksPageWithSuspense() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto px-4 py-8">
					<div className="space-y-4">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96" />
						<div className="space-y-2">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-32 w-full" />
							))}
						</div>
					</div>
				</div>
			}
		>
			<BookmarksPageContent />
		</Suspense>
	);
}

export default function BookmarksPage() {
	return <BookmarksPageWithSuspense />;
}
