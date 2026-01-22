"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { resolveParticipationAgreementMarkdown } from "@/lib/events/event-work-agreements";
import {
	validateFullPhoneNumber,
	type PhoneValidationResult,
} from "@/lib/utils/phone-validation";
import { resolveRegistrationFieldConfig } from "@/lib/events/registration-fields";
import { PROFILE_LIMITS } from "@/lib/utils/profile-limits";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const getFirstErrorMessage = (value: unknown): string | null => {
	if (!value) return null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			const message = getFirstErrorMessage(item);
			if (message) {
				return message;
			}
		}
		return null;
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		for (const key of ["message", "error", "detail"]) {
			if (key in record) {
				const nestedMessage = getFirstErrorMessage(record[key]);
				if (nestedMessage) {
					return nestedMessage;
				}
			}
		}
	}
	return null;
};

const parseRegistrationError = async (
	response: Response,
	fallbackMessage: string,
): Promise<string> => {
	try {
		const errorData = await response.json();
		const parsed = getFirstErrorMessage(errorData);
		if (parsed) {
			return parsed;
		}
	} catch {
		// Ignore JSON parsing errors and fall back to status text/default message
	}
	const statusMessage = response.statusText?.trim();
	if (statusMessage) {
		return statusMessage;
	}
	return fallbackMessage;
};

const resolveRegistrationErrorMessage = (
	error: unknown,
	fallbackMessage: string,
): string => {
	if (error instanceof Error) {
		const message = error.message.trim();
		return message ? message : fallbackMessage;
	}
	if (typeof error === "string") {
		const trimmed = error.trim();
		return trimmed ? trimmed : fallbackMessage;
	}
	if (error && typeof error === "object") {
		const parsed = getFirstErrorMessage(error);
		if (parsed) {
			return parsed;
		}
	}
	return fallbackMessage;
};

interface EventRegistrationFormProps {
	event: {
		id: string;
		title: string;
		type: "MEETUP" | "HACKATHON" | "BUILDING_PUBLIC";
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
	isSubmitting: boolean;
	onSubmittingChange: (isSubmitting: boolean) => void;
	onRegistrationComplete: (registration: EventRegistration) => void;
	onCancel: () => void;
	inviteCode?: string;
	giftCode?: string;
}

export function EventRegistrationForm({
	event,
	isSubmitting,
	onSubmittingChange,
	onRegistrationComplete,
	onCancel,
	inviteCode,
	giftCode,
}: EventRegistrationFormProps) {
	const t = useTranslations("events.registration");
	const router = useRouter();
	const pathname = usePathname();
	const defaultRegistrationError = t("toasts.registrationFailed");
	const fieldConfig = resolveRegistrationFieldConfig(
		event.registrationFieldConfig,
	);
	const participationAgreementMarkdown =
		resolveParticipationAgreementMarkdown(event.registrationFieldConfig);
	const participationAgreementEnabled = event.type === "HACKATHON";
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [selectedTicketType, setSelectedTicketType] = useState<string>("");
	const [selectedQuantity, setSelectedQuantity] = useState(1);
	const [paymentOrder, setPaymentOrder] = useState<PaymentOrderData | null>(
		null,
	);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [allowDigitalCardDisplay, setAllowDigitalCardDisplay] = useState<
		boolean | null
	>(null);
	const [agreedParticipationAgreement, setAgreedParticipationAgreement] =
		useState(false);
	const [
		participationAgreementDialogOpen,
		setParticipationAgreementDialogOpen,
	] = useState(false);
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

	// Fetch user projects when component mounts and requires project submission
	useEffect(() => {
		if (event.requireProjectSubmission) {
			fetchUserProjects();
		}
	}, [event.requireProjectSubmission]);

	// Fetch user profile when component mounts
	useEffect(() => {
		fetchUserProfile();
		setPhoneValidation({ isValid: true }); // Reset phone validation when component mounts
		setEmailError(null);
	}, []);

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
			disableSelection: Boolean(giftCode),
		});

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: answer,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (participationAgreementEnabled && !agreedParticipationAgreement) {
			toast.error(t("validation.acceptParticipationAgreement"));
			return;
		}

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
		if (
			!giftCode &&
			availableTicketTypes.length > 1 &&
			!selectedTicketType
		) {
			toast.error(t("validation.selectTicketType"));
			return;
		}

		if (!giftCode && selectedTicket?.priceTiers?.length && !selectedTier) {
			toast.error(t("validation.selectTierQuantity"));
			return;
		}
		// Validate digital card consent if required
		if (event.askDigitalCardConsent && allowDigitalCardDisplay === null) {
			toast.error(t("validation.selectDigitalCardConsent"));
			return;
		}

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

		// Only validate phone number if the event requires it
		if (isFieldEnabled("phoneNumber")) {
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
		}

		// Only validate email if the event requires it
		if (isFieldEnabled("email")) {
			const currentEmail = getFieldValue("email");
			if (currentEmail && !isEmailValid(currentEmail)) {
				const message = "请输入有效的邮箱地址";
				setEmailError(message);
				toast.error(message);
				setShowInlineProfileEdit(true);
				return;
			}
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
				onSubmittingChange(true);
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
			} finally {
				onSubmittingChange(false);
			}
			return;
		}

		// If profile is complete, proceed with registration
		onSubmittingChange(true);
		try {
			await performRegistration();
		} finally {
			onSubmittingChange(false);
		}
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

	const performGiftRedemption = async () => {
		try {
			const response = await fetch(
				`/api/events/${event.id}/orders/invites/${giftCode}/redeem`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						answers: buildAnswersPayload(),
						...(event.requireProjectSubmission && {
							projectId: selectedProjectId,
						}),
						...(event.askDigitalCardConsent &&
							allowDigitalCardDisplay !== null && {
								allowDigitalCardDisplay:
									allowDigitalCardDisplay,
							}),
					}),
				},
			);

			if (!response.ok) {
				const errorMessage = await parseRegistrationError(
					response,
					defaultRegistrationError,
				);
				throw new Error(errorMessage);
			}

			const result = await response.json();
			onRegistrationComplete(result.data);
		} catch (error) {
			console.error("Error redeeming invite:", error);
			toast.error(
				resolveRegistrationErrorMessage(
					error,
					defaultRegistrationError,
				),
			);
		}
	};

	const performPaidOrder = async () => {
		try {
			const ticketTypeId = resolveTicketTypeId();
			const response = await fetch(`/api/events/${event.id}/orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketTypeId,
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
				const errorMessage = await parseRegistrationError(
					response,
					defaultRegistrationError,
				);
				throw new Error(errorMessage);
			}

			const result = await response.json();
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
			const ticketTypeId = resolveTicketTypeId();
			const response = await fetch(`/api/events/${event.id}/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketTypeId,
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
		if (giftCode) {
			await performGiftRedemption();
			return;
		}
		if (isPaidTicket) {
			await performPaidOrder();
			return;
		}
		await performFreeRegistration();
	};

	const handlePaymentSuccess = (registration: EventRegistration) => {
		setPaymentOpen(false);
		setPaymentOrder(null);
		onRegistrationComplete(registration);
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Profile Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">个人信息</CardTitle>
					</CardHeader>
					<CardContent>
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
					</CardContent>
				</Card>

				{/* Project Selection - Only show if required */}
				{event.requireProjectSubmission && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">项目选择</CardTitle>
						</CardHeader>
						<CardContent>
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
									router.push(
										`/app/projects/create?returnTo=${encodeURIComponent(pathname)}`,
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
						</CardContent>
					</Card>
				)}

				{giftCode && (
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-muted-foreground">
								当前使用赠票链接报名，票种与数量已由赠票确定。
							</div>
						</CardContent>
					</Card>
				)}

				{/* Ticket Type Selection */}
				{!giftCode && availableTicketTypes.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">票种选择</CardTitle>
						</CardHeader>
						<CardContent>
							<TicketSelection
								availableTicketTypes={availableTicketTypes}
								selectedTicketType={selectedTicketType}
								onTicketTypeChange={setSelectedTicketType}
								selectedQuantity={selectedQuantity}
								onQuantityChange={setSelectedQuantity}
							/>
						</CardContent>
					</Card>
				)}

				{/* Digital Card Consent */}
				{event.askDigitalCardConsent && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								数字名片展示
							</CardTitle>
						</CardHeader>
						<CardContent>
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
						</CardContent>
					</Card>
				)}

				{/* Questions */}
				{event.questions.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">报名信息</CardTitle>
						</CardHeader>
						<CardContent>
							<QuestionsForm
								questions={event.questions}
								answers={answers}
								onAnswerChange={handleAnswerChange}
							/>
						</CardContent>
					</Card>
				)}

				{participationAgreementEnabled && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">参赛协议</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-start gap-3">
								<Checkbox
									id="participation-agreement"
									checked={agreedParticipationAgreement}
									onCheckedChange={(checked) =>
										setAgreedParticipationAgreement(
											checked === true,
										)
									}
								/>
								<div className="space-y-1">
									<Label
										htmlFor="participation-agreement"
										className="cursor-pointer"
									>
										我已阅读并同意《参赛协议》
										<span className="text-red-500 ml-1">
											*
										</span>
									</Label>
									<Button
										type="button"
										variant="link"
										className="h-auto p-0 text-sm"
										onClick={() =>
											setParticipationAgreementDialogOpen(
												true,
											)
										}
									>
										查看《参赛协议》
									</Button>
								</div>
							</div>

							<Dialog
								open={participationAgreementDialogOpen}
								onOpenChange={
									setParticipationAgreementDialogOpen
								}
							>
								<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
									<DialogHeader>
										<DialogTitle>参赛协议</DialogTitle>
									</DialogHeader>
									<div className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words prose-p:break-words">
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
										>
											{participationAgreementMarkdown}
										</ReactMarkdown>
									</div>
								</DialogContent>
							</Dialog>
						</CardContent>
					</Card>
				)}

				{/* Form Actions */}
				<div className="flex gap-4 pt-4 sticky bottom-0 bg-gray-50 pb-safe-bottom">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting}
						className="flex-1"
					>
						取消
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="flex-1"
					>
						{isSubmitting
							? t("submitting")
							: event.requireApproval
								? "提交申请"
								: "确认报名"}
					</Button>
				</div>
			</form>

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
		</>
	);
}
