import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { SectionCard } from "../common/SectionCard";

type Work = {
	title: string;
	tag: string;
	owner: string;
};

type ProjectSubmission = {
	project?: {
		title?: string | null;
		projectTags?: string[];
		user?: { name?: string | null };
	};
	user?: { id?: string; name?: string | null } | null;
	submitter?: { id?: string } | null;
	submitterId?: string | null;
	userId?: string | null;
};

export function WorksSection({
	projectSubmissions = [],
	locale,
	eventId,
	userId,
}: {
	projectSubmissions?: ProjectSubmission[];
	locale: string;
	eventId: string;
	userId?: string;
}) {
	const works: Work[] = projectSubmissions.map((submission) => ({
		title: submission.project?.title || "未命名作品",
		tag: submission.project?.projectTags?.[0] || "作品",
		owner:
			submission.project?.user?.name || submission.user?.name || "参赛者",
	}));

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

	return (
		<SectionCard
			id="works"
			title="作品广场"
			ctaLabel="查看全部作品"
			ctaHref={`/${locale}/events/${eventId}/submissions`}
		>
			{works.length > 0 ? (
				<div className="grid gap-3 md:grid-cols-3">
					{works.slice(0, 3).map((work, idx) => (
						<Card
							key={`${work.title}-${idx}`}
							className="shadow-none bg-gradient-to-br from-white to-slate-50"
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base">
									{work.title}
								</CardTitle>
								<CardDescription>{work.tag}</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
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
				<Button variant="outline" asChild className="gap-2">
					<a href={submissionHref}>提交/修改作品</a>
				</Button>
				{userSubmission ? (
					<Badge variant="secondary">已提交作品</Badge>
				) : null}
			</div>
		</SectionCard>
	);
}
