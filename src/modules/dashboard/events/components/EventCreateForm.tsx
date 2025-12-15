"use client";

import { Form } from "@/components/ui/form";
import { getRandomTemplate } from "@/config/image-templates";
import { DEFAULT_HACKATHON_SETTINGS } from "@/features/hackathon/config";
import { getPresetRegistrationFieldConfig } from "@/lib/events/registration-fields";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { getDefaultEventTimes } from "../utils/date-utils";
import { BasicInfoForm } from "./BasicInfoForm";
import { BuildingPublicSettings } from "./BuildingPublicSettings";
import { FormActions } from "./FormActions";
import { OptionalConfigSection } from "./OptionalConfigSection";
import {
	type EventFormData,
	type Organization,
	type VolunteerRole,
	eventSchema,
} from "./types";

interface EventCreateFormProps {
	organizations?: Organization[];
	volunteerRoles?: VolunteerRole[];
	onSubmit: (data: any, status?: "DRAFT" | "PUBLISHED") => void;
	onSaveAsTemplate?: (data: any) => void;
	isLoading?: boolean;
	defaultValues?: Partial<EventFormData>;
	initialData?: any;
	template?: any;
	isEdit?: boolean;
	isEditMode?: boolean;
	hideTemplateAction?: boolean;
	user?: { email?: string | null };
	onRefreshOrganizations?: () => void; // 新增
}

const mapTemplateTypeToEventType = (
	templateType: string | null | undefined,
): "MEETUP" | "HACKATHON" | "BUILDING_PUBLIC" => {
	switch (templateType) {
		case "HACKATHON_LEARNING":
		case "HACKATHON":
			return "HACKATHON";
		case "BUILDING_PUBLIC":
			return "BUILDING_PUBLIC";
		default:
			return "MEETUP";
	}
};

export function EventCreateForm({
	organizations = [],
	volunteerRoles = [],
	onSubmit,
	onSaveAsTemplate,
	isLoading,
	defaultValues,
	initialData,
	template,
	isEdit = false,
	isEditMode = false,
	hideTemplateAction = false,
	user,
	onRefreshOrganizations, // 新增
}: EventCreateFormProps) {
	const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

	// 计算默认时间的函数：今天最近的下个整点开始，持续2小时
	const getDefaultTimes = () => {
		return getDefaultEventTimes();
	};

	// 合并数据优先级：initialData > template > defaultValues > 默认值
	const getDefaultFormValues = () => {
		const defaultTimes = getDefaultTimes();

		// 为默认活动类型生成默认封面图片
		const defaultCoverImage = getRandomTemplate("meetup").url;

		// 为已加入组织的用户默认选择第一个组织，如果没有则选择个人发起
		const defaultOrganizationId =
			organizations && organizations.length > 0
				? organizations[0].id
				: "none";

		const baseDefaults = {
			title: "",
			richContent: "",
			shortDescription: "",
			contentImages: [],
			type: "MEETUP" as const,
			startTime: defaultTimes.startTime,
			endTime: defaultTimes.endTime,
			location: "",
			organizationId: defaultOrganizationId,
			isExternalEvent: false,
			externalUrl: "",
			maxAttendees: "",
			registrationDeadline: "",
			requireApproval: false,
			registrationSuccessInfo: "",
			registrationSuccessImage: "",
			coverImage: defaultCoverImage,
			tags: [],
			questions: [],
			ticketTypes: [],
			volunteerRoles: [],
			volunteerContactInfo: "",
			volunteerWechatQrCode: "",
			organizerContact: user?.email || "",
			// Building Public 默认值
			minCheckIns: 7,
			depositAmount: undefined,
			refundRate: 1.0,
			// 押金支付设置
			paymentType: "NONE",
			paymentUrl: "",
			paymentQRCode: "",
			paymentNote: "",
			// 作品关联默认值
			requireProjectSubmission: false,
			// 活动插件：作品提交
			submissionsEnabled: false,
			// 数字名片公开确认
			askDigitalCardConsent: false,
			// 报名字段配置
			registrationFieldConfig: getPresetRegistrationFieldConfig("FULL"),
			// Hackathon 默认值
			hackathonConfig: {
				settings: {
					maxTeamSize: 5,
					allowSolo: true,
				},
				voting: {
					allowPublicVoting: true,
					enableJudgeVoting: false,
					judgeWeight: 0,
					publicWeight: 1,
					publicVotingScope: "PARTICIPANTS",
				},
			},
		};

		// 如果有 initialData（用于模板编辑），优先使用
		if (initialData) {
			return { ...baseDefaults, ...initialData };
		}

		// 如果有 template，从模板构建表单数据
		if (template) {
			const templateDefaults = {
				title: template.title,
				richContent: template.defaultDescription || "",
				shortDescription: template.shortDescription || "",
				type: mapTemplateTypeToEventType(template.type),
				maxAttendees: template.maxAttendees?.toString() || "",
				requireApproval: template.requireApproval,
				organizationId: template.organizationId || "none",
				isExternalEvent: template.isExternalEvent || false,
				externalUrl: template.externalUrl || "",
				registrationDeadline: template.registrationDeadline || "",
				registrationSuccessInfo: template.registrationSuccessInfo || "",
				registrationSuccessImage:
					template.registrationSuccessImage || "",
				coverImage: template.coverImage || "",
				tags: template.tags || [],
				ticketTypes:
					template.ticketTypes?.map((tt: any) => ({
						name: tt.name,
						description: tt.description,
						price: tt.price,
						quantity: tt.maxQuantity,
					})) || [],
				volunteerRoles:
					template.volunteerRoles
						?.filter(
							(vr: any) =>
								!!(
									vr?.volunteerRoleId || vr?.volunteerRole?.id
								),
						)
						?.map((vr: any) => {
							const descriptionSource =
								typeof vr?.description === "string"
									? vr.description
									: typeof vr?.volunteerRole?.description ===
											"string"
										? vr.volunteerRole.description
										: "";
							return {
								volunteerRoleId:
									vr.volunteerRoleId ||
									vr.volunteerRole?.id ||
									"",
								recruitCount:
									typeof vr?.recruitCount === "number" &&
									!Number.isNaN(vr.recruitCount)
										? vr.recruitCount
										: 1,
								description: descriptionSource,
								requireApproval: vr?.requireApproval ?? true,
							};
						}) || [],
				questions:
					template.questions?.map((q: any, index: number) => ({
						question: q.question,
						type: q.type,
						options: q.options,
						required: q.required,
						order: q.order ?? index,
					})) || [],
				volunteerContactInfo: template.volunteerContactInfo || "",
				volunteerWechatQrCode: template.volunteerWechatQrCode || "",
				organizerContact: template.organizerContact || "",
				registrationFieldConfig:
					template.registrationFieldConfig ||
					getPresetRegistrationFieldConfig("FULL"),
				// Building Public 字段
				minCheckIns: template.minCheckIns || 7,
				depositAmount: template.depositAmount || 0,
				refundRate: template.refundRate || 1.0,
				paymentType: template.paymentType || "NONE",
				paymentUrl: template.paymentUrl || "",
				paymentQRCode: template.paymentQRCode || "",
				paymentNote: template.paymentNote || "",
				// 作品关联设置
				requireProjectSubmission:
					template.requireProjectSubmission || false,
				// 活动插件：作品提交（黑客松默认开启）
				submissionsEnabled:
					typeof template.submissionsEnabled === "boolean"
						? template.submissionsEnabled
						: mapTemplateTypeToEventType(template.type) ===
							"HACKATHON",
				// 数字名片公开确认
				askDigitalCardConsent: template.askDigitalCardConsent || false,
				// Hackathon 字段
				hackathonConfig: template.hackathonConfig || {
					settings: {
						maxTeamSize: 5,
						allowSolo: true,
					},
					voting: {
						allowPublicVoting: true,
						enableJudgeVoting: false,
						judgeWeight: 0,
						publicWeight: 1,
						publicVotingScope: "PARTICIPANTS" as const,
					},
				},
			};
			// 模板使用默认时间，因为模板中的时间信息通常不适用于新活动
			return { ...baseDefaults, ...templateDefaults };
		}

		// 最后使用传入的 defaultValues
		return { ...baseDefaults, ...defaultValues };
	};

	const formDefaultValues = getDefaultFormValues();

	const form = useForm({
		resolver: zodResolver(eventSchema),
		defaultValues: formDefaultValues,
	});

	// 监听活动类型变化，自动更新封面图片
	const currentType = form.watch("type");
	const currentCoverImage = form.watch("coverImage");

	// 添加一个标志来跟踪用户是否手动选择了图片
	// 如果是编辑模式且已有图片，认为用户已经选择了图片
	const [userHasSelectedImage, setUserHasSelectedImage] = useState(
		!!(isEdit && formDefaultValues.coverImage),
	);

	useEffect(() => {
		// In edit mode, reset form with correct data to ensure all fields are properly initialized
		if (isEdit && defaultValues) {
			form.reset(getDefaultFormValues());
		}
	}, [isEdit, defaultValues]);

	useEffect(() => {
		// Only auto-update cover image if user hasn't manually selected one and no custom image is uploaded
		// Check if current cover image is a template image (from the configured template URL base)
		const isTemplateImage =
			currentCoverImage?.includes("hackweek-public") ||
			currentCoverImage?.includes("myqcloud.com");

		// If user has manually selected an image, don't auto-update
		if (userHasSelectedImage) {
			return;
		}

		if (currentType && (isTemplateImage || !currentCoverImage)) {
			const newTemplate = getRandomTemplate(currentType.toLowerCase());
			if (newTemplate && newTemplate.url !== currentCoverImage) {
				form.setValue("coverImage", newTemplate.url);
			}
		}
	}, [currentType, form, currentCoverImage, userHasSelectedImage]);

	// 监听活动类型变化，用于条件渲染
	const activityType = form.watch("type");
	const isBuildingPublic = activityType === "BUILDING_PUBLIC";
	const isHackathon = activityType === "HACKATHON";

	useEffect(() => {
		if (activityType !== "HACKATHON") return;
		if (form.formState.dirtyFields.submissionsEnabled) return;
		if (form.getValues("submissionsEnabled") === true) return;
		form.setValue("submissionsEnabled", true, {
			shouldDirty: false,
			shouldTouch: true,
		});
	}, [activityType, form]);

	const handleFormSubmit = (
		data: EventFormData,
		status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
	) => {
		const formData = { ...data } as EventFormData & {
			description?: string;
		};
		if ("description" in formData) {
			(formData as { description?: string }).description = undefined;
		}

		// Determine if location is a URL (online event)
		const isUrl = /^https?:\/\//i.test(formData.location.trim());

		// Transform data for submission - convert new schema to old API format
		// Convert local time strings (YYYY-MM-DDTHH:mm) to ISO strings (UTC)
		// The server expects ISO strings, and assumes they are UTC if provided.
		// By creating a Date object in the browser, we capture the user's local timezone offset,
		// and toISOString() converts that specific moment to UTC.
		const sanitizedHackathonConfig =
			formData.type === "HACKATHON" && formData.hackathonConfig
				? {
						...formData.hackathonConfig,
						settings: {
							maxTeamSize:
								formData.hackathonConfig.settings
									?.maxTeamSize ??
								DEFAULT_HACKATHON_SETTINGS.maxTeamSize,
							allowSolo:
								formData.hackathonConfig.settings?.allowSolo ??
								DEFAULT_HACKATHON_SETTINGS.allowSolo,
						},
					}
				: undefined;

		const submissionData = {
			...formData,
			// Map location to appropriate fields based on whether it's external event
			isOnline: isUrl && !formData.isExternalEvent,
			address: formData.location,
			onlineUrl:
				isUrl && !formData.isExternalEvent ? formData.location : "",
			// For external events, use the dedicated external URL field
			externalUrl: formData.isExternalEvent ? formData.externalUrl : "",
			// Time conversion: ensure we send UTC ISO strings
			startTime: new Date(formData.startTime).toISOString(),
			endTime: new Date(formData.endTime).toISOString(),
			registrationDeadline: formData.registrationDeadline
				? new Date(formData.registrationDeadline).toISOString()
				: undefined,
			organizationId:
				formData.organizationId === "none"
					? null
					: formData.organizationId,
			maxAttendees: formData.maxAttendees
				? Number.parseInt(formData.maxAttendees) || undefined
				: undefined,
			shortDescription:
				formData.shortDescription &&
				formData.shortDescription.trim() !== ""
					? formData.shortDescription.trim()
					: undefined,
			// Ensure coverImage is properly handled
			coverImage:
				formData.coverImage && formData.coverImage.trim() !== ""
					? formData.coverImage
					: undefined,
			registrationFieldConfig: formData.registrationFieldConfig,
			// Add registration success fields
			registrationSuccessInfo:
				formData.registrationSuccessInfo || undefined,
			registrationSuccessImage:
				formData.registrationSuccessImage || undefined,
			// Transform ticketTypes to match API schema
			ticketTypes: formData.ticketTypes
				? formData.ticketTypes.map((t, index) => ({
						name: t.name,
						description: t.description,
						price: t.price,
						maxQuantity: t.quantity, // Map quantity to maxQuantity
						isActive: true,
						sortOrder: index,
					}))
				: [],
			// Transform volunteerRoles to match API schema
			volunteerRoles: formData.volunteerRoles
				? formData.volunteerRoles.map((vr) => ({
						volunteerRoleId: vr.volunteerRoleId,
						recruitCount: vr.recruitCount,
						description: vr.description || undefined,
						requireApproval: vr.requireApproval ?? true,
					}))
				: [],
			// Transform questions to match API schema
			questions: formData.questions
				? formData.questions.map((q, index) => ({
						id:
							typeof q.id === "string" && q.id.trim() !== ""
								? q.id
								: undefined,
						question: q.question,
						description: q.description || undefined,
						type: q.type,
						required: q.required,
						options: q.options || [],
						order: q.order ?? index,
					}))
				: [],
			// Add global volunteer fields
			volunteerContactInfo: formData.volunteerContactInfo || undefined,
			volunteerWechatQrCode: formData.volunteerWechatQrCode || undefined,
			// Add organizer contact field
			organizerContact: formData.organizerContact || undefined,
			// Building Public 特有字段
			minCheckIns: formData.minCheckIns,
			depositAmount: formData.depositAmount,
			refundRate: formData.refundRate,
			// 押金支付设置
			paymentType: formData.paymentType,
			paymentUrl: formData.paymentUrl || undefined,
			paymentQRCode: formData.paymentQRCode || undefined,
			paymentNote: formData.paymentNote || undefined,
			// 作品关联设置
			requireProjectSubmission: formData.requireProjectSubmission,
			// 活动插件：作品提交
			submissionsEnabled: formData.submissionsEnabled,
			// 数字名片公开确认
			askDigitalCardConsent: formData.askDigitalCardConsent,
			// Hackathon configuration
			hackathonConfig: sanitizedHackathonConfig,
			// Submission form configuration (available for all event types)
			submissionFormConfig: formData.submissionFormConfig || undefined,
		};

		onSubmit(submissionData, status);
	};

	const handleFormError = (errors: FieldErrors<EventFormData>) => {
		console.error("EventCreateForm validation errors:", errors);
		toast.error("表单未通过校验，请检查页面中的提示信息");
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(
						(data) => handleFormSubmit(data),
						handleFormError,
					)}
					className="space-y-8"
				>
					{/* Basic Information (包含时间地点) */}
					<BasicInfoForm
						control={form.control}
						setValue={form.setValue}
						watch={form.watch}
						organizations={organizations}
						watchedType={currentType}
						onImageChange={() => setUserHasSelectedImage(true)}
						user={user}
						onRefreshOrganizations={onRefreshOrganizations}
						isEdit={isEdit}
					/>

					{/* Building Public Challenge Settings */}
					{isBuildingPublic && (
						<BuildingPublicSettings
							control={form.control}
							watch={form.watch}
						/>
					)}

					{/* Optional Configuration */}
					<OptionalConfigSection
						control={form.control}
						watch={form.watch}
						setValue={form.setValue}
						volunteerRoles={volunteerRoles}
					/>

					{/* Submit Buttons */}
					<div className="sticky bottom-0 z-10 pb-2 pt-4 border-t">
						<FormActions
							onSubmit={onSubmit}
							onSaveAsTemplate={onSaveAsTemplate}
							handleSubmit={form.handleSubmit}
							handleFormSubmit={handleFormSubmit}
							isLoading={isLoading}
							isEdit={isEdit}
							isEditMode={isEditMode}
							hideTemplateAction={hideTemplateAction}
						/>
					</div>
				</form>
			</Form>
		</div>
	);
}
