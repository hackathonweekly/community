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
import { Input } from "@/components/ui/input";
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
	Plus,
	Send,
	User,
	X,
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

interface InviterOption {
	id: string;
	name: string;
	username?: string | null;
	image?: string | null;
	userRoleString?: string | null;
	membershipLevel?: string | null;
	currentWorkOn?: string | null;
}

interface OrganizationApplicationFormProps {
	slug: string;
	invitationCode?: string | null;
}

const MIN_INTRO_LENGTH = 30;
const MAX_INTRO_LENGTH = 800;
const MAX_REASON_LENGTH = 2000;
const MIN_DETAIL_LENGTH = 5;
const MIN_CONTRIBUTIONS = 1;
const MIN_OFFLINE_EVENTS = 2;
const MIN_AVAILABILITY_LENGTH = 10;
const MAX_AVAILABILITY_LENGTH = 300;

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
	const [introduction, setIntroduction] = useState("");
	const [contributions, setContributions] = useState<string[]>([""]);
	const [offlineEvents, setOfflineEvents] = useState<string[]>(["", ""]);
	const [availability, setAvailability] = useState("");
	const [selectedInviter, setSelectedInviter] =
		useState<InviterOption | null>(null);
	const [inviterQuery, setInviterQuery] = useState("");
	const [inviterResults, setInviterResults] = useState<InviterOption[]>([]);
	const [searchingInviter, setSearchingInviter] = useState(false);
	const [inviterErrorMessage, setInviterErrorMessage] = useState<
		string | null
	>(null);
	const [errors, setErrors] = useState<{
		introduction?: string;
		contributions?: string;
		offlineEvents?: string;
		inviter?: string;
		availability?: string;
		profile?: string;
	}>(() => ({}));

	const router = useRouter();
	const t = useTranslations("organizations.public.application");
	const { toast } = useToast();
	const currentUserId = currentUser?.id ?? "";

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

	const formatListField = useCallback(
		(items: string[]) =>
			items
				.map((item) => item.trim())
				.filter(Boolean)
				.map((item, index) => `${index + 1}. ${item}`)
				.join("\n"),
		[],
	);

	const normalizedContributions = useMemo(
		() => contributions.map((item) => item.trim()).filter(Boolean),
		[contributions],
	);

	const normalizedOfflineEvents = useMemo(
		() => offlineEvents.map((item) => item.trim()).filter(Boolean),
		[offlineEvents],
	);

	const applicationReason = useMemo(() => {
		const inviterLabel = selectedInviter
			? `${selectedInviter.name}${
					selectedInviter.username
						? ` (@${selectedInviter.username})`
						: ""
				}${
					selectedInviter.userRoleString
						? ` - ${selectedInviter.userRoleString}`
						: selectedInviter.membershipLevel
							? ` - ${selectedInviter.membershipLevel}`
							: ""
				}`
			: t("form.inviterPlaceholder");

		return [
			`【自我介绍】${introduction.trim()}`,
			`【过往贡献】\n${formatListField(normalizedContributions)}`,
			`【参加过的线下活动】\n${formatListField(normalizedOfflineEvents)}`,
			`【邀请人】${inviterLabel}`,
			`【未来一周可访谈时间】${availability.trim()}`,
		].join("\n\n");
	}, [
		introduction,
		normalizedContributions,
		normalizedOfflineEvents,
		selectedInviter,
		availability,
		formatListField,
		t,
	]);

	const applicationReasonLength = applicationReason.length;
	const introTooShort = introduction.trim().length < MIN_INTRO_LENGTH;
	const introTooLong = introduction.trim().length > MAX_INTRO_LENGTH;
	const contributionsInsufficient =
		normalizedContributions.length < MIN_CONTRIBUTIONS;
	const contributionsTooShort = normalizedContributions.some(
		(item) => item.length < MIN_DETAIL_LENGTH,
	);
	const offlineEventsInsufficient =
		normalizedOfflineEvents.length < MIN_OFFLINE_EVENTS;
	const offlineEventsTooShort = normalizedOfflineEvents.some(
		(item) => item.length < MIN_DETAIL_LENGTH,
	);
	const inviterMissing = !selectedInviter;
	const availabilityTooShort =
		availability.trim().length < MIN_AVAILABILITY_LENGTH;
	const availabilityTooLong =
		availability.trim().length > MAX_AVAILABILITY_LENGTH;
	const reasonTooLong = applicationReasonLength > MAX_REASON_LENGTH;
	const profileIncomplete = profileValidation?.isComplete === false;

	const submitBlockingMessages = useMemo(() => {
		const messages: string[] = [];
		if (introTooShort) {
			messages.push(
				t("form.submitHintReason", { min: MIN_INTRO_LENGTH }),
			);
		}
		if (introTooLong) {
			messages.push(
				t("form.submitHintIntroMax", { max: MAX_INTRO_LENGTH }),
			);
		}
		if (contributionsInsufficient || contributionsTooShort) {
			messages.push(
				t("form.submitHintContributions", {
					min: MIN_CONTRIBUTIONS,
					minDetail: MIN_DETAIL_LENGTH,
				}),
			);
		}
		if (offlineEventsInsufficient || offlineEventsTooShort) {
			messages.push(
				t("form.submitHintOfflineEvents", {
					min: MIN_OFFLINE_EVENTS,
					minDetail: MIN_DETAIL_LENGTH,
				}),
			);
		}
		if (inviterMissing) {
			messages.push(t("form.submitHintInviter"));
		}
		if (availabilityTooShort || availabilityTooLong) {
			messages.push(
				t("form.submitHintAvailability", {
					min: MIN_AVAILABILITY_LENGTH,
					max: MAX_AVAILABILITY_LENGTH,
				}),
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
		introTooShort,
		introTooLong,
		contributionsInsufficient,
		contributionsTooShort,
		offlineEventsInsufficient,
		offlineEventsTooShort,
		inviterMissing,
		availabilityTooShort,
		availabilityTooLong,
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
		const newErrors: typeof errors = {};

		if (introTooShort) {
			newErrors.introduction = t("form.errorReasonTooShort", {
				min: MIN_INTRO_LENGTH,
			});
		} else if (introTooLong) {
			newErrors.introduction = t("form.errorReasonTooLong", {
				max: MAX_INTRO_LENGTH,
			});
		}

		if (contributionsInsufficient || contributionsTooShort) {
			newErrors.contributions = t("form.errorContributions", {
				min: MIN_CONTRIBUTIONS,
				minDetail: MIN_DETAIL_LENGTH,
			});
		}

		if (offlineEventsInsufficient || offlineEventsTooShort) {
			newErrors.offlineEvents = t("form.errorOfflineEvents", {
				min: MIN_OFFLINE_EVENTS,
				minDetail: MIN_DETAIL_LENGTH,
			});
		}

		if (inviterMissing) {
			newErrors.inviter = t("form.errorInviterRequired");
		}

		if (availabilityTooShort || availabilityTooLong) {
			newErrors.availability = t("form.errorAvailability", {
				min: MIN_AVAILABILITY_LENGTH,
				max: MAX_AVAILABILITY_LENGTH,
			});
		}

		if (reasonTooLong) {
			newErrors.introduction = t("form.errorApplicationTooLong", {
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

	useEffect(() => {
		if (inviterQuery.trim().length < 2) {
			setInviterResults([]);
			setInviterErrorMessage(null);
			return;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(async () => {
			setSearchingInviter(true);
			try {
				const response = await fetch(
					`/api/users/search?query=${encodeURIComponent(inviterQuery.trim())}`,
					{ signal: controller.signal },
				);

				if (response.ok) {
					const data = await response.json();
					const filteredResults = (data.data || []).filter(
						(user: InviterOption) => {
							const roleString =
								user.userRoleString?.toLowerCase() || "";
							const isMemberLevel =
								user.membershipLevel === "MEMBER" ||
								roleString.includes("member");
							const notSelf = user.id !== currentUserId;
							return isMemberLevel && notSelf;
						},
					);
					setInviterResults(filteredResults);
					setInviterErrorMessage(
						filteredResults.length === 0
							? t("form.inviterSearchEmpty")
							: null,
					);
				} else {
					setInviterResults([]);
					setInviterErrorMessage(t("form.inviterSearchFailed"));
				}
			} catch (error) {
				if (controller.signal.aborted) return;
				console.error("Failed to search inviter:", error);
				setInviterResults([]);
				setInviterErrorMessage(t("form.inviterSearchFailed"));
			} finally {
				setSearchingInviter(false);
			}
		}, 300);

		return () => {
			controller.abort();
			clearTimeout(timeoutId);
		};
	}, [inviterQuery, currentUserId, t]);

	const clearFieldError = (field: keyof typeof errors) => {
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const updateContribution = (index: number, value: string) => {
		setContributions((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
		clearFieldError("contributions");
	};

	const addContributionField = () =>
		setContributions((prev) => [...prev, ""]);

	const removeContributionField = (index: number) => {
		setContributions((prev) => {
			if (prev.length <= 1) return prev;
			return prev.filter((_, i) => i !== index);
		});
	};

	const updateOfflineEvent = (index: number, value: string) => {
		setOfflineEvents((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
		clearFieldError("offlineEvents");
	};

	const addOfflineEventField = () =>
		setOfflineEvents((prev) => [...prev, ""]);

	const removeOfflineEventField = (index: number) => {
		setOfflineEvents((prev) => {
			if (prev.length <= MIN_OFFLINE_EVENTS) return prev;
			return prev.filter((_, i) => i !== index);
		});
	};

	const handleSelectInviter = (inviter: InviterOption) => {
		setSelectedInviter(inviter);
		setInviterQuery(inviter.name || inviter.username || "");
		setInviterResults([]);
		setInviterErrorMessage(null);
		clearFieldError("inviter");
	};

	const handleClearInviter = () => {
		setSelectedInviter(null);
		setInviterQuery("");
		setInviterResults([]);
		setInviterErrorMessage(null);
		clearFieldError("inviter");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!organization || !currentUser) {
			return;
		}

		if (!validateForm()) {
			return;
		}

		if (!selectedInviter) {
			setErrors((prev) => ({
				...prev,
				inviter: t("form.errorInviterRequired"),
			}));
			return;
		}

		setIsSubmitting(true);
		try {
			const payload: Record<string, unknown> = {
				organizationId: organization.id,
				introduction: introduction.trim(),
				contributions: normalizedContributions,
				offlineEvents: normalizedOfflineEvents,
				inviterUserId: selectedInviter.id,
				inviterName: selectedInviter.name,
				availability: availability.trim(),
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
					if (errorData.error.includes("member")) {
						setErrors((prev) => ({
							...prev,
							inviter: errorData.error,
						}));
						return;
					}

					if (errorData.error.includes("线下活动")) {
						setErrors((prev) => ({
							...prev,
							offlineEvents: errorData.error,
						}));
						return;
					}

					if (errorData.error.includes("贡献")) {
						setErrors((prev) => ({
							...prev,
							contributions: errorData.error,
						}));
						return;
					}

					if (errorData.error.includes("2000")) {
						setErrors((prev) => ({
							...prev,
							introduction: errorData.error,
						}));
						return;
					}

					if (
						errorData.error.includes(
							"Already a member of this organization",
						)
					) {
						// Refresh membership status and show member view
						await checkMembershipStatus();
						return;
					}

					if (
						errorData.error.includes(
							"Application already submitted",
						)
					) {
						setErrors({
							introduction: "您已经提交过申请，请等待管理员审核",
						});
						return;
					}

					setErrors((prev) => ({
						...prev,
						introduction: errorData.error,
					}));
					toast({
						title: "提交失败",
						description: errorData.error,
						variant: "destructive",
					});
					return;
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
								<div className="space-y-2">
									<label className="text-sm font-medium mb-2 block">
										{t("form.introduction")}
									</label>
									<Textarea
										name="introduction"
										value={introduction}
										onChange={(e) => {
											setIntroduction(e.target.value);
											clearFieldError("introduction");
										}}
										placeholder={t(
											"form.reasonPlaceholder",
										)}
										rows={6}
										maxLength={MAX_INTRO_LENGTH}
										required
									/>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>{t("form.reasonHelp")}</span>
										<span>
											{applicationReasonLength}/
											{MAX_REASON_LENGTH}
										</span>
									</div>
									{errors.introduction ? (
										<p className="text-sm text-red-600">
											{errors.introduction}
										</p>
									) : null}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium mb-1 block">
										{t("form.contributionsTitle")}
									</label>
									<p className="text-xs text-muted-foreground">
										{t("form.contributionsHelp")}
									</p>
									<div className="space-y-3">
										{contributions.map((item, index) => (
											<div
												className="flex gap-2"
												key={`contribution-${index}`}
											>
												<Input
													value={item}
													onChange={(e) =>
														updateContribution(
															index,
															e.target.value,
														)
													}
													placeholder={t(
														"form.contributionPlaceholder",
													)}
												/>
												{contributions.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() =>
															removeContributionField(
																index,
															)
														}
														aria-label={t(
															"form.removeField",
														)}
													>
														<X className="h-4 w-4" />
													</Button>
												)}
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addContributionField}
										>
											<Plus className="h-4 w-4 mr-1" />
											{t("form.addContribution")}
										</Button>
									</div>
									{errors.contributions ? (
										<p className="text-sm text-red-600">
											{errors.contributions}
										</p>
									) : null}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium mb-1 block">
										{t("form.offlineEventsTitle")}
									</label>
									<p className="text-xs text-muted-foreground">
										{t("form.offlineEventsHelp")}
									</p>
									<div className="space-y-3">
										{offlineEvents.map((event, index) => (
											<div
												className="flex gap-2"
												key={`offline-${index}`}
											>
												<Input
													value={event}
													onChange={(e) =>
														updateOfflineEvent(
															index,
															e.target.value,
														)
													}
													placeholder={t(
														"form.offlineEventsPlaceholder",
													)}
												/>
												{offlineEvents.length >
													MIN_OFFLINE_EVENTS && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() =>
															removeOfflineEventField(
																index,
															)
														}
														aria-label={t(
															"form.removeField",
														)}
													>
														<X className="h-4 w-4" />
													</Button>
												)}
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addOfflineEventField}
										>
											<Plus className="h-4 w-4 mr-1" />
											{t("form.addOfflineEvent")}
										</Button>
									</div>
									{errors.offlineEvents ? (
										<p className="text-sm text-red-600">
											{errors.offlineEvents}
										</p>
									) : null}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium mb-1 block">
										{t("form.inviterTitle")}
									</label>
									<p className="text-xs text-muted-foreground">
										{t("form.inviterHelp")}
									</p>
									<div className="relative">
										<Input
											value={inviterQuery}
											onChange={(e) => {
												setInviterQuery(e.target.value);
												if (selectedInviter) {
													setSelectedInviter(null);
												}
												clearFieldError("inviter");
											}}
											placeholder={t(
												"form.inviterSearchPlaceholder",
											)}
										/>
										{searchingInviter && (
											<div className="absolute right-3 top-1/2 -translate-y-1/2">
												<div className="h-4 w-4 animate-spin rounded-full border-b-2 border-foreground" />
											</div>
										)}

										{inviterResults.length > 0 && (
											<div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-card shadow-lg">
												{inviterResults.map((user) => (
													<button
														type="button"
														key={user.id}
														onClick={() =>
															handleSelectInviter(
																user,
															)
														}
														className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted"
													>
														<Avatar className="h-8 w-8">
															<AvatarImage
																src={
																	user.image ||
																	""
																}
															/>
															<AvatarFallback>
																{user.name?.charAt(
																	0,
																) || "U"}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 text-left">
															<div className="text-sm font-medium">
																{user.name}
															</div>
															<div className="text-xs text-muted-foreground">
																{user.username
																	? `@${user.username}`
																	: ""}
																{user.userRoleString
																	? ` • ${user.userRoleString}`
																	: user.membershipLevel
																		? ` • ${user.membershipLevel}`
																		: ""}
															</div>
															{user.currentWorkOn && (
																<div className="text-xs text-muted-foreground">
																	{
																		user.currentWorkOn
																	}
																</div>
															)}
														</div>
													</button>
												))}
											</div>
										)}
									</div>

									{selectedInviter ? (
										<div className="flex items-center justify-between rounded-md border p-3">
											<div className="flex items-center gap-3">
												<Avatar className="h-9 w-9">
													<AvatarImage
														src={
															selectedInviter.image ||
															""
														}
													/>
													<AvatarFallback>
														{selectedInviter.name?.charAt(
															0,
														) || "U"}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="text-sm font-medium">
														{selectedInviter.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{selectedInviter.username
															? `@${selectedInviter.username}`
															: ""}
														{selectedInviter.userRoleString
															? ` • ${selectedInviter.userRoleString}`
															: selectedInviter.membershipLevel
																? ` • ${selectedInviter.membershipLevel}`
																: ""}
													</div>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={handleClearInviter}
											>
												{t("form.changeInviter")}
											</Button>
										</div>
									) : null}
									{inviterErrorMessage ? (
										<p className="text-xs text-muted-foreground">
											{inviterErrorMessage}
										</p>
									) : null}
									{errors.inviter ? (
										<p className="text-sm text-red-600">
											{errors.inviter}
										</p>
									) : null}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium mb-2 block">
										{t("form.availability")}
									</label>
									<Textarea
										name="availability"
										value={availability}
										onChange={(e) => {
											setAvailability(e.target.value);
											clearFieldError("availability");
										}}
										placeholder={t(
											"form.availabilityPlaceholder",
										)}
										rows={3}
										maxLength={MAX_AVAILABILITY_LENGTH}
										required
									/>
									<p className="text-xs text-muted-foreground">
										{t("form.availabilityHelp")}
									</p>
									{errors.availability ? (
										<p className="text-sm text-red-600">
											{errors.availability}
										</p>
									) : null}
								</div>

								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={
										isSubmitting ||
										introTooShort ||
										introTooLong ||
										contributionsInsufficient ||
										contributionsTooShort ||
										offlineEventsInsufficient ||
										offlineEventsTooShort ||
										inviterMissing ||
										availabilityTooShort ||
										availabilityTooLong ||
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
