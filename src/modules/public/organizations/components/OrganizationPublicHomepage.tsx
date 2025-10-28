"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFunctionalRoleDisplayNameResolver } from "@/features/functional-roles/display-name";
import { EventHostSubscriptionButton } from "@/components/shared/EventHostSubscriptionButton";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { OrganizationLogo } from "@dashboard/organizations/components/OrganizationLogo";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Calendar,
	ExternalLink,
	Heart,
	Loader2,
	MapPin,
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
import { QRCodeCard } from "./QRCodeCard";
import { useRouter } from "next/navigation";
import { ScrollBackButton } from "@/app/(public)/[locale]/projects/[projectId]/components/ScrollBackButton";
import { OrganizationMobileBottomToolbar } from "./OrganizationMobileBottomToolbar";

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

interface OrganizationEvent {
	id: string;
	title: string;
	startTime: string;
	type: string;
}

interface OrganizationData {
	id: string;
	name: string;
	slug: string;
	summary: string | null;
	description: string | null;
	location: string | null;
	tags: string[];
	logo: string | null;
	coverImage: string | null;
	audienceQrCode: string | null;
	memberQrCode: string | null;
	membershipRequirements: string | null;
	contactInfo: string | null;
	members: OrganizationMember[];
	events: OrganizationEvent[];
	membersCount: number;
	eventsCount: number;
	createdAt: string;
}

interface OrganizationPublicHomepageProps {
	slug: string;
}

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
	const router = useRouter();
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
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(window.location.href);
			alert(t("public.linkCopied"));
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (error || !organization) {
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
			<ScrollBackButton href="/orgs" />
			<div className="container max-w-6xl mx-auto px-4 pt-8 pb-24 md:pb-8 overflow-x-hidden">
				<Link href="/orgs">
					<Button variant="ghost" className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						返回
					</Button>
				</Link>
				{/* Page Header */}
				<div className="mb-8 pt-6 text-center">
					<h1 className="mb-3 font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
						{organization.name}
					</h1>
					<p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
						{organization.summary ||
							(organization.description
								? organization.description.slice(0, 100) +
									(organization.description.length > 100
										? "..."
										: "")
								: t("public.joinCommunity", {
										name: organization.name,
									}))}
					</p>
				</div>

				{/* Hero Section */}
				<div className="mb-12">
					{hasCoverImage && (
						<div className="relative w-full overflow-hidden rounded-lg shadow-sm h-48 sm:h-56 lg:h-64 mb-6">
							<Image
								src={coverImageSrc ?? ""}
								alt={organization.name}
								fill
								className="object-cover"
								priority
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
							/>
						</div>
					)}

					<div
						className={`rounded-lg py-6 ${
							hasCoverImage
								? "bg-white/90 backdrop-blur-sm shadow-xl dark:bg-gray-900/90"
								: "bg-gradient-to-r from-primary/10 to-primary/5"
						}`}
					>
						<div className="px-4 sm:px-6">
							<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
								{/* Logo */}
								<div className="flex justify-center lg:justify-start shrink-0">
									<OrganizationLogo
										name={organization.name}
										logoUrl={organization.logo}
										className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg"
									/>
								</div>

								{/* Info Section */}
								<div className="flex-1 text-center lg:text-left space-y-4">
									{organization.location && (
										<div className="flex items-center justify-center lg:justify-start gap-2">
											<MapPin className="h-4 w-4" />
											<span className="text-sm">
												{organization.location}
											</span>
										</div>
									)}

									<div className="flex items-center justify-center lg:justify-start gap-4 text-sm flex-wrap">
										<span className="flex items-center gap-1.5">
											<Users className="h-4 w-4" />
											{organization.membersCount}{" "}
											{t("public.members")}
										</span>
										<span className="flex items-center gap-1.5">
											<Calendar className="h-4 w-4" />
											{organization.eventsCount}{" "}
											{t("public.events")}
										</span>
										<span>
											{t("public.founded")}{" "}
											{new Date(
												organization.createdAt,
											).getFullYear()}
										</span>
									</div>

									{organization.tags.length > 0 && (
										<div className="flex flex-wrap justify-center lg:justify-start gap-2">
											{organization.tags
												.slice(0, 5)
												.map((tag) => (
													<Badge
														key={tag}
														variant="secondary"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
											{organization.tags.length > 5 && (
												<Badge
													variant="outline"
													className="text-xs"
												>
													+
													{organization.tags.length -
														5}
												</Badge>
											)}
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<div className="w-full lg:w-auto lg:min-w-[220px] shrink-0">
									<div className="flex flex-col gap-2.5">
										{/* Primary action based on user membership */}
										{userMembership ? (
											<>
												<Button
													size="lg"
													className="w-full"
													asChild
												>
													<Link
														href={`/app/${organization.slug}`}
													>
														{t(
															"public.enterOrganization",
														)}
													</Link>
												</Button>
												<Button
													variant="outline"
													size="lg"
													className="w-full"
													asChild
												>
													<Link
														href={`/orgs/${organization.slug}/invite-member`}
													>
														<Users className="h-4 w-4 mr-2" />
														邀请成员
													</Link>
												</Button>
												{(userMembership.role ===
													"owner" ||
													userMembership.role ===
														"admin") && (
													<Button
														variant="outline"
														size="lg"
														className="w-full"
														asChild
													>
														<Link
															href={`/app/${organization.slug}/settings/members`}
														>
															{t(
																"public.manageOrganization",
															)}
														</Link>
													</Button>
												)}
											</>
										) : isLoggedIn ? (
											<Button
												size="lg"
												className="w-full"
												asChild
											>
												<Link
													href={`/orgs/${organization.slug}/apply`}
												>
													<Heart className="h-4 w-4 mr-2" />
													{t("public.applyToJoin")}
												</Link>
											</Button>
										) : (
											<Button
												size="lg"
												className="w-full"
												asChild
											>
												<Link
													href={`/auth/login?redirectTo=/orgs/${organization.slug}/apply`}
												>
													<Heart className="h-4 w-4 mr-2" />
													{t("public.loginToApply")}
												</Link>
											</Button>
										)}

										<EventHostSubscriptionButton
											organizationId={organization.id}
											hostName={organization.name}
											variant="outline"
											size="lg"
										/>

										<Button
											variant="ghost"
											size="lg"
											onClick={handleShare}
											className="w-full"
										>
											<Share2 className="h-4 w-4 mr-2" />
											{t("public.share")}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid lg:grid-cols-3 gap-6 w-full">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Description */}
						{organization.description && (
							<Card>
								<CardHeader>
									<CardTitle>{t("public.aboutUs")}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="prose max-w-none overflow-x-hidden break-words">
										<ReactMarkdown>
											{organization.description}
										</ReactMarkdown>
									</div>
								</CardContent>
							</Card>
						)}

						<Card>
							<CardHeader>
								<CardTitle>管理团队</CardTitle>
							</CardHeader>
							<CardContent>
								<MemberList
									members={adminMembers.map((member) => {
										const memberName =
											resolveMemberDisplayName(
												member.user.name,
												member.user.username,
												member.user.email,
											);
										return {
											id: member.id,
											name: memberName,
											image: member.user.image,
											profileLink: member.user.username
												? `/${locale}/u/${member.user.username}`
												: undefined,
											badge: (
												<Badge
													variant={
														member.role === "owner"
															? "default"
															: "secondary"
													}
													className="text-xs"
												>
													{member.role === "owner"
														? "组织者"
														: "管理员"}
												</Badge>
											),
											subtitle:
												member.user.userRoleString,
										};
									})}
									columns={2}
									emptyMessage="暂无公开的管理团队信息"
								/>
							</CardContent>
						</Card>

						{/* Membership Requirements */}
						{organization.membershipRequirements && (
							<Card>
								<CardHeader>
									<CardTitle>
										{t("public.membershipRequirements")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="prose max-w-none overflow-x-hidden break-words">
										<ReactMarkdown>
											{
												organization.membershipRequirements
											}
										</ReactMarkdown>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Organization Events */}
						<OrganizationEvents
							organizationId={organization.id}
							organizationSlug={organization.slug}
						/>

						{/* Members Preview */}
						<Card>
							<CardHeader>
								<CardTitle>{t("public.coreMembers")}</CardTitle>
							</CardHeader>
							<CardContent>
								{functionalRolesLoading ? (
									<div className="flex items-center justify-center py-6">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : functionalRolesErrorMessage ? (
									<p className="text-sm text-destructive">
										{functionalRolesErrorMessage}
									</p>
								) : (
									<MemberList
										members={activeFunctionalRoles.map(
											(assignment) => {
												const memberName =
													resolveMemberDisplayName(
														assignment.user.name,
														assignment.user
															.username,
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
														? `/${locale}/u/${assignment.user.username}`
														: undefined,
													badge: (
														<>
															<Badge variant="secondary">
																{resolveRoleDisplayName(
																	assignment.functionalRole,
																)}
															</Badge>
															<Badge variant="outline">
																{assignment.roleType ===
																"custom"
																	? "组织自定义"
																	: "系统预设"}
															</Badge>
														</>
													),
													subtitle: `组织：${assignment.organization?.name || "未指定"} · 任期：${formatDateDisplay(
														assignment.startDate,
													)} ~ ${formatDateDisplay(assignment.endDate)}`,
													description:
														assignment
															.functionalRole
															.description ??
														null,
												};
											},
										)}
										columns={1}
										emptyMessage="暂无在任职能角色成员"
									/>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Member QR Code - Only show to existing members */}
						{userMembership && organization.memberQrCode && (
							<QRCodeCard
								title="成员群二维码"
								qrCodeUrl={organization.memberQrCode}
								description="扫码加入成员群"
							/>
						)}

						{/* Audience QR Code */}
						{organization.audienceQrCode && (
							<QRCodeCard
								title={`${t("public.wechatGroup")} (观众群)`}
								qrCodeUrl={organization.audienceQrCode}
								description={t("public.scanToJoin")}
							/>
						)}

						{/* Contact Info */}
						{Object.keys(contactInfo).length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										{t("public.contactInfo")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{contactInfo.wechat && (
											<div className="flex justify-between items-start gap-2 min-w-0">
												<span className="text-sm text-muted-foreground flex-shrink-0">
													{t("public.wechat")}
												</span>
												<span className="text-sm font-mono text-right break-all flex-1 min-w-0">
													{contactInfo.wechat}
												</span>
											</div>
										)}
										{contactInfo.email && (
											<div className="flex justify-between items-start gap-2 min-w-0">
												<span className="text-sm text-muted-foreground flex-shrink-0">
													{t("public.email")}
												</span>
												<span className="text-sm text-right break-all flex-1 min-w-0">
													{contactInfo.email}
												</span>
											</div>
										)}
										{contactInfo.website && (
											<div className="flex justify-between items-start gap-2 min-w-0">
												<span className="text-sm text-muted-foreground flex-shrink-0">
													{t("public.website")}
												</span>
												<a
													href={contactInfo.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:underline flex items-center gap-1 text-right break-all flex-1 min-w-0"
												>
													{t("public.visit")}{" "}
													<ExternalLink className="h-3 w-3 shrink-0" />
												</a>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Organization Stats */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{t("public.organizationStats")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											{t("public.totalMembers")}
										</span>
										<span className="font-medium text-base">
											{organization.membersCount}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											{t("public.eventsCount")}
										</span>
										<span className="font-medium text-base">
											{organization.eventsCount}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											{t("public.founded")}
										</span>
										<span className="font-medium text-base">
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
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<OrganizationMobileBottomToolbar
				organizationId={organization.id}
				organizationName={organization.name}
				isLoggedIn={isLoggedIn}
				userMembership={userMembership}
			/>
		</>
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
