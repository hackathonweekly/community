import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./ProjectDetailClient";

// Enable ISR: Revalidate every 30 minutes for projects
export const revalidate = 1800;

async function getProjectForMetadata(projectId: string) {
	return await db.project.findUnique({
		where: { id: projectId },
		select: {
			title: true,
			description: true,
		},
	});
}

async function getProject(projectId: string) {
	const project = await db.project.findUnique({
		where: { id: projectId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					username: true,
					userRoleString: true,
					image: true,
				},
			},
			_count: {
				select: {
					likes: true,
					comments: true,
				},
			},
		},
	});

	if (!project || !project.user) {
		return null;
	}

	// Increment view count
	await db.project.update({
		where: { id: projectId },
		data: { viewCount: { increment: 1 } },
	});

	return project;
}

async function getUserLike(projectId: string, userId?: string) {
	if (!userId) {
		return null;
	}

	return await db.projectLike.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});
}

async function getUserBookmark(projectId: string, userId?: string) {
	if (!userId) {
		return null;
	}

	return await db.projectBookmark.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});
}

async function getMoreProjectsFromUser(
	userId: string,
	excludeProjectId: string,
) {
	return await db.project.findMany({
		where: {
			userId,
			id: { not: excludeProjectId },
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					username: true,
					userRoleString: true,
					image: true,
				},
			},
			_count: {
				select: {
					likes: true,
					comments: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 3,
	});
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ projectId: string; locale: string }>;
}): Promise<Metadata> {
	const { projectId, locale } = await params;
	const project = await getProjectForMetadata(projectId);

	if (!project) {
		return {
			title: "Project Not Found",
		};
	}

	const isZh = locale?.startsWith("zh");
	const pageTitle = isZh
		? `了解项目：${project.title}`
		: `${project.title} | Community Projects`;
	const shareTitle = isZh ? pageTitle : project.title;
	const description =
		project.description ||
		(isZh
			? "查看社区项目的详细介绍。"
			: "Explore this Hackathon Weekly project.");

	return {
		title: pageTitle,
		description,
		openGraph: {
			title: shareTitle,
			description,
		},
		twitter: {
			card: "summary_large_image",
			title: shareTitle,
			description,
		},
	};
}

interface ProjectDetailPageProps {
	params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({
	params,
}: ProjectDetailPageProps) {
	const { projectId } = await params;
	const session = await getSession();

	// 获取初始数据用于SSR，如果项目不存在会返回null
	const project = await getProject(projectId);

	// 如果项目不存在，返回404
	if (!project) {
		notFound();
	}

	// 获取用户交互数据作为初始数据
	const [userLike, userBookmark] = session?.user?.id
		? await Promise.all([
				getUserLike(projectId, session.user.id),
				getUserBookmark(projectId, session.user.id),
			])
		: [null, null];

	// 构造初始数据
	const initialData = {
		...project,
		userLike: !!userLike,
		userBookmark: !!userBookmark,
	};

	return (
		<ProjectDetailClient
			projectId={projectId}
			currentUserId={session?.user?.id}
			initialData={initialData}
		/>
	);
}
