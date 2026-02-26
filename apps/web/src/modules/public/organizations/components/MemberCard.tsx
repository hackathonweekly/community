import { UserAvatar } from "@community/ui/shared/UserAvatar";
import Link from "next/link";
import type { ReactNode } from "react";

interface MemberCardProps {
	name: string;
	image: string | null;
	profileLink?: string;
	badge?: ReactNode;
	subtitle?: string | null;
	description?: string | null;
	skills?: string[];
	currentWorkOn?: string | null;
}

export function MemberCard({
	name,
	image,
	profileLink,
	badge,
	subtitle,
	description,
	skills,
	currentWorkOn,
}: MemberCardProps) {
	const content = (
		<div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
			<UserAvatar
				name={name}
				avatarUrl={image}
				className="h-10 w-10 shrink-0"
			/>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5 flex-wrap">
					<span className="font-brand text-sm font-bold text-foreground group-hover:text-gray-600 dark:group-hover:text-[#A3A3A3] transition-colors truncate">
						{name}
					</span>
					{badge}
				</div>
				{subtitle && (
					<p className="text-[11px] font-mono text-muted-foreground mt-0.5 line-clamp-1">
						{subtitle}
					</p>
				)}
				{currentWorkOn && (
					<p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
						{currentWorkOn}
					</p>
				)}
				{description && (
					<p className="text-[11px] text-gray-400 dark:text-muted-foreground mt-1 line-clamp-2">
						{description}
					</p>
				)}
				{skills && skills.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-1.5">
						{skills.slice(0, 4).map((skill) => (
							<span
								key={skill}
								className="px-1.5 py-0.5 bg-gray-50 dark:bg-secondary text-muted-foreground rounded text-[9px] font-medium border border-gray-100 dark:border-border"
							>
								{skill}
							</span>
						))}
						{skills.length > 4 && (
							<span className="text-[9px] text-gray-400 font-medium px-1 py-0.5">
								+{skills.length - 4}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);

	if (profileLink) {
		return (
			<Link href={profileLink} className="block">
				{content}
			</Link>
		);
	}

	return content;
}

interface MemberListProps {
	members: Array<{
		id: string;
		name: string;
		image: string | null;
		profileLink?: string;
		badge?: ReactNode;
		subtitle?: string | null;
		description?: string | null;
		skills?: string[];
		currentWorkOn?: string | null;
	}>;
	columns?: 1 | 2;
	emptyMessage?: string;
}

export function MemberList({
	members,
	columns = 2,
	emptyMessage = "暂无成员信息",
}: MemberListProps) {
	if (members.length === 0) {
		return (
			<p className="text-xs text-gray-400 dark:text-muted-foreground">
				{emptyMessage}
			</p>
		);
	}

	return (
		<div
			className={`grid gap-2 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
		>
			{members.map((member) => (
				<MemberCard key={member.id} {...member} />
			))}
		</div>
	);
}
