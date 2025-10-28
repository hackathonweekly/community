import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { LevelApplicationForm } from "@dashboard/level/components/LevelApplicationForm";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { UserLevelApplications } from "@dashboard/level/components/UserLevelApplications";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { Award, ExternalLink, FileText, Info } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "等级申请 - HackathonWeekly Community",
		description: "申请社区等级，解锁更多权益和功能",
	};
}

export default async function LevelApplicationPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	// 获取用户当前等级信息
	const user = await db.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			id: true,
			name: true,
			membershipLevel: true,
			creatorLevel: true,
			mentorLevel: true,
			contributorLevel: true,
			cpValue: true,
		},
	});

	if (!user) {
		throw new Error("用户不存在");
	}

	return (
		<>
			<PageHeader
				title="等级申请"
				subtitle="申请社区等级，解锁更多权益和功能"
			/>

			<div className="space-y-8">
				{/* 当前等级展示 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Award className="h-5 w-5" />
							我的等级
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<UserLevelBadges user={user} size="lg" />
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									<p>
										当前社区积分:{" "}
										<span className="font-medium text-primary">
											{user.cpValue}
										</span>{" "}
										CP
									</p>
								</div>
								<Button variant="outline" size="sm" asChild>
									<Link href="/docs/user-level-system">
										<ExternalLink className="h-4 w-4 mr-2" />
										了解参与模式
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 等级申请 Tabs */}
				<Tabs defaultValue="overview" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger
							value="overview"
							className="flex items-center gap-2"
						>
							<Info className="h-4 w-4" />
							参与模式介绍
						</TabsTrigger>
						<TabsTrigger
							value="apply"
							className="flex items-center gap-2"
						>
							<FileText className="h-4 w-4" />
							申请提升
						</TabsTrigger>
						<TabsTrigger
							value="history"
							className="flex items-center gap-2"
						>
							<Award className="h-4 w-4" />
							申请记录
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						{/* 新人引导 */}
						<Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									<div className="rounded-full bg-primary/20 p-2">
										<Info className="h-5 w-5 text-primary" />
									</div>
									<div className="space-y-2">
										<h3 className="font-semibold text-lg">
											👋 欢迎加入社区！
										</h3>
										<p className="text-muted-foreground leading-relaxed">
											我们采用
											<strong>三轨并行参与模式</strong>
											，每个人都能找到属于自己的参与轨道。
											无论你想创造产品、分享知识、组织活动，还是支持生态，这里都有你的位置。
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 基础成员等级 */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									🎯 第一步：成为共创伙伴
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									所有人都从这里开始，完成基础参与认证后可解锁三条参与轨道
								</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between p-4 rounded-lg border">
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
											<div>
												<div className="font-medium">
													L0 - 新朋友
												</div>
												<div className="text-sm text-muted-foreground">
													浏览公开内容，关注社交媒体
												</div>
											</div>
										</div>
									</div>
									<div className="flex items-center justify-between p-4 rounded-lg border">
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 rounded-full bg-orange-500" />
											<div>
												<div className="font-medium">
													L1 - 共创伙伴
												</div>
												<div className="text-sm text-muted-foreground">
													完成1次志愿协作 或
													完成"自己的产品"分享，
													同意社区公约
												</div>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 三条参与轨道概览 */}
						<div className="grid gap-6 md:grid-cols-2">
							{/* 创造者轨道 */}
							<Card className="border-orange-200 bg-orange-50/50">
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										🧡 创造者轨道
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										为热爱产品创造的你而设，从构想到商业成功
									</p>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="text-sm space-y-2">
										<div className="flex justify-between">
											<span>C1 - 探索者</span>
											<span className="text-muted-foreground">
												分享产品Idea
											</span>
										</div>
										<div className="flex justify-between">
											<span>C2 - 创造者</span>
											<span className="text-muted-foreground">
												完成MVP
											</span>
										</div>
										<div className="flex justify-between">
											<span>C3 - 增长者</span>
											<span className="text-muted-foreground">
												100+用户
											</span>
										</div>
										<div className="text-xs text-muted-foreground pt-2">
											还有C4领跑者、C5引领者等更高等级...
										</div>
									</div>
								</CardContent>
							</Card>

							{/* 导师轨道 */}
							<Card className="border-yellow-200 bg-yellow-50/50">
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										💛 导师轨道
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										为传承知识、赋能他人的你而设
									</p>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="text-sm space-y-2">
										<div className="flex justify-between">
											<span>M1 - 分享者</span>
											<span className="text-muted-foreground">
												主持分享会
											</span>
										</div>
										<div className="flex justify-between">
											<span>M2 - 讲师</span>
											<span className="text-muted-foreground">
												辅导成员MVP
											</span>
										</div>
										<div className="flex justify-between">
											<span>M3 - 导师</span>
											<span className="text-muted-foreground">
												专业声望
											</span>
										</div>
										<div className="text-xs text-muted-foreground pt-2">
											还有M4专家导师、M5荣誉导师等更高等级...
										</div>
									</div>
								</CardContent>
							</Card>

							{/* 贡献者轨道 */}
							<Card className="border-blue-200 bg-blue-50/50">
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										💙 贡献者轨道
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										为热心社区建设的你而设
									</p>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="text-sm space-y-2">
										<div className="flex justify-between">
											<span>O1 - 志愿者</span>
											<span className="text-muted-foreground">
												&gt;1小时志愿服务
											</span>
										</div>
										<div className="flex justify-between">
											<span>O2 - 共创者</span>
											<span className="text-muted-foreground">
												组织20+人活动
											</span>
										</div>
										<div className="flex justify-between">
											<span>O3 - 组织者</span>
											<span className="text-muted-foreground">
												组织3场大型活动
											</span>
										</div>
										<div className="text-xs text-muted-foreground pt-2">
											还有O4核心组织者、O5荣誉贡献者等更高等级...
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* 申请须知 */}
						<Card className="border-amber-200 bg-amber-50/50">
							<CardHeader>
								<CardTitle className="text-lg">
									📋 申请须知
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid md:grid-cols-2 gap-4 text-sm">
									<div className="space-y-2">
										<h4 className="font-medium">
											申请规则
										</h4>
										<ul className="space-y-1 text-muted-foreground">
											<li>
												• 只能申请下一级等级，不可跨级
											</li>
											<li>
												• 同轨道同时只能有一个待审核申请
											</li>
											<li>• 3-7个工作日内处理申请</li>
										</ul>
									</div>
									<div className="space-y-2">
										<h4 className="font-medium">
											所需材料
										</h4>
										<ul className="space-y-1 text-muted-foreground">
											<li>
												• 创造者：产品链接、用户数据等
											</li>
											<li>
												• 导师：分享记录、辅导证明等
											</li>
											<li>
												• 贡献者：贡献记录、积分明细等
											</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 了解更多按钮 */}
						<div className="flex justify-center">
							<Button asChild size="lg">
								<Link href="/docs/user-level-system">
									<FileText className="h-4 w-4 mr-2" />
									查看完整参与模式文档
								</Link>
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="apply" className="space-y-6">
						<LevelApplicationForm currentLevels={user} />
					</TabsContent>

					<TabsContent value="history" className="space-y-6">
						<UserLevelApplications />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
