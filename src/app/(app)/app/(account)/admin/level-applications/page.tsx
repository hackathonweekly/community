import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { LevelApplicationReviewList } from "@dashboard/level/components/LevelApplicationReviewList";
import { AdminLevelManagement } from "@dashboard/level/components/AdminLevelManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, Clock, CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "等级申请管理 - HackathonWeekly Community",
		description: "审核和管理用户等级申请",
	};
}

export default async function LevelApplicationsAdminPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	// 检查权限：需要是管理员或组织管理员
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		include: {
			members: {
				include: {
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
				},
			},
		},
	});

	if (!user) {
		throw new Error("用户不存在");
	}

	const isAdmin = user.role === "admin" || user.role === "super_admin";
	const organizationRoles = user.members.map((m) => m.role);
	const isOrgAdmin = organizationRoles.some(
		(role) => role === "admin" || role === "owner" || role === "manager",
	);

	if (!isAdmin && !isOrgAdmin) {
		return redirect("/app");
	}

	// 获取申请统计数据
	const [pendingCount, approvedCount, rejectedCount, totalCount] =
		await Promise.all([
			db.levelApplication.count({ where: { status: "PENDING" } }),
			db.levelApplication.count({ where: { status: "APPROVED" } }),
			db.levelApplication.count({ where: { status: "REJECTED" } }),
			db.levelApplication.count(),
		]);

	return (
		<>
			<PageHeader
				title="等级申请管理"
				subtitle="审核和管理用户等级申请"
			/>

			<div className="space-y-8">
				{/* 统计概览 */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								待审核
							</CardTitle>
							<Clock className="h-4 w-4 text-yellow-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-yellow-600">
								{pendingCount}
							</div>
							<p className="text-xs text-muted-foreground">
								需要您审核的申请
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								已批准
							</CardTitle>
							<CheckCircle2 className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{approvedCount}
							</div>
							<p className="text-xs text-muted-foreground">
								批准的申请数量
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								已拒绝
							</CardTitle>
							<XCircle className="h-4 w-4 text-red-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{rejectedCount}
							</div>
							<p className="text-xs text-muted-foreground">
								拒绝的申请数量
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								总申请
							</CardTitle>
							<Award className="h-4 w-4 text-blue-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-blue-600">
								{totalCount}
							</div>
							<p className="text-xs text-muted-foreground">
								历史总申请数量
							</p>
						</CardContent>
					</Card>
				</div>

				{/* 权限说明 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							审核权限说明
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Badge variant="secondary">
									{isAdmin ? "超级管理员" : "组织管理员"}
								</Badge>
								<span className="text-sm">
									您的当前权限级别
								</span>
							</div>

							<div className="text-sm text-muted-foreground space-y-2">
								<p>
									<strong>组织管理员</strong>可以审核：
								</p>
								<ul className="list-disc list-inside ml-4 space-y-1">
									<li>
										基础参与层级申请（新朋友 → 共创伙伴）
									</li>
									<li>
										专业轨道 1-2
										级申请（C1/C2、T1/T2、S1/S2）
									</li>
								</ul>

								<p className="pt-2">
									<strong>超级管理员</strong>可以审核：
								</p>
								<ul className="list-disc list-inside ml-4 space-y-1">
									<li>所有等级申请，包括高级别专业轨道</li>
									<li>可以直接调整用户等级（降级操作）</li>
								</ul>
							</div>

							{user.members.length > 0 && (
								<div className="pt-3 border-t">
									<p className="text-sm font-medium mb-2">
										您管理的组织：
									</p>
									<div className="flex flex-wrap gap-2">
										{user.members.map((member) => (
											<Badge
												key={member.id}
												variant="outline"
											>
												{member.organization.name} (
												{member.role})
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* 管理员直接等级管理 */}
				<AdminLevelManagement isAdmin={isAdmin} />

				{/* 待审核申请列表 */}
				<LevelApplicationReviewList />
			</div>
		</>
	);
}
