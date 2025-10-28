"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserFunctionalRoleAssignment } from "../types";
import { ChevronDown, Clock, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

interface FunctionalRolesSectionProps {
	assignments: UserFunctionalRoleAssignment[];
}

const STATUS_LABEL: Record<UserFunctionalRoleAssignment["status"], string> = {
	ACTIVE: "在任",
	UPCOMING: "即将生效",
	HISTORICAL: "已结束",
	INACTIVE: "已停用",
};

const ROLE_TYPE_LABEL: Record<
	UserFunctionalRoleAssignment["roleType"],
	string
> = {
	system: "系统预设",
	custom: "组织自定义",
};

export function FunctionalRolesSection({
	assignments,
}: FunctionalRolesSectionProps) {
	const systemRoleMessages = useTranslations("profile.systemRoles");
	const resolveRoleDisplayName = useMemo(
		() =>
			createFunctionalRoleDisplayNameResolver((key) =>
				systemRoleMessages(
					key as Parameters<typeof systemRoleMessages>[0],
				),
			),
		[systemRoleMessages],
	);
	const [showHistory, setShowHistory] = useState(false);

	const { activeAssignments, historyAssignments } = useMemo(() => {
		const active = assignments.filter(
			(assignment) =>
				assignment.status === "ACTIVE" ||
				assignment.status === "UPCOMING",
		);
		const history = assignments.filter(
			(assignment) =>
				assignment.status === "HISTORICAL" ||
				assignment.status === "INACTIVE",
		);

		return { activeAssignments: active, historyAssignments: history };
	}, [assignments]);

	if (assignments.length === 0) {
		return null;
	}

	return (
		<TooltipProvider delayDuration={150}>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>职能角色</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{activeAssignments.length > 0 ? (
						<div className="space-y-3">
							{activeAssignments.map((assignment) => (
								<Tooltip key={assignment.id}>
									<TooltipTrigger asChild>
										<div className="flex flex-col gap-1 rounded-lg border p-3 transition hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between">
											<div>
												<p className="text-sm font-medium">
													{assignment.organization
														?.name ||
														"未指定组织"}{" "}
													·{" "}
													{resolveRoleDisplayName(
														assignment.functionalRole,
													)}
												</p>
												<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
													<span>
														任期：
														{formatDateDisplay(
															assignment.startDate,
														)}{" "}
														~{" "}
														{formatDateDisplay(
															assignment.endDate,
														)}
													</span>
													<Badge
														variant={
															assignment.status ===
															"UPCOMING"
																? "secondary"
																: "outline"
														}
													>
														{
															STATUS_LABEL[
																assignment
																	.status
															]
														}
													</Badge>
												</div>
											</div>
											<div className="flex flex-wrap items-center gap-2">
												<Badge
													variant={
														assignment.roleType ===
														"custom"
															? "secondary"
															: "outline"
													}
												>
													{
														ROLE_TYPE_LABEL[
															assignment.roleType
														]
													}
												</Badge>
											</div>
										</div>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs text-xs leading-relaxed">
										<p className="font-semibold">
											{resolveRoleDisplayName(
												assignment.functionalRole,
											)}
										</p>
										{assignment.functionalRole
											.description && (
											<p className="mt-1 text-primary-foreground">
												{
													assignment.functionalRole
														.description
												}
											</p>
										)}
										<p className="mt-2 flex items-center gap-1 text-primary-foreground">
											<Clock className="h-3 w-3" />
											<span>
												{formatDateDisplay(
													assignment.startDate,
												)}{" "}
												~{" "}
												{formatDateDisplay(
													assignment.endDate,
												)}
											</span>
										</p>
									</TooltipContent>
								</Tooltip>
							))}
						</div>
					) : (
						<div className="flex items-center gap-2 rounded border border-dashed p-3 text-sm text-muted-foreground">
							<ShieldAlert className="h-4 w-4" />
							<span>当前暂无在任职能角色</span>
						</div>
					)}

					{historyAssignments.length > 0 && (
						<div className="space-y-3">
							<button
								type="button"
								onClick={() => setShowHistory((prev) => !prev)}
								className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm"
							>
								<span>
									历史角色
									<Badge variant="secondary" className="ml-2">
										{historyAssignments.length}
									</Badge>
								</span>
								<ChevronDown
									className={`h-4 w-4 transition ${showHistory ? "rotate-180" : ""}`}
								/>
							</button>
							{showHistory && (
								<div className="space-y-2">
									{historyAssignments.map((assignment) => (
										<div
											key={assignment.id}
											className="rounded-lg border bg-muted/40 p-3 text-xs"
										>
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium">
													{assignment.organization
														?.name ||
														"未指定组织"}{" "}
													·{" "}
													{resolveRoleDisplayName(
														assignment.functionalRole,
													)}
												</span>
												<Badge variant="outline">
													{
														STATUS_LABEL[
															assignment.status
														]
													}
												</Badge>
											</div>
											<div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
												<span>
													任期：
													{formatDateDisplay(
														assignment.startDate,
													)}{" "}
													~{" "}
													{formatDateDisplay(
														assignment.endDate,
													)}
												</span>
											</div>
											{assignment.functionalRole
												.description && (
												<p className="mt-1 text-muted-foreground">
													{
														assignment
															.functionalRole
															.description
													}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}

function formatDateDisplay(value: string | null) {
	if (!value) {
		return "长期";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
