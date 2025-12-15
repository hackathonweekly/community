"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}: {
	projectSubmissions?: ProjectSubmission[];
	locale: string;
	eventId: string;
	userId?: string;
	onRequireLogin?: () => void;
}) {
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

	const handleViewAll = () => {
		if (!userId) {
			onRequireLogin?.();
			return;
		}
		window.location.href = `/${locale}/events/${eventId}/submissions`;
	};

	const handleSubmit = () => {
		if (!userId) {
			onRequireLogin?.();
			return;
		}
		window.location.href = submissionHref;
	};

	const handleCardClick = (href?: string) => {
		if (!href) return;
		if (!userId) {
			onRequireLogin?.();
			return;
		}
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
				<div className="grid gap-3 md:grid-cols-3">
					{works.slice(0, 3).map((work, idx) => (
						<Card
							key={`${work.title}-${idx}`}
							className={cn(
								"shadow-none bg-gradient-to-br from-white to-slate-50 cursor-pointer transition hover:shadow-md",
							)}
							onClick={() => handleCardClick(work.href)}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base">
									{work.title}
								</CardTitle>
								<CardDescription className="flex flex-wrap items-center gap-2">
									{work.tag}
									{work.stage ? (
										<Badge variant="secondary">
											{work.stage}
										</Badge>
									) : null}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								{work.cover ? (
									<div className="mb-3 overflow-hidden rounded-md border bg-muted/40">
										<Image
											src={work.cover}
											alt={work.title}
											width={400}
											height={240}
											className="h-28 w-full object-cover"
										/>
									</div>
								) : null}
								<Badge variant="secondary">
									🙋 {work.owner}
								</Badge>
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
				{userSubmission ? (
					<Badge variant="secondary">已提交作品</Badge>
				) : null}
			</div>
		</SectionCard>
	);
}
