import type { Config } from "./types";

export const config = {
	appName: "HackathonWeekly",
	// 国际化设置
	i18n: {
		// 是否启用多语言支持（关闭后仍需指定默认语言）
		enabled: true,
		// 应用支持的语言列表配置
		// 需要为每个语言指定显示名称和对应的货币单位
		locales: {
			zh: {
				currency: "CNY",
				label: "简体中文",
			},
			en: {
				currency: "USD",
				label: "English",
			},
		},
		// 未提供语言参数时使用的语言
		defaultLocale: "zh",
		// 价格展示时未指定货币的默认选项
		defaultCurrency: "CNY",
		// 用于存储语言偏好的 Cookie 键名
		localeCookieName: "NEXT_LOCALE",
	},
	// 组织管理
	organizations: {
		// 全局组织功能开关
		enable: true,
		// 是否对用户隐藏组织信息（多租户场景使用）
		hideOrganization: false,
		// 允许普通用户创建组织（关闭后仅管理员可创建）
		enableUsersToCreateOrganizations: true,
		// 强制用户必须加入组织（登录后自动跳转到组织页）
		requireOrganization: false,
		// 组织标识符黑名单，防止与路由路径冲突
		// 需包含 /app/... 下的所有一级路由以及品牌保护名称
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"HackathonWeekly",
			"WeeklyHackathon",
			"hackweek",
			"01mvp",
			"settings",
			"ai-demo",
			"organization-invitation",
		],
	},
	// 用户设置
	users: {
		// 新用户注册后是否展示引导流程
		enableOnboarding: false,
	},
	// 身份验证
	auth: {
		// 允许用户自主注册（关闭后仅管理员可创建账户）
		enableSignup: true,
		// 支持魔法链接登录方式
		enableMagicLink: true,
		// 支持第三方社交平台登录
		enableSocialLogin: true,
		// 支持通行密钥（Passkey）登录
		enablePasskeys: true,
		// 支持传统密码登录
		enablePasswordLogin: true,
		// 允许用户启用双因素认证
		enableTwoFactor: true,
		// 手机验证相关设置
		// 强制非短信登录用户完成手机绑定（如 OAuth 微信登录等）
		requirePhoneVerification: false,
		// 允许跳过手机验证（仅当 requirePhoneVerification 为 true 时生效）
		allowSkipPhoneVerification: true,
		// 在设置页面显示手机绑定选项（即使非强制）
		enablePhoneBinding: true,
		// 登录成功后的跳转路径
		redirectAfterSignIn: "/app",
		// 退出登录后的跳转路径
		redirectAfterLogout: "/auth/login",
		// 会话有效期（秒）
		sessionCookieMaxAge: 60 * 60 * 24 * 30,
	},
	// 邮件配置
	mails: {
		// 发送邮件的发件人地址
		from: "noreply@HackathonWeekly.com",
	},
	// 前端界面
	ui: {
		// 可用的主题模式列表
		enabledThemes: ["light", "dark"],
		// 默认主题模式
		defaultTheme: "light",
		// 应用功能区配置
		saas: {
			// 启用应用功能区（关闭时所有路由重定向到公开页面）
			enabled: true,
			// 使用侧边栏布局
			useSidebarLayout: true,
		},
		// 公开页面配置
		public: {
			// 启用公开页面功能（关闭时所有路由重定向到应用功能区）
			enabled: true,
		},
	},
	// 文件存储
	storage: {
		// 各用途的存储桶名称定义
		bucketNames: {
			public: process.env.NEXT_PUBLIC_BUCKET_NAME ?? "public",
		},
		// 直接访问文件的服务端点
		endpoints: {
			public: process.env.NEXT_PUBLIC_S3_ENDPOINT ?? "",
		},
	},
	// 联系表单
	contactForm: {
		// 启用联系表单功能
		enabled: true,
		// 表单提交内容发送到的邮箱
		to: "contact@hackathonweekly.com",
		// 邮件主题行
		subject: "Contact form message from HackathonWeekly.com Contact Form",
	},
	// 权限控制
	permissions: {
		visitor: {
			// L0 级别访客可发表评论
			allowComments: true,
			// L0 级别访客可创建活动
			allowEventCreation: true,
			// L0 级别访客可创建组织
			allowOrganizationCreation: false,
		},
	},
	// 客户服务系统（页面右下角组件）
	customerService: {
		// 启用客户服务功能
		enabled: true,
		// AI 聊天助手（预留未来实现）
		aiChat: {
			enabled: false,
			provider: "openai" as const,
		},
		// 社区服务配置
		community: {
			enabled: true,
			qrCodeUpload: true,
		},
		// 反馈系统配置
		feedback: {
			enabled: true,
			docsIntegration: true,
		},
	},
	// Payments - Focused on event ticketing
	// Subscription billing features have been removed
	payments: {
		// Payment providers configuration
		// Stripe and WeChat Pay are available for event ticket sales
		providers: {
			stripe: {
				enabled: true,
			},
			wechatpay: {
				enabled: true,
			},
		},
	},
} as const satisfies Config;

export type { Config };
