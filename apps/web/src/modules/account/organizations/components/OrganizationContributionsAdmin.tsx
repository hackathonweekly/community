"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import {
	Trophy,
	Clock,
	CheckCircle,
	XCircle,
	Eye,
	User,
	Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";

interface OrganizationContribution {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	type: string;
	title: string;
	description: string;
	requestedCpValue: number;
	approvedCpValue?: number;
	status: "pending" | "organization_approved" | "approved" | "rejected";
	submittedAt: string;
	reviewedAt?: string;
	evidenceUrl?: string;
	reviewComment?: string;
}

export function OrganizationContributionsAdmin() {
	const [contributions, setContributions] = useState<
		OrganizationContribution[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("pending");

	useEffect(() => {
		fetchContributions();
	}, []);

	const fetchContributions = async () => {
		try {
			const orgSlug = window.location.pathname.split("/")[2];
			const response = await fetch(
				`/api/organizations/${orgSlug}/contributions`,
			);
			if (response.ok) {
				const data = await response.json();
				setContributions(data.contributions || []);
			}
		} catch (error) {
			console.error("Failed to fetch contributions:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleContributionAction = async (
		contributionId: string,
		action: "approve" | "reject",
		approvedCpValue?: number,
		comment?: string,
	) => {
		try {
			const orgSlug = window.location.pathname.split("/")[2];
			const response = await fetch(
				`/api/organizations/${orgSlug}/contributions/${contributionId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action,
						approvedCpValue,
						comment,
					}),
				},
			);
			if (response.ok) {
				fetchContributions();
			}
		} catch (error) {
			console.error("Failed to handle contribution:", error);
		}
	};

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			pending: {
				variant: "outline" as const,
				text: "待组织审核",
				icon: Clock,
			},
			organization_approved: {
				variant: "default" as const,
				text: "组织已批准",
				icon: CheckCircle,
			},
			approved: {
				variant: "destructive" as const,
				text: "已批准",
				icon: CheckCircle,
			},
			rejected: {
				variant: "secondary" as const,
				text: "已拒绝",
				icon: XCircle,
			},
		};
		return (
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.pending
		);
	};

	const getFilteredContributions = () => {
		switch (activeTab) {
			case "pending":
				return contributions.filter((c) => c.status === "pending");
			case "organization_approved":
				return contributions.filter(
					(c) => c.status === "organization_approved",
				);
			case "approved":
				return contributions.filter((c) => c.status === "approved");
			case "rejected":
				return contributions.filter((c) => c.status === "rejected");
			default:
				return contributions;
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	const filteredContributions = getFilteredContributions();
	const pendingCount = contributions.filter(
		(c) => c.status === "pending",
	).length;
	const totalCpValue = contributions
		.filter((c) => c.status === "approved")
		.reduce((sum, c) => sum + (c.approvedCpValue || 0), 0);

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">贡献管理</h1>
					<p className="text-muted-foreground mt-2">
						审核组织成员贡献申请
					</p>
				</div>
				{pendingCount > 0 && (
					<Badge
						variant="destructive"
						className="text-base px-3 py-1"
					>
						{pendingCount} 个待审核
					</Badge>
				)}
			</div>

			{/* 贡献统计概览 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总贡献申请
						</CardTitle>
						<Trophy className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{contributions.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							待审核
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{pendingCount}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							已批准贡献值
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{totalCpValue}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							审核通过率
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{contributions.length > 0
								? Math.round(
										(contributions.filter(
											(c) => c.status === "approved",
										).length /
											contributions.length) *
											100,
									)
								: 0}
							%
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 贡献申请列表 */}
			<Card>
				<CardHeader>
					<CardTitle>贡献申请</CardTitle>
					<CardDescription>组织成员的贡献申请管理</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="space-y-4"
					>
						<TabsList>
							<TabsTrigger value="pending">
								待审核 (
								{
									contributions.filter(
										(c) => c.status === "pending",
									).length
								}
								)
							</TabsTrigger>
							<TabsTrigger value="organization_approved">
								组织已批准 (
								{
									contributions.filter(
										(c) =>
											c.status ===
											"organization_approved",
									).length
								}
								)
							</TabsTrigger>
							<TabsTrigger value="approved">
								已批准 (
								{
									contributions.filter(
										(c) => c.status === "approved",
									).length
								}
								)
							</TabsTrigger>
							<TabsTrigger value="rejected">
								已拒绝 (
								{
									contributions.filter(
										(c) => c.status === "rejected",
									).length
								}
								)
							</TabsTrigger>
						</TabsList>

						<TabsContent value={activeTab}>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>申请人</TableHead>
										<TableHead>贡献类型</TableHead>
										<TableHead>贡献标题</TableHead>
										<TableHead>申请积分</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>申请时间</TableHead>
										<TableHead>操作</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredContributions.map(
										(contribution) => {
											const statusConfig = getStatusBadge(
												contribution.status,
											);
											const StatusIcon =
												statusConfig.icon;
											return (
												<TableRow key={contribution.id}>
													<TableCell>
														<div className="flex items-center space-x-2">
															<User className="w-4 h-4" />
															<div>
																<div className="font-medium">
																	{
																		contribution.userName
																	}
																</div>
																<div className="text-sm text-muted-foreground">
																	{
																		contribution.userEmail
																	}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Badge variant="outline">
															{contribution.type}
														</Badge>
													</TableCell>
													<TableCell>
														<div>
															<div className="font-medium">
																{
																	contribution.title
																}
															</div>
															<div className="text-sm text-muted-foreground truncate max-w-xs">
																{
																	contribution.description
																}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center">
															<Trophy className="w-4 h-4 mr-1 text-yellow-500" />
															{
																contribution.requestedCpValue
															}
															{contribution.approvedCpValue && (
																<span className="text-sm text-muted-foreground ml-1">
																	(批准:{" "}
																	{
																		contribution.approvedCpValue
																	}
																	)
																</span>
															)}
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant={
																statusConfig.variant
															}
														>
															<StatusIcon className="w-3 h-3 mr-1" />
															{statusConfig.text}
														</Badge>
													</TableCell>
													<TableCell>
														<div className="flex items-center">
															<Calendar className="w-4 h-4 mr-1" />
															{new Date(
																contribution.submittedAt,
															).toLocaleDateString()}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center space-x-2">
															<Button
																size="sm"
																variant="outline"
															>
																<Eye className="w-4 h-4" />
															</Button>
															{contribution.status ===
																"pending" && (
																<>
																	<Button
																		size="sm"
																		onClick={() =>
																			handleContributionAction(
																				contribution.id,
																				"approve",
																				contribution.requestedCpValue,
																			)
																		}
																	>
																		<CheckCircle className="w-4 h-4 mr-1" />
																		通过
																	</Button>
																	<Button
																		size="sm"
																		variant="outline"
																		onClick={() =>
																			handleContributionAction(
																				contribution.id,
																				"reject",
																			)
																		}
																	>
																		<XCircle className="w-4 h-4 mr-1" />
																		拒绝
																	</Button>
																</>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										},
									)}
								</TableBody>
							</Table>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
