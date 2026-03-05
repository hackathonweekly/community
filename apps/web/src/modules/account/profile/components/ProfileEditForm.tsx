"use client";
import { ProfileCompletionNotice } from "@/modules/account/profile/components/ProfileCompletionNotice";
import { Button } from "@community/ui/ui/button";
import { Form } from "@community/ui/ui/form";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { cacheInvalidation } from "@community/lib-client/cache-config";
import {
	validateCoreProfile,
	type ProfileFieldKey,
	type ProfileRequirementStatus,
	type UserProfileValidation,
} from "@community/lib-shared/utils/profile-validation";
import { useSession } from "@account/auth/hooks/use-session";
import { useRouter } from "@/hooks/router";
import { IdentityVerificationDialog } from "./IdentityVerificationDialog";
import { IdentityVerificationStatus } from "./IdentityVerificationStatus";
import { ProfileCoreDialog } from "./ProfileCoreDialog";
import { ProfileCorePreview } from "./ProfileCorePreview";
import { ResourceMatchingDialog } from "./ResourceMatchingDialog";
import { ResourceMatchingPreview } from "./ResourceMatchingPreview";
import { SkillsManagementDialog } from "./SkillsManagementDialog";
import { SkillsPreview } from "./SkillsPreview";
import { BasicInfoDialog } from "./BasicInfoDialog";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { SocialAccountsSection } from "./sections/SocialAccountsSection";
import { PROFILE_LIMITS } from "@community/lib-shared/utils/profile-limits";

// 创建一个更好的URL验证schema
const urlSchema = z
	.string()
	.refine(
		(val) => !val || val === "" || z.string().url().safeParse(val).success,
		{ message: "Invalid URL format" },
	)
	.optional();

const profileFormSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
	username: z
		.string()
		.min(2, "Username must be at least 2 characters")
		.max(20, "Username must be less than 20 characters")
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
			"Username can only contain letters, numbers, and underscores. Cannot start or end with underscore.",
		),
	bio: z
		.string()
		.max(500, "Bio must be less than 500 characters")
		.optional()
		.or(z.literal("")),
	region: z
		.string()
		.max(50, "Region name must be less than 50 characters")
		.optional()
		.or(z.literal("")),
	gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]).optional(),
	// 重新设计的字段
	userRoleString: z
		.string()
		.min(1, "Please enter your main role")
		.max(PROFILE_LIMITS.userRoleStringMax, "Role must be 7 characters max"),
	currentWorkOn: z
		.string()
		.max(
			PROFILE_LIMITS.currentWorkOnMax,
			"Current status must be 10 characters max",
		)
		.optional()
		.or(z.literal("")),
	githubUrl: urlSchema,
	twitterUrl: urlSchema,
	websiteUrl: urlSchema,
	wechatId: z
		.string()
		.max(50, "WeChat ID must be less than 50 characters")
		.optional()
		.or(z.literal("")),
	wechatQrCode: z.string().optional().or(z.literal("")),
	email: z.string().email("Invalid email format").optional(),
	phoneNumber: z
		.string()
		.regex(
			/^\+?[1-9]\d{1,14}|1[3-9]\d{9}$|^$/,
			"Invalid phone number format",
		)
		.optional()
		.or(z.literal("")),
	// 统一的技能系统
	skills: z.array(z.string()).min(1, "Please select at least one skill"),
	// 两部分资源匹配信息
	whatICanOffer: z
		.string()
		.max(500, "What I can offer must be less than 500 characters")
		.optional()
		.or(z.literal("")),
	whatIAmLookingFor: z
		.string()
		.max(500, "What I am looking for must be less than 500 characters")
		.optional()
		.or(z.literal("")),
	// 简化的当前状态
	lifeStatus: z
		.string()
		.max(20, "Life status must be less than 20 characters")
		.optional()
		.or(z.literal("")),
	// 身份验证字段（可选，仅在需要时填写）
	realName: z
		.string()
		.max(50, "Real name must be less than 50 characters")
		.optional()
		.or(z.literal("")),
	idCard: z
		.string()
		.regex(/^[0-9X]{18}$|^$/, "Invalid ID card format")
		.optional()
		.or(z.literal("")),
	shippingAddress: z
		.string()
		.max(200, "Shipping address must be less than 200 characters")
		.optional()
		.or(z.literal("")),
	shippingName: z
		.string()
		.max(50, "Shipping name must be less than 50 characters")
		.optional()
		.or(z.literal("")),
	shippingPhone: z
		.string()
		.regex(
			/^(\+?[1-9]\d{1,14}|1[3-9]\d{9})$|^$/,
			"Invalid phone number format",
		)
		.optional()
		.or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// 改进用户类型定义
type ProfileUser = {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
	bio: string | null;
	region: string | null;
	gender?: string | null;
	userRoleString: string | null; // 改为字符串类型
	currentWorkOn: string | null;
	githubUrl: string | null;
	twitterUrl: string | null;
	websiteUrl: string | null;
	wechatId: string | null;
	wechatQrCode?: string | null;
	phoneNumber: string | null;
	skills?: string[] | null;
	// 新的资源匹配字段
	whatICanOffer?: string | null;
	whatIAmLookingFor?: string | null;
	lifeStatus?: string | null;
	// 身份验证字段
	realName?: string | null;
	idCard?: string | null;
	idCardVerified?: boolean;
	shippingAddress?: string | null;
	shippingName?: string | null;
	shippingPhone?: string | null;
	identityVerifiedAt?: Date | null;
};

interface ProfileEditFormProps {
	user: ProfileUser;
	onSuccess?: () => void;
}

interface SectionSaveState {
	isLoading: boolean;
	hasChanges: boolean;
}

export function ProfileEditForm({ user, onSuccess }: ProfileEditFormProps) {
	const t = useTranslations();
	const { toast: showToast } = useToast();
	const queryClient = useQueryClient();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const { user: sessionUser, reloadSession } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();

	const invitationIdFromQuery = searchParams?.get("invitationId") ?? null;
	const redirectAfterProfile =
		searchParams?.get("redirectAfterProfile") ?? null;
	const pendingInvitationIdFromSession =
		sessionUser?.pendingInvitationId ?? null;
	const [activeInvitationId, setActiveInvitationId] = useState<string | null>(
		pendingInvitationIdFromSession ?? invitationIdFromQuery,
	);
	const acceptedInvitationIdsRef = useRef(new Set<string>());

	useEffect(() => {
		const nextInvitationId =
			pendingInvitationIdFromSession ?? invitationIdFromQuery ?? null;

		if (
			nextInvitationId &&
			acceptedInvitationIdsRef.current.has(nextInvitationId)
		) {
			setActiveInvitationId(null);
			return;
		}

		setActiveInvitationId((prev) =>
			prev === nextInvitationId ? prev : nextInvitationId,
		);
	}, [pendingInvitationIdFromSession, invitationIdFromQuery]);

	// 添加组件挂载状态跟踪，防止内存泄漏
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			// 组件卸载时取消所有进行中的请求
			abortControllerRef.current?.abort();
		};
	}, []);

	const acceptPendingInvitation = useCallback(
		async (invitationId: string) => {
			try {
				const response = await fetch(
					`/api/organizations/invitations/${invitationId}/accept`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
					},
				);

				const result = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(
						result.error || "接受组织邀请失败，请稍后再试",
					);
				}

				if (result.status === "needs_profile") {
					if (Array.isArray(result.missingFields)) {
						const details = result.missingFields.join("、");
						sonnerToast.info(
							`我们仍检测到以下资料未完善：${details}`,
						);
					}
					setActiveInvitationId(invitationId);
					return;
				}

				setActiveInvitationId(null);
				acceptedInvitationIdsRef.current.add(invitationId);
				showToast({ title: "资料更新成功，已加入组织" });
				await reloadSession().catch(() => undefined);

				if (typeof window !== "undefined") {
					const url = new URL(window.location.href);
					url.searchParams.delete("invitationId");
					const nextPath = url.searchParams.toString()
						? `${url.pathname}?${url.searchParams.toString()}`
						: url.pathname;
					router.replace(nextPath);
				}
			} catch (error) {
				setActiveInvitationId(invitationId);
				showToast({
					title:
						error instanceof Error
							? error.message
							: "接受组织邀请失败，请稍后再试",
					variant: "destructive",
				});
			}
		},
		[reloadSession, router, showToast],
	);

	// 弹窗状态
	const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
	const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
	const [profileCoreDialogOpen, setProfileCoreDialogOpen] = useState(false);
	const [resourceMatchingDialogOpen, setResourceMatchingDialogOpen] =
		useState(false);
	const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false);

	// 各个section的保存状态
	const [sectionStates, setSectionStates] = useState<
		Record<string, SectionSaveState>
	>({
		basicInfo: { isLoading: false, hasChanges: false },
		userRole: { isLoading: false, hasChanges: false },
		socialAccounts: { isLoading: false, hasChanges: false },
		privacy: { isLoading: false, hasChanges: false },
		skills: { isLoading: false, hasChanges: false },
		resourceMatching: { isLoading: false, hasChanges: false },
		lifeStatus: { isLoading: false, hasChanges: false },
		identityVerification: { isLoading: false, hasChanges: false },
	});

	// 使用useMemo优化默认值计算
	const defaultValues = useMemo(
		(): ProfileFormValues => ({
			name: user.name || "",
			username: user.username || "",
			bio: user.bio || "",
			region: user.region || "",
			gender: (user.gender as ProfileFormValues["gender"]) || undefined,
			userRoleString: user.userRoleString || "", // 现在是字符串类型
			currentWorkOn: user.currentWorkOn || "",
			githubUrl: user.githubUrl || "",
			twitterUrl: user.twitterUrl || "",
			websiteUrl: user.websiteUrl || "",
			wechatId: user.wechatId || "",
			wechatQrCode: user.wechatQrCode || "",
			email: user.email || "",
			phoneNumber: user.phoneNumber || "",
			skills: user.skills || [],
			// 新的资源匹配字段
			whatICanOffer: user.whatICanOffer || "",
			whatIAmLookingFor: user.whatIAmLookingFor || "",
			lifeStatus: user.lifeStatus || "",
			// 身份验证字段
			realName: user.realName || "",
			idCard: user.idCard || "",
			shippingAddress: user.shippingAddress || "",
			shippingName: user.shippingName || "",
			shippingPhone: user.shippingPhone || "",
		}),
		[user],
	);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileFormSchema),
		defaultValues,
	});

	// 监听表单变化，检测未保存的更改 - 优化版本，减少误触发
	const watchedValues = form.watch();

	const profileValidation = useMemo<UserProfileValidation>(() => {
		return validateCoreProfile({
			name: watchedValues.name,
			phoneNumber: watchedValues.phoneNumber,
			email: watchedValues.email,
			bio: watchedValues.bio,
			userRoleString: watchedValues.userRoleString,
			currentWorkOn: watchedValues.currentWorkOn,
			lifeStatus: watchedValues.lifeStatus,
			wechatId: watchedValues.wechatId,
			skills: watchedValues.skills,
			whatICanOffer: watchedValues.whatICanOffer,
			whatIAmLookingFor: watchedValues.whatIAmLookingFor,
		});
	}, [watchedValues]);

	const shouldShowProfileNotice = useMemo(() => {
		return (
			profileValidation.missingCount > 0 ||
			profileValidation.missingRecommendedFields.length > 0
		);
	}, [profileValidation]);
	useEffect(() => {
		// 使用深度比较，但忽略某些瞬时状态变化
		const normalizeValues = (values: any) => {
			// 创建一个副本并清理掉可能导致误判的字段
			const normalized = { ...values };
			// 如果有需要忽略的临时字段，可以在这里处理
			return normalized;
		};

		const hasChanges =
			JSON.stringify(normalizeValues(watchedValues)) !==
			JSON.stringify(normalizeValues(defaultValues));

		// 添加更长的延迟，避免在弹窗操作时误触发
		const timeoutId = setTimeout(() => {
			// 只有在弹窗都关闭的情况下才更新状态，避免弹窗操作时触发离开警告
			if (
				!skillsDialogOpen &&
				!identityDialogOpen &&
				!profileCoreDialogOpen &&
				!resourceMatchingDialogOpen
			) {
				setHasUnsavedChanges(hasChanges);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [
		watchedValues,
		defaultValues,
		skillsDialogOpen,
		identityDialogOpen,
		profileCoreDialogOpen,
		resourceMatchingDialogOpen,
	]);

	// 页面离开前的警告 - 更精确的检测
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// 只有在真正有未保存更改且弹窗都未打开时才显示警告
			if (
				hasUnsavedChanges &&
				!skillsDialogOpen &&
				!identityDialogOpen &&
				!profileCoreDialogOpen &&
				!resourceMatchingDialogOpen &&
				!basicInfoDialogOpen
			) {
				const message = "您有未保存的更改，确定要离开吗？";
				e.preventDefault();
				e.returnValue = message;
				return message;
			}
		};

		// 添加对弹窗状态的监听，确保弹窗打开时临时禁用beforeunload
		const handleKeyDown = (e: KeyboardEvent) => {
			// 如果弹窗开着，ESC键也不应该触发离开警告
			if (
				(skillsDialogOpen ||
					identityDialogOpen ||
					profileCoreDialogOpen ||
					resourceMatchingDialogOpen ||
					basicInfoDialogOpen) &&
				e.key === "Escape"
			) {
				// 临时清除未保存更改状态，避免ESC关闭弹窗时触发警告
				setHasUnsavedChanges(false);
				setTimeout(() => {
					// 延迟恢复状态检查
					const currentValues = form.getValues();
					const hasChanges =
						JSON.stringify(currentValues) !==
						JSON.stringify(defaultValues);
					if (
						!skillsDialogOpen &&
						!identityDialogOpen &&
						!profileCoreDialogOpen &&
						!resourceMatchingDialogOpen &&
						!basicInfoDialogOpen
					) {
						setHasUnsavedChanges(hasChanges);
					}
				}, 100);
			}
		};

		if (typeof window !== "undefined") {
			window.addEventListener("beforeunload", handleBeforeUnload);
			window.addEventListener("keydown", handleKeyDown);
			return () => {
				window.removeEventListener("beforeunload", handleBeforeUnload);
				window.removeEventListener("keydown", handleKeyDown);
			};
		}
	}, [
		hasUnsavedChanges,
		skillsDialogOpen,
		identityDialogOpen,
		profileCoreDialogOpen,
		resourceMatchingDialogOpen,
		basicInfoDialogOpen,
		form,
		defaultValues,
	]);

	const scrollToSection = useCallback((sectionId?: string) => {
		if (!sectionId) return;
		if (typeof window === "undefined") return;
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, []);

	// 保存指定section的数据
	const saveSectionData = useCallback(
		async (
			sectionName: string,
			sectionData: Partial<ProfileFormValues>,
		) => {
			// 取消之前的请求
			abortControllerRef.current?.abort();
			abortControllerRef.current = new AbortController();

			setSectionStates((prev) => ({
				...prev,
				[sectionName]: { ...prev[sectionName], isLoading: true },
			}));

			try {
				const response = await fetch("/api/profile/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(sectionData),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const fallbackMessage = `HTTP ${response.status}: Failed to update ${sectionName}`;
					throw new Error(
						errorData.message || errorData.error || fallbackMessage,
					);
				}

				// 检查组件是否仍然挂载
				if (!isMountedRef.current) {
					return false;
				}

				showToast({
					title: "Success",
					description: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} updated successfully`,
				});

				// 失效相关缓存，确保数据一致性
				cacheInvalidation.onProfileUpdate(queryClient);

				// 更新表单值并重置到当前状态，清除未保存更改检测
				const currentValues = form.getValues();
				const updatedValues = { ...currentValues, ...sectionData };
				form.reset(updatedValues);

				// 立即清除未保存更改状态
				setHasUnsavedChanges(false);

				setSectionStates((prev) => ({
					...prev,
					[sectionName]: { isLoading: false, hasChanges: false },
				}));

				return true;
			} catch (error) {
				// 忽略取消的请求
				if (error instanceof Error && error.name === "AbortError") {
					return false;
				}

				// 检查组件是否仍然挂载
				if (!isMountedRef.current) {
					return false;
				}

				console.error(`${sectionName} update error:`, error);
				showToast({
					title: "Update Failed",
					description:
						error instanceof Error
							? error.message
							: `Failed to update ${sectionName}`,
					variant: "destructive",
				});

				setSectionStates((prev) => ({
					...prev,
					[sectionName]: { ...prev[sectionName], isLoading: false },
				}));

				return false;
			}
		},
		[showToast, form, queryClient],
	);

	// 各section的保存函数
	const saveBasicInfo = useCallback(async () => {
		const data = form.getValues();
		const basicInfoData = {
			name: data.name,
			username: data.username,
			bio: data.bio,
			region: data.region,
			gender: data.gender,
			phoneNumber: data.phoneNumber,
			wechatId: data.wechatId,
			wechatQrCode: data.wechatQrCode,
			email: data.email,
		};
		return await saveSectionData("basicInfo", basicInfoData);
	}, [form, saveSectionData]);

	const saveUserRole = useCallback(async () => {
		const data = form.getValues();
		const userRoleData = {
			userRoleString: data.userRoleString,
			currentWorkOn: data.currentWorkOn,
		};
		return await saveSectionData("userRole", userRoleData);
	}, [form, saveSectionData]);

	const saveSocialAccounts = useCallback(async () => {
		const data = form.getValues();
		const socialData = {
			githubUrl: data.githubUrl,
			twitterUrl: data.twitterUrl,
			websiteUrl: data.websiteUrl,
		};
		return await saveSectionData("socialAccounts", socialData);
	}, [form, saveSectionData]);

	// 保存技能
	const saveSkills = useCallback(async () => {
		const data = form.getValues();
		const skillsData = {
			skills: data.skills || [],
		};
		return await saveSectionData("skills", skillsData);
	}, [form, saveSectionData]);

	// 保存核心档案信息
	const saveProfileCore = useCallback(
		async (data: any) => {
			return await saveSectionData("profileCore", data);
		},
		[saveSectionData],
	);

	// 保存资源匹配信息 - 更新为新的处理方式
	const saveResourceMatchingNew = useCallback(
		async (data: any) => {
			return await saveSectionData("resourceMatching", data);
		},
		[saveSectionData],
	);
	const saveResourceMatching = useCallback(async () => {
		const data = form.getValues();
		const resourceData = {
			whatICanOffer: data.whatICanOffer,
			whatIAmLookingFor: data.whatIAmLookingFor,
		};
		return await saveSectionData("resourceMatching", resourceData);
	}, [form, saveSectionData]);

	// 保存当前状态
	const saveLifeStatus = useCallback(async () => {
		const data = form.getValues();
		const statusData = {
			lifeStatus: data.lifeStatus,
		};
		return await saveSectionData("lifeStatus", statusData);
	}, [form, saveSectionData]);

	// 保存身份验证信息
	const saveIdentityVerification = useCallback(async () => {
		const data = form.getValues();
		const identityData = {
			realName: data.realName,
			idCard: data.idCard,
			shippingAddress: data.shippingAddress,
			shippingName: data.shippingName,
			shippingPhone: data.shippingPhone,
		};
		return await saveSectionData("identityVerification", identityData);
	}, [form, saveSectionData]);

	// 技能更改处理 - 添加延迟避免与UI交互冲突
	const handleSkillsChange = useCallback(
		(skills: string[]) => {
			// 延迟设置，避免在用户快速点击时触发离开警告
			setTimeout(() => {
				form.setValue("skills", skills, { shouldDirty: true });
			}, 200);
		},
		[form],
	);

	// 弹窗打开处理函数，确保打开弹窗时不会触发离开警告
	const handleOpenSkillsDialog = useCallback((e?: React.MouseEvent) => {
		e?.preventDefault?.();
		// 临时清除未保存更改状态
		setHasUnsavedChanges(false);
		setSkillsDialogOpen(true);
	}, []);

	const handleOpenIdentityDialog = useCallback((e?: React.MouseEvent) => {
		e?.preventDefault?.();
		// 临时清除未保存更改状态
		setHasUnsavedChanges(false);
		setIdentityDialogOpen(true);
	}, []);

	const handleOpenProfileCoreDialog = useCallback((e?: React.MouseEvent) => {
		e?.preventDefault?.();
		// 临时清除未保存更改状态
		setHasUnsavedChanges(false);
		setProfileCoreDialogOpen(true);
	}, []);

	const handleOpenResourceMatchingDialog = useCallback(
		(e?: React.MouseEvent) => {
			e?.preventDefault?.();
			// 临时清除未保存更改状态
			setHasUnsavedChanges(false);
			setResourceMatchingDialogOpen(true);
		},
		[],
	);

	const handleOpenBasicInfoDialog = useCallback((e?: React.MouseEvent) => {
		e?.preventDefault?.();
		// 临时清除未保存更改状态
		setHasUnsavedChanges(false);
		setBasicInfoDialogOpen(true);
	}, []);

	// 弹窗关闭处理函数，恢复状态检查
	const handleCloseSkillsDialog = useCallback(
		(open: boolean) => {
			setSkillsDialogOpen(open);
			if (!open) {
				// 延迟恢复状态检查，并检查组件是否仍然挂载
				setTimeout(() => {
					if (isMountedRef.current) {
						const currentValues = form.getValues();
						const hasChanges =
							JSON.stringify(currentValues) !==
							JSON.stringify(defaultValues);
						setHasUnsavedChanges(hasChanges);
					}
				}, 200);
			}
		},
		[form, defaultValues],
	);

	const handleCloseIdentityDialog = useCallback(
		(open: boolean) => {
			setIdentityDialogOpen(open);
			if (!open) {
				// 延迟恢复状态检查，并检查组件是否仍然挂载
				setTimeout(() => {
					if (isMountedRef.current) {
						const currentValues = form.getValues();
						const hasChanges =
							JSON.stringify(currentValues) !==
							JSON.stringify(defaultValues);
						setHasUnsavedChanges(hasChanges);
					}
				}, 200);
			}
		},
		[form, defaultValues],
	);

	const handleCloseProfileCoreDialog = useCallback(
		(open: boolean) => {
			setProfileCoreDialogOpen(open);
			if (!open) {
				// 延迟恢复状态检查，并检查组件是否仍然挂载
				setTimeout(() => {
					if (isMountedRef.current) {
						const currentValues = form.getValues();
						const hasChanges =
							JSON.stringify(currentValues) !==
							JSON.stringify(defaultValues);
						setHasUnsavedChanges(hasChanges);
					}
				}, 200);
			}
		},
		[form, defaultValues],
	);

	const handleCloseResourceMatchingDialog = useCallback(
		(open: boolean) => {
			setResourceMatchingDialogOpen(open);
			if (!open) {
				// 延迟恢复状态检查，并检查组件是否仍然挂载
				setTimeout(() => {
					if (isMountedRef.current) {
						const currentValues = form.getValues();
						const hasChanges =
							JSON.stringify(currentValues) !==
							JSON.stringify(defaultValues);
						setHasUnsavedChanges(hasChanges);
					}
				}, 200);
			}
		},
		[form, defaultValues],
	);

	const handleCloseBasicInfoDialog = useCallback(
		(open: boolean) => {
			setBasicInfoDialogOpen(open);
			if (!open) {
				// 延迟恢复状态检查，并检查组件是否仍然挂载
				setTimeout(() => {
					if (isMountedRef.current) {
						const currentValues = form.getValues();
						const hasChanges =
							JSON.stringify(currentValues) !==
							JSON.stringify(defaultValues);
						setHasUnsavedChanges(hasChanges);
					}
				}, 200);
			}
		},
		[form, defaultValues],
	);

	const fieldActionMap = useMemo(
		() =>
			({
				name: () => handleOpenBasicInfoDialog(),
				username: () => handleOpenBasicInfoDialog(),
				phoneNumber: () => handleOpenBasicInfoDialog(),
				email: () => handleOpenBasicInfoDialog(),
				region: () => handleOpenBasicInfoDialog(),
				gender: () => handleOpenBasicInfoDialog(),
				wechatId: () => handleOpenBasicInfoDialog(),
				bio: () => handleOpenProfileCoreDialog(),
				userRoleString: () => handleOpenProfileCoreDialog(),
				currentWorkOn: () => handleOpenProfileCoreDialog(),
				lifeStatus: () => handleOpenProfileCoreDialog(),
				skills: () => handleOpenSkillsDialog(),
				whatICanOffer: () => handleOpenResourceMatchingDialog(),
				whatIAmLookingFor: () => handleOpenResourceMatchingDialog(),
			}) satisfies Partial<Record<ProfileFieldKey, () => void>>,
		[
			handleOpenBasicInfoDialog,
			handleOpenProfileCoreDialog,
			handleOpenResourceMatchingDialog,
			handleOpenSkillsDialog,
		],
	);

	const handleFixProfileField = useCallback(
		(field: ProfileRequirementStatus) => {
			scrollToSection(field.sectionId);
			const action = fieldActionMap[field.key];
			if (action) {
				action();
			}
		},
		[scrollToSection, fieldActionMap],
	);

	// 资源匹配信息更改处理
	const handleOfferingChange = useCallback(
		(offering: string) => {
			form.setValue("whatICanOffer", offering, { shouldDirty: true });
		},
		[form],
	);

	const handleLookingForChange = useCallback(
		(lookingFor: string) => {
			form.setValue("whatIAmLookingFor", lookingFor, {
				shouldDirty: true,
			});
		},
		[form],
	);

	// 身份验证数据处理
	const getIdentityData = useCallback(() => {
		return {
			realName: user.realName || "",
			idCard: user.idCard || "",
			shippingAddress: user.shippingAddress || "",
			shippingName: user.shippingName || "",
			shippingPhone: user.shippingPhone || "",
		};
	}, [user]);

	const hasIdentityData = useMemo(() => {
		const identityData = getIdentityData();
		return Object.values(identityData).some(
			(value) => value && value.trim() !== "",
		);
	}, [getIdentityData]);

	// 当前状态更改处理 - 添加延迟避免与UI交互冲突
	const handleLifeStatusChange = useCallback(
		(status: string) => {
			// 延迟设置，避免在用户点击状态选项时触发离开警告
			setTimeout(() => {
				form.setValue("lifeStatus", status, { shouldDirty: true });
			}, 200);
		},
		[form],
	);

	// 优化提交函数（保存所有内容）
	const onSubmit = useCallback(
		async (data: ProfileFormValues) => {
			const allSections = [
				"basicInfo",
				"userRole",
				"socialAccounts",
				"privacy",
				"skills",
				"resourceMatching",
				"lifeStatus",
				"identityVerification",
			];

			// 设置所有section为loading状态
			setSectionStates((prev) => {
				const newState = { ...prev };
				allSections.forEach((section) => {
					newState[section] = {
						...newState[section],
						isLoading: true,
					};
				});
				return newState;
			});

			try {
				const response = await fetch("/api/profile/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const fallbackMessage = `HTTP ${response.status}: Failed to update profile`;
					throw new Error(
						errorData.message || errorData.error || fallbackMessage,
					);
				}

				// 成功提示
				showToast({
					title: t("profile.success.updated"),
					description: t("profile.success.profileSaved"),
				});

				// 失效相关缓存，确保数据一致性
				cacheInvalidation.onProfileUpdate(queryClient);

				// 重置表单状态为当前值，清除未保存更改标记
				form.reset(data);
				setHasUnsavedChanges(false);

				// 重置所有section状态
				setSectionStates((prev) => {
					const newState = { ...prev };
					allSections.forEach((section) => {
						newState[section] = {
							isLoading: false,
							hasChanges: false,
						};
					});
					return newState;
				});

				// 调用成功回调
				onSuccess?.();

				const invitationToAccept = activeInvitationId;
				if (invitationToAccept) {
					await acceptPendingInvitation(invitationToAccept);
				}

				// 处理个人信息完善后的跳转逻辑
				if (redirectAfterProfile) {
					// 如果指定了跳转路径，直接跳转
					if (redirectAfterProfile.startsWith("/")) {
						router.push(redirectAfterProfile);
					} else {
						// 如果是相对路径，构建完整路径
						router.push(`/u/${redirectAfterProfile}`);
					}
				}
			} catch (error) {
				console.error("Profile update error:", error);
				showToast({
					title: t("profile.errors.updateFailed"),
					description:
						error instanceof Error
							? error.message
							: t("profile.errors.tryAgain"),
					variant: "destructive",
				});

				// 重置loading状态
				setSectionStates((prev) => {
					const newState = { ...prev };
					allSections.forEach((section) => {
						newState[section] = {
							...newState[section],
							isLoading: false,
						};
					});
					return newState;
				});
			}
		},
		[
			t,
			showToast,
			onSuccess,
			form,
			queryClient,
			acceptPendingInvitation,
			activeInvitationId,
		],
	);

	return (
		<div className="space-y-4">
			{/* 资料完善提示 */}
			{shouldShowProfileNotice && (
				<ProfileCompletionNotice
					validation={profileValidation}
					variant="card"
					onFixField={handleFixProfileField}
				/>
			)}

			<Form {...form}>
				<form className="space-y-4">
					{/* 基本信息 */}
					<div id="essential-info">
						<BasicInfoSection
							initialData={{
								name: user.name,
								username: user.username,
								region: user.region,
								gender: user.gender,
								phoneNumber: user.phoneNumber,
								wechatId: user.wechatId,
								wechatQrCode: user.wechatQrCode,
								email: user.email,
							}}
							onOpenDialog={handleOpenBasicInfoDialog}
						/>
					</div>

					{/* 核心档案预览 - 替代原来的长角色信息表单 */}
					<div id="role-info">
						<ProfileCorePreview
							bio={form.watch("bio")}
							userRoleString={form.watch("userRoleString")}
							currentWorkOn={form.watch("currentWorkOn")}
							lifeStatus={form.watch("lifeStatus")}
							onManageCore={handleOpenProfileCoreDialog}
						/>
					</div>

					{/* 资源匹配预览 - 替代原来的长表单 */}
					<div id="resource-matching">
						<ResourceMatchingPreview
							whatICanOffer={form.watch("whatICanOffer")}
							whatIAmLookingFor={form.watch("whatIAmLookingFor")}
							onManageResourceMatching={
								handleOpenResourceMatchingDialog
							}
						/>
					</div>

					{/* 技能预览组件 */}
					<div id="skills">
						<SkillsPreview
							skills={form.watch("skills") || []}
							onManageSkills={handleOpenSkillsDialog}
						/>
					</div>

					{/* 社交账号 */}
					<SocialAccountsSection
						control={form.control}
						onSave={saveSocialAccounts}
						isLoading={sectionStates.socialAccounts.isLoading}
					/>

					{/* 身份验证状态组件 */}
					<IdentityVerificationStatus
						hasData={hasIdentityData}
						isVerified={user.idCardVerified || false}
						onManageIdentity={handleOpenIdentityDialog}
					/>

					{/* 全局保存按钮 */}
					<div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4 dark:border-border">
						<Button
							type="button"
							variant="outline"
							onClick={() => form.reset(defaultValues)}
							disabled={Object.values(sectionStates).some(
								(state) => state.isLoading,
							)}
							className="h-8 rounded-full border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
						>
							{t("profile.form.reset")}
						</Button>
						<Button
							type="button"
							onClick={form.handleSubmit(onSubmit)}
							disabled={Object.values(sectionStates).some(
								(state) => state.isLoading,
							)}
							className="h-8 rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
						>
							{Object.values(sectionStates).some(
								(state) => state.isLoading,
							)
								? t("profile.form.saving")
								: t("profile.form.saveAll")}
						</Button>
					</div>
				</form>
			</Form>

			{/* 技能管理弹窗 */}
			<SkillsManagementDialog
				open={skillsDialogOpen}
				onOpenChange={handleCloseSkillsDialog}
				selectedSkills={form.watch("skills") || []}
				onSkillsChange={(skills) => {
					form.setValue("skills", skills, { shouldDirty: true });
				}}
				onSave={saveSkills}
				isLoading={sectionStates.skills.isLoading}
			/>

			{/* 核心档案编辑弹窗 */}
			<ProfileCoreDialog
				open={profileCoreDialogOpen}
				onOpenChange={handleCloseProfileCoreDialog}
				initialData={{
					bio: user.bio,
					userRoleString: user.userRoleString,
					currentWorkOn: user.currentWorkOn,
					lifeStatus: user.lifeStatus,
				}}
				onSave={saveProfileCore}
				isLoading={sectionStates.profileCore?.isLoading}
			/>

			{/* 资源匹配编辑弹窗 */}
			<ResourceMatchingDialog
				open={resourceMatchingDialogOpen}
				onOpenChange={handleCloseResourceMatchingDialog}
				initialData={{
					whatICanOffer: user.whatICanOffer,
					whatIAmLookingFor: user.whatIAmLookingFor,
				}}
				onSave={saveResourceMatchingNew}
				isLoading={sectionStates.resourceMatching?.isLoading}
			/>

			{/* 身份验证弹窗 */}
			<IdentityVerificationDialog
				open={identityDialogOpen}
				onOpenChange={handleCloseIdentityDialog}
				initialData={getIdentityData()}
				onSave={async (data) => {
					// 更新表单数据
					Object.keys(data).forEach((key) => {
						form.setValue(key as any, (data as any)[key], {
							shouldDirty: true,
						});
					});
					// 保存身份验证信息
					return await saveSectionData("identityVerification", data);
				}}
				isLoading={sectionStates.identityVerification.isLoading}
				isVerified={user.idCardVerified || false}
			/>

			{/* 基本信息编辑弹窗 */}
			<BasicInfoDialog
				open={basicInfoDialogOpen}
				onOpenChange={handleCloseBasicInfoDialog}
				userId={user.id}
				initialData={{
					name: user.name,
					username: user.username,
					region: user.region,
					gender: user.gender,
					phoneNumber: user.phoneNumber,
					wechatId: user.wechatId,
					wechatQrCode: user.wechatQrCode,
					email: user.email,
				}}
				onSave={async (data) => {
					// 更新表单数据
					Object.keys(data).forEach((key) => {
						form.setValue(key as any, (data as any)[key], {
							shouldDirty: true,
						});
					});
					// 保存基本信息
					return await saveBasicInfo();
				}}
				isLoading={sectionStates.basicInfo.isLoading}
			/>
		</div>
	);
}
