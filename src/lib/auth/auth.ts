import { config } from "@/config";
import { db, getInvitationById } from "@/lib/database";
import { getUserByEmail } from "@/lib/database";
import type { Locale } from "@/lib/i18n";
import { logger } from "@/lib/logs";
import { sendEmail } from "@/lib/mail";
import { getBaseUrl } from "@/lib/utils";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
	admin,
	createAuthMiddleware,
	magicLink,
	openAPI,
	organization,
	phoneNumber,
	twoFactor,
	username,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { parse as parseCookies } from "cookie";
import { nanoid } from "nanoid";
import { updateSeatsInOrganizationSubscription } from "./lib/organization";
import { isPlaceholderInvitationEmail } from "./invitations";
import { invitationOnlyPlugin } from "./plugins/invitation-only";
import { wechatOAuth } from "./plugins/wechat-oauth-plugin";

const getLocaleFromRequest = (request?: Request) => {
	const cookies = parseCookies(request?.headers.get("cookie") ?? "");
	return (
		(cookies[config.i18n.localeCookieName] as Locale) ??
		config.i18n.defaultLocale
	);
};

const appUrl = getBaseUrl();

export const auth = betterAuth({
	baseURL: appUrl,
	trustedOrigins: [
		appUrl,
		...(process.env.TRUSTED_ORIGINS?.split(",") || []),
	].filter(Boolean),
	appName: config.appName,
	// 添加登录成功和失败的重定向处理
	successRedirectTo: async (context: any) => {
		// 检查是否有来自活动页面的 redirectTo 参数
		const searchParams = new URLSearchParams(context.searchParams || "");
		const redirectTo = searchParams.get("redirectTo");

		// 🔧 微信登录后检查是否需要绑定手机号
		// 检查当前登录方式是否为微信（通过 providerId 判断）
		const isWeChatLogin =
			context.user?.accounts?.some((acc: any) =>
				acc.providerId?.startsWith("wechat-"),
			) || context.account?.providerId?.startsWith("wechat-");

		if (isWeChatLogin) {
			// 如果是微信登录，检查用户是否已绑定手机号
			const user = await db.user.findUnique({
				where: { id: context.user?.id || context.userId },
				select: {
					phoneNumber: true,
					phoneNumberVerified: true,
				},
			});

			// 如果未绑定手机号或手机号未验证，引导到绑定页面
			if (!user?.phoneNumber || !user?.phoneNumberVerified) {
				const bindPhoneUrl = redirectTo
					? `/auth/bind-phone?redirectTo=${encodeURIComponent(redirectTo)}`
					: "/auth/bind-phone";
				return bindPhoneUrl;
			}
		}

		// 如果有 redirectTo 参数，跳转到指定页面
		if (redirectTo) {
			return redirectTo;
		}

		// 默认跳转到应用首页
		return config.auth.redirectAfterSignIn;
	},
	errorRedirectTo: (context: any) => {
		// 检查是否有来自活动页面的 redirectTo 参数
		const searchParams = new URLSearchParams(context.searchParams || "");
		const redirectTo = searchParams.get("redirectTo");

		// 如果有 redirectTo 参数，说明用户是从某个页面跳转到登录页的
		// 登录失败时应该回到登录页，而不是活动页面
		if (redirectTo) {
			// 保留 redirectTo 参数，让用户可以重新登录
			return `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;
		}

		// 默认回到登录页
		return "/auth/login";
	},
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	session: {
		expiresIn: config.auth.sessionCookieMaxAge,
		freshAge: 0,
		cookieCache: {
			enabled: true,
			maxAge: config.auth.sessionCookieMaxAge,
		},
	},
	account: {
		accountLinking: {
			enabled: true, // 启用账户链接以支持微信多端登录绑定
			trustedProviders: ["wechat-pc", "wechat-mobile"], // 微信 PC 和移动端相互信任
			allowDifferentEmails: true, // 🔧 关键配置：允许不同邮箱地址的账户关联
			updateUserInfoOnLink: false, // 关联时不更新用户信息，保持原有信息
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/organization/accept-invitation")) {
				const { invitationId } = ctx.body;

				if (!invitationId) {
					return;
				}

				const invitation = await getInvitationById(invitationId);

				if (!invitation) {
					return;
				}

				await updateSeatsInOrganizationSubscription(
					invitation.organizationId,
				);
			} else if (ctx.path.startsWith("/organization/remove-member")) {
				const { organizationId } = ctx.body;

				if (!organizationId) {
					return;
				}

				await updateSeatsInOrganizationSubscription(organizationId);
			}
		}),
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user, context) => {
					// 🔧 检查微信账户关联 - 如果存在相同 unionId 的用户，阻止创建新用户
					logger.info(
						"[WECHAT_AUTH] User creation hook - checking for account linking opportunity",
					);

					// 🔧 检查手机号用户是否已存在
					if (
						user.phoneNumber &&
						typeof user.phoneNumber === "string"
					) {
						logger.info(
							`[PHONE_AUTH] Checking for existing user with phone number: ${user.phoneNumber}`,
						);

						try {
							const existingUser = await db.user.findUnique({
								where: { phoneNumber: user.phoneNumber },
								select: {
									id: true,
									email: true,
									phoneNumberVerified: true,
								},
							});

							if (existingUser) {
								logger.info(
									`[PHONE_AUTH] Found existing user ${existingUser.id} with phone number, should reuse instead of creating new user`,
								);
								// Better Auth 应该自动处理重复手机号登录，但这里添加日志记录
							}
						} catch (error) {
							logger.warn(
								`[PHONE_AUTH] Error checking existing phone number: ${error}`,
							);
						}
					}
				},
				after: async (user) => {
					// 使用nanoid生成短的、唯一的用户名
					logger.info(
						`[USERNAME_DEBUG] Generating unique username for user ${user.id}`,
					);

					try {
						let username = "";
						let isUnique = false;
						let attempts = 0;
						const maxAttempts = 10;

						// 使用nanoid生成唯一的短用户名
						while (!isUnique && attempts < maxAttempts) {
							// 生成8位的nanoid，使用URL安全字符
							username = nanoid(8);

							// 检查用户名是否已存在
							const existingUser = await db.user.findUnique({
								where: { username },
								select: { id: true },
							});

							if (!existingUser) {
								isUnique = true;
							}
							attempts++;
						}

						if (!isUnique) {
							// 如果多次尝试都不成功，使用更长的nanoid确保唯一性
							username = `u${nanoid(10)}`;
							logger.warn(
								`Failed to generate unique 8-char username after ${maxAttempts} attempts, using longer fallback: ${username}`,
							);
						}

						// 更新用户的用户名
						await db.user.update({
							where: { id: user.id },
							data: { username },
						});

						logger.info(
							`Set username to '${username}' for user ${user.id}`,
						);
					} catch (error) {
						logger.error(
							`Error setting username for user ${user.id}:`,
							error,
						);
					}
				},
			},
		},
		account: {
			create: {
				before: async (account, context) => {
					// 🔧 微信账户关联逻辑：检查是否存在相同 unionId 的用户来关联账户
					if (
						account.providerId?.startsWith("wechat-") &&
						account.accountId
					) {
						logger.info(
							`[WECHAT_AUTH] Checking for account linking with unionId: ${account.accountId}`,
						);

						try {
							// 查找是否存在相同 unionId 的现有用户
							const existingUser = await db.user.findFirst({
								where: {
									wechatUnionId: account.accountId,
								},
								include: {
									accounts: {
										where: {
											providerId: {
												startsWith: "wechat-",
											},
										},
									},
								},
							});

							if (existingUser) {
								logger.info(
									`[WECHAT_AUTH] Found existing user ${existingUser.id} with same unionId, linking account`,
								);

								// 保存原始用户 ID
								const originalUserId = account.userId;

								// 关联到现有用户
								account.userId = existingUser.id;

								// 🔧 修复：不在 before 钩子中删除用户，因为 Better Auth 后续流程仍需要用户对象
								// 改为在 after 钩子中异步清理重复用户
								if (originalUserId !== existingUser.id) {
									// 将需要删除的用户 ID 存储在 context 中，供 after 钩子使用
									(context as any)._duplicateUserIdToDelete =
										originalUserId;
									logger.info(
										`[WECHAT_AUTH] Marked duplicate user ${originalUserId} for deletion after account creation`,
									);
								}

								return;
							}

							// 如果没有找到现有用户，为新用户设置 wechatUnionId
							await db.user.update({
								where: { id: account.userId },
								data: { wechatUnionId: account.accountId },
							});
							logger.info(
								`[WECHAT_AUTH] Set wechatUnionId for new user: ${account.userId}`,
							);
						} catch (error) {
							logger.warn(
								`[WECHAT_AUTH] Error in account linking: ${error}`,
							);
						}
					}
				},
				after: async (account, context) => {
					// 🔧 清理在 before 钩子中标记的重复用户
					const duplicateUserId = (context as any)
						._duplicateUserIdToDelete;
					if (duplicateUserId) {
						try {
							// 延迟删除，确保 Better Auth 的 session 创建流程已完成
							setTimeout(async () => {
								try {
									await db.user.delete({
										where: { id: duplicateUserId },
									});
									logger.info(
										`[WECHAT_AUTH] Deleted duplicate user ${duplicateUserId}`,
									);
								} catch (error) {
									logger.warn(
										`[WECHAT_AUTH] Could not delete duplicate user: ${error}`,
									);
								}
							}, 1000);
						} catch (error) {
							logger.warn(
								`[WECHAT_AUTH] Error scheduling duplicate user deletion: ${error}`,
							);
						}
					}
				},
			},
		},
	},
	user: {
		additionalFields: {
			username: {
				type: "string",
				required: false,
			},
			onboardingComplete: {
				type: "boolean",
				required: false,
			},
			locale: {
				type: "string",
				required: false,
			},
			bio: {
				type: "string",
				required: false,
			},
			userRoleString: {
				type: "string",
				required: false,
			},
			whatICanOffer: {
				type: "string",
				required: false,
			},
			whatIAmLookingFor: {
				type: "string",
				required: false,
			},
			skills: {
				type: "string[]",
				required: false,
			},
			// Level system fields
			membershipLevel: {
				type: "string",
				required: false,
			},
			creatorLevel: {
				type: "string",
				required: false,
			},
			mentorLevel: {
				type: "string",
				required: false,
			},
			contributorLevel: {
				type: "string",
				required: false,
			},
			// 🔧 添加微信相关字段
			wechatId: {
				type: "string",
				required: false,
			},
			wechatOpenId: {
				type: "string",
				required: false,
			},
			wechatUnionId: {
				type: "string",
				required: false,
			},
			preferredContact: {
				type: "string",
				required: false,
			},
			// 手机号字段（自定义API实现，非Better Auth插件）
			phoneNumber: {
				type: "string",
				required: false,
			},
			phoneNumberVerified: {
				type: "boolean",
				required: false,
			},
			pendingInvitationId: {
				type: "string",
				required: false,
			},
			// 角色字段用于权限管理
			role: {
				type: "string",
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailVerification: async (
				{ user, newEmail, url },
				request,
			) => {
				const locale = getLocaleFromRequest(request);

				// 为邮箱变更验证URL添加自定义回调参数
				const verificationUrl = new URL(url);
				const callbackUrl = `${getBaseUrl()}/auth/email-verified`;
				verificationUrl.searchParams.set("callbackURL", callbackUrl);

				await sendEmail({
					to: newEmail,
					templateId: "emailVerification",
					context: {
						url: verificationUrl.toString(),
						name: user.name,
					},
					locale,
				});
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		// If signup is disabled, the only way to sign up is via an invitation. So in this case we can auto sign in the user, as the email is already verified by the invitation.
		// If signup is enabled, we can't auto sign in the user, as the email is not verified yet.
		autoSignIn: !config.auth.enableSignup,
		// Enable email verification for security - users must verify their email before signing in
		requireEmailVerification: config.auth.enableSignup,
		sendResetPassword: async ({ user, url }, request) => {
			const locale = getLocaleFromRequest(request);
			await sendEmail({
				to: user.email,
				templateId: "forgotPassword",
				context: {
					url,
					name: user.name,
				},
				locale,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: config.auth.enableSignup,
		sendVerificationEmail: async (
			{ user: { email, name }, url },
			request,
		) => {
			const locale = getLocaleFromRequest(request);

			// 为验证URL添加自定义回调参数，指向邮箱验证成功页面
			const verificationUrl = new URL(url);
			const callbackUrl = `${getBaseUrl()}/auth/email-verified`;
			verificationUrl.searchParams.set("callbackURL", callbackUrl);

			await sendEmail({
				to: email,
				templateId: "emailVerification",
				context: {
					url: verificationUrl.toString(),
					name,
				},
				locale,
			});
		},
	},
	// socialProviders: {
	// 	已移除 Google 和 GitHub 登录
	// },
	plugins: [
		admin(),
		passkey(),
		magicLink({
			disableSignUp: true,
			sendMagicLink: async ({ email, url }, request) => {
				const locale = getLocaleFromRequest(request);
				await sendEmail({
					to: email,
					templateId: "magicLink",
					context: {
						url,
					},
					locale,
				});
			},
		}),
		organization({
			schema: {
				organization: {
					additionalFields: {
						logo: {
							type: "string",
							required: false,
						},
						summary: {
							type: "string",
							required: false,
						},
						description: {
							type: "string",
							required: false,
						},
						location: {
							type: "string",
							required: false,
						},
						tags: {
							type: "string[]",
							required: false,
						},
						audienceQrCode: {
							type: "string",
							required: false,
						},
						memberQrCode: {
							type: "string",
							required: false,
						},
						contactInfo: {
							type: "string",
							required: false,
						},
						coverImage: {
							type: "string",
							required: false,
						},
						isPublic: {
							type: "boolean",
							required: false,
						},
						membershipRequirements: {
							type: "string",
							required: false,
						},
					},
				},
				invitation: {
					additionalFields: {
						targetUserId: {
							type: "string",
							required: false,
						},
					},
				},
			},
			sendInvitationEmail: async (
				{ email, id, organization },
				request,
			) => {
				const locale = getLocaleFromRequest(request);
				const existingUser = await getUserByEmail(email);

				const url = new URL(
					existingUser ? "/auth/login" : "/auth/signup",
					getBaseUrl(),
				);

				url.searchParams.set("invitationId", id);
				url.searchParams.set("email", email);

				// Invitations generated without a target email use a placeholder domain and should not trigger email sending
				if (!isPlaceholderInvitationEmail(email)) {
					await sendEmail({
						to: email,
						templateId: "organizationInvitation",
						locale,
						context: {
							organizationName: organization.name,
							url: url.toString(),
						},
					});
				}
			},
		}),
		openAPI(),
		invitationOnlyPlugin(),
		twoFactor(),
		username(), // 允许用户使用用户名而不是邮箱登录
		// 手机号验证插件 - 替代自定义实现
		phoneNumber({
			sendOTP: async ({ phoneNumber, code }, request) => {
				const { sendVerificationCodeSMS } = await import(
					"@/lib/sms/tencent-sms"
				);
				const result = await sendVerificationCodeSMS(phoneNumber, code);
				if (!result.success) {
					throw new Error(result.message || "发送验证码失败");
				}
			},
			sendPasswordResetOTP: async ({ phoneNumber, code }, request) => {
				const { sendVerificationCodeSMS } = await import(
					"@/lib/sms/tencent-sms"
				);
				const result = await sendVerificationCodeSMS(phoneNumber, code);
				if (!result.success) {
					throw new Error(result.message || "发送验证码失败");
				}
			},
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => {
					// 使用手机号确保唯一性，加上时间戳防止冲突
					const timestamp = Date.now();
					const cleanPhone = phoneNumber.replace("+", "");
					return `${cleanPhone}_${timestamp}@sms.hackathonweekly.com`;
				},
				getTempName: (phoneNumber) => `用户${phoneNumber.slice(-4)}`,
			},
			phoneNumberValidator: async (phoneNumber) => {
				const { validateFullPhoneNumber } = await import(
					"@/lib/utils/phone-validation"
				);
				const { normalizePhoneNumber } = await import(
					"@/lib/utils/phone-format"
				);
				const normalizedPhone = normalizePhoneNumber(phoneNumber);
				const validation = validateFullPhoneNumber(normalizedPhone);
				return validation.isValid;
			},
			otpLength: 6,
			expiresIn: 300, // 5 minutes
			allowedAttempts: 3,
			requireVerification: false, // 允许未验证手机号登录，以支持重复登录场景
			callbackOnVerification: async ({ phoneNumber, user }, request) => {
				logger.info(
					`Phone number ${phoneNumber} verified for user ${user.id}`,
				);
			},
		}),
		// 微信登录插件
		...(process.env.WECHAT_WEBSITE_APP_ID &&
		process.env.WECHAT_WEBSITE_APP_SECRET
			? [wechatOAuth()]
			: []),
	],
	onAPIError: {
		onError(error, ctx) {
			// 🔧 处理数据库唯一性约束错误
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "P2002" &&
				"meta" in error &&
				error.meta &&
				typeof error.meta === "object" &&
				"target" in error.meta &&
				Array.isArray(error.meta.target)
			) {
				const prismaError = error as any;

				// 微信 UnionId 冲突
				if (error.meta.target.includes("wechatUnionId")) {
					logger.warn(
						`[WECHAT_AUTH] Database constraint violation for wechatUnionId: ${prismaError.meta.target}`,
					);
					return;
				}

				// 邮箱冲突 - 手机号登录时临时邮箱重复
				if (error.meta.target.includes("email")) {
					logger.warn(
						`[PHONE_AUTH] Email constraint violation during phone auth, likely duplicate temp email: ${prismaError.meta.target}`,
					);
					return;
				}
			}

			// 🔧 处理状态不匹配错误（State Mismatch）
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				typeof error.message === "string" &&
				error.message.includes("State Mismatch")
			) {
				logger.warn(
					"[WECHAT_AUTH] OAuth state mismatch error, likely expired session or invalid request",
					{ ctx },
				);
				return;
			}

			// 默认错误处理
			logger.error(error, { ctx });
		},
	},
});

export * from "./lib/organization";

export type Session = typeof auth.$Infer.Session;

// Manually define User type with additional fields to fix Better Auth type inference
export type User = {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	image?: string | null;
	// Additional fields from auth configuration
	username?: string | null;
	onboardingComplete?: boolean | null;
	locale?: string | null;
	bio?: string | null;
	userRoleString?: string | null;
	whatICanOffer?: string | null;
	whatIAmLookingFor?: string | null;
	skills?: string[] | null;
	membershipLevel?: string | null;
	creatorLevel?: string | null;
	mentorLevel?: string | null;
	contributorLevel?: string | null;
	wechatId?: string | null;
	wechatOpenId?: string | null;
	wechatUnionId?: string | null;
	preferredContact?: string | null;
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
	pendingInvitationId?: string | null;
	role?: string | null;
	twoFactorEnabled: boolean;
	// Additional Better Auth fields - using Session type inferred fields
	banned: boolean;
	// Additional fields that might be required by some components
	displayUsername?: string | null;
	[key: string]: any; // Add index signature for compatibility
};

// Helper type to transform null to undefined for optional fields
type NullToUndefined<T> = T extends null | undefined ? undefined : T;

type TransformNullableFields<T> = {
	[K in keyof T]: NullToUndefined<T[K]>;
};

export type ActiveOrganization =
	| TransformNullableFields<
			NonNullable<
				Awaited<ReturnType<typeof auth.api.getFullOrganization>>
			>
	  >
	| any; // Temporary workaround for Better Auth type inference issue

export type Organization = typeof auth.$Infer.Organization | any; // Temporary workaround

export type OrganizationMemberRole =
	| ActiveOrganization["members"][number]["role"]
	| string;

export type OrganizationInvitationStatus =
	| typeof auth.$Infer.Invitation.status
	| string; // Temporary workaround

export type OrganizationMetadata = Record<string, unknown> | undefined;
