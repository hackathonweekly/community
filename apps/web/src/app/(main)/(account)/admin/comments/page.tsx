"use client";

import { CommentAdminDashboard } from "@community/ui/ui/comments/CommentAdminDashboard";

export default function AdminCommentsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">评论管理</h1>
				<p className="text-muted-foreground">
					管理和审核用户评论，配置评论系统设置
				</p>
			</div>

			<CommentAdminDashboard />
		</div>
	);
}
