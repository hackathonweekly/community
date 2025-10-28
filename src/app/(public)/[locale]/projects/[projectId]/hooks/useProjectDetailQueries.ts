import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// 项目详情数据类型
interface ProjectDetail {
	id: string;
	title: string;
	subtitle?: string;
	description: string;
	stage?: string;
	featured: boolean;
	projectTags: string[];
	url?: string;
	screenshots?: string[];
	viewCount: number;
	milestones: string[];
	isRecruiting: boolean;
	teamDescription?: string;
	teamSkills: string[];
	teamSize?: string;
	contactInfo?: string;
	creationExperience?: string;
	pricingType?: string;
	demoVideoUrl?: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	user: {
		id: string;
		name: string;
		username: string;
		userRoleString?: string;
		image?: string;
	};
	_count: {
		likes: number;
		comments: number;
	};
	userLike: boolean;
	userBookmark: boolean;
}

interface RelatedProject {
	id: string;
	title: string;
	subtitle?: string;
	description: string;
	stage?: string;
	user: {
		id: string;
		name: string;
		username: string;
		userRoleString?: string;
		image?: string;
	};
	_count: {
		likes: number;
		comments: number;
	};
}

// 获取项目详情
async function fetchProjectDetail(projectId: string): Promise<ProjectDetail> {
	const response = await fetch(`/api/projects/public/detail/${projectId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch project detail");
	}
	return response.json();
}

// 获取相关项目
async function fetchRelatedProjects(
	projectId: string,
): Promise<RelatedProject[]> {
	const response = await fetch(
		`/api/projects/public/detail/${projectId}/related`,
	);
	if (!response.ok) {
		throw new Error("Failed to fetch related projects");
	}
	return response.json();
}

// 点赞/取消点赞
async function toggleProjectLike(
	projectId: string,
	isLiked: boolean,
): Promise<{ success: boolean; likesCount: number }> {
	const response = await fetch(`/api/projects/${projectId}/like`, {
		method: isLiked ? "DELETE" : "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error("Failed to toggle like");
	}

	return response.json();
}

// 收藏/取消收藏
async function toggleProjectBookmark(
	projectId: string,
	isBookmarked: boolean,
): Promise<{ success: boolean }> {
	const response = await fetch(`/api/projects/${projectId}/bookmark`, {
		method: isBookmarked ? "DELETE" : "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error("Failed to toggle bookmark");
	}

	return response.json();
}

// 使用项目详情的 hook
export function useProjectDetail(
	projectId: string,
	initialData?: ProjectDetail,
) {
	return useQuery({
		queryKey: ["project", projectId],
		queryFn: () => fetchProjectDetail(projectId),
		initialData,
		staleTime: 5 * 60 * 1000, // 5分钟缓存
		gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

// 使用相关项目的 hook
export function useRelatedProjects(projectId: string) {
	return useQuery({
		queryKey: ["related-projects", projectId],
		queryFn: () => fetchRelatedProjects(projectId),
		staleTime: 10 * 60 * 1000, // 相关项目缓存更久
		gcTime: 30 * 60 * 1000,
		retry: 2,
	});
}

// 使用点赞功能的 hook
export function useProjectLike(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (isLiked: boolean) => toggleProjectLike(projectId, isLiked),
		onMutate: async (isLiked: boolean) => {
			// 取消任何进行中的请求
			await queryClient.cancelQueries({
				queryKey: ["project", projectId],
			});

			// 获取当前数据
			const previousProject = queryClient.getQueryData<ProjectDetail>([
				"project",
				projectId,
			]);

			// 乐观更新
			if (previousProject) {
				queryClient.setQueryData<ProjectDetail>(
					["project", projectId],
					{
						...previousProject,
						userLike: !isLiked,
						_count: {
							...previousProject._count,
							likes:
								previousProject._count.likes +
								(isLiked ? -1 : 1),
						},
					},
				);
			}

			return { previousProject };
		},
		onError: (err, variables, context) => {
			// 发生错误时回滚
			if (context?.previousProject) {
				queryClient.setQueryData(
					["project", projectId],
					context.previousProject,
				);
			}
		},
		onSettled: () => {
			// 无论成功或失败都重新获取数据
			queryClient.invalidateQueries({ queryKey: ["project", projectId] });
		},
	});
}

// 使用收藏功能的 hook
export function useProjectBookmark(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (isBookmarked: boolean) =>
			toggleProjectBookmark(projectId, isBookmarked),
		onMutate: async (isBookmarked: boolean) => {
			await queryClient.cancelQueries({
				queryKey: ["project", projectId],
			});

			const previousProject = queryClient.getQueryData<ProjectDetail>([
				"project",
				projectId,
			]);

			if (previousProject) {
				queryClient.setQueryData<ProjectDetail>(
					["project", projectId],
					{
						...previousProject,
						userBookmark: !isBookmarked,
					},
				);
			}

			return { previousProject };
		},
		onError: (err, variables, context) => {
			if (context?.previousProject) {
				queryClient.setQueryData(
					["project", projectId],
					context.previousProject,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["project", projectId] });
		},
	});
}

// 预取项目详情的 hook
export function usePrefetchProjectDetail() {
	const queryClient = useQueryClient();

	const prefetchProject = (projectId: string) => {
		queryClient.prefetchQuery({
			queryKey: ["project", projectId],
			queryFn: () => fetchProjectDetail(projectId),
			staleTime: 5 * 60 * 1000,
		});
	};

	return { prefetchProject };
}
