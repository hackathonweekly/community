"use client";

import { BasicInfoDialog } from "@shared/profile/components/BasicInfoDialog";
import { ProfileCompletionNotice } from "@shared/profile/components/ProfileCompletionNotice";
import { ProfileCoreDialog } from "@/modules/account/profile/components/ProfileCoreDialog";
import { ProfileCorePreview } from "@/modules/account/profile/components/ProfileCorePreview";
import { BasicInfoSection } from "@/modules/account/profile/components/sections/BasicInfoSection";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@community/ui/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@community/ui/ui/popover";
import {
	type ProfileRequirementStatus,
	type UserProfileValidation,
	validateProfileForOrganizationApplication,
} from "@community/lib-shared/utils/profile-validation";
import { cn } from "@community/lib-shared/utils";
import {
	ArrowLeft,
	Check,
	CheckCircle,
	ChevronsUpDown,
	Heart,
	MessageSquare,
	Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OrganizationMember {
	id: string;
	role: string;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	};
}

interface InvitationRequestSummary {
	inviter: {
		id: string;
		name: string | null;
		email: string | null;
		username?: string | null;
	} | null;
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
	memberQrCode: string | null;
	audienceQrCode: string | null;
	contactInfo: string | null;
	members?: OrganizationMember[];
}

interface OrganizationApplicationFormProps {
	slug: string;
	invitationCode?: string | null;
	inviterId?: string | null;
}

export function OrganizationApplicationForm({
	slug,
	invitationCode,
	inviterId: inviterIdFromQuery,
}: OrganizationApplicationFormProps) {
	const [organization, setOrganization] = useState<OrganizationData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [organizationNotFound, setOrganizationNotFound] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [profileValidation, setProfileValidation] =
		useState<UserProfileValidation | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [profileLoading, setProfileLoading] = useState(true);
	const [profileSaving, setProfileSaving] = useState<"basic" | "core" | null>(
		null,
	);
	const [membershipStatus, setMembershipStatus] = useState<{
		isMember: boolean;
		memberRole?: string;
		memberSince?: Date;
	} | null>(null);
	const [membershipLoading, setMembershipLoading] = useState(false);
	const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false);
	const [profileCoreDialogOpen, setProfileCoreDialogOpen] = useState(false);
	const [inviterId, setInviterId] = useState<string | null>(
		inviterIdFromQuery ?? null,
	);
	const [inviterPopoverOpen, setInviterPopoverOpen] = useState(false);
	const [inviterLocked, setInviterLocked] = useState(
		Boolean(inviterIdFromQuery),
	);
	const [invitationRequest, setInvitationRequest] =
		useState<InvitationRequestSummary | null>(null);

	const router = useRouter();
	const t = useTranslations("organizations.public.application");
	const { toast } = useToast();

	const handleFixProfileField = useCallback(
		(field: ProfileRequirementStatus) => {
			if (field.sectionId === "essential-info") {
				setBasicInfoDialogOpen(true);
				document
					.getElementById("profile-basic-info")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
				return;
			}

			if (field.sectionId === "role-info") {
				setProfileCoreDialogOpen(true);
				document
					.getElementById("profile-core-info")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		},
		[],
	);

	const fetchCurrentUserProfile = useCallback(async (fallbackUser?: any) => {
		setProfileLoading(true);
		try {
			const response = await fetch("/api/profile");
			if (!response.ok) {
				throw new Error("Failed to fetch profile");
			}
			const data = await response.json();
			setCurrentUser(data.user);
		} catch (error) {
			console.error("Failed to fetch profile:", error);
			if (fallbackUser) {
				setCurrentUser(fallbackUser);
			}
		} finally {
			setProfileLoading(false);
		}
	}, []);

	const checkMembershipStatus = useCallback(async () => {
		if (!organization || !currentUser) return;

		setMembershipLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/by-slug/${organization.slug}`,
			);
			if (response.ok) {
				const orgData = await response.json();
				const member = orgData.members?.find(
					(m: any) => m.user.id === currentUser.id,
				);

				if (member) {
					setMembershipStatus({
						isMember: true,
						memberRole: member.role,
						memberSince: member.createdAt,
					});
				} else {
					setMembershipStatus({
						isMember: false,
					});
				}
			}
		} catch (error) {
			console.error("Failed to check membership status:", error);
		} finally {
			setMembershipLoading(false);
		}
	}, [organization, currentUser]);

	useEffect(() => {
		fetchOrganization();
		checkAuthStatus();
	}, [slug, invitationCode, inviterIdFromQuery]);

	useEffect(() => {
		const fetchInvitationRequest = async () => {
			if (!invitationCode || !isLoggedIn) return;
			try {
				const response = await fetch(
					`/api/organizations/invitation-requests/${encodeURIComponent(
						invitationCode,
					)}`,
				);
				if (!response.ok) {
					return;
				}
				const data = await response.json();
				if (data?.request?.inviter?.id) {
					setInvitationRequest({ inviter: data.request.inviter });
					setInviterId(data.request.inviter.id);
					setInviterLocked(true);
				}
			} catch (error) {
				console.error("Failed to fetch invitation request:", error);
			}
		};

		fetchInvitationRequest();
	}, [invitationCode, isLoggedIn]);

	useEffect(() => {
		if (invitationCode) {
			return;
		}

		if (inviterIdFromQuery) {
			setInviterId(inviterIdFromQuery);
			setInviterLocked(true);
			setInvitationRequest(null);
			return;
		}

		setInviterLocked(false);
	}, [invitationCode, inviterIdFromQuery]);

	useEffect(() => {
		if (currentUser) {
			const validation =
				validateProfileForOrganizationApplication(currentUser);
			setProfileValidation(validation);
		}
	}, [currentUser]);

	useEffect(() => {
		if (organization && currentUser) {
			checkMembershipStatus();
		}
	}, [organization, currentUser, checkMembershipStatus]);

	const profileIncomplete = profileValidation?.isComplete === false;

	const inviterOptions = useMemo(() => {
		if (!organization?.members) return [];
		return organization.members
			.map((member) => ({
				id: member.user.id,
				name: member.user.name,
				username: member.user.username,
				image: member.user.image,
				role: member.role,
			}))
			.filter((member) => member.id !== currentUser?.id)
			.sort((a, b) => {
				const aLabel = a.name || a.username || "";
				const bLabel = b.name || b.username || "";
				return aLabel.localeCompare(bLabel, "zh-Hans-CN", {
					sensitivity: "base",
				});
			});
	}, [organization?.members, currentUser?.id]);

	const selectedInviter = useMemo(() => {
		const option =
			inviterOptions.find((member) => member.id === inviterId) || null;
		if (option) return option;
		if (
			invitationRequest?.inviter &&
			invitationRequest.inviter.id === inviterId
		) {
			return {
				id: invitationRequest.inviter.id,
				name: invitationRequest.inviter.name,
				username: invitationRequest.inviter.username ?? null,
				image: null,
				role: "member",
			};
		}
		return null;
	}, [inviterId, inviterOptions, invitationRequest]);

	const checkAuthStatus = async () => {
		const params = new URLSearchParams();
		if (invitationCode) {
			params.set("invited-code", invitationCode);
		}
		if (inviterIdFromQuery) {
			params.set("inviteby", inviterIdFromQuery);
		}
		const redirectTo = `/orgs/${slug}/apply${
			params.toString() ? `?${params.toString()}` : ""
		}`;

		try {
			const response = await fetch(
				"/api/auth/get-session?disableCookieCache=true",
			);
			if (response.ok) {
				const session = await response.json();
				if (session?.user) {
					setIsLoggedIn(true);
					await fetchCurrentUserProfile(session.user);
				} else {
					setProfileLoading(false);
					router.push(
						`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`,
					);
				}
			} else {
				setProfileLoading(false);
				router.push(
					`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`,
				);
			}
		} catch (error) {
			console.error("Failed to check auth status:", error);
			setProfileLoading(false);
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`,
			);
		}
	};

	const fetchOrganization = async () => {
		try {
			const response = await fetch(`/api/organizations/by-slug/${slug}`);
			if (response.ok) {
				const data = await response.json();
				setOrganization(data);
				setOrganizationNotFound(false);
			} else if (response.status === 404) {
				setOrganization(null);
				setOrganizationNotFound(true);
			}
		} catch (error) {
			console.error("Failed to fetch organization:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!organization || !currentUser) {
			return;
		}

		if (profileIncomplete) {
			toast({
				title: t("form.profileIncompleteTitle"),
				description: t("form.profileIncompleteHint"),
				variant: "destructive",
			});
			return;
		}

		if (!inviterId) {
			toast({
				title: t("form.profileIncompleteTitle"),
				description: t("form.errorInviterRequired"),
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const payload: Record<string, unknown> = {
				organizationId: organization.id,
				inviterId,
			};

			if (invitationCode) {
				payload.invitationRequestCode = invitationCode;
			}

			const response = await fetch("/api/organizations/applications", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				setSubmitted(true);
				return;
			}

			const errorData = await response.json().catch(() => ({}));
			if (
				response.status === 400 &&
				(errorData.error || "").includes(
					"Already a member of this organization",
				)
			) {
				await checkMembershipStatus();
				return;
			}

			toast({
				title: t("form.submitFailedTitle"),
				description: errorData.error || t("error.submitFailed"),
				variant: "destructive",
			});
		} catch (error) {
			console.error("Failed to submit application:", error);
			toast({
				title: t("form.submitFailedTitle"),
				description: t("error.submitFailed"),
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const saveProfileBasicInfo = useCallback(
		async (data: {
			name?: string;
			username?: string;
			region?: string;
			gender?: string;
			phoneNumber?: string;
			wechatId?: string;
			wechatQrCode?: string;
			email?: string;
		}) => {
			setProfileSaving("basic");
			try {
				const response = await fetch("/api/profile/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				});

				if (response.ok) {
					await fetchCurrentUserProfile(currentUser);
					toast({
						title: "保存成功",
						description: "基础信息已更新",
					});
					return true;
				}

				const errorData = await response.json().catch(() => ({}));
				toast({
					title: "保存失败",
					description: errorData.error || "无法更新资料，请稍后重试",
					variant: "destructive",
				});
				return false;
			} catch (error) {
				console.error("Failed to save basic profile:", error);
				toast({
					title: "保存失败",
					description: "无法更新资料，请稍后重试",
					variant: "destructive",
				});
				return false;
			} finally {
				setProfileSaving(null);
			}
		},
		[currentUser, fetchCurrentUserProfile, toast],
	);

	const saveProfileCore = useCallback(
		async (data: {
			bio?: string;
			userRoleString?: string;
			currentWorkOn?: string;
			lifeStatus?: string;
		}) => {
			setProfileSaving("core");
			try {
				const response = await fetch("/api/profile/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				});

				if (response.ok) {
					await fetchCurrentUserProfile(currentUser);
					toast({
						title: "保存成功",
						description: "核心档案已更新",
					});
					return true;
				}

				const errorData = await response.json().catch(() => ({}));
				toast({
					title: "保存失败",
					description: errorData.error || "无法更新资料，请稍后重试",
					variant: "destructive",
				});
				return false;
			} catch (error) {
				console.error("Failed to save core profile:", error);
				toast({
					title: "保存失败",
					description: "无法更新资料，请稍后重试",
					variant: "destructive",
				});
				return false;
			} finally {
				setProfileSaving(null);
			}
		},
		[currentUser, fetchCurrentUserProfile, toast],
	);

	if (loading || profileLoading || membershipLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (organizationNotFound) {
		return (
			<div className="container max-w-2xl pt-16 pb-16">
				<h1 className="text-2xl font-semibold">组织不存在或未公开</h1>
				<p className="mt-3 text-muted-foreground">
					请检查链接是否正确，或联系组织管理员确认组织状态。
				</p>
				<div className="mt-6">
					<Button asChild>
						<Link href="/">返回首页</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (!organization || !isLoggedIn) {
		return null;
	}

	const orgDetailsHref = `/orgs/${organization.slug}`;

	if (membershipStatus?.isMember) {
		return (
			<div className="container max-w-4xl pt-16 pb-16">
				<div className="mb-6">
					<Button variant="ghost" className="gap-2" asChild>
						<Link href={orgDetailsHref}>
							<ArrowLeft className="h-4 w-4" />
							返回组织详情
						</Link>
					</Button>
				</div>

				<div className="text-center py-8">
					<CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
					<h1 className="font-brand font-bold text-2xl mb-3">
						您已经是 {organization.name} 的成员
					</h1>
					<div className="text-sm text-muted-foreground mb-6 space-y-1">
						<p>
							您的角色：
							<span className="font-medium text-foreground">
								{membershipStatus.memberRole === "owner"
									? "组织所有者"
									: membershipStatus.memberRole === "admin"
										? "管理员"
										: membershipStatus.memberRole === "core"
											? "核心成员"
											: "成员"}
							</span>
						</p>
						{membershipStatus.memberSince && (
							<p>
								加入时间：
								<span className="font-medium text-foreground">
									{new Date(
										membershipStatus.memberSince,
									).toLocaleDateString("zh-CN")}
								</span>
							</p>
						)}
					</div>

					<Card className="max-w-2xl mx-auto">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" />
								组织主页
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center space-y-4">
								<p className="text-muted-foreground">
									您可以访问组织主页，查看组织的最新动态、活动和成员信息。
								</p>

								<div className="flex justify-center gap-4">
									<Button asChild>
										<Link href={orgDetailsHref}>
											查看组织详情
										</Link>
									</Button>
									<Button variant="outline" asChild>
										<Link
											href={`/orgs/${organization.slug}`}
										>
											进入组织管理
										</Link>
									</Button>
								</div>

								{organization.memberQrCode && (
									<div className="flex justify-center mt-6">
										<div className="relative w-full max-w-48 aspect-square">
											<Image
												src={organization.memberQrCode}
												alt="组织成员群二维码"
												fill
												className="object-contain border rounded-lg"
												sizes="192px"
											/>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (submitted) {
		return (
			<div className="container max-w-4xl pt-16 pb-16">
				<div className="mb-6">
					<Button variant="ghost" className="gap-2" asChild>
						<Link href={orgDetailsHref}>
							<ArrowLeft className="h-4 w-4" />
							{t("backToDetails")}
						</Link>
					</Button>
				</div>

				<div className="text-center py-8">
					<CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
					<h1 className="font-brand font-bold text-2xl mb-3">
						{t("submitted.title")}
					</h1>
					<p
						className="text-sm text-muted-foreground mb-6"
						dangerouslySetInnerHTML={{
							__html: t("submitted.description", {
								name: organization.name,
							}),
						}}
					/>

					<Card className="max-w-2xl mx-auto">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" />
								加入社区群组
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center space-y-4">
								<p className="text-muted-foreground">
									在等待审核期间，欢迎先加入我们的观众群/开放群，了解更多组织动态和活动信息。
								</p>

								{organization.audienceQrCode && (
									<div className="flex justify-center">
										<div className="relative w-full max-w-48 aspect-square">
											<Image
												src={
													organization.audienceQrCode
												}
												alt="观众群二维码"
												fill
												className="object-contain border rounded-lg"
												sizes="192px"
											/>
										</div>
									</div>
								)}

								<p className="text-sm text-muted-foreground">
									扫描二维码加入社区群组，第一时间获取审核结果通知
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-4xl pt-16 pb-16">
			<div className="mb-6">
				<Button variant="ghost" className="gap-2" asChild>
					<Link href={orgDetailsHref}>
						<ArrowLeft className="h-4 w-4" />
						{t("backToDetails")}
					</Link>
				</Button>
			</div>

			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Avatar className="h-14 w-14">
						<AvatarImage src={organization.logo || ""} />
						<AvatarFallback className="text-lg">
							{organization.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-brand font-bold text-2xl">
							{t("title", { name: organization.name })}
						</h1>
						<p className="text-muted-foreground mt-1">
							{organization.summary || t("subtitle")}
						</p>
					</div>
				</div>

				{organization.tags.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{organization.tags.slice(0, 5).map((tag) => (
							<Badge key={tag} variant="outline">
								{tag}
							</Badge>
						))}
					</div>
				)}
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{profileValidation && (
						<ProfileCompletionNotice
							validation={profileValidation}
							variant="card"
							actionLabel={t("profileAlert.optimizeProfile")}
							onFixField={handleFixProfileField}
							onAction={() => {
								const nextField =
									profileValidation.requiredFields.find(
										(field) => !field.isComplete,
									) ?? null;
								if (nextField) {
									handleFixProfileField(nextField);
								}
							}}
						/>
					)}

					<div id="profile-basic-info">
						<BasicInfoSection
							initialData={{
								name: currentUser?.name,
								username: currentUser?.username,
								region: currentUser?.region,
								gender: currentUser?.gender,
								phoneNumber: currentUser?.phoneNumber,
								wechatId: currentUser?.wechatId,
								wechatQrCode: currentUser?.wechatQrCode,
								email: currentUser?.email,
							}}
							onOpenDialog={() => setBasicInfoDialogOpen(true)}
						/>
					</div>

					<div id="profile-core-info">
						<ProfileCorePreview
							bio={currentUser?.bio}
							userRoleString={currentUser?.userRoleString}
							currentWorkOn={currentUser?.currentWorkOn}
							lifeStatus={currentUser?.lifeStatus}
							onManageCore={() => setProfileCoreDialogOpen(true)}
						/>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Heart className="h-5 w-5" />
								{t("form.title")}
							</CardTitle>
							<CardDescription>
								{t("form.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="space-y-3">
									<div className="text-sm font-medium">
										{t("form.inviterTitle")}
									</div>
									{!inviterLocked && (
										<p className="text-xs text-muted-foreground">
											{t("form.inviterHelp")}
										</p>
									)}
									<Popover
										open={inviterPopoverOpen}
										onOpenChange={setInviterPopoverOpen}
									>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												className="w-full justify-between"
												disabled={
													inviterLocked ||
													inviterOptions.length === 0
												}
											>
												{selectedInviter ? (
													<div className="flex items-center gap-2">
														<Avatar className="h-6 w-6">
															<AvatarImage
																src={
																	selectedInviter.image ||
																	""
																}
															/>
															<AvatarFallback className="text-xs">
																{(
																	selectedInviter.name ||
																	selectedInviter.username ||
																	"U"
																).charAt(0)}
															</AvatarFallback>
														</Avatar>
														<span>
															{selectedInviter.name ||
																selectedInviter.username ||
																"未命名"}
															{selectedInviter.username
																? ` @${selectedInviter.username}`
																: ""}
														</span>
													</div>
												) : (
													<span className="text-muted-foreground">
														{inviterLocked
															? t(
																	"form.inviterLockedLabel",
																)
															: t(
																	"form.inviterPlaceholder",
																)}
													</span>
												)}
												<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										{!inviterLocked && (
											<PopoverContent
												className="w-full p-0"
												align="start"
											>
												<Command>
													<CommandInput
														placeholder={t(
															"form.inviterSearchPlaceholder",
														)}
													/>
													<CommandList>
														<CommandEmpty>
															{t(
																"form.inviterSearchEmpty",
															)}
														</CommandEmpty>
														<CommandGroup>
															{inviterOptions.map(
																(member) => (
																	<CommandItem
																		key={
																			member.id
																		}
																		value={`${member.name || ""} ${member.username || ""}`.trim()}
																		onSelect={() => {
																			setInviterId(
																				member.id,
																			);
																			setInviterPopoverOpen(
																				false,
																			);
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				inviterId ===
																					member.id
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		<div className="flex items-center gap-2">
																			<Avatar className="h-6 w-6">
																				<AvatarImage
																					src={
																						member.image ||
																						""
																					}
																				/>
																				<AvatarFallback className="text-xs">
																					{(
																						member.name ||
																						member.username ||
																						"U"
																					).charAt(
																						0,
																					)}
																				</AvatarFallback>
																			</Avatar>
																			<div className="text-sm">
																				<div className="font-medium">
																					{member.name ||
																						member.username ||
																						"未命名"}
																				</div>
																				{member.username && (
																					<div className="text-xs text-muted-foreground">
																						@
																						{
																							member.username
																						}
																					</div>
																				)}
																			</div>
																		</div>
																	</CommandItem>
																),
															)}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										)}
									</Popover>
									{inviterLocked ? (
										<p className="text-xs text-muted-foreground">
											{t("form.inviterLockedHint")}
										</p>
									) : null}
								</div>

								<p className="text-xs text-muted-foreground">
									{t("form.activityRequirement")}
								</p>

								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={
										isSubmitting ||
										profileIncomplete ||
										!inviterId
									}
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2" />
											{t("form.submitting")}
										</>
									) : (
										<>
											<Send className="h-4 w-4 mr-2" />
											{t("form.submit")}
										</>
									)}
								</Button>
								{profileIncomplete && (
									<p className="text-xs text-muted-foreground">
										{t("form.profileIncompleteHint")}
									</p>
								)}
								{!inviterId && (
									<p className="text-xs text-muted-foreground">
										{t("form.submitHintInviter")}
									</p>
								)}
							</form>
						</CardContent>
					</Card>

					<BasicInfoDialog
						open={basicInfoDialogOpen}
						onOpenChange={setBasicInfoDialogOpen}
						userId={currentUser?.id}
						initialData={{
							name: currentUser?.name,
							username: currentUser?.username,
							region: currentUser?.region,
							gender: currentUser?.gender,
							phoneNumber: currentUser?.phoneNumber,
							wechatId: currentUser?.wechatId,
							wechatQrCode: currentUser?.wechatQrCode,
							email: currentUser?.email,
						}}
						onSave={saveProfileBasicInfo}
						isLoading={profileSaving === "basic"}
					/>

					<ProfileCoreDialog
						open={profileCoreDialogOpen}
						onOpenChange={setProfileCoreDialogOpen}
						initialData={{
							bio: currentUser?.bio,
							userRoleString: currentUser?.userRoleString,
							currentWorkOn: currentUser?.currentWorkOn,
							lifeStatus: currentUser?.lifeStatus,
						}}
						onSave={saveProfileCore}
						isLoading={profileSaving === "core"}
					/>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" />
								社区群组
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								提交申请后，建议先加入社区群组了解更多信息
							</p>
							<div className="space-y-3">
								{organization.audienceQrCode && (
									<div className="text-center">
										<div className="relative w-full max-w-32 mx-auto aspect-square mb-3">
											<Image
												src={
													organization.audienceQrCode
												}
												alt="观众群二维码"
												fill
												className="object-contain border rounded-lg"
												sizes="128px"
											/>
										</div>
										<p className="text-xs text-muted-foreground">
											扫描二维码加入观众群，获取组织动态
										</p>
									</div>
								)}
								<div className="text-center text-sm text-muted-foreground pt-3 border-t">
									审核通过后会通过邮件通知您
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
