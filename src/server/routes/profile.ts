import { db } from "@/lib/database";
import { ContentType, createContentValidator } from "@/lib/content-moderation";
import { generateUsername, isValidUsername } from "@/lib/utils";
import { PROFILE_LIMITS } from "@/lib/utils/profile-limits";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const updateProfileSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	username: z
		.string()
		.min(2, "Username must be at least 2 characters")
		.max(20, "Username must be less than 20 characters")
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
			"Username can only contain letters, numbers, and underscores. Cannot start or end with underscore.",
		)
		.optional(),
	bio: z
		.string()
		.max(500, "Bio must be less than 500 characters")
		.optional()
		.nullable(),
	region: z.string().optional().nullable(),
	phoneNumber: z
		.string()
		.transform((val) => {
			if (!val) return val;
			const {
				normalizePhoneNumber,
			} = require("@/lib/utils/phone-format");
			return normalizePhoneNumber(val);
		})
		.optional()
		.nullable(),
	gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]).optional(),
	userRoleString: z
		.string()
		.max(PROFILE_LIMITS.userRoleStringMax, "个人角色不能超过7个字")
		.optional()
		.nullable(),
	currentWorkOn: z
		.string()
		.max(PROFILE_LIMITS.currentWorkOnMax, "个人状态不能超过10个字")
		.optional()
		.nullable(),
	skills: z.array(z.string()).optional(),
	whatICanOffer: z.string().optional().nullable(),
	whatIAmLookingFor: z.string().optional().nullable(),
	lifeStatus: z.string().optional().nullable(),
	githubUrl: z
		.string()
		.url("Invalid URL")
		.optional()
		.nullable()
		.or(z.literal("")),
	twitterUrl: z
		.string()
		.url("Invalid URL")
		.optional()
		.nullable()
		.or(z.literal("")),
	websiteUrl: z
		.string()
		.url("Invalid URL")
		.optional()
		.nullable()
		.or(z.literal("")),
	wechatId: z.string().optional().nullable(),
	wechatQrCode: z.string().optional().nullable(),
	// Email field - read-only, changes are ignored in updates
	email: z.string().email().optional(),
	profilePublic: z.boolean().optional(),
	showEmail: z.boolean().optional(),
	showWechat: z.boolean().optional(),
	// 身份验证字段
	realName: z
		.string()
		.max(50, "Real name must be less than 50 characters")
		.optional()
		.nullable(),
	idCard: z
		.string()
		.regex(/^[0-9X]{18}$|^$/, "Invalid ID card format")
		.optional()
		.nullable()
		.or(z.literal("")),
	shippingAddress: z
		.string()
		.max(200, "Shipping address must be less than 200 characters")
		.optional()
		.nullable(),
	shippingName: z
		.string()
		.max(50, "Shipping name must be less than 50 characters")
		.optional()
		.nullable(),
	shippingPhone: z
		.string()
		.regex(
			/^(\+?[1-9]\d{1,14}|1[3-9]\d{9})$|^$/,
			"Invalid phone number format",
		)
		.optional()
		.nullable()
		.or(z.literal("")),
});

const validateProfileContent = createContentValidator({
	name: { type: ContentType.USER_NAME, skipIfEmpty: false },
	bio: { type: ContentType.USER_BIO },
	username: { type: ContentType.USER_USERNAME, skipIfEmpty: false },
	region: { type: ContentType.USER_REGION },
	userRoleString: { type: ContentType.USER_ROLE },
	currentWorkOn: { type: ContentType.USER_CURRENT_WORK },
	whatICanOffer: { type: ContentType.USER_OFFER },
	whatIAmLookingFor: { type: ContentType.USER_LOOKING_FOR },
	lifeStatus: { type: ContentType.USER_LIFE_STATUS },
	wechatId: { type: ContentType.USER_WECHAT_ID },
	realName: { type: ContentType.USER_REAL_NAME },
	idCard: { type: ContentType.USER_ID_CARD },
	shippingName: { type: ContentType.USER_SHIPPING_NAME },
	shippingAddress: { type: ContentType.USER_SHIPPING_ADDRESS },
	shippingPhone: { type: ContentType.USER_SHIPPING_PHONE },
});

export const profileRouter = new Hono()
	.use(authMiddleware)
	.get("/profile/check-username", async (c) => {
		try {
			const { username } = c.req.query();

			if (!username) {
				return c.json({ error: "Username is required" }, 400);
			}

			// Check if username is valid format and not reserved
			if (!isValidUsername(username)) {
				return c.json({
					available: false,
					message: "Invalid username format or reserved username",
				});
			}

			// Check if username is already taken
			const existingUser = await db.user.findFirst({
				where: {
					username: {
						equals: username,
						mode: "insensitive",
					},
				},
			});

			return c.json({
				available: !existingUser,
				message: existingUser
					? "Username is already taken"
					: "Username is available",
			});
		} catch (error) {
			console.error("Error checking username:", error);
			return c.json({ error: "Failed to check username" }, 500);
		}
	})
	.post("/profile/generate-username", async (c) => {
		try {
			const sessionUser = c.get("user");

			// Get current user data to check existing username
			const currentUser = await db.user.findUnique({
				where: { id: sessionUser.id },
				select: {
					id: true,
					name: true,
					username: true,
				},
			});

			if (!currentUser) {
				return c.json({ error: "User not found" }, 404);
			}

			// Check if user already has a username
			if (currentUser.username) {
				return c.json({
					success: true,
					username: currentUser.username,
					message: "Username already exists",
				});
			}

			// Get existing usernames to avoid conflicts
			const existingUsernames = await db.user.findMany({
				where: {
					username: {
						not: null,
					},
				},
				select: {
					username: true,
				},
			});

			const usernameList = existingUsernames
				.map((u) => u.username)
				.filter(Boolean) as string[];

			const generatedUsername = generateUsername(
				currentUser.name,
				usernameList,
			);

			// Update user with generated username
			const updatedUser = await db.user.update({
				where: { id: currentUser.id },
				data: { username: generatedUsername },
			});

			return c.json({
				success: true,
				username: updatedUser.username,
				message: "Username generated successfully",
			});
		} catch (error) {
			console.error("Error generating username:", error);
			return c.json({ error: "Failed to generate username" }, 500);
		}
	})
	.post("/profile/update", async (c) => {
		try {
			const sessionUser = c.get("user");

			const body = await c.req.json();
			const validatedData = updateProfileSchema.parse(body);

			// 内容安全审核
			const moderationResult = await validateProfileContent({
				name: validatedData.name,
				bio: validatedData.bio || undefined,
				username: validatedData.username,
				region: validatedData.region,
				userRoleString: validatedData.userRoleString,
				currentWorkOn: validatedData.currentWorkOn,
				whatICanOffer: validatedData.whatICanOffer,
				whatIAmLookingFor: validatedData.whatIAmLookingFor,
				lifeStatus: validatedData.lifeStatus,
				wechatId: validatedData.wechatId,
				realName: validatedData.realName,
				idCard: validatedData.idCard,
				shippingName: validatedData.shippingName,
				shippingAddress: validatedData.shippingAddress,
				shippingPhone: validatedData.shippingPhone,
			});

			if (!moderationResult.isValid) {
				console.warn("User profile content moderation failed:", {
					userData: {
						name: validatedData.name,
						username: validatedData.username,
					},
					errors: moderationResult.errors,
					userId: sessionUser.id,
				});
				const violationMessage = "发布内容含违规信息，请修改后重试";
				return c.json(
					{
						error: violationMessage,
						message: violationMessage,
						details: moderationResult.errors,
					},
					400,
				);
			}

			// Get current user data with all fields needed for validation
			const currentUser = await db.user.findUnique({
				where: { id: sessionUser.id },
				select: {
					id: true,
					email: true,
					username: true,
					phoneNumber: true,
					idCard: true,
				},
			});

			if (!currentUser) {
				return c.json({ error: "User not found" }, 404);
			}

			// Check if username is valid and not reserved (only if username is provided)
			if (
				validatedData.username &&
				!isValidUsername(validatedData.username)
			) {
				return c.json(
					{
						error: "Invalid username format or reserved username",
					},
					400,
				);
			}

			// Check if username is already taken by another user (only if username is provided)
			if (
				validatedData.username &&
				validatedData.username.toLowerCase() !==
					currentUser.username?.toLowerCase()
			) {
				const existingUser = await db.user.findFirst({
					where: {
						username: {
							equals: validatedData.username,
							mode: "insensitive",
						},
						id: {
							not: currentUser.id,
						},
					},
				});

				if (existingUser) {
					return c.json(
						{
							error: "Username is already taken",
						},
						400,
					);
				}
			}

			// Check if phone number is already taken by another user (only if phone number is provided)
			if (
				validatedData.phoneNumber &&
				validatedData.phoneNumber !== currentUser.phoneNumber
			) {
				const existingUser = await db.user.findFirst({
					where: {
						phoneNumber: validatedData.phoneNumber,
						id: {
							not: currentUser.id,
						},
					},
				});

				if (existingUser) {
					return c.json(
						{
							error: "该手机号已被其他用户使用",
						},
						400,
					);
				}
			}

			const trimmedEmail =
				validatedData.email !== undefined
					? validatedData.email.trim()
					: undefined;
			const normalizedCurrentEmail = currentUser.email.toLowerCase();

			// Check if email is already taken by another user (only if email is provided)
			if (
				trimmedEmail &&
				trimmedEmail.toLowerCase() !== normalizedCurrentEmail
			) {
				const existingEmailUser = await db.user.findFirst({
					where: {
						email: trimmedEmail,
						id: {
							not: currentUser.id,
						},
					},
				});

				if (existingEmailUser) {
					return c.json(
						{
							error: "该邮箱已被其他用户使用",
						},
						400,
					);
				}
			}

			// Build update data object with only provided fields
			const updateData: any = {};

			if (validatedData.name !== undefined) {
				updateData.name = validatedData.name;
			}
			if (validatedData.username !== undefined) {
				updateData.username = validatedData.username;
			}
			if (validatedData.bio !== undefined) {
				updateData.bio = validatedData.bio || null;
			}
			if (validatedData.region !== undefined) {
				updateData.region = validatedData.region || null;
			}
			if (validatedData.phoneNumber !== undefined) {
				updateData.phoneNumber = validatedData.phoneNumber || null;
				// 如果设置手机号为 null（解绑），同时重置验证状态
				if (
					validatedData.phoneNumber === null ||
					validatedData.phoneNumber === ""
				) {
					updateData.phoneNumberVerified = false;
				}
			}
			if (validatedData.gender !== undefined) {
				updateData.gender = validatedData.gender;
			}
			if (validatedData.userRoleString !== undefined) {
				updateData.userRoleString =
					validatedData.userRoleString || null;
			}
			if (validatedData.currentWorkOn !== undefined) {
				updateData.currentWorkOn = validatedData.currentWorkOn || null;
			}
			if (validatedData.skills !== undefined) {
				updateData.skills = validatedData.skills;
			}
			if (validatedData.whatICanOffer !== undefined) {
				updateData.whatICanOffer = validatedData.whatICanOffer || null;
			}
			if (validatedData.whatIAmLookingFor !== undefined) {
				updateData.whatIAmLookingFor =
					validatedData.whatIAmLookingFor || null;
			}
			if (validatedData.lifeStatus !== undefined) {
				updateData.lifeStatus = validatedData.lifeStatus || null;
			}
			if (validatedData.githubUrl !== undefined) {
				updateData.githubUrl = validatedData.githubUrl || null;
			}
			if (validatedData.twitterUrl !== undefined) {
				updateData.twitterUrl = validatedData.twitterUrl || null;
			}
			if (validatedData.websiteUrl !== undefined) {
				updateData.websiteUrl = validatedData.websiteUrl || null;
			}
			if (validatedData.wechatId !== undefined) {
				updateData.wechatId = validatedData.wechatId || null;
			}
			if (validatedData.wechatQrCode !== undefined) {
				updateData.wechatQrCode = validatedData.wechatQrCode || null;
			}
			if (validatedData.email !== undefined) {
				updateData.email = trimmedEmail;
				if (trimmedEmail?.toLowerCase() !== normalizedCurrentEmail) {
					updateData.emailVerified = false;
				}
			}
			if (validatedData.profilePublic !== undefined) {
				updateData.profilePublic = validatedData.profilePublic;
			}
			if (validatedData.showEmail !== undefined) {
				updateData.showEmail = validatedData.showEmail;
			}
			if (validatedData.showWechat !== undefined) {
				updateData.showWechat = validatedData.showWechat;
			}

			// 身份验证字段
			if (validatedData.realName !== undefined) {
				updateData.realName = validatedData.realName || null;
			}
			if (validatedData.idCard !== undefined) {
				updateData.idCard = validatedData.idCard || null;
				// 如果身份证号发生变化，重置验证状态
				if (
					validatedData.idCard &&
					validatedData.idCard !== currentUser?.idCard
				) {
					updateData.idCardVerified = false;
					updateData.identityVerifiedAt = null;
				}
			}
			if (validatedData.shippingAddress !== undefined) {
				updateData.shippingAddress =
					validatedData.shippingAddress || null;
			}
			if (validatedData.shippingName !== undefined) {
				updateData.shippingName = validatedData.shippingName || null;
			}
			if (validatedData.shippingPhone !== undefined) {
				updateData.shippingPhone = validatedData.shippingPhone || null;
			}

			// Update user profile
			const updatedUser = await db.user.update({
				where: {
					id: currentUser.id,
				},
				data: updateData,
			});

			return c.json({
				success: true,
				user: {
					id: updatedUser.id,
					name: updatedUser.name,
					username: updatedUser.username,
					bio: updatedUser.bio,
					region: updatedUser.region,
					email: updatedUser.email,
					emailVerified: updatedUser.emailVerified,
					phoneNumber: updatedUser.phoneNumber,
					gender: updatedUser.gender,
					userRoleString: updatedUser.userRoleString,
					currentWorkOn: updatedUser.currentWorkOn,
					skills: updatedUser.skills,
					whatICanOffer: updatedUser.whatICanOffer,
					whatIAmLookingFor: updatedUser.whatIAmLookingFor,
					lifeStatus: updatedUser.lifeStatus,
					githubUrl: updatedUser.githubUrl,
					twitterUrl: updatedUser.twitterUrl,
					websiteUrl: updatedUser.websiteUrl,
					wechatId: updatedUser.wechatId,
					wechatQrCode: updatedUser.wechatQrCode,
					profilePublic: updatedUser.profilePublic,
					showEmail: updatedUser.showEmail,
					showWechat: updatedUser.showWechat,
					realName: updatedUser.realName,
					idCard: updatedUser.idCard,
					idCardVerified: updatedUser.idCardVerified,
					shippingAddress: updatedUser.shippingAddress,
					shippingName: updatedUser.shippingName,
					shippingPhone: updatedUser.shippingPhone,
					identityVerifiedAt: updatedUser.identityVerifiedAt,
				},
			});
		} catch (error) {
			console.error("Error updating profile:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid data",
						details: error.errors,
					},
					400,
				);
			}

			// Handle Prisma unique constraint errors
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				(error as any).code === "P2002"
			) {
				const prismaError = error as any;
				const target = prismaError.meta?.target;
				if (Array.isArray(target) && target.includes("phoneNumber")) {
					return c.json(
						{
							error: "该手机号已被其他用户使用",
						},
						400,
					);
				}
				if (Array.isArray(target) && target.includes("username")) {
					return c.json(
						{
							error: "用户名已被使用",
						},
						400,
					);
				}
				if (Array.isArray(target) && target.includes("email")) {
					return c.json(
						{
							error: "邮箱已被使用",
						},
						400,
					);
				}
				return c.json(
					{
						error: "数据重复，请检查输入信息",
					},
					400,
				);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/profile", async (c) => {
		try {
			const currentUser = c.get("user");

			const user = await db.user.findUnique({
				where: {
					id: currentUser.id,
				},
				select: {
					id: true,
					name: true,
					email: true,
					emailVerified: true,
					username: true,
					bio: true,
					region: true,
					phoneNumber: true,
					gender: true,
					userRoleString: true,
					currentWorkOn: true,
					skills: true,
					whatICanOffer: true,
					whatIAmLookingFor: true,
					lifeStatus: true,
					githubUrl: true,
					twitterUrl: true,
					websiteUrl: true,
					wechatId: true,
					wechatQrCode: true,
					cpValue: true,
					joinedAt: true,
					profileViews: true,
					profilePublic: true,
					showEmail: true,
					showWechat: true,
					realName: true,
					idCard: true,
					idCardVerified: true,
					shippingAddress: true,
					shippingName: true,
					shippingPhone: true,
					identityVerifiedAt: true,
					// Level system fields
					membershipLevel: true,
					creatorLevel: true,
					mentorLevel: true,
					contributorLevel: true,
				},
			});

			if (!user) {
				return c.json({ error: "User not found" }, 404);
			}

			return c.json({ user });
		} catch (error) {
			console.error("Error fetching profile:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/members", async (c) => {
		try {
			const members = await db.user.findMany({
				where: {
					profilePublic: true, // Only show public profiles
				},
				select: {
					id: true,
					name: true,
					username: true,
					bio: true,
					region: true,
					userRoleString: true,
					currentWorkOn: true,
					skills: true,
					whatICanOffer: true,
					whatIAmLookingFor: true,
					lifeStatus: true,
					githubUrl: true,
					twitterUrl: true,
					websiteUrl: true,
					wechatId: true,
					showEmail: true,
					showWechat: true,
					email: true,
					profileViews: true,
					joinedAt: true,
					// Level system fields
					membershipLevel: true,
					creatorLevel: true,
					mentorLevel: true,
					contributorLevel: true,
					projects: {
						select: {
							id: true,
							title: true,
							stage: true,
							featured: true,
						},
						orderBy: [{ featured: "desc" }, { order: "asc" }],
					},
				},
				orderBy: [{ joinedAt: "desc" }],
			});

			return c.json({ members });
		} catch (error) {
			console.error("Error fetching members:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});
