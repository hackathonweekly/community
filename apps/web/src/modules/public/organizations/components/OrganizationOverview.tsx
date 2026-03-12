"use client";

import { Calendar, MapPin, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface OrganizationOverviewEvent {
	id: string;
	title: string;
	startTime: string;
	type: string;
}

interface OrganizationOverviewData {
	name: string;
	slug: string;
	summary: string | null;
	description: string | null;
	location: string | null;
	tags: string[];
	membersCount: number;
	eventsCount: number;
	events: OrganizationOverviewEvent[];
}

interface OrganizationOverviewProps {
	organization: OrganizationOverviewData;
}

export function OrganizationOverview({
	organization,
}: OrganizationOverviewProps) {
	const t = useTranslations("organizations.public");
	const recentEvents = organization.events.slice(0, 3);

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-border bg-card p-5">
				<h2 className="mb-2 font-brand text-xl font-bold text-foreground">
					{organization.name}
				</h2>
				{organization.summary && (
					<p className="mb-3 text-sm text-muted-foreground">
						{organization.summary}
					</p>
				)}
				<p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
					{organization.description ||
						t("joinCommunity", { name: organization.name })}
				</p>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				<div className="rounded-lg border border-border bg-card p-3 sm:p-4">
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
						<Users className="h-3.5 w-3.5" />
						{t("members")}
					</div>
					<p className="mt-1.5 font-brand text-xl font-bold leading-none text-foreground sm:mt-2 sm:text-2xl">
						{organization.membersCount}
					</p>
				</div>
				<div className="rounded-lg border border-border bg-card p-3 sm:p-4">
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
						<Calendar className="h-3.5 w-3.5" />
						{t("events")}
					</div>
					<p className="mt-1.5 font-brand text-xl font-bold leading-none text-foreground sm:mt-2 sm:text-2xl">
						{organization.eventsCount}
					</p>
				</div>
				<div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
						<MapPin className="h-3.5 w-3.5" />
						位置
					</div>
					<p className="mt-1.5 truncate text-xs font-medium text-foreground sm:mt-2 sm:text-sm">
						{organization.location || "未填写"}
					</p>
				</div>
			</div>

			{organization.tags.length > 0 && (
				<div className="rounded-xl border border-border bg-card p-5">
					<h3 className="mb-3 text-sm font-semibold text-foreground">
						标签
					</h3>
					<div className="flex flex-wrap gap-2">
						{organization.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
							>
								{tag}
							</span>
						))}
					</div>
				</div>
			)}

			<div className="rounded-xl border border-border bg-card p-5">
				<div className="mb-3 flex items-center justify-between gap-3">
					<h3 className="text-sm font-semibold text-foreground">
						最近活动
					</h3>
					<Link
						href={`/orgs/${organization.slug}?tab=events`}
						className="text-xs font-semibold text-muted-foreground hover:text-foreground"
					>
						查看全部
					</Link>
				</div>

				{recentEvents.length === 0 ? (
					<p className="text-sm text-muted-foreground">暂无活动</p>
				) : (
					<div className="space-y-2">
						{recentEvents.map((event) => (
							<div
								key={event.id}
								className="rounded-lg border border-border bg-background p-3"
							>
								<p className="line-clamp-1 text-sm font-medium text-foreground">
									{event.title}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{new Date(
										event.startTime,
									).toLocaleDateString()}
								</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
