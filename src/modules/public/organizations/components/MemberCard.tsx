import { UserAvatar } from "@/components/shared/UserAvatar";
import Link from "next/link";
import type { ReactNode } from "react";

interface MemberCardProps {
	name: string;
	image: string | null;
	profileLink?: string;
	badge?: ReactNode;
	subtitle?: string | null;
	description?: string | null;
}

export function MemberCard({
	name,
	image,
	profileLink,
	badge,
	subtitle,
	description,
}: MemberCardProps) {
	const content = (
		<div className="flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50">
			<UserAvatar
				name={name}
				avatarUrl={image}
				className="h-12 w-12 shrink-0"
			/>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-medium truncate">{name}</span>
					{badge}
				</div>
				{subtitle && (
					<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
						{subtitle}
					</p>
				)}
				{description && (
					<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
						{description}
					</p>
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
		return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
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
