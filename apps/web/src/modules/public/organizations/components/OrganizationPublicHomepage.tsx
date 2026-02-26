"use client";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { EventHostSubscriptionButton } from "@community/ui/shared/EventHostSubscriptionButton";
import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";
import { OrganizationSwitcher } from "@account/organizations/components/OrganizationSwitcher";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Calendar,
	ExternalLink,
	Loader2,
	MapPin,
	Settings,
	Share2,
	Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useOrganizationBySlug } from "../hooks/useOrganizationBySlug";
import { MemberList } from "./MemberCard";
import { OrganizationEvents } from "./OrganizationEvents";
import { OrganizationMobileBottomToolbar } from "./OrganizationMobileBottomToolbar";
import { QRCodeCard } from "./QRCodeCard";

interface OrganizationMember {
	id: string;
	role: string;
	createdAt: string;
	user: {
		id: string;
		name: string;
		username: string | null;
		image: string | null;
		cpValue: number;
		createdAt: string;
		userRoleString: string | null;
		currentWorkOn: string | null;
		email?: string | null;
		skills?: string[];
	};
}

interface FunctionalRoleAssignment {
	id: string;
	roleType: "system" | "custom";
	startDate: string;
	endDate: string | null;
	status: "ACTIVE" | "UPCOMING" | "HISTORICAL" | "INACTIVE";
	user: {
		id: string;
		name?: string | null;
		username?: string | null;
		image?: string | null;
		email?: string | null;
	};
	organization: {
		id: string;
		name: string;
		slug: string;
	} | null;
	functionalRole: {
		id: string;
		name: string;
		description: string;
		applicableScope: string | null;
	};
}

interface OrganizationPublicHomepageProps {
	slug: string;
}

const IS_ORGANIZATION_APPLICATION_OPEN = false;

function resolveMemberDisplayName(
	...values: Array<string | null | undefined>
): string {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value;
		}
	}
	return "匿名成员";
}

export function OrganizationPublicHomepage({
	slug,
}: OrganizationPublicHomepageProps) {
	const t = useTranslations("organizations");
	const locale = useLocale();
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

	const {
		data: organization,
		isLoading,
		error,
	} = useOrganizationBySlug(slug);
	const authStatus = useAuthStatus();
	const authSession = authStatus.user ? { user: authStatus.user } : null;

	const isLoggedIn = !!authSession?.user;
	const currentUser = authSession?.user;

	const userMembership = useMemo(() => {
		if (!organization || !currentUser) return null;
		return (
			organization.members?.find((m) => m.user.id === currentUser.id) ||
			null
		);
	}, [organization, currentUser]);

	const organizationMembers = organization?.members;
	const adminMembers = useMemo<OrganizationMember[]>(() => {
		if (!organizationMembers) {
			return [];
		}
		return organizationMembers.filter(
			(member) => member.role === "owner" || member.role === "admin",
		);
	}, [organizationMembers]);

	const isMember = !!userMembership;
	const isMemberAdmin =
		userMembership?.role === "owner" || userMembership?.role === "admin";

	const {
		data: activeFunctionalRoles = [],
		isLoading: functionalRolesLoading,
		error: functionalRolesError,
	} = useQuery<FunctionalRoleAssignment[]>({
		queryKey: ["organization-functional-roles", slug],
		queryFn: async (): Promise<FunctionalRoleAssignment[]> => {
			const params = new URLSearchParams({
				organizationSlug: slug,
				status: "active",
				limit: "100",
			});
			const response = await fetch(
				`/api/functional-roles/assignments?${params.toString()}`,
			);

			if (!response.ok) {
				throw new Error("Failed to fetch functional roles");
			}

			const data = await response.json();
			return (data.assignments || []) as FunctionalRoleAssignment[];
		},
		staleTime: 1000 * 60,
	});

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: organization?.name,
					text:
						organization?.description ||
						t("public.joinCommunity", {
							name: organization?.name || "",
						}),
					url: window.location.href,
				});
			} catch (error) {
				console.error("Error sharing:", error);
			}
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert(t("public.linkCopied"));
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<MobilePageHeader title="组织详情" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="animate-pulse">
								<div className="h-6 bg-gray-200 dark:bg-[#262626] rounded w-1/3 mb-2" />
								<div className="h-4 bg-accent rounded w-2/3" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background">
				<MobilePageHeader title="组织详情" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<EmptyState
						title="加载组织失败"
						description="请稍后重试。"
						action={
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors"
							>
								重新加载
							</button>
						}
					/>
				</div>
			</div>
		);
	}

	if (!organization) {
		return notFound();
	}

	const contactInfo = organization.contactInfo
		? JSON.parse(organization.contactInfo)
		: {};
	const coverImageSrc = organization.coverImage ?? null;
	const hasCoverImage = Boolean(coverImageSrc);

	const functionalRolesErrorMessage =
		functionalRolesError instanceof Error
			? functionalRolesError.message
			: functionalRolesError
				? "加载职能角色失败"
				: null;

	return (
		<>
			<MobilePageHeader title={organization.name} />
			<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-24 md:pb-8">
				{/* Back link / Org Switcher */}
				{isMember ? (
					<div className="hidden md:flex items-center justify-between mb-4">
						<OrganizationSwitcher
							currentSlug={organization.slug}
							currentName={organization.name}
							currentLogo={organization.logo}
						/>
						<div className="flex items-center gap-2">
							{isMemberAdmin && (
								<Link
									href={`/orgs/${organization.slug}/settings/general`}
								>
									<button
										type="button"
										className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-gray-600 dark:text-muted-foreground rounded-md text-xs font-bold hover:bg-muted hover:text-black dark:hover:text-white transition-colors"
									>
										<Settings className="h-3.5 w-3.5" />
										设置
									</button>
								</Link>
							)}
						</div>
					</div>
				) : (
					<Link
						href="/orgs"
						className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-black dark:hover:text-white transition-colors mb-4"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						返回组织列表
					</Link>
				)}

				{/* Header */}
				<div className="mb-6 pb-6 border-b border-gray-100 dark:border-border">
					{/* Tags */}
					<div className="flex flex-wrap gap-2 mb-3">
						{organization.tags.slice(0, 5).map((tag) => (
							<span
								key={tag}
								className="px-2 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider border border-border"
							>
								{tag}
							</span>
						))}
						{organization.tags.length > 5 && (
							<span className="px-2 py-0.5 text-gray-400 text-[10px] font-bold">
								+{organization.tags.length - 5}
							</span>
						)}
					</div>
					<div className="flex items-start gap-4">
						<OrganizationLogo
							name={organization.name}
							logoUrl={organization.logo}
							className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl border-2 border-border shadow-sm"
						/>
						<div className="flex-1 min-w-0">
							<h1 className="font-brand text-3xl lg:text-5xl font-bold leading-tight mb-2 text-foreground">
								{organization.name}
							</h1>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-2">
								{organization.summary ||
									(organization.description
										? organization.description.slice(
												0,
												120,
											) +
											(organization.description.length >
											120
												? "..."
												: "")
										: t("public.joinCommunity", {
												name: organization.name,
											}))}
							</p>
						</div>
					</div>
				</div>

				{/* Banner Image */}
				{hasCoverImage && (
					<div className="rounded-xl overflow-hidden shadow-sm border border-border h-48 lg:h-72 mb-8">
						<Image
							src={coverImageSrc ?? ""}
							alt={organization.name}
							width={1200}
							height={400}
							className="w-full h-full object-cover"
							priority
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
						/>
					</div>
				)}

				{/* Main Content Grid: 8 + 4 */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
					{/* Left: Content (8 cols) */}
					<div className="lg:col-span-8 space-y-8">
						{/* About */}
						{organization.description && (
							<div>
								<SectionDivider title={t("public.aboutUs")} />
								<div className="prose prose-sm prose-gray dark:prose-invert max-w-none font-sans leading-7 overflow-x-hidden break-words">
									<ReactMarkdown>
										{organization.description}
									</ReactMarkdown>
								</div>
							</div>
						)}

						{/* Admin Team */}
						<div>
							<SectionDivider title="管理团队" />
							<MemberList
								members={adminMembers.map((member) => {
									const memberName = resolveMemberDisplayName(
										member.user.name,
										member.user.username,
										member.user.email,
									);
									return {
										id: member.id,
										name: memberName,
										image: member.user.image,
										profileLink: member.user.username
											? `/u/${member.user.username}`
											: undefined,
										badge: (
											<span
												className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
													member.role === "owner"
														? "bg-black text-white dark:bg-white dark:text-black border-transparent"
														: "bg-accent text-gray-600 dark:text-muted-foreground border-border"
												}`}
											>
												{member.role === "owner"
													? "组织者"
													: "管理员"}
											</span>
										),
										subtitle: member.user.userRoleString,
										currentWorkOn:
											member.user.currentWorkOn,
										skills: member.user.skills,
									};
								})}
								columns={2}
								emptyMessage="暂无公开的管理团队信息"
							/>
							{organization.membersCount > 0 && (
								<Link
									href={`/orgs/${organization.slug}/members`}
									className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
								>
									查看全部 {organization.membersCount} 位成员
									<Users className="h-3.5 w-3.5" />
								</Link>
							)}
						</div>

						{/* Membership Requirements */}
						{organization.membershipRequirements && (
							<div>
								<SectionDivider
									title={t("public.membershipRequirements")}
								/>
								<div className="prose prose-sm prose-gray dark:prose-invert max-w-none font-sans leading-7 overflow-x-hidden break-words">
									<ReactMarkdown>
										{organization.membershipRequirements}
									</ReactMarkdown>
								</div>
							</div>
						)}

						{/* Organization Events */}
						<div>
							<SectionDivider title="组织活动" />
							<OrganizationEvents
								organizationId={organization.id}
								organizationSlug={organization.slug}
							/>
						</div>

						{/* Core Members / Functional Roles */}
						<div>
							<SectionDivider title={t("public.coreMembers")} />
							{functionalRolesLoading ? (
								<div className="flex items-center justify-center py-6">
									<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
								</div>
							) : functionalRolesErrorMessage ? (
								<p className="text-sm text-red-600">
									{functionalRolesErrorMessage}
								</p>
							) : (
								<MemberList
									members={activeFunctionalRoles.map(
										(assignment) => {
											const memberName =
												resolveMemberDisplayName(
													assignment.user.name,
													assignment.user.username,
													assignment.user.email,
												);
											return {
												id: assignment.id,
												name: memberName,
												image:
													assignment.user.image ??
													null,
												profileLink: assignment.user
													.username
													? `/u/${assignment.user.username}`
													: undefined,
												badge: (
													<>
														<span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-800/30">
															{resolveRoleDisplayName(
																assignment.functionalRole,
															)}
														</span>
														<span className="px-2 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider border border-border">
															{assignment.roleType ===
															"custom"
																? "组织自定义"
																: "系统预设"}
														</span>
													</>
												),
												subtitle: `组织：${assignment.organization?.name || "未指定"} · 任期：${formatDateDisplay(
													assignment.startDate,
												)} ~ ${formatDateDisplay(assignment.endDate)}`,
												description:
													assignment.functionalRole
														.description ?? null,
											};
										},
									)}
									columns={1}
									emptyMessage="暂无在任职能角色成员"
								/>
							)}
						</div>
					</div>

					{/* Right: Sticky Sidebar (4 cols, desktop only) */}
					<div className="hidden lg:block lg:col-span-4 relative">
						<div className="sticky top-16 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
							{/* Action Card */}
							<div className="bg-card border border-border rounded-lg p-5 shadow-sm">
								{/* Stats row */}
								<div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-4">
									<span className="flex items-center gap-1.5">
										<Users className="h-3.5 w-3.5" />
										{organization.membersCount}{" "}
										{t("public.members")}
									</span>
									<span className="w-px h-3 bg-gray-200 dark:bg-[#262626]" />
									<span className="flex items-center gap-1.5">
										<Calendar className="h-3.5 w-3.5" />
										{organization.eventsCount}{" "}
										{t("public.events")}
									</span>
								</div>

								{/* Location */}
								{organization.location && (
									<div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
										<MapPin className="h-3.5 w-3.5 shrink-0" />
										<span>{organization.location}</span>
									</div>
								)}

								{/* CTA Buttons */}
								<div className="space-y-2.5">
									{userMembership ? (
										<>
											<Link
												href={`/orgs/${organization.slug}/members`}
												className="block w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-md font-bold text-sm text-center shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
											>
												{t("public.enterOrganization")}
											</Link>
											<Link
												href={`/orgs/${organization.slug}/invite-member`}
												className="flex items-center justify-center gap-2 w-full bg-card border border-border text-foreground py-2 rounded-md font-bold text-xs hover:bg-muted transition-colors"
											>
												<Users className="h-3.5 w-3.5" />
												邀请成员
											</Link>
											{(userMembership.role === "owner" ||
												userMembership.role ===
													"admin") && (
												<Link
													href={`/orgs/${organization.slug}/settings/members`}
													className="flex items-center justify-center gap-2 w-full bg-card border border-border text-foreground py-2 rounded-md font-bold text-xs hover:bg-muted transition-colors"
												>
													{t(
														"public.manageOrganization",
													)}
												</Link>
											)}
										</>
									) : IS_ORGANIZATION_APPLICATION_OPEN ? (
										isLoggedIn ? (
											<Link
												href={`/orgs/${organization.slug}/apply`}
												className="flex items-center justify-center gap-2 w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
											>
												{t("public.applyToJoin")}
											</Link>
										) : (
											<Link
												href={`/auth/login?redirectTo=/orgs/${organization.slug}/apply`}
												className="flex items-center justify-center gap-2 w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
											>
												{t("public.loginToApply")}
											</Link>
										)
									) : null}

									<EventHostSubscriptionButton
										organizationId={organization.id}
										hostName={organization.name}
										variant="outline"
										size="sm"
									/>

									<button
										type="button"
										onClick={handleShare}
										className="flex items-center justify-center gap-2 w-full text-muted-foreground py-2 rounded-md text-xs font-bold hover:bg-muted transition-colors"
									>
										<Share2 className="h-3.5 w-3.5" />
										{t("public.share")}
									</button>
								</div>
							</div>

							{/* QR Codes */}
							{userMembership && organization.memberQrCode && (
								<QRCodeCard
									title="成员群二维码"
									qrCodeUrl={organization.memberQrCode}
									description="扫码加入成员群"
								/>
							)}
							{organization.audienceQrCode && (
								<QRCodeCard
									title={`${t("public.wechatGroup")} (观众群)`}
									qrCodeUrl={organization.audienceQrCode}
									description={t("public.scanToJoin")}
								/>
							)}

							{/* Contact Info */}
							{Object.keys(contactInfo).length > 0 && (
								<div className="bg-card border border-border rounded-lg p-5 shadow-sm">
									<h3 className="font-brand text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground mb-3">
										{t("public.contactInfo")}
									</h3>
									<div className="space-y-3 text-sm">
										{contactInfo.wechat && (
											<div className="flex gap-3 items-start p-2 rounded-md hover:bg-muted transition-colors">
												<div className="w-5 text-center text-gray-400 mt-0.5 text-xs">
													微信
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-mono text-xs text-foreground break-all">
														{contactInfo.wechat}
													</div>
												</div>
											</div>
										)}
										{contactInfo.email && (
											<div className="flex gap-3 items-start p-2 rounded-md hover:bg-muted transition-colors">
												<div className="w-5 text-center text-gray-400 mt-0.5 text-xs">
													邮箱
												</div>
												<div className="flex-1 min-w-0">
													<div className="text-xs text-foreground break-all">
														{contactInfo.email}
													</div>
												</div>
											</div>
										)}
										{contactInfo.website && (
											<div className="flex gap-3 items-start p-2 rounded-md hover:bg-muted transition-colors">
												<div className="w-5 text-center text-gray-400 mt-0.5 text-xs">
													网站
												</div>
												<div className="flex-1 min-w-0">
													<a
														href={
															contactInfo.website
														}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-foreground hover:text-gray-600 dark:hover:text-[#A3A3A3] flex items-center gap-1 break-all"
													>
														{t("public.visit")}
														<ExternalLink className="h-3 w-3 shrink-0" />
													</a>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Organization Stats */}
							<div className="bg-card border border-border rounded-lg p-5 shadow-sm">
								<h3 className="font-brand text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground mb-3">
									{t("public.organizationStats")}
								</h3>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between items-center">
										<span className="text-xs text-muted-foreground">
											{t("public.totalMembers")}
										</span>
										<span className="font-mono font-bold text-sm text-foreground">
											{organization.membersCount}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-xs text-muted-foreground">
											{t("public.eventsCount")}
										</span>
										<span className="font-mono font-bold text-sm text-foreground">
											{organization.eventsCount}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-xs text-muted-foreground">
											{t("public.founded")}
										</span>
										<span className="font-mono font-bold text-sm text-foreground">
											{new Date(
												organization.createdAt,
											).toLocaleDateString(
												locale === "zh"
													? "zh-CN"
													: "en-US",
												{
													year: "numeric",
													month: "long",
												},
											)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Mobile: Action buttons (shown below content on mobile, above bottom toolbar) */}
				<div className="lg:hidden mt-8 space-y-4">
					{/* QR Codes */}
					{userMembership && organization.memberQrCode && (
						<QRCodeCard
							title="成员群二维码"
							qrCodeUrl={organization.memberQrCode}
							description="扫码加入成员群"
						/>
					)}
					{organization.audienceQrCode && (
						<QRCodeCard
							title={`${t("public.wechatGroup")} (观众群)`}
							qrCodeUrl={organization.audienceQrCode}
							description={t("public.scanToJoin")}
						/>
					)}
				</div>
			</div>
			<OrganizationMobileBottomToolbar
				organizationId={organization.id}
				organizationName={organization.name}
				organizationSlug={organization.slug}
				isApplicationOpen={IS_ORGANIZATION_APPLICATION_OPEN}
				isLoggedIn={isLoggedIn}
				userMembership={userMembership}
			/>
		</>
	);
}

function SectionDivider({ title }: { title: string }) {
	return (
		<div className="flex items-center gap-3 mb-4">
			<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
				{title}
			</h3>
			<div className="h-px bg-gray-100 dark:bg-[#262626] flex-1" />
		</div>
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
