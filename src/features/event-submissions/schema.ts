import { z } from "zod";

export const submissionFormSchema = z.object({
	name: z.string().min(1, "请输入作品名称").max(50),
	tagline: z.string().min(10, "至少 10 个字符").max(100),
	description: z.string().max(5000).optional().or(z.literal("")),
	demoUrl: z.string().url("请输入合法的链接").optional().or(z.literal("")),
	teamLeaderId: z.string().optional(),
	teamMemberIds: z.array(z.string()).max(10).default([]),
	attachments: z
		.array(
			z.object({
				fileName: z.string().min(1),
				fileUrl: z.string().url(),
				fileType: z.string().min(1),
				mimeType: z.string().optional(),
				fileSize: z.number().min(0),
				order: z.number().optional(),
			}),
		)
		.default([]),
	communityUseAuthorization: z.boolean(),
	customFields: z.record(z.any()).optional(),
});

export type SubmissionFormSchema = z.infer<typeof submissionFormSchema>;
