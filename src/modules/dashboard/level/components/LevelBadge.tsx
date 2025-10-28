"use client";

import { Badge } from "@/components/ui/badge";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getLevelInfo } from "@/lib/level-utils";
import type {
	CreatorLevel,
	MembershipLevel,
	MentorLevel,
	ContributorLevel,
} from "@prisma/client";
import { Shield, Star, GraduationCap, Briefcase } from "lucide-react";

interface LevelBadgeProps {
	levelType: "membership" | "creator" | "mentor" | "contributor";
	level: string;
	showTooltip?: boolean;
	size?: "sm" | "md" | "lg";
}

const LEVEL_ICONS = {
	membership: Shield,
	creator: Star,
	mentor: GraduationCap,
	contributor: Briefcase,
} as const;

export function LevelBadge({
	levelType,
	level,
	showTooltip = true,
	size = "md",
}: LevelBadgeProps) {
	const levelInfo = getLevelInfo(levelType, level);

	if (!levelInfo) {
		return null;
	}

	const Icon = LEVEL_ICONS[levelType];

	const sizeClasses = {
		sm: "text-xs px-2 py-1",
		md: "text-sm px-3 py-1",
		lg: "text-base px-4 py-2",
	};

	const iconSizeClasses = {
		sm: "h-3 w-3",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};

	const badge = (
		<Badge
			variant="outline"
			className={`${levelInfo.color} ${sizeClasses[size]} inline-flex items-center gap-1 font-medium border`}
		>
			<Icon className={iconSizeClasses[size]} />
			{levelInfo.label}
		</Badge>
	);

	if (!showTooltip) {
		return badge;
	}

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<span className="cursor-help">{badge}</span>
			</HoverCardTrigger>
			<HoverCardContent className="w-80" side="top">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Icon className="h-5 w-5" />
						<div>
							<h4 className="font-semibold">{levelInfo.label}</h4>
							<p className="text-sm text-muted-foreground">
								{level}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<div>
							<p className="text-sm font-medium text-muted-foreground mb-1">
								等级说明
							</p>
							<p className="text-sm">{levelInfo.description}</p>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground mb-1">
								达成标准
							</p>
							<p className="text-sm">{levelInfo.requirements}</p>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground mb-1">
								权益内容
							</p>
							<p className="text-sm">{levelInfo.benefits}</p>
						</div>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

// 用户等级组合显示组件
interface UserLevelBadgesProps {
	user: {
		membershipLevel?: MembershipLevel | string | null;
		creatorLevel?: CreatorLevel | string | null;
		mentorLevel?: MentorLevel | string | null;
		contributorLevel?: ContributorLevel | string | null;
		// 为了向后兼容，允许其他属性
		[key: string]: any;
	};
	showTooltip?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function UserLevelBadges({
	user,
	showTooltip = true,
	size = "md",
	className = "",
}: UserLevelBadgesProps) {
	const levels = [];

	// 仅依据 membershipLevel 展示基础等级；未设置时按新朋友处理，避免误判为伙伴
	const membershipLevel = (user.membershipLevel ?? "VISITOR") as string;
	const membershipInfo = getLevelInfo("membership", membershipLevel);
	if (membershipInfo) {
		levels.push({
			type: "membership" as const,
			level: membershipLevel,
		});
	}

	// 专业轨道等级
	if (user.creatorLevel) {
		levels.push({
			type: "creator" as const,
			level: user.creatorLevel,
		});
	}

	if (user.mentorLevel) {
		levels.push({
			type: "mentor" as const,
			level: user.mentorLevel,
		});
	}

	if (user.contributorLevel) {
		levels.push({
			type: "contributor" as const,
			level: user.contributorLevel,
		});
	}

	// 现在我们总是有至少一个基础等级，不需要默认"新朋友"显示
	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{levels.map(({ type, level }) => (
				<LevelBadge
					key={`${type}-${level}`}
					levelType={type}
					level={level}
					showTooltip={showTooltip}
					size={size}
				/>
			))}
		</div>
	);
}
