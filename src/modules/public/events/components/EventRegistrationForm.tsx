"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
	validateFullPhoneNumber,
	type PhoneValidationResult,
} from "@/lib/utils/phone-validation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSection } from "./ProfileSection";
import { ProjectSection } from "./ProjectSection";
import { TicketSelection } from "./TicketSelection";
import { QuestionsForm } from "./QuestionsForm";
import type { Project, Question, TicketType, UserProfile } from "./types";

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
		requireApproval: boolean;
		requireProjectSubmission?: boolean;
		askDigitalCardConsent?: boolean;
		questions: Question[];
		ticketTypes: TicketType[];
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
	};
	isSubmitting: boolean;
	onSubmittingChange: (isSubmitting: boolean) => void;
	onRegistrationComplete: (registration: any) => void;
	onCancel: () => void;
	inviteCode?: string;
}

export function EventRegistrationForm({
	event,
	isSubmitting,
	onSubmittingChange,
	onRegistrationComplete,
	onCancel,
	inviteCode,
}: EventRegistrationFormProps) {
	const t = useTranslations("events.registration");
	const router = useRouter();
	const pathname = usePathname();
	const defaultRegistrationError = t("toasts.registrationFailed");
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [selectedTicketType, setSelectedTicketType] = useState<string>("");
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
		bio: "",
		userRoleString: "",
		currentWorkOn: "",
		phoneNumber: "",
		email: "",
		lifeStatus: "",
		wechatId: "",
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
				bio: userProfile.bio || "",
				userRoleString: userProfile.userRoleString || "",
				currentWorkOn: userProfile.currentWorkOn || "",
				phoneNumber: userProfile.phoneNumber || "",
				email: normalizeEmail(userProfile.email),
				lifeStatus: userProfile.lifeStatus || "",
				wechatId: userProfile.wechatId || "",
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
				});
			}
		} catch (error) {
			console.error("Error fetching user profile:", error);
		} finally {
			setProfileLoading(false);
		}
	};

	const saveUserProfile = async (silent = false) => {
		const trimmedEmail = editingProfile.email.trim();
		const trimmedWechatId = editingProfile.wechatId.trim();
		if (!trimmedEmail) {
			const message = "请填写邮箱，方便接收通知";
			setEmailError(message);
			if (!silent) {
				toast.error(message);
			}
			throw new Error(message);
		}

		if (!isEmailValid(trimmedEmail)) {
			const message = "请输入有效的邮箱地址";
			setEmailError(message);
			if (!silent) {
				toast.error(message);
			}
			throw new Error(message);
		}

		setEmailError(null);

		// Check for phone validation errors before saving
		if (!phoneValidation.isValid && editingProfile.phoneNumber.trim()) {
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
			const response = await fetch("/api/profile/update", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bio: editingProfile.bio,
					userRoleString: editingProfile.userRoleString,
					currentWorkOn: editingProfile.currentWorkOn,
					phoneNumber: editingProfile.phoneNumber,
					email: trimmedEmail,
					lifeStatus: editingProfile.lifeStatus,
					wechatId: trimmedWechatId || null,
				}),
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
				bio: editingProfile.bio,
				userRoleString: editingProfile.userRoleString,
				currentWorkOn: editingProfile.currentWorkOn,
				phoneNumber: editingProfile.phoneNumber,
				email: trimmedEmail,
				emailVerified:
					userProfile?.email === trimmedEmail
						? (userProfile?.emailVerified ?? null)
						: false,
				lifeStatus: editingProfile.lifeStatus,
				wechatId: trimmedWechatId,
			};
			setUserProfile(updatedProfile);
			setEditingProfile((prev) => ({
				...prev,
				email: trimmedEmail,
				wechatId: trimmedWechatId,
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

	// Get available ticket types
	const availableTicketTypes = event.ticketTypes.filter(
		(ticket) =>
			ticket.isActive &&
			(!ticket.maxQuantity ||
				ticket.currentQuantity < ticket.maxQuantity),
	);

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

		// Validate digital card consent if required
		if (event.askDigitalCardConsent && allowDigitalCardDisplay === null) {
			toast.error(
				"请选择是否愿意在现场屏幕公开自我介绍并展示数字名片信息",
			);
			return;
		}

		// Check if user profile is incomplete and show inline edit
		const hasSavedBio = userProfile?.bio?.trim();
		const hasEditingBio = editingProfile.bio.trim();

		// If user has no saved bio and no editing content, require them to fill it
		if (!hasSavedBio && !hasEditingBio) {
			toast.error(t("toasts.profileBioRequired"));
			setShowInlineProfileEdit(true);
			return;
		}

		// Check bio minimum length (15 characters)
		const currentBio = hasEditingBio || hasSavedBio;
		if (currentBio && currentBio.length < 15) {
			toast.error(t("toasts.bioTooShort"));
			setShowInlineProfileEdit(true);
			return;
		}

		// Check if required fields are complete
		const trimmedEditingEmail = editingProfile.email.trim();
		const currentProfile = hasEditingBio
			? {
					...userProfile,
					...editingProfile,
					email: trimmedEditingEmail,
				}
			: userProfile
				? {
						...userProfile,
						email: normalizeEmail(userProfile.email),
					}
				: userProfile;

		// Check required fields: userRoleString, currentWorkOn, bio, lifeStatus
		if (!currentProfile?.userRoleString?.trim()) {
			toast.error(t("toasts.roleRequired"));
			setShowInlineProfileEdit(true);
			return;
		}

		if (!currentProfile?.currentWorkOn?.trim()) {
			toast.error(t("toasts.currentWorkRequired"));
			setShowInlineProfileEdit(true);
			return;
		}

		if (!currentProfile?.lifeStatus?.trim()) {
			toast.error(t("toasts.lifeStatusRequired"));
			setShowInlineProfileEdit(true);
			return;
		}

		// Check if user has required contact information
		const hasPhoneNumber = currentProfile?.phoneNumber?.trim();
		const currentEmail = currentProfile?.email?.trim();

		// Validate phone number format if provided
		if (hasPhoneNumber) {
			// For Chinese phone numbers, add +86 prefix if not present
			const fullPhoneNumber = hasPhoneNumber.startsWith("+")
				? hasPhoneNumber
				: `+86${hasPhoneNumber}`;
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

		if (!hasPhoneNumber) {
			toast.error(t("toasts.phoneRequired"));
			setShowInlineProfileEdit(true);
			return;
		}

		if (!currentEmail) {
			const message = "请填写邮箱，方便接收通知";
			setEmailError(message);
			toast.error(message);
			setShowInlineProfileEdit(true);
			return;
		}

		if (!isEmailValid(currentEmail)) {
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
		const initialEmail = userProfile
			? normalizeEmail(userProfile.email)
			: "";
		if (
			hasEditingBio &&
			(!hasSavedBio ||
				editingProfile.bio !== userProfile?.bio ||
				editingProfile.userRoleString !==
					(userProfile?.userRoleString || "") ||
				editingProfile.currentWorkOn !==
					(userProfile?.currentWorkOn || "") ||
				editingProfile.phoneNumber !==
					(userProfile?.phoneNumber || "") ||
				trimmedEditingEmail !== initialEmail ||
				editingProfile.lifeStatus !== (userProfile?.lifeStatus || "") ||
				editingProfile.wechatId !== (userProfile?.wechatId || ""))
		) {
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

	const performRegistration = async () => {
		try {
			const response = await fetch(`/api/events/${event.id}/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketTypeId:
						availableTicketTypes.length === 1
							? availableTicketTypes[0].id
							: selectedTicketType,
					answers: Object.entries(answers).map(
						([questionId, answer]) => ({
							questionId,
							answer,
						}),
					),
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
			// Pass the registration data (including status) to parent
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

	const formatPrice = (price?: number) => {
		if (!price) {
			return t("free");
		}
		return `¥${price.toFixed(2)}`;
	};

	return (
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
						onWechatIdChange={(value) =>
							setEditingProfile((prev) => ({
								...prev,
								wechatId: value,
							}))
						}
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

			{/* Ticket Type Selection */}
			{availableTicketTypes.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">票种选择</CardTitle>
					</CardHeader>
					<CardContent>
						<TicketSelection
							availableTicketTypes={availableTicketTypes}
							selectedTicketType={selectedTicketType}
							onTicketTypeChange={setSelectedTicketType}
						/>
					</CardContent>
				</Card>
			)}

			{/* Digital Card Consent */}
			{event.askDigitalCardConsent && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">数字名片展示</CardTitle>
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
									setAllowDigitalCardDisplay(value === "true")
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
	);
}
