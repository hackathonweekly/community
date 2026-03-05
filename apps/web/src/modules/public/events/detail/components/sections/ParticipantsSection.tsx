"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { getLifeStatusLabel } from "@community/lib-shared/utils/life-status";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

type ParticipantsSectionProps = {
	event: EventData;
	currentUserId?: string;
	onRequireLogin: () => void;
};

export function ParticipantsSection({
	event,
	currentUserId,
	onRequireLogin,
}: ParticipantsSectionProps) {
	const pathname = usePathname();
	const approvedRegs = (event.registrations ?? []).filter(
		(reg) => reg.status === "APPROVED",
	);
	const totalCount = approvedRegs.length;
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const filteredParticipants = useMemo(() => {
		if (!searchTerm.trim()) {
			return approvedRegs;
		}

		const searchLower = searchTerm.toLowerCase();
		return approvedRegs.filter((participant) => {
			const name = participant.user.name?.toLowerCase() || "";
			const username = participant.user.username?.toLowerCase() || "";
			const bio = participant.user.bio?.toLowerCase() || "";
			const userRoleString =
				participant.user.userRoleString?.toLowerCase() || "";
			const currentWorkOn =
				participant.user.currentWorkOn?.toLowerCase() || "";
			const lifeStatus = participant.user.lifeStatus?.toLowerCase() || "";
			const lifeStatusLabel =
				getLifeStatusLabel(
					participant.user.lifeStatus,
				)?.toLowerCase() || "";

			return (
				name.includes(searchLower) ||
				username.includes(searchLower) ||
				bio.includes(searchLower) ||
				userRoleString.includes(searchLower) ||
				currentWorkOn.includes(searchLower) ||
				lifeStatus.includes(searchLower) ||
				lifeStatusLabel.includes(searchLower)
			);
		});
	}, [approvedRegs, searchTerm]);

	const totalPages = Math.ceil(filteredParticipants.length / pageSize);
	const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
	const pagedParticipants = filteredParticipants.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	useEffect(() => {
		setPage(1);
	}, [searchTerm]);

	useEffect(() => {
		if (totalPages === 0) {
			if (page !== 1) {
				setPage(1);
			}
			return;
		}
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

	const getFallbackText = (
		name?: string | null,
		username?: string | null,
	) => {
		const source = (name ?? username ?? "").trim();
		if (!source) return "??";
		return Array.from(source).slice(0, 2).join("").toUpperCase();
	};

	return (
		<SectionCard id="participants" title={`已报名 (${totalCount})`}>
			{!currentUserId ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
					<div className="rounded-full bg-white p-3 shadow-sm">
						<Users className="h-6 w-6 text-blue-500/40" />
					</div>
					<div className="space-y-1">
						<p className="text-sm font-medium">登录后查看报名者</p>
						<p className="text-xs text-slate-400">
							报名者的详细信息仅对登录用户开放
						</p>
					</div>
					<Button size="sm" onClick={onRequireLogin}>
						登录查看
					</Button>
				</div>
			) : totalCount > 0 ? (
				<div className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-xs">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="搜索成员姓名、角色、当前在做、简介等..."
								value={searchTerm}
								onChange={(event) =>
									setSearchTerm(event.target.value)
								}
								className="pl-9"
							/>
						</div>
						{searchTerm ? (
							<p className="text-xs text-slate-500">
								找到 {filteredParticipants.length} 位成员
							</p>
						) : null}
					</div>

					{filteredParticipants.length > 0 ? (
						<div className="space-y-3">
							<div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
								{pagedParticipants.map((reg) => {
									const displayName =
										reg.user.name ||
										reg.user.username ||
										"未命名";
									const roleText =
										reg.user.userRoleString?.trim() || "";
									const currentWorkOnText =
										reg.user.currentWorkOn?.trim() || "";
									const bioText = reg.user.bio?.trim() || "";
									const lifeStatusText =
										getLifeStatusLabel(
											reg.user.lifeStatus,
										) ||
										reg.user.lifeStatus ||
										"";
									const hasProfileDetails =
										roleText ||
										currentWorkOnText ||
										bioText ||
										lifeStatusText;
									return (
										<Link
											key={reg.id}
											href={`/u/${reg.user.username || reg.user.id}?returnTo=${pathname}`}
											className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/30"
										>
											<Avatar className="h-10 w-10 border border-white shadow-sm">
												<AvatarImage
													src={
														reg.user.image ||
														undefined
													}
													alt={displayName}
												/>
												<AvatarFallback className="text-xs font-medium leading-none">
													{getFallbackText(
														reg.user.name,
														reg.user.username,
													)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p
													className="truncate text-sm font-medium text-slate-900"
													title={displayName}
												>
													{displayName}
												</p>
												{hasProfileDetails ? (
													<div className="mt-1 space-y-1">
														{(roleText ||
															lifeStatusText ||
															currentWorkOnText) && (
															<div className="flex flex-wrap items-center gap-2 text-xs">
																{roleText && (
																	<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
																		<span
																			aria-hidden="true"
																			className="h-1.5 w-1.5 rounded-full bg-blue-400"
																		/>
																		{
																			roleText
																		}
																	</span>
																)}
																{lifeStatusText && (
																	<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
																		<span
																			aria-hidden="true"
																			className="h-1.5 w-1.5 rounded-full bg-emerald-500"
																		/>
																		{
																			lifeStatusText
																		}
																	</span>
																)}
																{currentWorkOnText && (
																	<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full max-w-[240px]">
																		<span
																			aria-hidden="true"
																			className="h-1.5 w-1.5 rounded-full bg-indigo-500"
																		/>
																		<span className="truncate">
																			{
																				currentWorkOnText
																			}
																		</span>
																	</span>
																)}
															</div>
														)}
														{bioText && (
															<p className="text-xs text-slate-500 line-clamp-2">
																<span className="text-slate-600">
																	{bioText}
																</span>
															</p>
														)}
													</div>
												) : (
													<p className="text-xs text-slate-500">
														参赛者
													</p>
												)}
											</div>
										</Link>
									);
								})}
							</div>
							{totalPages > 1 && (
								<div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white/80 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
									<span>
										第 {currentPage} 页，共 {totalPages} 页
									</span>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setPage((prev) =>
													Math.max(prev - 1, 1),
												)
											}
											disabled={currentPage === 1}
										>
											上一页
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setPage((prev) =>
													Math.min(
														prev + 1,
														totalPages,
													),
												)
											}
											disabled={
												currentPage === totalPages
											}
										>
											下一页
										</Button>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
							<div className="rounded-full bg-white p-3 shadow-sm">
								<Users className="h-6 w-6 text-blue-500/40" />
							</div>
							<p className="text-sm font-medium">暂无匹配成员</p>
							<p className="text-xs text-slate-400">
								试试换个关键词搜索
							</p>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
					<div className="p-4 bg-white rounded-full shadow-sm mb-4">
						<Users className="h-8 w-8 text-blue-500/40" />
					</div>
					<p className="text-sm font-medium mb-1">暂无公开报名者</p>
					<p className="text-xs text-slate-400 max-w-xs text-center px-4">
						快来成为第一位报名者，开启精彩旅程！
					</p>
				</div>
			)}
		</SectionCard>
	);
}
