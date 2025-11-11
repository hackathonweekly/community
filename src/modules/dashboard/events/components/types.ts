import { z } from "zod";
import { HackathonConfigSchema as hackathonConfigSchema } from "@/features/hackathon/config";

// Feedback configuration schema
const feedbackQuestionSchema = z.object({
	id: z.string(),
	type: z.enum([
		"text",
		"textarea",
		"rating",
		"single_choice",
		"multiple_choice",
		"yes_no",
	]),
	label: z.string().min(1, "问题标题不能为空"),
	placeholder: z.string().optional(),
	required: z.boolean(),
	options: z.array(z.string()).optional(),
	maxLength: z.number().int().positive().optional(),
});

const feedbackConfigSchema = z
	.object({
		questions: z.array(feedbackQuestionSchema),
	})
	.optional();

export const eventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		richContent: z.string().min(1, "Description is required"), // 富文本HTML内容
		shortDescription: z.string().max(200, "简介不能超过200字").optional(),
		contentImages: z.array(z.string()).default([]), // 内容中的图片URLs
		type: z.enum(["MEETUP", "HACKATHON", "BUILDING_PUBLIC"]),
		startTime: z.string().min(1, "Start time is required"),
		endTime: z.string().min(1, "End time is required"),
		location: z.string().min(1, "Location is required"),
		organizationId: z.string().optional(),
		isExternalEvent: z.boolean(),
		externalUrl: z
			.string()
			.url("请输入有效的外部链接")
			.optional()
			.or(z.literal("")),
		maxAttendees: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val || val.trim() === "") return true;
					const num = Number.parseInt(val);
					return !Number.isNaN(num) && num > 0;
				},
				{
					message: "参与人数必须是大于0的正整数",
				},
			),
		registrationDeadline: z.string().optional(),
		requireApproval: z.boolean(),
		registrationSuccessInfo: z.string().optional(),
		registrationSuccessImage: z.string().optional(),
		registrationPendingInfo: z.string().optional(),
		registrationPendingImage: z.string().optional(),
		coverImage: z.string().optional(),
		tags: z.array(z.string()),
		questions: z.array(
			z.object({
				id: z.string().optional(),
				question: z.string().min(1, "Question is required"),
				description: z.string().optional(),
				type: z.enum([
					"TEXT",
					"TEXTAREA",
					"SELECT",
					"CHECKBOX",
					"RADIO",
				]),
				required: z.boolean(),
				options: z.array(z.string()).optional(),
				order: z.number().int().min(0).optional(),
			}),
		),
		ticketTypes: z
			.array(
				z.object({
					name: z.string().min(1, "票种名称必填"),
					description: z.string().optional(),
					price: z.number().min(0, "价格不能为负数"),
					quantity: z.number().min(1, "数量必须大于0"),
				}),
			)
			.optional(),
		volunteerRoles: z
			.array(
				z.object({
					volunteerRoleId: z.string().min(1, "请选择志愿者角色"),
					recruitCount: z.number().min(1, "招募数量至少为1"),
					description: z.string().optional(),
					requireApproval: z.boolean().optional(),
				}),
			)
			.optional(),
		volunteerContactInfo: z.string().optional(),
		volunteerWechatQrCode: z.string().optional(),
		organizerContact: z.string().optional(),
		// Building Public 专门字段
		minCheckIns: z.number().int().positive().optional(),
		depositAmount: z.number().min(0).optional(),
		refundRate: z.number().min(0).max(1).optional(),
		// 押金支付设置
		paymentType: z.enum(["NONE", "CUSTOM"]).optional(),
		paymentUrl: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val || val.trim() === "") return true;
					try {
						new URL(val);
						return true;
					} catch {
						return false;
					}
				},
				{
					message: "请输入有效的支付链接",
				},
			)
			.or(z.literal("")),
		paymentQRCode: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val || val.trim() === "") return true;
					try {
						new URL(val);
						return true;
					} catch {
						return false;
					}
				},
				{
					message: "请输入有效的二维码图片链接",
				},
			)
			.or(z.literal("")),
		paymentNote: z.string().optional(),
		// 作品关联设置
		requireProjectSubmission: z.boolean().default(false),
		// 数字名片公开确认
		askDigitalCardConsent: z.boolean().default(false),
		// Hackathon 专门字段
		hackathonConfig: hackathonConfigSchema,
		// 反馈配置
		feedbackConfig: feedbackConfigSchema,
	})
	.refine(
		(data) => {
			if (data.endTime && data.startTime) {
				return new Date(data.endTime) > new Date(data.startTime);
			}
			return true;
		},
		{
			message: "End time must be after start time",
			path: ["endTime"],
		},
	)
	.refine(
		(data) => {
			if (data.isExternalEvent) {
				return data.externalUrl && data.externalUrl.trim() !== "";
			}
			return true;
		},
		{
			message: "外部活动必须提供外部报名链接",
			path: ["externalUrl"],
		},
	);

export type EventFormData = z.infer<typeof eventSchema>;

export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

export interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

export interface TicketType {
	name: string;
	description?: string;
	price: number;
	quantity: number;
}

export interface Question {
	id?: string;
	question: string;
	description?: string;
	type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "RADIO";
	required: boolean;
	options?: string[];
	order?: number;
}
