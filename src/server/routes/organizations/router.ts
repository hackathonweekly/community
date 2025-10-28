import {
	ContentType,
	createContentValidator,
	ensureImageSafe,
	validateSingleContent,
} from "@/lib/content-moderation";
import {
	INVITATION_PLACEHOLDER_DOMAIN,
	isPlaceholderInvitationEmail,
} from "@/lib/auth/invitations";
import { getInvitationMissingFieldLabels } from "@/features/profile/invitation-requirements";
import {
	getMarketingOrganizations,
	getOrganizationBySlug,
} from "@/lib/database";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database/prisma/client";
import { sendEmail } from "@/lib/mail";
import { NotificationService } from "@/features/notifications/service";
import { getAllTags, getBaseUrl } from "@/lib/utils";
import { withOrganizationPublicUrls } from "@/lib/storage";
import { BatchCommunicationService } from "@/lib/services/communication-service";
import { Prisma } from "@prisma/client";
import type { CommunicationType } from "@prisma/client";
import { canUserDoAction, RestrictedAction } from "@/features/permissions";
import { getVisitorRestrictionsConfig } from "@/config/visitor-restrictions";
import { APIError } from "better-auth/api";

import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { nanoid } from "nanoid";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const OrganizationUpdateSchema = z.object({
	name: z.string().optional(),
	summary: z.string().optional(),
	description: z.string().optional(),
	location: z.string().optional(),
	tags: z.array(z.string()).optional(),
	logo: z.string().nullable().optional(),
	audienceQrCode: z.string().nullable().optional(),
	memberQrCode: z.string().nullable().optional(),
	contactInfo: z.string().optional(),
	coverImage: z.string().nullable().optional(),
	membershipRequirements: z.string().optional(),
	isPublic: z.boolean().optional(),
});

const OrganizationCreateSchema = z.object({
	name: z.string().min(3).max(32),
	summary: z.string().optional(),
	description: z.string().min(20).max(1000),
	location: z.string().min(2),
	tags: z.array(z.string()).min(1).max(10),
	logo: z.string().optional(),
	coverImage: z.string().optional(),
	audienceQrCode: z.string().optional(),
	membershipRequirements: z.string().optional(),
});

const OrganizationApplicationSchema = z.object({
	organizationId: z.string(),
	reason: z
		.string()
		.min(10, "申请理由至少需要10个字符")
		.max(1000, "申请理由不能超过1000个字符"),
	invitationRequestCode: z
		.string()
		.min(8, "邀请码无效")
		.max(32, "邀请码无效")
		.optional(),
});

const buildInvitationPath = (invitationId: string) =>
	`/app/organization-invitation/${invitationId}`;

const buildInvitationUrl = (invitationId: string) =>
	`${getBaseUrl()}${buildInvitationPath(invitationId)}`;

type InvitationMetadata = {
	originalEmail?: string | null;
	targetUserId?: string | null;
	placeholderEmailUsed?: boolean;
	notificationSent?: boolean;
	linkType?: string;
	createdByUserId?: string;
	claimedByUserId?: string | null;
	claimedEmail?: string | null;
	claimedAt?: string | null;
	pendingProfileUserId?: string | null;
	inviterQuestionnaire?: {
		inviteeName?: string;
		invitationReason?: string;
		eligibilityDetails?: string;
	} | null;
};

const parseInvitationMetadata = (
	metadata: Prisma.JsonValue | null,
): InvitationMetadata => {
	if (!metadata || typeof metadata !== "object") {
		return {};
	}

	const record = metadata as Record<string, unknown>;

	const originalEmailRaw = record.originalEmail;
	let inviterQuestionnaire: InvitationMetadata["inviterQuestionnaire"];
	const inviterQuestionnaireRaw = record.inviterQuestionnaire;

	if (
		inviterQuestionnaireRaw &&
		typeof inviterQuestionnaireRaw === "object"
	) {
		const questionnaire = inviterQuestionnaireRaw as Record<
			string,
			unknown
		>;
		inviterQuestionnaire = {
			inviteeName:
				typeof questionnaire.inviteeName === "string"
					? questionnaire.inviteeName
					: undefined,
			invitationReason:
				typeof questionnaire.invitationReason === "string"
					? questionnaire.invitationReason
					: undefined,
			eligibilityDetails:
				typeof questionnaire.eligibilityDetails === "string"
					? questionnaire.eligibilityDetails
					: undefined,
		};
	}

	return {
		originalEmail:
			typeof originalEmailRaw === "string"
				? originalEmailRaw
				: originalEmailRaw === null
					? null
					: undefined,
		targetUserId:
			typeof record.targetUserId === "string"
				? record.targetUserId
				: null,
		placeholderEmailUsed: record.placeholderEmailUsed === true,
		notificationSent: record.notificationSent === true,
		linkType:
			typeof record.linkType === "string" ? record.linkType : undefined,
		createdByUserId:
			typeof record.createdByUserId === "string"
				? record.createdByUserId
				: undefined,
		claimedByUserId:
			typeof record.claimedByUserId === "string"
				? record.claimedByUserId
				: null,
		claimedEmail:
			typeof record.claimedEmail === "string"
				? record.claimedEmail
				: null,
		claimedAt:
			typeof record.claimedAt === "string" ? record.claimedAt : null,
		pendingProfileUserId:
			typeof record.pendingProfileUserId === "string"
				? record.pendingProfileUserId
				: null,
		inviterQuestionnaire,
	};
};

const CreateInvitationSchema = z.object({
	role: z.enum(["member", "admin"]).default("member"),
	email: z.string().email().optional(),
	targetUserId: z.string().optional(),
});

async function getMissingProfileFields(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			email: true,
			phoneNumber: true,
			userRoleString: true,
			bio: true,
			lifeStatus: true,
			currentWorkOn: true,
		},
	});

	if (!user) {
		return ["用户信息缺失"];
	}

	return getInvitationMissingFieldLabels(user);
}

const validateOrganizationContent = createContentValidator({
	name: { type: ContentType.ORGANIZATION_NAME },
	summary: { type: ContentType.ORGANIZATION_SUMMARY },
	description: { type: ContentType.ORGANIZATION_DESCRIPTION },
});

const validateOrganizationApplicationReason = (reason?: string) =>
	validateSingleContent(reason, ContentType.ORGANIZATION_APPLICATION_REASON);

const OrganizationQuerySchema = z.object({
	location: z.string().optional(),
	tags: z.string().optional(),
	search: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(50).default(12),
});

export const organizationsRouter = new Hono()
	.basePath("/organizations")
	.get(
		"/generate-slug",
		validator(
			"query",
			z.object({
				name: z.string(),
			}),
		),
		describeRoute({
			summary: "Generate a slug for an organization",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { name } = c.req.valid("query");

			// 生成简短、随机的slug (8字符以降低冲突概率)
			let slug: string;
			let hasAvailableSlug = false;
			let attempts = 0;
			const maxAttempts = 10;

			// 使用更强的重试机制
			do {
				attempts++;
				slug = nanoid(8).toLowerCase(); // 增加到8位以降低冲突概率

				const existing = await getOrganizationBySlug(slug);
				if (!existing) {
					hasAvailableSlug = true;
					break;
				}
			} while (attempts < maxAttempts);

			if (!hasAvailableSlug) {
				return c.json(
					{
						error: "Unable to generate unique slug after multiple attempts",
					},
					500,
				);
			}

			return c.json({
				slug,
			});
		},
	)
	.get(
		"/",
		validator("query", OrganizationQuerySchema),
		describeRoute({
			summary: "Get organizations with filtering",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { location, tags, search, page, limit } =
				c.req.valid("query");

			const tagArray = tags
				? tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean)
				: undefined;

			const marketingData = await getMarketingOrganizations({
				search,
				location,
				tags: tagArray,
				page,
				limit,
			});

			return c.json(marketingData);
		},
	)
	.get(
		"/tags",
		describeRoute({
			summary: "Get available organization tags",
			tags: ["Organizations"],
		}),
		async (c) => {
			return c.json({
				tags: getAllTags(),
			});
		},
	)
	.get(
		"/cities",
		describeRoute({
			summary: "Get available cities",
			tags: ["Organizations"],
		}),
		async (c) => {
			return c.json({
				cities: [], // Empty since we're using location instead
			});
		},
	)
	.post(
		"/create",
		authMiddleware,
		validator("json", OrganizationCreateSchema),
		describeRoute({
			summary: "Create a new organization",
			tags: ["Organizations"],
		}),
		async (c) => {
			const organizationData = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const membership = await db.user.findUnique({
				where: { id: user.id },
				select: { membershipLevel: true },
			});

			if (!membership) {
				return c.json({ error: "用户不存在" }, 404);
			}

			const restrictions = await getVisitorRestrictionsConfig();
			const membershipInfo = {
				membershipLevel: membership.membershipLevel,
			};
			const { allowed, reason } = canUserDoAction(
				membershipInfo,
				RestrictedAction.CREATE_ORGANIZATION,
				restrictions,
			);

			if (!allowed) {
				return c.json(
					{
						error:
							reason ??
							"创建组织需要成为共创伙伴，请联系社区负责人！",
					},
					403,
				);
			}

			const moderation = await validateOrganizationContent({
				name: organizationData.name,
				summary: organizationData.summary,
				description: organizationData.description,
			});

			if (!moderation.isValid) {
				console.warn("Organization content moderation failed", {
					userId: user.id,
					errors: moderation.errors,
					results: moderation.results,
				});

				return c.json(
					{
						error: "组织信息未通过内容审核",
						details: moderation.errors,
					},
					400,
				);
			}

			const imageFieldsForCreate: Array<{
				value?: string;
				name: string;
				mode: "avatar" | "content";
			}> = [
				{
					value: organizationData.logo,
					name: "organization_logo",
					mode: "avatar",
				},
				{
					value: organizationData.coverImage,
					name: "organization_cover",
					mode: "content",
				},
				{
					value: organizationData.audienceQrCode,
					name: "organization_audience_qrcode",
					mode: "content",
				},
			];

			for (const field of imageFieldsForCreate) {
				if (!field.value) continue;
				const moderation = await ensureImageSafe(
					field.value,
					field.mode,
					{
						skipIfEmpty: true,
					},
				);
				if (!moderation.isApproved) {
					console.warn("Organization image moderation failed", {
						userId: user.id,
						field: field.name,
						value: field.value,
						result: moderation.result,
					});
					return c.json(
						{
							error: moderation.reason ?? "组织图片未通过审核",
						},
						400,
					);
				}
			}

			try {
				// 生成简短、随机的slug并使用数据库唯一约束处理并发
				let organization: any;
				let attempts = 0;
				const maxAttempts = 10;

				do {
					attempts++;
					const slug = nanoid(8).toLowerCase(); // 增加到8位以降低冲突概率

					try {
						// 直接尝试创建，让数据库的唯一约束处理并发
						organization = await db.organization.create({
							data: {
								name: organizationData.name,
								slug,
								summary: organizationData.summary,
								description: organizationData.description,
								location: organizationData.location,
								tags: organizationData.tags,
								logo: organizationData.logo,
								coverImage: organizationData.coverImage,
								audienceQrCode: organizationData.audienceQrCode,
								membershipRequirements:
									organizationData.membershipRequirements,
								isPublic: true,
								createdAt: new Date(),
								members: {
									create: {
										userId: user.id,
										role: "owner",
										createdAt: new Date(),
									},
								},
							},
							include: {
								_count: {
									select: {
										members: true,
										events: true,
									},
								},
							},
						});
						break; // 创建成功，跳出循环
					} catch (error: any) {
						// 检查是否是唯一约束违反错误
						if (
							error.code === "P2002" &&
							error.meta?.target?.includes("slug")
						) {
							// slug冲突，继续重试
							if (attempts >= maxAttempts) {
								return c.json(
									{
										error: "Unable to generate unique slug after multiple attempts",
									},
									500,
								);
							}
							continue;
						}
						// 其他错误直接抛出
						throw error;
					}
				} while (attempts < maxAttempts);

				if (!organization) {
					return c.json(
						{
							error: "Failed to create organization",
						},
						500,
					);
				}

				const organizationWithUrls =
					withOrganizationPublicUrls(organization);
				return c.json({
					...organizationWithUrls,
					membersCount: organization._count.members,
					eventsCount: organization._count.events,
				});
			} catch (error) {
				console.error("Failed to create organization:", error);
				return c.json({ error: "Failed to create organization" }, 500);
			}
		},
	)
	.get(
		"/by-slug/:slug",
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		describeRoute({
			summary: "Get organization by slug for public access",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");

			const organization = await db.organization.findUnique({
				where: { slug },
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									username: true,
									image: true,
									bio: true,
									userRoleString: true,
									currentWorkOn: true,
									skills: true,
									cpValue: true,
									createdAt: true,
									membershipLevel: true,
									creatorLevel: true,
									mentorLevel: true,
									contributorLevel: true,
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					},
					events: {
						where: {
							status: "PUBLISHED",
							startTime: {
								gte: new Date(),
							},
						},
						orderBy: {
							startTime: "asc",
						},
						take: 5,
					},
					_count: {
						select: {
							members: true,
							events: true,
						},
					},
				},
			});

			if (!organization || !organization.isPublic) {
				return c.json({ error: "Organization not found" }, 404);
			}

			const organizationWithUrls =
				withOrganizationPublicUrls(organization);
			return c.json({
				...organizationWithUrls,
				membersCount: organization._count.members,
				eventsCount: organization._count.events,
			});
		},
	)
	.get(
		"/:slug/members",
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		describeRoute({
			summary: "Get organization members by slug",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");

			const organization = await db.organization.findUnique({
				where: { slug },
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									username: true,
									image: true,
									bio: true,
									region: true,
									userRoleString: true,
									githubUrl: true,
									twitterUrl: true,
									websiteUrl: true,
									wechatId: true,
									email: true,
									showEmail: true,
									showWechat: true,
									profilePublic: true,
									skills: true,
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					},
				},
			});

			if (!organization) {
				return c.json({ error: "Organization not found" }, 404);
			}

			return c.json({
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
				},
				members: organization.members,
			});
		},
	)
	.delete(
		"/:slug/members/:memberId",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
				memberId: z.string(),
			}),
		),
		describeRoute({
			summary: "Remove a member from organization",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { slug, memberId } = c.req.valid("param");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Get organization
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				// Check if user is organization admin or owner
				const userMember = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				// Check if the member to be removed exists
				const memberToRemove = await db.member.findUnique({
					where: { id: memberId },
					include: { user: true },
				});

				if (
					!memberToRemove ||
					memberToRemove.organizationId !== organization.id
				) {
					return c.json({ error: "Member not found" }, 404);
				}

				// Prevent removing the organization owner
				if (memberToRemove.role === "owner") {
					return c.json(
						{ error: "Cannot remove organization owner" },
						400,
					);
				}

				// Remove the member
				await db.member.delete({
					where: { id: memberId },
				});

				return c.json({
					message: "Member removed successfully",
				});
			} catch (error) {
				console.error("Error removing member:", error);
				return c.json({ error: "Failed to remove member" }, 500);
			}
		},
	)
	.patch(
		"/:slug/members/:memberId/role",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
				memberId: z.string(),
			}),
		),
		validator(
			"json",
			z.object({
				role: z.enum(["member", "admin", "core"]),
			}),
		),
		describeRoute({
			summary: "Update member role in organization",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { slug, memberId } = c.req.valid("param");
			const { role } = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Get organization
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				// Check if user is organization admin or owner
				const userMember = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				// Check if the member exists
				const memberToUpdate = await db.member.findUnique({
					where: { id: memberId },
				});

				if (
					!memberToUpdate ||
					memberToUpdate.organizationId !== organization.id
				) {
					return c.json({ error: "Member not found" }, 404);
				}

				// Prevent changing owner role
				if (memberToUpdate.role === "owner") {
					return c.json({ error: "Cannot change owner role" }, 400);
				}

				// Update the member role
				const updatedMember = await db.member.update({
					where: { id: memberId },
					data: { role },
					include: { user: true },
				});

				return c.json({
					message: "Member role updated successfully",
					member: updatedMember,
				});
			} catch (error) {
				console.error("Error updating member role:", error);
				return c.json({ error: "Failed to update member role" }, 500);
			}
		},
	)
	.post(
		"/:slug/invitations",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		validator("json", CreateInvitationSchema),
		describeRoute({
			summary: "Create a new organization invitation",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");
			const { role, email, targetUserId } = c.req.valid("json");
			const sessionUser = c.get("user");

			if (!sessionUser) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				const adminMember = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: sessionUser.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!adminMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				if (targetUserId) {
					const targetUser = await db.user.findUnique({
						where: { id: targetUserId },
						select: {
							id: true,
							name: true,
							email: true,
							username: true,
							image: true,
						},
					});

					if (!targetUser) {
						return c.json({ error: "Target user not found" }, 404);
					}

					const existingMember = await db.member.findFirst({
						where: {
							organizationId: organization.id,
							userId: targetUserId,
						},
					});

					if (existingMember) {
						return c.json(
							{
								error: "User is already a member of this organization",
							},
							400,
						);
					}

					const existingPendingForUser =
						await db.invitation.findFirst({
							where: {
								organizationId: organization.id,
								targetUserId,
								status: "pending",
								expiresAt: { gt: new Date() },
							},
						});

					if (existingPendingForUser) {
						return c.json(
							{
								error: "An active invitation already exists for this user",
							},
							409,
						);
					}
				}

				const normalizedEmail = email?.toLowerCase();
				if (normalizedEmail) {
					const existingPendingForEmail =
						await db.invitation.findFirst({
							where: {
								organizationId: organization.id,
								email: normalizedEmail,
								status: "pending",
								expiresAt: { gt: new Date() },
							},
						});

					if (existingPendingForEmail) {
						return c.json(
							{
								error: "An active invitation already exists for this email",
							},
							409,
						);
					}
				}

				const placeholderEmail = `invite-${randomUUID()}@${INVITATION_PLACEHOLDER_DOMAIN}`;
				const invitationEmail = (
					normalizedEmail ?? placeholderEmail
				).toLowerCase();

				const invitation = await (auth.api as any).createInvitation({
					headers: c.req.raw.headers,
					body: {
						email: invitationEmail,
						role,
						organizationId: organization.id,
						...(targetUserId ? { targetUserId } : {}),
					},
				});

				if (!invitation) {
					return c.json(
						{ error: "Failed to create invitation" },
						500,
					);
				}

				const linkType = normalizedEmail
					? targetUserId
						? "email+in-app"
						: "email"
					: targetUserId
						? "in-app"
						: "link";

				const invitationMetadata: Prisma.JsonObject = {
					originalEmail: normalizedEmail ?? null,
					targetUserId: targetUserId ?? null,
					placeholderEmailUsed: !normalizedEmail,
					notificationSent: Boolean(targetUserId),
					linkType,
					createdByUserId: sessionUser.id,
				};

				await db.invitation.update({
					where: { id: invitation.id },
					data: {
						metadata: invitationMetadata,
						targetUserId: targetUserId ?? null,
					},
				});

				if (targetUserId) {
					try {
						await db.notification.create({
							data: {
								userId: targetUserId,
								type: "ORGANIZATION_MEMBER_INVITED",
								title: "组织邀请",
								content: `${sessionUser.name || "管理员"} 邀请您加入 ${organization.name}`,
								actionUrl: buildInvitationPath(invitation.id),
								relatedUserId: sessionUser.id,
								metadata: {
									organizationName: organization.name,
									organizationSlug: organization.slug,
									invitationId: invitation.id,
									role,
								},
							},
						});
					} catch (notificationError) {
						console.error(
							"Failed to create invitation notification:",
							notificationError,
						);
					}
				}

				const fullInvitation = await db.invitation.findUnique({
					where: { id: invitation.id },
					include: {
						targetUser: {
							select: {
								id: true,
								name: true,
								email: true,
								username: true,
								image: true,
							},
						},
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				});

				if (!fullInvitation) {
					return c.json(
						{ error: "Invitation not found after creation" },
						500,
					);
				}

				const parsedMetadata = parseInvitationMetadata(
					fullInvitation.metadata as Prisma.JsonValue | null,
				);
				const sharePath = buildInvitationPath(fullInvitation.id);
				const effectiveEmail =
					parsedMetadata.originalEmail ??
					(isPlaceholderInvitationEmail(fullInvitation.email)
						? null
						: fullInvitation.email);

				return c.json({
					invitation: {
						id: fullInvitation.id,
						organizationId: fullInvitation.organizationId,
						role: fullInvitation.role,
						status: fullInvitation.status,
						email: effectiveEmail,
						expiresAt: fullInvitation.expiresAt,
						targetUserId: fullInvitation.targetUserId,
						targetUser: fullInvitation.targetUser,
						inviter: fullInvitation.user,
						metadata: parsedMetadata,
						linkType: parsedMetadata.linkType,
						notificationSent:
							parsedMetadata.notificationSent ??
							Boolean(targetUserId),
						sharePath,
						shareUrl: buildInvitationUrl(fullInvitation.id),
						createdAt: fullInvitation.createdAt,
						updatedAt: fullInvitation.updatedAt,
					},
				});
			} catch (error) {
				console.error("Error creating invitation:", error);
				return c.json({ error: "Failed to create invitation" }, 500);
			}
		},
	)
	.get(
		"/:slug/invitations",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		describeRoute({
			summary: "List organization invitations",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");
			const sessionUser = c.get("user");

			if (!sessionUser) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				const adminMember = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: sessionUser.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!adminMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				const invitations = await db.invitation.findMany({
					where: {
						organizationId: organization.id,
					},
					include: {
						targetUser: {
							select: {
								id: true,
								name: true,
								email: true,
								username: true,
								image: true,
							},
						},
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				const referralRequests =
					await db.organizationInvitationRequest.findMany({
						where: {
							organizationId: organization.id,
							status: {
								in: ["PENDING", "APPLICATION_SUBMITTED"],
							},
						},
						include: {
							inviter: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
							application: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											email: true,
											username: true,
										},
									},
								},
							},
						},
						orderBy: {
							createdAt: "desc",
						},
					});

				const result = invitations.map((invitation) => {
					const parsedMetadata = parseInvitationMetadata(
						invitation.metadata as Prisma.JsonValue | null,
					);
					const sharePath = buildInvitationPath(invitation.id);
					const effectiveEmail =
						parsedMetadata.originalEmail ??
						(isPlaceholderInvitationEmail(invitation.email)
							? null
							: invitation.email);

					return {
						id: invitation.id,
						organizationId: invitation.organizationId,
						role: invitation.role,
						status: invitation.status,
						email: effectiveEmail,
						expiresAt: invitation.expiresAt,
						targetUserId: invitation.targetUserId,
						targetUser: invitation.targetUser,
						inviter: invitation.user,
						metadata: parsedMetadata,
						linkType: parsedMetadata.linkType,
						notificationSent:
							parsedMetadata.notificationSent ?? false,
						sharePath,
						shareUrl: buildInvitationUrl(invitation.id),
						createdAt: invitation.createdAt,
						updatedAt: invitation.updatedAt,
					};
				});

				const referralResult = referralRequests.map((request) => ({
					id: request.id,
					code: request.code,
					status: request.status,
					inviteeName: request.inviteeName,
					invitationReason: request.invitationReason,
					eligibilityDetails: request.eligibilityDetails,
					inviter: request.inviter,
					application: request.application
						? {
								id: request.application.id,
								status: request.application.status,
								submittedAt: request.application.submittedAt,
								user: request.application.user
									? {
											id: request.application.user.id,
											name: request.application.user.name,
											email: request.application.user
												.email,
											username:
												request.application.user
													.username,
										}
									: null,
							}
						: null,
					createdAt: request.createdAt,
					updatedAt: request.updatedAt,
				}));

				return c.json({
					invitations: result,
					referralRequests: referralResult,
				});
			} catch (error) {
				console.error("Error fetching invitations:", error);
				return c.json({ error: "Failed to fetch invitations" }, 500);
			}
		},
	)
	.post(
		"/invitations/:invitationId/accept",
		authMiddleware,
		validator(
			"param",
			z.object({
				invitationId: z.string(),
			}),
		),
		describeRoute({
			summary:
				"Accept organization invitation with profile completeness guard",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { invitationId } = c.req.valid("param");
			const currentUser = c.get("user");

			if (!currentUser) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				const invitationRecord = await db.invitation.findUnique({
					where: { id: invitationId },
					include: {
						organization: {
							select: {
								id: true,
								slug: true,
								name: true,
							},
						},
					},
				});

				if (!invitationRecord) {
					return c.json({ error: "邀请不存在" }, 404);
				}

				const clearPendingStateForUser = async () => {
					await db.user.updateMany({
						where: {
							id: currentUser.id,
							pendingInvitationId: invitationId,
						},
						data: { pendingInvitationId: null },
					});

					if (
						invitationRecord.metadata &&
						typeof invitationRecord.metadata === "object"
					) {
						const {
							pendingProfileUserId,
							pendingProfileMissing,
							...rest
						} = invitationRecord.metadata as Record<
							string,
							Prisma.JsonValue
						>;

						if (pendingProfileUserId === currentUser.id) {
							await db.invitation.update({
								where: { id: invitationId },
								data: {
									metadata:
										Object.keys(rest).length > 0
											? (rest as Prisma.JsonObject)
											: Prisma.JsonNull,
								},
							});
						}
					}
				};

				if (invitationRecord.status !== "pending") {
					await clearPendingStateForUser();
					return c.json({ error: "邀请已失效或已处理" }, 400);
				}

				if (new Date(invitationRecord.expiresAt) <= new Date()) {
					await clearPendingStateForUser();
					return c.json({ error: "邀请已过期" }, 400);
				}

				let invitationMetadata = parseInvitationMetadata(
					invitationRecord.metadata as Prisma.JsonValue | null,
				);
				const linkType = invitationMetadata.linkType
					? invitationMetadata.linkType
					: invitationRecord.targetUserId
						? "in-app"
						: "link";
				const shouldRestrictToRecipient =
					linkType === "in-app" || linkType === "email+in-app";

				if (
					shouldRestrictToRecipient &&
					invitationRecord.targetUserId &&
					invitationRecord.targetUserId !== currentUser.id
				) {
					return c.json(
						{
							error: "该邀请仅面向特定成员，您无法接受",
						},
						403,
					);
				}

				const missingFields = await getMissingProfileFields(
					currentUser.id,
				);

				if (missingFields.length > 0) {
					await db.user.update({
						where: { id: currentUser.id },
						data: { pendingInvitationId: invitationId },
					});

					const existingMetadata =
						(invitationRecord.metadata as Prisma.JsonObject | null) ??
						{};
					const updatedMetadata: Prisma.JsonObject = {
						...(existingMetadata as Record<
							string,
							Prisma.JsonValue
						>),
						pendingProfileUserId: currentUser.id,
						pendingProfileMissing: missingFields,
					};

					await db.invitation.update({
						where: { id: invitationId },
						data: { metadata: updatedMetadata },
					});

					return c.json({
						status: "needs_profile",
						missingFields,
					});
				}

				const normalizedCurrentUserEmail = currentUser.email
					? currentUser.email.trim().toLowerCase()
					: "";

				if (
					!shouldRestrictToRecipient &&
					isPlaceholderInvitationEmail(invitationRecord.email)
				) {
					if (!normalizedCurrentUserEmail) {
						return c.json(
							{
								error: "请先完善账号邮箱后再接受邀请",
							},
							400,
						);
					}

					const existingMetadata =
						(invitationRecord.metadata as Prisma.JsonObject | null) ??
						{};
					const updatedMetadata: Prisma.JsonObject = {
						...(existingMetadata as Record<
							string,
							Prisma.JsonValue
						>),
						claimedByUserId: currentUser.id,
						claimedEmail: normalizedCurrentUserEmail,
						claimedAt: new Date().toISOString(),
					};

					await db.invitation.update({
						where: { id: invitationId },
						data: {
							email: normalizedCurrentUserEmail,
							metadata: updatedMetadata,
						},
					});

					invitationRecord.email = normalizedCurrentUserEmail;
					invitationMetadata =
						parseInvitationMetadata(updatedMetadata);
				}

				try {
					await (auth.api as any).acceptInvitation({
						headers: c.req.raw.headers,
						body: {
							invitationId,
						},
					});
				} catch (error) {
					if (error instanceof APIError) {
						const statusCode = error.statusCode ?? 400;
						const message =
							error.body?.error ||
							error.message ||
							"无法接受邀请";

						if (statusCode === 403 || statusCode === 404) {
							await clearPendingStateForUser();
						}

						return c.json({ error: message }, statusCode as any);
					}

					throw error;
				}

				// 更新用户状态：清除待处理邀请，并自动升级为成员
				const userBeforeUpdate = await db.user.findUnique({
					where: { id: currentUser.id },
					select: { membershipLevel: true },
				});

				await db.user.update({
					where: { id: currentUser.id },
					data: {
						pendingInvitationId: null,
						// 如果是游客，自动升级为成员
						...(userBeforeUpdate?.membershipLevel === "VISITOR"
							? { membershipLevel: "MEMBER" }
							: {}),
					},
				});

				const metadataValue =
					(invitationRecord.metadata as Prisma.JsonObject | null) ??
					null;
				let cleanedMetadata: Prisma.JsonObject | null = null;

				if (metadataValue && typeof metadataValue === "object") {
					const {
						pendingProfileUserId: _pendingProfileUserId,
						pendingProfileMissing: _pendingProfileMissing,
						...rest
					} = metadataValue as Record<string, Prisma.JsonValue>;
					cleanedMetadata = rest;
				}

				await db.invitation.update({
					where: { id: invitationId },
					data: { metadata: cleanedMetadata ?? null },
				});

				return c.json({
					status: "accepted",
					organizationSlug: invitationRecord.organization.slug,
				});
			} catch (error) {
				console.error("Error accepting invitation:", error);
				return c.json({ error: "Failed to accept invitation" }, 500);
			}
		},
	)
	.post(
		"/:slug/members/direct-add",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		describeRoute({
			summary: "Deprecated direct member addition endpoint",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			return c.json(
				{
					error: "Direct member addition is no longer supported. Please create an invitation instead.",
				},
				410,
			);
		},
	)
	.get(
		"/:id",
		validator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		describeRoute({
			summary: "Get organization by ID with members",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { id } = c.req.valid("param");

			const organization = await db.organization.findUnique({
				where: { id },
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									username: true,
									image: true,
									bio: true,
									userRoleString: true,
									currentWorkOn: true,
									skills: true,
									cpValue: true,
									createdAt: true,
									membershipLevel: true,
									creatorLevel: true,
									mentorLevel: true,
									contributorLevel: true,
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					},
					events: {
						where: {
							status: "PUBLISHED",
							startTime: {
								gte: new Date(),
							},
						},
						orderBy: {
							startTime: "asc",
						},
						take: 5,
					},
					_count: {
						select: {
							members: true,
							events: true,
						},
					},
				},
			});

			if (!organization || !organization.isPublic) {
				return c.json({ error: "Organization not found" }, 404);
			}

			const organizationWithUrls =
				withOrganizationPublicUrls(organization);
			return c.json({
				...organizationWithUrls,
				membersCount: organization._count.members,
				eventsCount: organization._count.events,
			});
		},
	)
	.put(
		"/:id",
		authMiddleware,
		validator("param", z.object({ id: z.string() })),
		validator("json", OrganizationUpdateSchema),
		describeRoute({
			summary: "Update organization information",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { id } = c.req.valid("param");
			const updateData = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Check if user is organization member with admin/owner role
				const userMember = await db.member.findFirst({
					where: {
						organizationId: id,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden" }, 403);
				}

				const moderation = await validateOrganizationContent({
					name: updateData.name,
					summary: updateData.summary,
					description: updateData.description,
				});

				if (!moderation.isValid) {
					console.warn("Organization update moderation failed", {
						userId: user.id,
						organizationId: id,
						errors: moderation.errors,
						results: moderation.results,
					});

					return c.json(
						{
							error: "组织信息未通过内容审核",
							details: moderation.errors,
						},
						400,
					);
				}

				const imageFieldsForUpdate: Array<{
					value?: string;
					name: string;
					mode: "avatar" | "content";
				}> = [
					{
						value: updateData.logo ?? undefined,
						name: "organization_logo",
						mode: "avatar",
					},
					{
						value: updateData.coverImage ?? undefined,
						name: "organization_cover",
						mode: "content",
					},
					{
						value: updateData.audienceQrCode ?? undefined,
						name: "organization_audience_qrcode",
						mode: "content",
					},
					{
						value: updateData.memberQrCode ?? undefined,
						name: "organization_member_qrcode",
						mode: "content",
					},
				];

				for (const field of imageFieldsForUpdate) {
					if (field.value === undefined) continue;
					const moderation = await ensureImageSafe(
						field.value,
						field.mode,
						{
							skipIfEmpty: true,
						},
					);
					if (!moderation.isApproved) {
						console.warn(
							"Organization image moderation failed on update",
							{
								userId: user.id,
								organizationId: id,
								field: field.name,
								value: field.value,
								result: moderation.result,
							},
						);
						return c.json(
							{
								error:
									moderation.reason ?? "组织图片未通过审核",
							},
							400,
						);
					}
				}

				const organization = await db.organization.update({
					where: { id },
					data: updateData,
					include: {
						_count: {
							select: {
								members: true,
								events: true,
							},
						},
					},
				});

				const organizationWithUrls =
					withOrganizationPublicUrls(organization);
				return c.json({
					...organizationWithUrls,
					membersCount: organization._count.members,
					eventsCount: organization._count.events,
				});
			} catch (error) {
				return c.json({ error: "Failed to update organization" }, 500);
			}
		},
	)
	.post(
		"/applications",
		authMiddleware,
		validator("json", OrganizationApplicationSchema),
		describeRoute({
			summary: "Submit organization application",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { organizationId, reason, invitationRequestCode } =
				c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Check if user is already a member of this organization
				const existingMembership = await db.member.findFirst({
					where: {
						organizationId,
						userId: user.id,
					},
				});

				if (existingMembership) {
					return c.json(
						{ error: "Already a member of this organization" },
						400,
					);
				}

				// Check if there's already a pending application
				const existingApplication =
					await db.organizationApplication.findFirst({
						where: {
							organizationId,
							userId: user.id,
							status: "PENDING",
						},
					});

				if (existingApplication) {
					return c.json(
						{ error: "Application already submitted" },
						400,
					);
				}

				let invitationRequest: Awaited<
					ReturnType<
						typeof db.organizationInvitationRequest.findUnique
					>
				> = null;

				if (invitationRequestCode) {
					invitationRequest =
						await db.organizationInvitationRequest.findUnique({
							where: { code: invitationRequestCode },
						});

					if (
						!invitationRequest ||
						invitationRequest.organizationId !== organizationId
					) {
						return c.json({ error: "邀请码无效或已失效" }, 400);
					}

					if (invitationRequest.status !== "PENDING") {
						return c.json(
							{ error: "该邀请码已被使用或正在审核" },
							400,
						);
					}
				}

				const reasonModeration =
					await validateOrganizationApplicationReason(reason);

				if (!reasonModeration.isValid) {
					console.warn("Organization application moderation failed", {
						userId: user.id,
						organizationId,
						reasonModeration,
					});

					return c.json(
						{
							error: "申请理由未通过内容审核",
							details: {
								reason:
									reasonModeration.error ?? "内容审核未通过",
							},
						},
						400,
					);
				}

				// Create new application
				const application = await db.organizationApplication.create({
					data: {
						organizationId,
						userId: user.id,
						reason,
						status: "PENDING",
						submittedAt: new Date(),
					},
					include: {
						organization: true,
						user: true,
					},
				});

				if (invitationRequest) {
					await db.organizationInvitationRequest.update({
						where: { id: invitationRequest.id },
						data: {
							status: "APPLICATION_SUBMITTED",
							applicationId: application.id,
						},
					});
				}

				// Send notification to organization admins
				try {
					const organization = application.organization;
					const admins = await db.member.findMany({
						where: {
							organizationId: organization.id,
							role: { in: ["owner", "admin"] },
						},
						include: {
							user: true,
						},
					});

					// Send notifications to organization admins using NotificationService
					const adminUserIds = admins.map((admin) => admin.user.id);
					await NotificationService.notifyOrganizationMemberApplication(
						organization.id,
						organization.name,
						adminUserIds,
						user.id,
						user.name || "未知用户",
						organization.slug,
					);

					// Also send email notifications directly (keeping existing email logic)
					for (const admin of admins) {
						if (admin.user?.email) {
							await sendEmail({
								to: admin.user.email,
								subject: `新的加入申请 - ${organization.name}`,
								templateId: "organizationApplicationReceived",
								context: {
									organizationName: organization.name,
									applicantName: user.name || "Unknown User",
									applicantEmail: user.email,
									reason: application.reason,
									dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/${organization.slug}/settings/members`,
								},
							});
						}
					}
				} catch (emailError) {
					// Log email error but don't fail the application
					console.error("Failed to send notification:", emailError);
				}

				return c.json({
					message: "Application submitted successfully",
					application,
				});
			} catch (error) {
				console.error("Failed to submit application:", error);
				return c.json({ error: "Failed to submit application" }, 500);
			}
		},
	)
	.post(
		"/:id/join",
		validator("param", z.object({ id: z.string() })),
		validator("json", z.object({ message: z.string().optional() })),
		describeRoute({
			summary:
				"Request to join organization (deprecated - use /applications)",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { id } = c.req.valid("param");
			const { message } = c.req.valid("json");

			// Redirect to new applications endpoint
			return c.json(
				{
					message:
						"Please use /api/organizations/applications endpoint instead",
					redirectTo: "/api/organizations/applications",
				},
				302,
			);
		},
	)
	// Admin endpoints for organization applications
	.get(
		"/:organizationId/applications",
		authMiddleware,
		validator(
			"param",
			z.object({
				organizationId: z.string(),
			}),
		),
		validator(
			"query",
			z.object({
				status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
				page: z.coerce.number().min(1).default(1),
				limit: z.coerce.number().min(1).max(50).default(20),
			}),
		),
		describeRoute({
			summary: "Get organization applications (admin only)",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { organizationId } = c.req.valid("param");
			const { status, page, limit } = c.req.valid("query");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Check if user is organization admin or owner
				const userMember = await db.member.findFirst({
					where: {
						organizationId,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				const skip = (page - 1) * limit;
				const where: any = {
					organizationId,
				};

				if (status) {
					where.status = status;
				}

				const [applications, total] = await Promise.all([
					db.organizationApplication.findMany({
						where,
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
									bio: true,
									username: true,
									githubUrl: true,
									skills: true,
									createdAt: true,
								},
							},
							organization: {
								select: {
									id: true,
									name: true,
									slug: true,
								},
							},
							invitationRequest: {
								include: {
									inviter: {
										select: {
											id: true,
											name: true,
											email: true,
										},
									},
								},
							},
						},
						orderBy: {
							submittedAt: "desc",
						},
						skip,
						take: limit,
					}),
					db.organizationApplication.count({ where }),
				]);

				return c.json({
					applications,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
					},
				});
			} catch (error) {
				console.error("Error fetching applications:", error);
				return c.json({ error: "Failed to fetch applications" }, 500);
			}
		},
	)
	.put(
		"/applications/:applicationId/review",
		authMiddleware,
		validator(
			"param",
			z.object({
				applicationId: z.string(),
			}),
		),
		validator(
			"json",
			z.object({
				status: z.enum(["APPROVED", "REJECTED"]),
				reviewNote: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Review organization application (admin only)",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { applicationId } = c.req.valid("param");
			const { status, reviewNote } = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Get the application first
				const application = await db.organizationApplication.findUnique(
					{
						where: { id: applicationId },
						include: {
							organization: true,
							user: true,
							invitationRequest: true,
						},
					},
				);

				if (!application) {
					return c.json({ error: "Application not found" }, 404);
				}

				// Check if user is organization admin or owner
				const userMember = await db.member.findFirst({
					where: {
						organizationId: application.organizationId,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				// Update the application
				const updatedApplication =
					await db.organizationApplication.update({
						where: { id: applicationId },
						data: {
							status,
							reviewedAt: new Date(),
							reviewedBy: user.id,
							reviewNote,
						},
						include: {
							user: true,
							organization: true,
						},
					});

				// If approved, add user as member
				if (status === "APPROVED") {
					await db.member.create({
						data: {
							organizationId: application.organizationId,
							userId: application.userId,
							role: "member",
							createdAt: new Date(),
						},
					});
				}

				if (application.invitationRequest) {
					await db.organizationInvitationRequest.update({
						where: { id: application.invitationRequest.id },
						data: {
							status:
								status === "APPROVED" ? "APPROVED" : "REJECTED",
						},
					});
				}

				// Send notification to applicant using NotificationService
				await NotificationService.notifyOrganizationApplicationResult(
					application.userId,
					application.organization.name,
					status === "APPROVED",
					application.organization.slug,
				);

				return c.json({
					message: "Application reviewed successfully",
					application: updatedApplication,
				});
			} catch (error) {
				console.error("Error reviewing application:", error);
				return c.json({ error: "Failed to review application" }, 500);
			}
		},
	)
	.get(
		"/:slug/analytics",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		describeRoute({
			summary: "Get organization analytics data",
			tags: ["Organizations", "Analytics"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");

			try {
				// Get organization
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				// Get current user for permission check
				const user = c.get("user");
				if (!user) {
					return c.json({ error: "Unauthorized" }, 401);
				}

				// Check if user is organization admin
				const membership = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!membership) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				// Get analytics data
				const now = new Date();
				const twelveMonthsAgo = new Date();
				twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

				const [
					totalMembers,
					memberGrowth,
					activeMembers,
					contributionStats,
					topContributors,
					eventStats,
				] = await Promise.all([
					// Total members
					db.member.count({
						where: { organizationId: organization.id },
					}),

					// Monthly member growth for past 12 months
					db.member.findMany({
						where: {
							organizationId: organization.id,
							createdAt: {
								gte: twelveMonthsAgo,
							},
						},
						select: {
							createdAt: true,
						},
						orderBy: {
							createdAt: "asc",
						},
					}),

					// Active members (contributed in last 90 days)
					db.user.count({
						where: {
							members: {
								some: {
									organizationId: organization.id,
								},
							},
							contributions: {
								some: {
									organizationId: organization.id,
									status: "APPROVED",
									createdAt: {
										gte: new Date(
											now.getTime() -
												90 * 24 * 60 * 60 * 1000,
										),
									},
								},
							},
						},
					}),

					// Contribution types
					db.contribution.groupBy({
						by: ["type"],
						where: {
							organizationId: organization.id,
							status: "APPROVED",
						},
						_sum: {
							cpValue: true,
						},
						_count: {
							id: true,
						},
					}),

					// Top contributors
					db.user.findMany({
						where: {
							members: {
								some: {
									organizationId: organization.id,
								},
							},
							contributions: {
								some: {
									organizationId: organization.id,
									status: "APPROVED",
								},
							},
						},
						select: {
							id: true,
							name: true,
							contributions: {
								where: {
									organizationId: organization.id,
									status: "APPROVED",
								},
								select: {
									cpValue: true,
								},
							},
						},
						take: 10,
					}),

					// Event statistics
					db.event.groupBy({
						by: ["status"],
						where: {
							organizationId: organization.id,
						},
						_count: {
							id: true,
						},
					}),
				]);

				// Process member growth data
				const memberGrowthByMonth = new Map<string, number>();
				memberGrowth.forEach((member) => {
					const month = member.createdAt.toLocaleDateString("zh-CN", {
						year: "numeric",
						month: "short",
					});
					memberGrowthByMonth.set(
						month,
						(memberGrowthByMonth.get(month) || 0) + 1,
					);
				});

				const memberGrowthData = [];
				const currentDate = new Date(twelveMonthsAgo);
				let cumulativeMembers = 0;

				while (currentDate <= now) {
					const month = currentDate.toLocaleDateString("zh-CN", {
						year: "numeric",
						month: "short",
					});
					cumulativeMembers += memberGrowthByMonth.get(month) || 0;
					memberGrowthData.push({
						month,
						count: cumulativeMembers,
					});
					currentDate.setMonth(currentDate.getMonth() + 1);
				}

				// Process contribution types
				const contributionTypes = contributionStats.map((stat) => ({
					type: stat.type,
					count: stat._count.id,
					cpValue: stat._sum.cpValue || 0,
				}));

				// Process top contributors
				const topContributorsList = topContributors
					.map((user) => ({
						name: user.name,
						cpValue: user.contributions.reduce(
							(sum, contrib) => sum + contrib.cpValue,
							0,
						),
					}))
					.filter((contributor) => contributor.cpValue > 0)
					.sort((a, b) => b.cpValue - a.cpValue)
					.slice(0, 10);

				// Calculate KPIs
				const totalContributionValue = contributionTypes.reduce(
					(sum, type) => sum + type.cpValue,
					0,
				);
				const activeMemberRate =
					totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

				// Calculate monthly growth rate
				const monthlyGrowthRate =
					memberGrowthData.length > 1
						? ((memberGrowthData[memberGrowthData.length - 1]
								.count -
								memberGrowthData[memberGrowthData.length - 2]
									.count) /
								Math.max(
									1,
									memberGrowthData[
										memberGrowthData.length - 2
									].count,
								)) *
							100
						: 0;

				// Get event participation data
				const eventParticipationData = await db.event.findMany({
					where: {
						organizationId: organization.id,
						startTime: {
							gte: twelveMonthsAgo,
						},
					},
					select: {
						startTime: true,
						_count: {
							select: {
								registrations: true,
							},
						},
						maxAttendees: true,
					},
				});

				// Calculate average event participation rate
				const avgEventParticipation =
					eventParticipationData.length > 0
						? eventParticipationData.reduce((sum, event) => {
								const rate =
									event.maxAttendees && event.maxAttendees > 0
										? (event._count.registrations /
												event.maxAttendees) *
											100
										: 0;
								return sum + rate;
							}, 0) / eventParticipationData.length
						: 0;

				const eventParticipationByMonth = new Map<
					string,
					{ events: number; participants: number }
				>();
				eventParticipationData.forEach((event) => {
					const month = event.startTime.toLocaleDateString("zh-CN", {
						year: "numeric",
						month: "short",
					});
					if (!eventParticipationByMonth.has(month)) {
						eventParticipationByMonth.set(month, {
							events: 0,
							participants: 0,
						});
					}
					const data = eventParticipationByMonth.get(month)!;
					data.events += 1;
					data.participants += event._count.registrations;
				});

				const eventParticipationDataFormatted = Array.from(
					eventParticipationByMonth.entries(),
				).map(([month, data]) => ({
					month,
					events: data.events,
					participants: data.participants,
				}));

				const analytics = {
					memberGrowth: memberGrowthData,
					eventParticipation: eventParticipationDataFormatted,
					contributionTypes,
					memberActivity: memberGrowthData, // Simplified for now
					topContributors: topContributorsList,
					kpis: {
						totalMembers,
						monthlyGrowthRate:
							Math.round(monthlyGrowthRate * 100) / 100,
						avgEventParticipation:
							Math.round(avgEventParticipation * 100) / 100,
						totalContributionValue,
						activeMemberRate:
							Math.round(activeMemberRate * 100) / 100,
					},
				};

				return c.json({ analytics });
			} catch (error) {
				console.error("Failed to fetch organization analytics:", error);
				return c.json({ error: "Failed to fetch analytics" }, 500);
			}
		},
	)
	.post(
		"/:slug/send-message",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
			}),
		),
		validator(
			"json",
			z.object({
				type: z.enum(["EMAIL", "SMS"]),
				subject: z.string().min(1, "主题不能为空"),
				content: z.string().min(1, "内容不能为空"),
				memberIds: z.array(z.string()).optional(),
			}),
		),
		describeRoute({
			summary: "Send bulk message to organization members",
			tags: ["Organizations", "Communications"],
		}),
		async (c) => {
			const { slug } = c.req.valid("param");
			const { type, subject, content, memberIds } = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Get organization with members
				const organization = await db.organization.findUnique({
					where: { slug },
					include: {
						members: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										phoneNumber: true,
									},
								},
							},
						},
					},
				});

				if (!organization) {
					return c.json({ error: "组织不存在" }, 404);
				}

				// Check if user is organization admin or owner
				const userMember = organization.members.find(
					(member) =>
						member.userId === user.id &&
						["owner", "admin"].includes(member.role),
				);

				if (!userMember) {
					return c.json({ error: "权限不足" }, 403);
				}

				// Get target members
				let targetMembers = organization.members.map((member) => ({
					recordId: member.id,
					recipientEmail: member.user?.email || undefined,
					recipientPhone: member.user?.phoneNumber || undefined,
					recipientName: member.user?.name || "未知用户",
				}));

				// Filter by specific member IDs if provided
				if (memberIds && memberIds.length > 0) {
					targetMembers = targetMembers.filter((member) =>
						memberIds.includes(member.recordId),
					);
				}

				if (targetMembers.length === 0) {
					return c.json({ error: "没有找到目标成员" }, 400);
				}

				// Filter members with valid contact info
				const validMembers = targetMembers.filter((member) => {
					if (type === "EMAIL") {
						return member.recipientEmail;
					}
					if (type === "SMS") {
						return member.recipientPhone;
					}
					return false;
				});

				if (validMembers.length === 0) {
					const missingField =
						type === "EMAIL" ? "邮箱地址" : "手机号";
					return c.json(
						{ error: `所有目标成员都没有${missingField}信息` },
						400,
					);
				}

				// Send messages using BatchCommunicationService
				const result = await BatchCommunicationService.sendBatch({
					type: type as CommunicationType,
					records: validMembers,
					subject,
					content,
				});

				return c.json({
					success: true,
					message: "消息发送完成",
					totalCount: validMembers.length,
					successCount: result.summary.success,
					failedCount: result.summary.failed,
					results: result.results,
				});
			} catch (error) {
				console.error("Error sending message:", error);
				return c.json(
					{
						error:
							error instanceof Error ? error.message : "发送失败",
					},
					500,
				);
			}
		},
	)
	.post(
		"/:slug/members/:memberId/adjust-level",
		authMiddleware,
		validator(
			"param",
			z.object({
				slug: z.string(),
				memberId: z.string(),
			}),
		),
		validator(
			"json",
			z.object({
				levelType: z.enum([
					"MEMBERSHIP",
					"CREATOR",
					"MENTOR",
					"CONTRIBUTOR",
				]),
				level: z.string().optional().nullable(), // null表示清除等级
				reason: z.string().min(5, "调整理由至少需要5个字符"),
			}),
		),
		describeRoute({
			summary: "Adjust member level in organization (admin only)",
			tags: ["Organizations", "Admin"],
		}),
		async (c) => {
			const { slug, memberId } = c.req.valid("param");
			const { levelType, level, reason } = c.req.valid("json");
			const user = c.get("user");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Get organization
				const organization = await db.organization.findUnique({
					where: { slug },
					select: { id: true, name: true, slug: true },
				});

				if (!organization) {
					return c.json({ error: "Organization not found" }, 404);
				}

				// Check if user is organization admin or owner
				const userMember = await db.member.findFirst({
					where: {
						organizationId: organization.id,
						userId: user.id,
						role: { in: ["owner", "admin"] },
					},
				});

				if (!userMember) {
					return c.json({ error: "Forbidden - not an admin" }, 403);
				}

				// Get the member to adjust
				const memberToAdjust = await db.member.findUnique({
					where: { id: memberId },
					include: { user: true },
				});

				if (
					!memberToAdjust ||
					memberToAdjust.organizationId !== organization.id
				) {
					return c.json({ error: "Member not found" }, 404);
				}

				const targetUserId = memberToAdjust.userId;

				// Validate level - organization admins can only set levels 1-3
				if (level) {
					const validOrganizationLevels = [
						"C1",
						"C2",
						"C3",
						"M1",
						"M2",
						"M3",
						"O1",
						"O2",
						"O3",
					];
					if (!validOrganizationLevels.includes(level)) {
						return c.json(
							{
								error: "组织管理员只能设置 C1-C3（创作者1-3级）、M1-M3（导师1-3级）或 O1-O3（贡献者1-3级）等级",
							},
							400,
						);
					}
				}

				// Get current level
				const targetUser = await db.user.findUnique({
					where: { id: targetUserId },
					select: {
						id: true,
						name: true,
						membershipLevel: true,
						creatorLevel: true,
						mentorLevel: true,
						contributorLevel: true,
					},
				});

				if (!targetUser) {
					return c.json({ error: "Target user not found" }, 404);
				}

				let currentLevel: string | null = null;
				switch (levelType) {
					case "MEMBERSHIP":
						currentLevel = targetUser.membershipLevel;
						break;
					case "CREATOR":
						currentLevel = targetUser.creatorLevel;
						break;
					case "MENTOR":
						currentLevel = targetUser.mentorLevel;
						break;
					case "CONTRIBUTOR":
						currentLevel = targetUser.contributorLevel;
						break;
				}

				// Update user level
				const updateData: any = {};
				switch (levelType) {
					case "MEMBERSHIP":
						updateData.membershipLevel = level as any;
						break;
					case "CREATOR":
						updateData.creatorLevel = level as any;
						break;
					case "MENTOR":
						updateData.mentorLevel = level as any;
						break;
					case "CONTRIBUTOR":
						updateData.contributorLevel = level as any;
						break;
				}

				// Start database transaction
				const result = await db.$transaction(async (prisma) => {
					// Update user level
					const updatedUser = await prisma.user.update({
						where: { id: targetUserId },
						data: updateData,
					});

					// Create a level application record for audit
					await prisma.levelApplication.create({
						data: {
							userId: targetUserId,
							levelType,
							action: level ? "UPGRADE" : "DOWNGRADE",
							targetLevel: level || "NONE",
							currentLevel,
							reason,
							status: "APPROVED",
							reviewedBy: user.id,
							reviewedAt: new Date(),
							submittedByAdmin: true,
							reviewNote: `组织管理员 (${organization.name}) 直接调整等级: ${reason}`,
						},
					});

					return updatedUser;
				});

				return c.json({
					success: true,
					message: "成员等级调整成功",
					user: result,
				});
			} catch (error) {
				console.error("Error adjusting member level:", error);
				return c.json({ error: "Failed to adjust member level" }, 500);
			}
		},
	)
	.post(
		"/member-invitations",
		authMiddleware,
		validator(
			"json",
			z.object({
				organizationId: z.string(),
				inviterQuestionnaire: z.object({
					inviteeName: z
						.string()
						.min(2, "被邀请人姓名至少需要2个字符")
						.max(100, "被邀请人姓名不能超过100个字符"),
					invitationReason: z
						.string()
						.min(10, "邀请理由至少需要10个字符")
						.max(500, "邀请理由不能超过500个字符"),
					eligibilityDetails: z
						.string()
						.min(10, "请说明候选人符合加入条件的理由，至少10个字符")
						.max(500, "理由不能超过500个字符"),
				}),
			}),
		),
		describeRoute({
			summary: "Create member invitation with inviter questionnaire",
			tags: ["Organizations", "Members"],
		}),
		async (c) => {
			const { organizationId, inviterQuestionnaire } =
				c.req.valid("json");
			const currentUser = c.get("user");

			if (!currentUser) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			try {
				// Check if user is a member of the organization
				const membership = await db.member.findFirst({
					where: {
						organizationId,
						userId: currentUser.id,
					},
					include: {
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
							},
						},
					},
				});

				if (!membership) {
					return c.json({ error: "只有组织成员才能邀请新成员" }, 403);
				}

				const ADMIN_ROLES = new Set(["owner", "admin", "manager"]);
				const isAdmin = ADMIN_ROLES.has(membership.role);

				if (isAdmin) {
					// Admins can create direct invitations that grant immediate access
					const placeholderEmail = `invite-${randomUUID()}@${INVITATION_PLACEHOLDER_DOMAIN}`;

					const invitation = await (auth.api as any).createInvitation(
						{
							headers: c.req.raw.headers,
							body: {
								email: placeholderEmail,
								role: "member",
								organizationId,
							},
						},
					);

					if (!invitation) {
						return c.json(
							{ error: "Failed to create invitation" },
							500,
						);
					}

					const invitationMetadata: Prisma.JsonObject = {
						placeholderEmailUsed: true,
						linkType: "direct-invite",
						createdByUserId: currentUser.id,
						inviterQuestionnaire: {
							inviteeName: inviterQuestionnaire.inviteeName,
							invitationReason:
								inviterQuestionnaire.invitationReason,
							eligibilityDetails:
								inviterQuestionnaire.eligibilityDetails,
						},
					};

					await db.invitation.update({
						where: { id: invitation.id },
						data: {
							metadata: invitationMetadata,
						},
					});

					const invitationUrl = buildInvitationUrl(invitation.id);

					return c.json({
						success: true,
						mode: "direct",
						invitationUrl,
						invitationId: invitation.id,
					});
				}

				// Non-admin members create referral invitations that require admin approval
				const organization = membership.organization;
				if (!organization) {
					return c.json(
						{ error: "Organization information not found" },
						404,
					);
				}

				const code = nanoid(16);

				const request = await db.organizationInvitationRequest.create({
					data: {
						code,
						organizationId,
						inviterId: currentUser.id,
						inviteeName: inviterQuestionnaire.inviteeName,
						invitationReason: inviterQuestionnaire.invitationReason,
						eligibilityDetails:
							inviterQuestionnaire.eligibilityDetails,
					},
				});

				const invitationPath = `/orgs/${organization.slug}/apply?invited-code=${code}`;
				const invitationUrl = `${getBaseUrl()}${invitationPath}`;

				return c.json({
					success: true,
					mode: "referral",
					invitationUrl,
					invitationPath,
					invitationCode: code,
					requestId: request.id,
				});
			} catch (error) {
				console.error("Error creating member invitation:", error);
				if (error instanceof APIError) {
					const status =
						typeof error.statusCode === "number"
							? error.statusCode
							: typeof error.status === "number"
								? error.status
								: 500;
					return c.json(
						{
							error:
								error.message ||
								"您没有权限为该组织创建邀请链接",
						},
						status as any,
					);
				}

				return c.json({ error: "Failed to create invitation" }, 500);
			}
		},
	);

export const organizationsRouterExtended = organizationsRouter.get(
	"/invitation-requests/:code",
	authMiddleware,
	validator(
		"param",
		z.object({
			code: z.string().min(8).max(32),
		}),
	),
	describeRoute({
		summary: "Get referral invitation details by code",
		tags: ["Organizations", "Members"],
	}),
	async (c) => {
		const { code } = c.req.valid("param");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const request = await db.organizationInvitationRequest.findUnique({
				where: { code },
				include: {
					inviter: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
					application: {
						select: {
							id: true,
							status: true,
							userId: true,
						},
					},
				},
			});

			if (!request) {
				return c.json({ error: "邀请链接无效或已过期" }, 404);
			}

			return c.json({
				request: {
					id: request.id,
					code: request.code,
					status: request.status,
					inviteeName: request.inviteeName,
					invitationReason: request.invitationReason,
					eligibilityDetails: request.eligibilityDetails,
					organization: request.organization,
					inviter: request.inviter,
					applicationId: request.applicationId,
					applicationStatus: request.application?.status ?? null,
				},
			});
		} catch (error) {
			console.error("Error fetching invitation request:", error);
			return c.json({ error: "Failed to fetch invitation request" }, 500);
		}
	},
);
