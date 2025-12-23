"use client";

import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { SectionCard } from "../common/SectionCard";

type Work = {
	title: string;
	stage?: string | null;
	tag: string;
	owner: string;
	cover?: string | null;
	href?: string;
};

type ProjectSubmission = {
	id?: string;
	project?: {
		title?: string | null;
		subtitle?: string | null;
		projectTags?: string[];
		stage?: string | null;
		screenshots?: string[] | null;
		user?: { id?: string | null; name?: string | null };
		id?: string | null;
	};
	user?: { id?: string; name?: string | null } | null;
	submitter?: { id?: string } | null;
	submitterId?: string | null;
	userId?: string | null;
};

const formatStage = (stage?: string | null) => {
	switch (stage) {
		case "DEVELOPMENT":
			return "开发中";
		case "IDEA_VALIDATION":
			return "想法验证";
		case "PROTOTYPING":
			return "原型期";
		case "MVP":
			return "MVP";
		case "LAUNCHED":
			return "已上线";
		case "GROWTH":
			return "增长期";
		default:
			return stage || null;
	}
};

export function WorksSection({
	projectSubmissions = [],
	locale,
	eventId,
	userId,
	onRequireLogin,
	onSubmitWork,
	enabled = true,
}: {
	projectSubmissions?: ProjectSubmission[];
	locale: string;
	eventId: string;
	userId?: string;
	onRequireLogin?: (redirectTo?: string) => void;
	onSubmitWork?: () => void;
	enabled?: boolean;
}) {
	if (!enabled) return null;

	const works: Work[] = projectSubmissions.map((submission) => {
		const project = submission.project;
		const cover = project?.screenshots?.[0] || null;
		const stage = formatStage(project?.stage || null);
		const tag =
			project?.projectTags?.[0] || (stage ? `阶段：${stage}` : "作品");
		const owner = project?.user?.name || submission.user?.name || "参赛者";
		const href = submission.id
			? `/${locale}/events/${eventId}/submissions/${submission.id}`
			: project?.id
				? `/projects/${project.id}`
				: `/${locale}/events/${eventId}/submissions`;

		return {
			title: project?.title || "未命名作品",
			tag,
			stage,
			cover,
			owner,
			href,
		};
	});

	const userSubmission =
		projectSubmissions.find(
			(submission) =>
				submission.submitterId === userId ||
				submission.userId === userId ||
				submission.user?.id === userId ||
				submission.submitter?.id === userId,
		) || null;

	const submissionHref = userSubmission
		? `/app/events/${eventId}/submissions`
		: `/app/events/${eventId}/submissions/new`;
	const unauthenticatedSubmissionHref = `/app/events/${eventId}/submissions`;

	const handleViewAll = () => {
		window.location.assign(`/${locale}/events/${eventId}/submissions`);
	};

	const handleSubmit = () => {
		if (onSubmitWork) {
			onSubmitWork();
			return;
		}
		if (!userId) {
			const redirectTarget = unauthenticatedSubmissionHref;
			if (onRequireLogin) {
				onRequireLogin(redirectTarget);
				return;
			}
			window.location.assign(redirectTarget);
			return;
		}
		window.location.assign(submissionHref);
	};

	const handleCardClick = (href?: string) => {
		if (!href) return;
		window.open(href, "_blank");
	};

	return (
		<SectionCard
			id="works"
			title="作品广场"
			ctaLabel="查看全部作品"
			ctaOnClick={handleViewAll}
		>
			{works.length > 0 ? (
				<div className="space-y-3">
					{works.slice(0, 3).map((work, idx) => (
						<Card
							key={`${work.title}-${idx}`}
							className="group overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
							onClick={() => handleCardClick(work.href)}
						>
							<CardContent className="p-3">
								<div className="flex items-center gap-3">
									{/* Thumbnail */}
									<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
										{work.cover ? (
											<Image
												src={work.cover}
												alt={work.title}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-muted-foreground">
												<ImageIcon className="h-5 w-5 opacity-70" />
											</div>
										)}
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1 flex flex-col gap-1">
										<div className="flex items-center gap-2 flex-wrap">
											<h4 className="line-clamp-1 font-semibold leading-tight group-hover:text-primary transition-colors text-sm md:text-base">
												{work.title}
											</h4>
										</div>

										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span className="truncate">
												{work.owner}
											</span>
											{work.stage && (
												<>
													<span>·</span>
													<Badge
														variant="secondary"
														className="h-5 px-1.5 font-normal text-[10px]"
													>
														{work.stage}
													</Badge>
												</>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					暂未提交作品，入口保留。
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					className="gap-2"
					onClick={handleSubmit}
				>
					提交/修改作品
				</Button>
				{/* {userSubmission ? (
					<Badge variant="secondary">已提交作品</Badge>
				) : null} */}
			</div>
		</SectionCard>
	);
}
