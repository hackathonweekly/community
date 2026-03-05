export interface ProjectUrlParams {
	stage?: string;
	search?: string;
	organization?: string;
	sort?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * 构建项目页面 URL 的工具函数
 * 统一处理 URL 参数编码和构建逻辑
 */
export function buildProjectsUrl(params: ProjectUrlParams = {}): string {
	const searchParams = new URLSearchParams();

	// 按照特定顺序添加参数，确保 URL 一致性
	const orderedParams: (keyof ProjectUrlParams)[] = [
		"stage",
		"search",
		"organization",
		"sort",
		"sortOrder",
	];

	for (const key of orderedParams) {
		const value = params[key];
		if (value && value.trim() !== "") {
			searchParams.set(key, encodeURIComponent(value.trim()));
		}
	}

	const queryString = searchParams.toString();
	return `/projects${queryString ? `?${queryString}` : ""}`;
}

/**
 * 合并现有参数和新参数
 * 用于在保持其他参数的同时更新特定参数
 */
export function mergeProjectUrlParams(
	currentParams: ProjectUrlParams,
	newParams: Partial<ProjectUrlParams>,
): ProjectUrlParams {
	return {
		...currentParams,
		...newParams,
		// 移除空值和空字符串
		...(Object.fromEntries(
			Object.entries(newParams).filter(
				([_, value]) =>
					value !== undefined &&
					value !== null &&
					value.toString().trim() !== "",
			),
		) as Partial<ProjectUrlParams>),
	};
}

/**
 * 从 URL 搜索参数解析项目参数
 */
export function parseProjectUrlParams(
	searchParams: URLSearchParams,
): ProjectUrlParams {
	return {
		stage: searchParams.get("stage") || undefined,
		search: searchParams.get("search") || undefined,
		organization: searchParams.get("organization") || undefined,
		sort: searchParams.get("sort") || undefined,
		sortOrder:
			(searchParams.get("sortOrder") as "asc" | "desc") || undefined,
	};
}

/**
 * 检查两个参数对象是否相等
 * 用于避免不必要的 URL 更新
 */
export function areProjectParamsEqual(
	params1: ProjectUrlParams,
	params2: ProjectUrlParams,
): boolean {
	const keys: (keyof ProjectUrlParams)[] = [
		"stage",
		"search",
		"organization",
		"sort",
		"sortOrder",
	];

	for (const key of keys) {
		const val1 = params1[key]?.trim() || "";
		const val2 = params2[key]?.trim() || "";
		if (val1 !== val2) {
			return false;
		}
	}

	return true;
}
