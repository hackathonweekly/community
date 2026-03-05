"use client";

import { Badge } from "@community/ui/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { InteractiveBadge } from "@community/ui/ui/interactive-badge";
import { TruncatedText } from "@community/ui/ui/truncated-text";
import { cn } from "@community/lib-shared/utils";
import { UserLevelBadges } from "@shared/level/components/LevelBadge";
import {
	Copy,
	EyeIcon,
	ExternalLinkIcon,
	GithubIcon,
	GlobeIcon,
	Star,
	Trophy,
	TwitterIcon,
	Users,
	CalendarDays,
} from "lucide-react";
import { useCallback, type ComponentProps } from "react";
import { Button } from "@community/ui/ui/button";
import { toast } from "sonner";
import type { UserProfile } from "../types";
import { getImageUrl, getLifeStatusLabel } from "../types";

interface ProfileIdentityProps {
	user: UserProfile;
	currentUserId?: string;
	translations: {
		editProfile: string;
	};
}

export function ProfileIdentity({
	user,
	currentUserId,
	translations,
}: ProfileIdentityProps) {
	const skills = user.skills || [];
	const normalizedSkills = Array.isArray(skills)
		? skills.filter(
				(skill): skill is string =>
					typeof skill === "string" && skill.trim().length > 0,
			)
		: [];

	const copyToClipboard = useCallback((value: string, label: string) => {
		if (!value) return;
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			toast.error(`复制${label}失败，请手动复制`);
			return;
		}
		navigator.clipboard
			.writeText(value)
			.then(() => toast.success(`${label}已复制`))
			.catch(() => toast.error(`复制${label}失败，请稍后重试`));
	}, []);

	const safeExternalUrl = useCallback((raw: string | null | undefined) => {
		if (!raw) return null;
		const trimmed = raw.trim();
		if (!trimmed) return null;
		const lower = trimmed.toLowerCase();
		if (
			lower.startsWith("javascript:") ||
			lower.startsWith("data:") ||
			lower.startsWith("vbscript:")
		) {
			return null;
		}
		try {
			const url = trimmed.includes("://")
				? new URL(trimmed)
				: new URL(`https://${trimmed}`);
			if (url.protocol !== "http:" && url.protocol !== "https:") {
				return null;
			}
			return url.toString();
		} catch {
			return null;
		}
	}, []);

	const githubUrl = safeExternalUrl(user.githubUrl);
	const twitterUrl = safeExternalUrl(user.twitterUrl);
	const websiteUrl = safeExternalUrl(user.websiteUrl);

	const ExpandableValueBadge = ({
		label,
		value,
		variant,
		className,
	}: {
		label: string;
		value: string;
		variant: ComponentProps<typeof Badge>["variant"];
		className?: string;
	}) => {
		const shouldExpand =
			value.length > 18 || value.includes("\n") || value.includes("\r");

		if (!shouldExpand) {
			return (
				<Badge
					variant={variant}
					className={cn(className)}
					title={value}
				>
					{value}
				</Badge>
			);
		}

		return (
			<Dialog>
				<DialogTrigger asChild>
					<Badge
						variant={variant}
						className={cn("cursor-pointer", className)}
						title={value}
					>
						{value}
					</Badge>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{label}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<p
							className="whitespace-pre-line break-words text-sm"
							style={{ overflowWrap: "anywhere" }}
						>
							{value}
						</p>
						<div className="flex justify-end">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => copyToClipboard(value, label)}
							>
								<Copy className="h-4 w-4 mr-2" />
								复制
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	};

	return (
		<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
			{/* Avatar */}
			<div className="flex-shrink-0">
				{user.image ? (
					<img
						src={getImageUrl(user.image) || undefined}
						alt={user.name || "User"}
						className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-border"
					/>
				) : (
					<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-foreground text-xl sm:text-2xl font-bold">
						{(user.name || "User").charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			{/* Basic info */}
			<div className="flex-1 text-center sm:text-left">
				{/* Desktop edit button */}
				{currentUserId === user.id && (
					<div className="hidden sm:flex justify-end mb-1">
						<a
							href="/me/edit"
							className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
						>
							{translations.editProfile}
						</a>
					</div>
				)}

				<h1 className="text-2xl sm:text-3xl font-brand font-bold mb-2">
					<span
						className="break-words"
						style={{ overflowWrap: "anywhere" }}
					>
						{user.name || "User"}
					</span>
				</h1>

				{/* User level badges */}
				<div className="mb-3 flex justify-center sm:justify-start">
					<UserLevelBadges user={user} size="md" />
				</div>

				<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
					{user.currentWorkOn && (
						<ExpandableValueBadge
							label="当前在做"
							value={user.currentWorkOn}
							variant="default"
							className="text-sm font-medium max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[450px] truncate"
						/>
					)}
					{user.userRoleString && (
						<ExpandableValueBadge
							label="用户角色"
							value={user.userRoleString}
							variant="secondary"
							className="text-sm max-w-[160px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] truncate"
						/>
					)}
					{user.gender && user.gender !== "NOT_SPECIFIED" && (
						<div className="flex items-center text-sm text-muted-foreground">
							<Users className="h-4 w-4 mr-1" />
							{user.gender === "MALE"
								? "男"
								: user.gender === "FEMALE"
									? "女"
									: "其他"}
						</div>
					)}
					{user.region && (
						<div className="flex items-center text-sm text-muted-foreground">
							<GlobeIcon className="h-4 w-4 mr-1" />
							<span
								className="max-w-[220px] truncate"
								title={user.region}
							>
								{user.region}
							</span>
						</div>
					)}
					{user.lifeStatus && (
						<Badge variant="outline" className="text-sm">
							{getLifeStatusLabel(user.lifeStatus)}
						</Badge>
					)}
				</div>

				{/* Inline meta: views + joinDate */}
				<div className="flex items-center justify-center sm:justify-start gap-3 mb-3 text-[11px] text-gray-500 font-mono">
					<span className="flex items-center gap-1">
						<EyeIcon className="h-3 w-3" />
						{user.profileViews} 浏览
					</span>
					{user.joinedAt && (
						<>
							<span className="w-px h-3 bg-gray-200" />
							<span className="flex items-center gap-1">
								<CalendarDays className="h-3 w-3" />
								{new Date(user.joinedAt).toLocaleDateString(
									"zh-CN",
									{ year: "numeric", month: "short" },
								)}{" "}
								加入
							</span>
						</>
					)}
				</div>

				{user.bio && (
					<div className="mb-4">
						<TruncatedText
							text={user.bio}
							maxLines={4}
							maxLength={180}
							className="text-muted-foreground text-center sm:text-left"
						/>
					</div>
				)}

				{/* Skills */}
				{normalizedSkills.length > 0 && (
					<div className="mb-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 justify-center sm:justify-start">
							<Star className="h-4 w-4" />
							<span>技能</span>
						</div>
						<div className="flex flex-wrap gap-1 justify-center sm:justify-start">
							{normalizedSkills
								.slice(0, 5)
								.map((skill, index) => (
									<Badge
										key={index}
										variant="outline"
										className="text-xs bg-accent border-border text-accent-foreground max-w-[140px] truncate"
										title={skill}
									>
										{skill}
									</Badge>
								))}
							{normalizedSkills.length > 5 && (
								<Dialog>
									<DialogTrigger asChild>
										<Badge
											variant="secondary"
											className="text-xs bg-accent text-accent-foreground cursor-pointer"
										>
											+{normalizedSkills.length - 5}
										</Badge>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>技能</DialogTitle>
										</DialogHeader>
										<div className="max-h-[50vh] overflow-auto">
											<div className="flex flex-wrap gap-2">
												{normalizedSkills.map(
													(skill, index) => (
														<Badge
															key={`${skill}-${index}`}
															variant="outline"
															className="max-w-[220px] truncate"
															title={skill}
														>
															{skill}
														</Badge>
													),
												)}
											</div>
										</div>
									</DialogContent>
								</Dialog>
							)}
						</div>
					</div>
				)}

				{/* Social links */}
				{(githubUrl || twitterUrl || websiteUrl) && (
					<div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
						{githubUrl && (
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
							>
								<GithubIcon className="h-4 w-4 mr-1" />
								GitHub
							</a>
						)}
						{twitterUrl && (
							<a
								href={twitterUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
							>
								<TwitterIcon className="h-4 w-4 mr-1" />
								Twitter
							</a>
						)}
						{websiteUrl && (
							<a
								href={websiteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
							>
								<ExternalLinkIcon className="h-4 w-4 mr-1" />
								Website
							</a>
						)}
					</div>
				)}

				{/* Top Badges Display */}
				{user.userBadges && user.userBadges.length > 0 && (
					<div className="mt-4">
						<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
							{user.userBadges
								.slice(0, 3)
								.map((userBadge: any) => {
									const badge = userBadge.badge;
									const rarityColors: Record<string, string> =
										{
											COMMON: "from-gray-400 to-gray-600",
											UNCOMMON:
												"from-green-400 to-green-600",
											RARE: "from-blue-400 to-blue-600",
											EPIC: "from-purple-400 to-purple-600",
											LEGENDARY:
												"from-yellow-400 to-yellow-600",
										};
									const bgGradient =
										rarityColors[badge.rarity] ||
										rarityColors.COMMON;

									return (
										<InteractiveBadge
											key={userBadge.id}
											className="flex items-center gap-1 p-1.5 border rounded-lg hover:shadow-sm transition-shadow bg-gradient-to-r from-background to-muted/30 cursor-pointer"
											scrollToTarget="achievements-section"
										>
											<div
												className={`w-5 h-5 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center`}
											>
												<Trophy className="w-3 h-3 text-foreground" />
											</div>
											<span className="text-xs font-medium text-muted-foreground">
												{badge.name}
											</span>
										</InteractiveBadge>
									);
								})}
							{user.userBadges.length > 3 && (
								<InteractiveBadge
									className="flex items-center gap-1 p-1.5 border rounded-lg hover:shadow-sm transition-shadow bg-muted/30 cursor-pointer"
									scrollToTarget="achievements-section"
								>
									<Trophy className="w-4 h-4 text-muted-foreground" />
									<span className="text-xs text-muted-foreground">
										+{user.userBadges.length - 3}
									</span>
								</InteractiveBadge>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
