"use client";

import {} from "@community/ui/ui/card";
import { useCallback, useEffect, useState } from "react";
import type { CommentSystemProps } from "./CommentComponents";
import { CommentSystem } from "./CommentSystem";

interface CommentSectionProps extends CommentSystemProps {
	title?: string;
	className?: string;
}

export function CommentSection({
	title = "评论交流",
	className,
	...commentSystemProps
}: CommentSectionProps) {
	const [enabled, setEnabled] = useState<boolean | null>(null);

	// API 调用函数
	const apiCall = useCallback(
		async (url: string, options: RequestInit = {}) => {
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "网络错误" }));

				// 为403错误创建特殊的错误对象
				if (response.status === 403) {
					const error = new Error(errorData.error || "权限不足");
					(error as any).status = 403;
					throw error;
				}

				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			return response.json();
		},
		[],
	);

	// 检查评论功能是否启用
	const checkEnabled = useCallback(async () => {
		try {
			await apiCall(
				`/api/comments/entity/${commentSystemProps.entityType}/${commentSystemProps.entityId}?limit=1`,
			);
			setEnabled(true);
		} catch (error) {
			if (error instanceof Error && error.message.includes("关闭")) {
				setEnabled(false);
			} else {
				// 其他错误认为是启用的，让CommentSystem处理具体错误
				setEnabled(true);
			}
		}
	}, [commentSystemProps.entityType, commentSystemProps.entityId, apiCall]);

	useEffect(() => {
		checkEnabled();
	}, [checkEnabled]);

	// 如果还在检查状态，显示加载中
	if (enabled === null) {
		return null; // 或者可以显示skeleton
	}

	// 如果评论功能关闭，不显示整个评论区域
	if (!enabled) {
		return null;
	}

	// 如果评论功能启用，显示完整的评论区域
	return <CommentSystem {...commentSystemProps} />;
}
