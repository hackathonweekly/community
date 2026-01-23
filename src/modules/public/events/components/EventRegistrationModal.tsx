"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	validateFullPhoneNumber,
	type PhoneValidationResult,
} from "@/lib/utils/phone-validation";
import { resolveRegistrationFieldConfig } from "@/lib/events/registration-fields";
import { PROFILE_LIMITS } from "@/lib/utils/profile-limits";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSection } from "./ProfileSection";
import { ProjectSection } from "./ProjectSection";
import { TicketSelection } from "./TicketSelection";
import { QuestionsForm } from "./QuestionsForm";
import type {
	EventRegistration,
	Project,
	Question,
	TicketType,
	UserProfile,
} from "./types";
import { PaymentModal, type PaymentOrderData } from "./PaymentModal";
import { useTicketSelection } from "./useTicketSelection";
import { WeChatBindingPrompt } from "./WeChatBindingPrompt";
import {
	parseRegistrationErrorPayload,
	resolveRegistrationErrorMessage,
} from "./registrationErrorUtils";

interface EventRegistrationModalProps {
	isOpen: boolean;
	onClose: () => void;
	event: {
		id: string;
		title: string;
		requireApproval: boolean;
		requireProjectSubmission?: boolean;
		askDigitalCardConsent?: boolean;
		questions: Question[];
		ticketTypes: TicketType[];
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
		registrationFieldConfig?: any;
	};
	inviteCode?: string;
	onRegistrationComplete: (registration: EventRegistration) => void;
}

export function EventRegistrationModal({
	isOpen,
	onClose,
	event,
	inviteCode,
	onRegistrationComplete,
}: EventRegistrationModalProps) {
	const t = useTranslations("events.registration");
	const router = useRouter();
	const defaultRegistrationError = t("toasts.registrationFailed");
	const fieldConfig = resolveRegistrationFieldConfig(
		event.registrationFieldConfig,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [selectedTicketType, setSelectedTicketType] = useState<string>("");
	const [selectedQuantity, setSelectedQuantity] = useState(1);
	const [paymentOrder, setPaymentOrder] = useState<PaymentOrderData | null>(
		null,
	);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [wechatBindingOpen, setWechatBindingOpen] = useState(false);
	const [wechatBindingMessage, setWechatBindingMessage] = useState<
		string | null
	>(null);
	const [pendingOrderChecked, setPendingOrderChecked] = useState(false);
	const [allowDigitalCardDisplay, setAllowDigitalCardDisplay] = useState<
		boolean | null
	>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [projectsLoading, setProjectsLoading] = useState(false);
	const [selectedProjectId, setSelectedProjectId] = useState<string>("");
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [profileLoading, setProfileLoading] = useState(false);
	const [showInlineProfileEdit, setShowInlineProfileEdit] = useState(false);
	const [editingProfile, setEditingProfile] = useState({
		name: "",
		bio: "",
		userRoleString: "",
		currentWorkOn: "",
		phoneNumber: "",
		email: "",
		lifeStatus: "",
		wechatId: "",
		shippingAddress: "",
	});
	const [savingProfile, setSavingProfile] = useState(false);
	const [phoneValidation, setPhoneValidation] =
		useState<PhoneValidationResult>({
			isValid: true,
		});
	const [emailError, setEmailError] = useState<string | null>(null);

	// Project quick edit states
	const [showInlineProjectEdit, setShowInlineProjectEdit] = useState(false);
	const [editingProject, setEditingProject] = useState({
		title: "",
		subtitle: "",
		stage: "IDEA_VALIDATION",
	});
	const [savingProject, setSavingProject] = useState(false);

	const WECHAT_EMAIL_SUFFIX = "@wechat.app";
	const normalizeEmail = (value?: string | null) => {
		if (!value) {
			return "";
		}
		const trimmed = value.trim();
		if (!trimmed) {
			return "";
		}
		return trimmed.toLowerCase().endsWith(WECHAT_EMAIL_SUFFIX)
			? ""
			: trimmed;
	};

	const isEmailValid = (value: string) => {
		const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return pattern.test(value);
	};

	const isFieldEnabled = (key: keyof typeof fieldConfig.fields) =>
		fieldConfig.fields[key]?.enabled;

	const isFieldRequired = (key: keyof typeof fieldConfig.fields) =>
		fieldConfig.fields[key]?.required;

	// Handle phone number change with proper validation
	const handlePhoneNumberChange = (value: string) => {
		setEditingProfile((prev) => ({
			...prev,
			phoneNumber: value,
		}));

		// Use the proper phone validation from lib
		if (value.trim()) {
			// For Chinese phone numbers, add +86 prefix if not present
			const fullPhoneNumber = value.startsWith("+")
				? value
				: `+86${value}`;
			const validation = validateFullPhoneNumber(fullPhoneNumber);
			setPhoneValidation(validation);
		} else {
			setPhoneValidation({ isValid: true });
		}
	};

	// Fetch user projects when modal opens and requires project submission
	useEffect(() => {
		if (isOpen && event.requireProjectSubmission) {
			fetchUserProjects();
		}
	}, [isOpen, event.requireProjectSubmission]);

	// Fetch user profile when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchUserProfile();
			setPhoneValidation({ isValid: true }); // Reset phone validation when modal opens
			setEmailError(null);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setPendingOrderChecked(false);
			return;
		}
		if (pendingOrderChecked || paymentOpen || paymentOrder) return;

		const fetchPendingOrder = async () => {
			try {
				const response = await fetch(
					`/api/events/${event.id}/orders/pending`,
				);
				if (!response.ok) {
					return;
				}
				const result = await response.json();
				if (result?.data) {
					toast.info(t("payment.existingOrderFound"));
					setPaymentOrder(result.data as PaymentOrderData);
					setPaymentOpen(true);
				}
			} catch (error) {
				console.error("Error checking pending order:", error);
			} finally {
				setPendingOrderChecked(true);
			}
		};

		fetchPendingOrder();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, pendingOrderChecked, event.id, paymentOpen, paymentOrder]);

	// Initialize editing profile when user profile is loaded
	useEffect(() => {
		if (userProfile) {
			setEditingProfile({
				name: userProfile.name || "",
				bio: userProfile.bio || "",
				userRoleString: userProfile.userRoleString || "",
				currentWorkOn: userProfile.currentWorkOn || "",
				phoneNumber: userProfile.phoneNumber || "",
				email: normalizeEmail(userProfile.email),
				lifeStatus: userProfile.lifeStatus || "",
				wechatId: userProfile.wechatId || "",
				shippingAddress: userProfile.shippingAddress || "",
			});
			setEmailError(null);
		}
	}, [userProfile]);

	const fetchUserProjects = async () => {
		setProjectsLoading(true);
		try {
			const response = await fetch("/api/projects");
			if (response.ok) {
				const data = await response.json();
				setProjects(data.projects || []);
			}
		} catch (error) {
			console.error("Error fetching projects:", error);
			toast.error(t("toasts.projectsFetchError"));
		} finally {
			setProjectsLoading(false);
		}
	};

	const fetchUserProfile = async () => {
		setProfileLoading(true);
		try {
			const response = await fetch("/api/profile");
			if (response.ok) {
				const data = await response.json();
				setUserProfile({
					bio: data.user?.bio,
					userRoleString: data.user?.userRoleString,
					currentWorkOn: data.user?.currentWorkOn,
					name: data.user?.name,
					preferredContact: data.user?.preferredContact,
					phoneNumber: data.user?.phoneNumber,
					wechatId: data.user?.wechatId,
					email: normalizeEmail(data.user?.email),
					emailVerified: data.user?.emailVerified ?? null,
					showWechat: data.user?.showWechat,
					showEmail: data.user?.showEmail,
					lifeStatus: data.user?.lifeStatus,
					shippingAddress: data.user?.shippingAddress,
				});
			}
		} catch (error) {
			console.error("Error fetching user profile:", error);
		} finally {
			setProfileLoading(false);
		}
	};

	const saveUserProfile = async (silent = false) => {
		const nameRequired = isFieldRequired("name");
		const nameToSave =
			editingProfile.name.trim() || userProfile?.name?.trim() || "";
		if (nameRequired && !nameToSave) {
			const message = "请填写姓名";
			if (!silent) toast.error(message);
			throw new Error(message);
		}

		const emailRequired = isFieldRequired("email");
		const trimmedEmail = editingProfile.email.trim();
		const effectiveEmail =
			trimmedEmail || (!emailRequired ? userProfile?.email || "" : "");

		if (emailRequired && !effectiveEmail) {
			const message = "请填写邮箱，方便接收通知";
			setEmailError(message);
			if (!silent) {
				toast.error(message);
			}
			throw new Error(message);
		}

		if (effectiveEmail && !isEmailValid(effectiveEmail)) {
			const message = "请输入有效的邮箱地址";
			setEmailError(message);
			if (!silent) {
				toast.error(message);
			}
			throw new Error(message);
		}

		setEmailError(null);

		// Check for phone validation errors before saving
		const phoneRequired = isFieldRequired("phoneNumber");
		const phoneToSave = editingProfile.phoneNumber.trim();
		if (phoneRequired && !phoneToSave) {
			const message = "请填写手机号";
			if (!silent) toast.error(message);
			throw new Error(message);
		}

		if (!phoneValidation.isValid && phoneToSave) {
			if (!silent) {
				toast.error(
					phoneValidation.errorMessage || t("toasts.invalidPhone"),
				);
			}
			throw new Error(
				phoneValidation.errorMessage || t("toasts.invalidPhone"),
			);
		}

		setSavingProfile(true);
		try {
			const payload: Record<string, unknown> = {};

			if (isFieldEnabled("bio")) payload.bio = editingProfile.bio;
			if (isFieldEnabled("userRoleString"))
				payload.userRoleString = editingProfile.userRoleString;
			if (isFieldEnabled("currentWorkOn"))
				payload.currentWorkOn = editingProfile.currentWorkOn;
			if (isFieldEnabled("lifeStatus"))
				payload.lifeStatus = editingProfile.lifeStatus;

			if (isFieldEnabled("name") || nameToSave) {
				payload.name = nameToSave;
			}
			if (phoneToSave) {
				payload.phoneNumber = phoneToSave;
			}
			if (effectiveEmail) {
				payload.email = effectiveEmail;
			}
			if (isFieldEnabled("wechatId")) {
				payload.wechatId = editingProfile.wechatId;
			}
			if (isFieldEnabled("shippingAddress")) {
				payload.shippingAddress = editingProfile.shippingAddress;
			}

			const response = await fetch("/api/profile/update", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				let errorMessage = t("toasts.profileSaveFailed");
				let errorDetails: Record<string, string> = {};
				try {
					const errorData = await response.json();
					// 提取 error 字段作为通用错误消息
					errorMessage = errorData.error || errorMessage;
					// 提取 details 字段，包含具体字段的错误信息
					if (
						errorData.details &&
						typeof errorData.details === "object"
					) {
						errorDetails = errorData.details;
					}
				} catch (parseError) {
					// If JSON parsing fails, use status text
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}

				// 如果有具体字段的错误，显示第一个具体错误
				if (Object.keys(errorDetails).length > 0) {
					const firstErrorField = Object.keys(errorDetails)[0];
					const firstErrorMessage = errorDetails[firstErrorField];
					if (firstErrorMessage) {
						errorMessage = `${firstErrorMessage}`;
					}
				}

				throw new Error(errorMessage);
			}

			// Update local state immediately
			const updatedProfile = {
				...userProfile,
				name: nameToSave || userProfile?.name,
				bio: editingProfile.bio,
				userRoleString: editingProfile.userRoleString,
				currentWorkOn: editingProfile.currentWorkOn,
				phoneNumber: phoneToSave || userProfile?.phoneNumber,
				email: effectiveEmail || userProfile?.email,
				emailVerified:
					userProfile?.email === effectiveEmail
						? (userProfile?.emailVerified ?? null)
						: false,
				lifeStatus: editingProfile.lifeStatus,
				wechatId: editingProfile.wechatId,
				shippingAddress: editingProfile.shippingAddress,
			};
			setUserProfile(updatedProfile);
			setEditingProfile((prev) => ({
				...prev,
				email: effectiveEmail,
			}));

			if (!silent) {
				toast.success(t("toasts.profileSaved"));
				setShowInlineProfileEdit(false);
				setPhoneValidation({ isValid: true }); // Clear phone validation on successful save
			}
		} catch (error) {
			console.error("Error saving profile:", error);
			if (!silent) {
				const fallbackMessage = t("toasts.profileSaveFailed");
				toast.error(
					error instanceof Error ? error.message : fallbackMessage,
				);
			}
			throw error; // Re-throw for caller to handle
		} finally {
			setSavingProfile(false);
		}
	};

	const handleSaveProfile = async () => {
		await saveUserProfile(false);
	};

	const saveProject = async () => {
		setSavingProject(true);
		try {
			const response = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: editingProject.title,
					subtitle: editingProject.subtitle,
					stage: editingProject.stage,
				}),
			});

			if (!response.ok) {
				let errorMessage = t("toasts.projectCreateFailed");
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (parseError) {
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			const newProject = data.project;

			// Update local projects list
			setProjects((prev) => [...prev, newProject]);
			setSelectedProjectId(newProject.id);

			// Reset form and close
			setEditingProject({
				title: "",
				subtitle: "",
				stage: "IDEA_VALIDATION",
			});
			setShowInlineProjectEdit(false);

			toast.success(t("toasts.projectCreated"));
		} catch (error) {
			console.error("Error creating project:", error);
			const fallbackMessage = t("toasts.projectCreateFailed");
			toast.error(
				error instanceof Error ? error.message : fallbackMessage,
			);
		} finally {
			setSavingProject(false);
		}
	};

	const handleSaveProject = async () => {
		await saveProject();
	};

	const { availableTicketTypes, selectedTicket, selectedTier, isPaidTicket } =
		useTicketSelection({
			ticketTypes: event.ticketTypes,
			selectedTicketType,
			selectedQuantity,
			onQuantityChange: setSelectedQuantity,
		});

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: answer,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required questions
		const missingAnswers = event.questions
			.filter((q) => q.required && !answers[q.id])
			.map((q) => q.question);

		if (missingAnswers.length > 0) {
			toast.error(
				t("validation.missingAnswers", {
					questions: missingAnswers.join(", "),
				}),
			);
			return;
		}

		// Validate ticket type selection if there are multiple types
		if (availableTicketTypes.length > 1 && !selectedTicketType) {
			toast.error(t("validation.selectTicketType"));
			return;
		}

		if (selectedTicket?.priceTiers?.length && !selectedTier) {
			toast.error(t("validation.selectTierQuantity"));
			return;
		}

		// Validate digital card consent if required
		if (event.askDigitalCardConsent && allowDigitalCardDisplay === null) {
			toast.error(t("validation.selectDigitalCardConsent"));
			return;
		}

		// Project selection is now optional - no validation needed

		const getFieldValue = (key: keyof typeof fieldConfig.fields) => {
			const editingValue = (editingProfile as any)[key];
			if (typeof editingValue === "string" && editingValue.trim()) {
				return editingValue.trim();
			}
			const saved = (userProfile as any)?.[key];
			if (typeof saved === "string" && saved.trim()) {
				return saved.trim();
			}
			return "";
		};

		const requiredFields: Array<keyof typeof fieldConfig.fields> = [];
		for (const key of Object.keys(fieldConfig.fields) as Array<
			keyof typeof fieldConfig.fields
		>) {
			if (isFieldEnabled(key) && isFieldRequired(key)) {
				requiredFields.push(key);
			}
		}

		for (const key of requiredFields) {
			const value = getFieldValue(key);
			if (!value) {
				const fieldLabels: Record<string, string> = {
					name: "姓名",
					userRoleString: "个人角色",
					currentWorkOn: "当前在做",
					lifeStatus: "当前状态",
					bio: "个人简介",
					phoneNumber: "手机号",
					email: "邮箱",
					wechatId: "微信号",
					shippingAddress: "邮寄地址",
				};
				toast.error(`请填写${fieldLabels[key] || key}`);
				if (key === "bio" || key === "userRoleString") {
					setShowInlineProfileEdit(true);
				}
				return;
			}
			if (key === "bio" && value.length < 15) {
				toast.error(t("toasts.bioTooShort"));
				setShowInlineProfileEdit(true);
				return;
			}
			if (
				key === "userRoleString" &&
				value.length > PROFILE_LIMITS.userRoleStringMax
			) {
				toast.error("个人角色不能超过7个字");
				setShowInlineProfileEdit(true);
				return;
			}
			if (
				key === "currentWorkOn" &&
				value.length > PROFILE_LIMITS.currentWorkOnMax
			) {
				toast.error("个人状态不能超过10个字");
				setShowInlineProfileEdit(true);
				return;
			}
		}

		const currentPhone = getFieldValue("phoneNumber");
		if (currentPhone) {
			const fullPhoneNumber = currentPhone.startsWith("+")
				? currentPhone
				: `+86${currentPhone}`;
			const phoneValidationResult =
				validateFullPhoneNumber(fullPhoneNumber);
			if (!phoneValidationResult.isValid) {
				toast.error(
					phoneValidationResult.errorMessage ||
						t("toasts.invalidPhone"),
				);
				setPhoneValidation(phoneValidationResult);
				setShowInlineProfileEdit(true);
				return;
			}
		}

		const currentEmail = getFieldValue("email");
		if (currentEmail && !isEmailValid(currentEmail)) {
			const message = "请输入有效的邮箱地址";
			setEmailError(message);
			toast.error(message);
			setShowInlineProfileEdit(true);
			return;
		}

		setEmailError(null);

		if (event.requireProjectSubmission && !selectedProjectId) {
			toast.error(t("validation.selectProject"));
			if (!projects.length) {
				setShowInlineProjectEdit(true);
			}
			return;
		}

		// If user has unsaved changes, save them first before registration
		const fieldsToCompare: Array<keyof typeof editingProfile> = [
			"name",
			"bio",
			"userRoleString",
			"currentWorkOn",
			"phoneNumber",
			"email",
			"lifeStatus",
			"wechatId",
			"shippingAddress",
		];

		const hasUnsavedChanges = fieldsToCompare.some((key) => {
			const editingValue = (editingProfile as any)[key];
			if (typeof editingValue !== "string") {
				return false;
			}
			const normalizedEditing = editingValue.trim();
			if (!normalizedEditing) {
				return false;
			}
			const savedValue = ((userProfile as any)?.[key] || "").trim();
			return normalizedEditing !== savedValue;
		});

		if (hasUnsavedChanges) {
			try {
				await saveUserProfile(true); // Silent save, no toast notification
				// After saving, proceed with registration
				await performRegistration();
			} catch (error) {
				// If save fails, don't proceed with registration
				console.error(
					"Failed to save profile before registration:",
					error,
				);
				// 展开编辑表单，让用户看到并修改违规内容
				setShowInlineProfileEdit(true);
				// 显示具体的错误信息
				const errorMessage =
					error instanceof Error
						? error.message
						: t("toasts.profileSaveFailed");
				toast.error(errorMessage);
				return;
			}
			return;
		}

		// If profile is complete, proceed with registration
		await performRegistration();
	};

	const resolveTicketTypeId = () => {
		if (availableTicketTypes.length === 0) {
			return undefined;
		}
		if (availableTicketTypes.length === 1) {
			return availableTicketTypes[0].id;
		}
		return selectedTicketType || undefined;
	};

	const buildAnswersPayload = () =>
		Object.entries(answers).map(([questionId, answer]) => ({
			questionId,
			answer,
		}));

	const performPaidOrder = async () => {
		try {
			const response = await fetch(`/api/events/${event.id}/orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketTypeId: resolveTicketTypeId(),
					quantity: selectedQuantity,
					answers: buildAnswersPayload(),
					...(event.requireProjectSubmission && {
						projectId: selectedProjectId,
					}),
					...(event.askDigitalCardConsent &&
						allowDigitalCardDisplay !== null && {
							allowDigitalCardDisplay: allowDigitalCardDisplay,
						}),
					...(inviteCode ? { inviteCode } : {}),
				}),
			});

			if (!response.ok) {
				const errorPayload = await parseRegistrationErrorPayload(
					response,
					defaultRegistrationError,
				);
				const errorMessage = errorPayload.message;
				const shouldPromptWechatBinding =
					errorPayload.code === "WECHAT_OPENID_REQUIRED" ||
					errorMessage.toLowerCase().includes("openid");
				if (shouldPromptWechatBinding) {
					setWechatBindingMessage(errorMessage);
					setWechatBindingOpen(true);
					return;
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			if (result.data?.isExisting) {
				toast.info(t("payment.existingOrderFound"));
			}
			setPaymentOrder(result.data as PaymentOrderData);
			setPaymentOpen(true);
		} catch (error) {
			console.error("Error creating paid order:", error);
			toast.error(
				resolveRegistrationErrorMessage(
					error,
					defaultRegistrationError,
				),
			);
		}
	};

	const performFreeRegistration = async () => {
		try {
			const response = await fetch(`/api/events/${event.id}/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketTypeId: resolveTicketTypeId(),
					answers: buildAnswersPayload(),
					...(event.requireProjectSubmission && {
						projectId: selectedProjectId,
					}),
					...(event.askDigitalCardConsent &&
						allowDigitalCardDisplay !== null && {
							allowDigitalCardDisplay: allowDigitalCardDisplay,
						}),
					...(inviteCode ? { inviteCode } : {}),
				}),
			});

			if (!response.ok) {
				const errorMessage = await parseRegistrationError(
					response,
					defaultRegistrationError,
				);
				throw new Error(errorMessage);
			}

			const result = await response.json();
			onRegistrationComplete(result.data);
			onClose();
		} catch (error) {
			console.error("Error registering for event:", error);
			toast.error(
				resolveRegistrationErrorMessage(
					error,
					defaultRegistrationError,
				),
			);
		}
	};

	const performRegistration = async () => {
		setIsSubmitting(true);
		try {
			if (isPaidTicket) {
				await performPaidOrder();
				return;
			}
			await performFreeRegistration();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePaymentSuccess = (registration: EventRegistration) => {
		setPaymentOpen(false);
		setPaymentOrder(null);
		onRegistrationComplete(registration);
		onClose();
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{t("title", { title: event.title })}
						</DialogTitle>
						<DialogDescription>
							{t("description")}
							{event.requireApproval && (
								<span className="text-orange-600 font-medium">
									{t("requiresApproval")}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Profile Section */}
						<ProfileSection
							userProfile={userProfile}
							showInlineProfileEdit={showInlineProfileEdit}
							editingProfile={editingProfile}
							phoneValidation={phoneValidation}
							emailError={emailError}
							savingProfile={savingProfile}
							profileLoading={profileLoading}
							fieldConfig={fieldConfig}
							onToggleInlineEdit={setShowInlineProfileEdit}
							onSaveProfile={handleSaveProfile}
							onUpdateEditingProfile={(profile) =>
								setEditingProfile((prev) => ({
									...prev,
									...profile,
								}))
							}
							onPhoneNumberChange={handlePhoneNumberChange}
							onEmailChange={(value) => {
								setEmailError(null);
								setEditingProfile((prev) => ({
									...prev,
									email: value,
								}));
							}}
							onLifeStatusChange={(value) =>
								setEditingProfile((prev) => ({
									...prev,
									lifeStatus: value,
								}))
							}
						/>

						{/* Project Selection - Only show if required */}
						{event.requireProjectSubmission && (
							<ProjectSection
								projects={projects}
								projectsLoading={projectsLoading}
								selectedProjectId={selectedProjectId}
								showInlineProjectEdit={showInlineProjectEdit}
								editingProject={editingProject}
								savingProject={savingProject}
								onProjectSelect={setSelectedProjectId}
								onRefreshProjects={fetchUserProjects}
								onCreateNewProject={() => {
									const currentPath =
										window.location.pathname;
									router.push(
										`/app/projects/create?returnTo=${encodeURIComponent(currentPath)}`,
									);
								}}
								onToggleInlineEdit={setShowInlineProjectEdit}
								onSaveProject={handleSaveProject}
								onUpdateEditingProject={(project) =>
									setEditingProject((prev) => ({
										...prev,
										...project,
									}))
								}
							/>
						)}

						{/* Ticket Type Selection */}
						<TicketSelection
							availableTicketTypes={availableTicketTypes}
							selectedTicketType={selectedTicketType}
							onTicketTypeChange={setSelectedTicketType}
							selectedQuantity={selectedQuantity}
							onQuantityChange={setSelectedQuantity}
						/>

						{/* Digital Card Consent */}
						{event.askDigitalCardConsent && (
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									是否愿意在现场屏幕中公开自我介绍并展示数字名片
									<span className="text-red-500 ml-1">*</span>
								</Label>
								<RadioGroup
									value={
										allowDigitalCardDisplay === null
											? ""
											: String(allowDigitalCardDisplay)
									}
									onValueChange={(value) =>
										setAllowDigitalCardDisplay(
											value === "true",
										)
									}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="true"
											id="consent-yes"
										/>
										<Label
											htmlFor="consent-yes"
											className="font-normal cursor-pointer"
										>
											非常愿意
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="false"
											id="consent-no"
										/>
										<Label
											htmlFor="consent-no"
											className="font-normal cursor-pointer"
										>
											下次一定
										</Label>
									</div>
								</RadioGroup>
							</div>
						)}

						{/* Questions */}
						<QuestionsForm
							questions={event.questions}
							answers={answers}
							onAnswerChange={handleAnswerChange}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isSubmitting}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? t("submitting")
									: t("confirmRegistration")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{paymentOrder && (
				<PaymentModal
					open={paymentOpen}
					onOpenChange={(open) => {
						setPaymentOpen(open);
						if (!open) {
							setPaymentOrder(null);
						}
					}}
					eventId={event.id}
					order={paymentOrder}
					onPaymentSuccess={handlePaymentSuccess}
				/>
			)}
			<WeChatBindingPrompt
				open={wechatBindingOpen}
				onOpenChange={(open) => {
					setWechatBindingOpen(open);
					if (!open) {
						setWechatBindingMessage(null);
					}
				}}
				message={wechatBindingMessage}
			/>
		</>
	);
}
