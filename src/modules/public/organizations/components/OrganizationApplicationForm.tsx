"use client";
import { ProfileCompletionNotice } from "@/modules/dashboard/profile/components/ProfileCompletionNotice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	type ProfileRequirementStatus,
	type UserProfileValidation,
	validateProfileForOrganizationApplication,
} from "@/lib/utils/profile-validation";
import {
	ArrowLeft,
	CheckCircle,
	Heart,
	Info,
	MessageSquare,
	Send,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OrganizationMember {
	id: string;
	role: string;
	user: {
		id: string;
		name: string;
		email: string | null;
		phoneNumber: string | null;
		showEmail: boolean;
		wechatId: string | null;
		showWechat: boolean;
	};
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
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

export function OrganizationApplicationForm({
	slug,
	invitationCode,
}: OrganizationApplicationFormProps) {
	const [organization, setOrganization] = useState<OrganizationData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [profileValidation, setProfileValidation] =
		useState<UserProfileValidation | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [profileLoading, setProfileLoading] = useState(true);
	const [referralInfo, setReferralInfo] = useState<{
		inviteeName: string;
		invitationReason: string | null;
		eligibilityDetails: string | null;
		inviterName: string | null;
		inviterEmail: string | null;
	} | null>(null);
	const [referralLoading, setReferralLoading] = useState(
		Boolean(invitationCode),
	);
	const [referralError, setReferralError] = useState<string | null>(null);
	const [membershipStatus, setMembershipStatus] = useState<{
		isMember: boolean;
		memberRole?: string;
		memberSince?: Date;
	} | null>(null);
	const [membershipLoading, setMembershipLoading] = useState(false);

	const [formData, setFormData] = useState({
		reason: "",
	});
	const [errors, setErrors] = useState<{ reason?: string; profile?: string }>(
		{},
	);

	const router = useRouter();
	const t = useTranslations("organizations.public.application");
	const { toast } = useToast();

	const handleFixProfileField = useCallback(
		(field: ProfileRequirementStatus) => {
			const hash = field.sectionId ? `#${field.sectionId}` : "";
			router.push(`/app/profile${hash}`);
		},
		[router],
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
	}, [slug]);

	// 验证用户资料完整性
	useEffect(() => {
		if (currentUser) {
			const validation =
				validateProfileForOrganizationApplication(currentUser);
			setProfileValidation(validation);
		}
	}, [currentUser]);

	// 检查成员状态
	useEffect(() => {
		if (organization && currentUser) {
			checkMembershipStatus();
		}
	}, [organization, currentUser, checkMembershipStatus]);

	useEffect(() => {
		const loadReferral = async () => {
			if (!invitationCode) {
				setReferralInfo(null);
				setReferralError(null);
				setReferralLoading(false);
				return;
			}

			if (!isLoggedIn) {
				return;
			}

			setReferralLoading(true);
			try {
				const response = await fetch(
					`/api/organizations/invitation-requests/${invitationCode}`,
				);
				if (!response.ok) {
					const data = await response.json().catch(() => ({}));
					throw new Error(data.error || "无法获取推荐邀请信息");
				}

				const data = await response.json();
				const request = data.request;
				setReferralInfo({
					inviteeName: request.inviteeName ?? "",
					invitationReason: request.invitationReason ?? null,
					eligibilityDetails: request.eligibilityDetails ?? null,
					inviterName: request.inviter?.name ?? null,
					inviterEmail: request.inviter?.email ?? null,
				});
				setReferralError(null);
			} catch (error) {
				console.error("Failed to fetch invitation request:", error);
				setReferralInfo(null);
				setReferralError(
					error instanceof Error
						? error.message
						: "无法获取推荐邀请信息",
				);
			} finally {
				setReferralLoading(false);
			}
		};

		loadReferral();
	}, [invitationCode, isLoggedIn]);

	const reasonLength = formData.reason.length;
	const reasonTooShort = reasonLength < MIN_REASON_LENGTH;
	const reasonTooLong = reasonLength > MAX_REASON_LENGTH;
	const profileIncomplete = profileValidation?.isComplete === false;

	const submitBlockingMessages = useMemo(() => {
		const messages: string[] = [];
		if (reasonTooShort) {
			messages.push(
				t("form.submitHintReason", { min: MIN_REASON_LENGTH }),
			);
		}
		if (reasonTooLong) {
			messages.push(
				t("form.submitHintReasonMax", { max: MAX_REASON_LENGTH }),
			);
		}
		if (profileIncomplete && profileValidation) {
			const fields = profileValidation.missingFields.join("、");
			messages.push(t("form.submitHintProfile", { fields }));
		}
		return messages;
	}, [
		t,
		reasonTooShort,
		reasonTooLong,
		profileIncomplete,
		profileValidation,
	]);

	const checkAuthStatus = async () => {
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
					// Redirect to login with return URL
					setProfileLoading(false);
					router.push(`/auth/login?redirectTo=/orgs/${slug}/apply`);
				}
			} else {
				setProfileLoading(false);
				router.push(`/auth/login?redirectTo=/orgs/${slug}/apply`);
			}
		} catch (error) {
			console.error("Failed to check auth status:", error);
			setProfileLoading(false);
			router.push(`/auth/login?redirectTo=/orgs/${slug}/apply`);
		}
	};

	const fetchOrganization = async () => {
		try {
			const response = await fetch(`/api/organizations/by-slug/${slug}`);
			if (response.ok) {
				const data = await response.json();
				setOrganization(data);
			} else if (response.status === 404) {
				notFound();
			}
		} catch (error) {
			console.error("Failed to fetch organization:", error);
		} finally {
			setLoading(false);
		}
	};

	const validateForm = () => {
		const newErrors: { reason?: string; profile?: string } = {};

		if (reasonTooShort) {
			newErrors.reason = t("form.errorReasonTooShort", {
				min: MIN_REASON_LENGTH,
			});
		} else if (reasonTooLong) {
			newErrors.reason = t("form.errorReasonTooLong", {
				max: MAX_REASON_LENGTH,
			});
		}

		// 检查用户资料完整性
		if (profileValidation && !profileValidation.isComplete) {
			newErrors.profile = `您的资料信息尚未完善，无法申请加入组织。还需要完善：${profileValidation.missingFields.join("、")}`;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear errors when user starts typing
		if (errors[name as keyof typeof errors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!organization || !currentUser) {
			return;
		}

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		try {
			const payload: Record<string, unknown> = {
				organizationId: organization.id,
				reason: formData.reason,
			};

			if (referralInfo && invitationCode) {
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
			} else {
				const errorData = await response.json();
				// Handle validation errors from server
				if (response.status === 400 && errorData.error) {
					// Handle specific error cases
					if (errorData.error.includes("10个字符")) {
						setErrors({ reason: errorData.error });
						return;
					}

					// Handle "Already a member" error specially
					if (
						errorData.error.includes(
							"Already a member of this organization",
						)
					) {
						// Refresh membership status and show member view
						await checkMembershipStatus();
						return;
					}

					// Handle other server errors
					if (
						errorData.error.includes(
							"Application already submitted",
						)
					) {
						setErrors({
							reason: "您已经提交过申请，请等待管理员审核",
						});
						return;
					}
				}
				throw new Error(
					errorData.error || "Failed to submit application",
				);
			}
		} catch (error) {
			console.error("Failed to submit application:", error);

			// Check if it's a content safety error
			if (
				error instanceof Error &&
				error.message.includes("申请理由未通过内容审核")
			) {
				toast({
					title: "内容审核未通过",
					description:
						"您的申请理由包含疑似违规词汇，请修改后重新提交。",
					variant: "destructive",
				});
			} else {
				// Handle other server errors
				if (
					error instanceof Error &&
					error.message.includes("Application already submitted")
				) {
					toast({
						title: "申请已提交",
						description: "您已经提交过申请，请等待管理员审核。",
						variant: "destructive",
					});
				} else {
					toast({
						title: "提交失败",
						description: t("error.submitFailed"),
						variant: "destructive",
					});
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading || profileLoading || membershipLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (!organization || !isLoggedIn) {
		return null;
	}

	// 如果用户已经是成员，显示成员状态页面
	if (membershipStatus?.isMember) {
		return (
			<div className="container max-w-4xl pt-16 pb-16">
				<div className="mb-6">
					<Button variant="ghost" className="gap-2" asChild>
						<Link href={`/orgs/${organization.slug}`}>
							<ArrowLeft className="h-4 w-4" />
							返回组织详情
						</Link>
					</Button>
				</div>

				<div className="text-center py-12">
					<CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
					<h1 className="font-bold text-3xl mb-4">
						您已经是 {organization.name} 的成员
					</h1>
					<div className="text-lg text-muted-foreground mb-8 space-y-2">
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
										<Link
											href={`/orgs/${organization.slug}`}
										>
											查看组织详情
										</Link>
									</Button>
									<Button variant="outline" asChild>
										<Link
											href={`/app/orgs/${organization.slug}`}
										>
											进入组织管理
										</Link>
									</Button>
								</div>

								{/* QR Code */}
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
						<Link href={`/orgs/${organization.slug}`}>
							<ArrowLeft className="h-4 w-4" />
							{t("backToDetails")}
						</Link>
					</Button>
				</div>

				<div className="text-center py-12">
					<CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
					<h1 className="font-bold text-3xl mb-4">
						{t("submitted.title")}
					</h1>
					<p
						className="text-lg text-muted-foreground mb-8"
						dangerouslySetInnerHTML={{
							__html: t("submitted.description", {
								name: organization.name,
							}),
						}}
					/>

					{/* Community Groups Reminder */}
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

								{/* QR Code */}
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
					<Link href={`/orgs/${organization.slug}`}>
						<ArrowLeft className="h-4 w-4" />
						{t("backToDetails")}
					</Link>
				</Button>
			</div>

			<div className="mb-8">
				<div className="flex items-center gap-4 mb-6">
					<Avatar className="h-16 w-16">
						<AvatarImage src={organization.logo || ""} />
						<AvatarFallback className="text-lg">
							{organization.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-bold text-3xl">
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
				{/* Application Form */}
				<div className="lg:col-span-2 space-y-6">
					{/* Profile Validation Alert */}
					{profileValidation && (
						<ProfileCompletionNotice
							validation={profileValidation}
							variant="card"
							actionHref="/app/profile"
							onFixField={handleFixProfileField}
						/>
					)}

					{/* Profile validation error */}
					{errors.profile && (
						<Alert className="border-red-200 bg-red-50">
							<Info className="h-4 w-4 text-red-600" />
							<AlertDescription>
								<strong className="text-red-800">
									无法提交申请
								</strong>
								<br />
								<span className="text-red-700">
									{errors.profile}
								</span>
							</AlertDescription>
						</Alert>
					)}

					{invitationCode ? (
						<div className="mb-6">
							{referralLoading ? (
								<Alert>
									<AlertDescription>
										正在加载邀请人提供的信息，请稍候...
									</AlertDescription>
								</Alert>
							) : referralError ? (
								<Alert variant="destructive">
									<AlertDescription>
										{referralError}
									</AlertDescription>
								</Alert>
							) : referralInfo ? (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">
											邀请人{" "}
											{referralInfo.inviterName ||
												"未知成员"}{" "}
											的推荐
										</CardTitle>
										<CardDescription>
											{referralInfo.inviterEmail ||
												"暂无公开联系方式"}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4 text-sm">
										<div>
											<h4 className="font-medium text-muted-foreground mb-1">
												邀请理由
											</h4>
											<p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">
												{referralInfo.invitationReason ||
													"邀请人暂未填写"}
											</p>
										</div>
										<div>
											<h4 className="font-medium text-muted-foreground mb-1">
												符合加入条件的依据
											</h4>
											<p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">
												{referralInfo.eligibilityDetails ||
													"邀请人暂未填写"}
											</p>
										</div>
										<p className="text-xs text-muted-foreground">
											提示：管理员在审核时会同时看到以上推荐信息和您在下方填写的理由。
										</p>
									</CardContent>
								</Card>
							) : null}
						</div>
					) : null}

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Heart className="h-5 w-5" />
								{t("form.title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label className="text-sm font-medium mb-2 block">
										{t("form.reason")}
									</label>
									<Textarea
										name="reason"
										value={formData.reason}
										onChange={handleInputChange}
										placeholder={t(
											"form.reasonPlaceholder",
										)}
										rows={6}
										required
									/>
									<p className="text-xs text-muted-foreground mt-2">
										{t("form.reasonHelp")}
									</p>
								</div>

								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={
										isSubmitting ||
										reasonTooShort ||
										reasonTooLong ||
										profileIncomplete
									}
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
											{t("form.submitting")}
										</>
									) : (
										<>
											<Send className="h-4 w-4 mr-2" />
											{t("form.submit")}
										</>
									)}
								</Button>
								{submitBlockingMessages.length > 0 && (
									<p className="text-xs text-muted-foreground mt-2">
										{t("form.submitHintPrefix")}
										<br />
										{submitBlockingMessages.join("；")}
									</p>
								)}
							</form>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Current User Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								{t("userInfo.title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={currentUser?.image || ""}
										/>
										<AvatarFallback>
											{currentUser?.name?.charAt(0) ||
												"U"}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="font-medium">
											{currentUser?.name ||
												t("userInfo.nameNotSet")}
										</div>
										<div className="text-sm text-muted-foreground">
											{currentUser?.email}
										</div>
									</div>
								</div>

								{currentUser?.bio && (
									<div>
										<div className="text-sm font-medium">
											{t("userInfo.bio")}
										</div>
										<div className="text-sm text-muted-foreground">
											{currentUser.bio}
										</div>
									</div>
								)}

								{currentUser?.skills &&
									currentUser.skills.length > 0 && (
										<div>
											<div className="text-sm font-medium mb-2">
												{t("userInfo.skills")}
											</div>
											<div className="flex flex-wrap gap-1">
												{currentUser.skills
													.slice(0, 3)
													.map((skill: string) => (
														<Badge
															key={skill}
															variant="secondary"
															className="text-xs"
														>
															{skill}
														</Badge>
													))}
												{currentUser.skills.length >
													3 && (
													<Badge
														variant="secondary"
														className="text-xs"
													>
														+
														{currentUser.skills
															.length - 3}
													</Badge>
												)}
											</div>
										</div>
									)}

								<p className="text-xs text-muted-foreground">
									{t("userInfo.adminWillSee")}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Community Group Info */}
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
