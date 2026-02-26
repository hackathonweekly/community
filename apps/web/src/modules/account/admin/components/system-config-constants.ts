import { config as appConfig } from "@community/config";
import { RestrictedAction } from "@/features/permissions/visitor-restrictions";

export interface SystemConfig {
	key: string;
	value: any;
	description?: string;
	updatedAt: string;
	updatedBy?: {
		name: string;
		email: string;
	};
}

export interface SiteSettingsConfig {
	site_name: string;
	site_description: string;
	announcement: string;
	maintenance_mode: boolean;
}

export interface AppConfigBooleanEntry {
	path: string;
	label: string;
	section: string;
	value: boolean;
}

export interface VisitorRestrictionOption {
	action: RestrictedAction;
	title: string;
	description: string;
	recommended?: boolean;
}

export interface VisitorRestrictionGroup {
	title: string;
	hint: string;
	actions: RestrictedAction[];
}

export interface CommentConfigEntry {
	key: string;
	label: string;
	description: string;
	type: "boolean" | "number";
	defaultValue: boolean | number;
	suffix?: string;
}

export const APP_CONFIG_SECTION_LABELS: Record<string, string> = {
	auth: "认证",
	contactForm: "联系表单",
	organizations: "组织",
	ui: "界面",
	users: "用户",
};

export const APP_CONFIG_BOOLEAN_ENTRIES: AppConfigBooleanEntry[] = [
	{
		path: "organizations.enable",
		label: "启用组织模块",
		section: "organizations",
		value: appConfig.organizations.enable,
	},
	{
		path: "organizations.hideOrganization",
		label: "隐藏组织入口",
		section: "organizations",
		value: appConfig.organizations.hideOrganization,
	},
	{
		path: "organizations.enableUsersToCreateOrganizations",
		label: "允许用户创建组织",
		section: "organizations",
		value: appConfig.organizations.enableUsersToCreateOrganizations,
	},
	{
		path: "organizations.requireOrganization",
		label: "必须加入组织",
		section: "organizations",
		value: appConfig.organizations.requireOrganization,
	},
	{
		path: "users.enableOnboarding",
		label: "启用用户 Onboarding",
		section: "users",
		value: appConfig.users.enableOnboarding,
	},
	{
		path: "auth.enableSignup",
		label: "允许注册",
		section: "auth",
		value: appConfig.auth.enableSignup,
	},
	{
		path: "auth.enableMagicLink",
		label: "魔法链接登录",
		section: "auth",
		value: appConfig.auth.enableMagicLink,
	},
	{
		path: "auth.enableSocialLogin",
		label: "社交登录",
		section: "auth",
		value: appConfig.auth.enableSocialLogin,
	},
	{
		path: "auth.enablePasskeys",
		label: "Passkey 登录",
		section: "auth",
		value: appConfig.auth.enablePasskeys,
	},
	{
		path: "auth.enablePasswordLogin",
		label: "密码登录",
		section: "auth",
		value: appConfig.auth.enablePasswordLogin,
	},
	{
		path: "auth.enableTwoFactor",
		label: "双重认证",
		section: "auth",
		value: appConfig.auth.enableTwoFactor,
	},
	{
		path: "auth.requirePhoneVerification",
		label: "强制手机验证",
		section: "auth",
		value: appConfig.auth.requirePhoneVerification,
	},
	{
		path: "auth.allowSkipPhoneVerification",
		label: "允许跳过手机验证",
		section: "auth",
		value: appConfig.auth.allowSkipPhoneVerification,
	},
	{
		path: "auth.enablePhoneBinding",
		label: "显示绑定手机号",
		section: "auth",
		value: appConfig.auth.enablePhoneBinding,
	},
	{
		path: "ui.saas.enabled",
		label: "启用 SaaS 仪表盘",
		section: "ui",
		value: appConfig.ui.saas.enabled,
	},
	{
		path: "ui.saas.useSidebarLayout",
		label: "使用侧边栏布局",
		section: "ui",
		value: appConfig.ui.saas.useSidebarLayout,
	},
	{
		path: "ui.public.enabled",
		label: "启用公开页面",
		section: "ui",
		value: appConfig.ui.public.enabled,
	},
	{
		path: "contactForm.enabled",
		label: "启用联系表单",
		section: "contactForm",
		value: appConfig.contactForm.enabled,
	},
];

export const VISITOR_RESTRICTION_OPTIONS: VisitorRestrictionOption[] = [
	{
		action: RestrictedAction.CREATE_COMMENT,
		title: "限制新朋友发表评论",
		description: "仍可浏览评论内容，发布需要成为社区成员。",
		recommended: true,
	},
	{
		action: RestrictedAction.CREATE_PROJECT,
		title: "限制新朋友创建作品",
		description: "避免匿名刷屏，鼓励提交高质量作品。",
		recommended: true,
	},
	{
		action: RestrictedAction.CREATE_ORGANIZATION,
		title: "限制新朋友创建组织",
		description: "仅允许社区成员或更高角色创建组织实体。",
		recommended: true,
	},
	{
		action: RestrictedAction.CREATE_EVENT,
		title: "限制新朋友创建活动",
		description: "如需严格把控活动质量，可限制新朋友直接创建活动。",
		recommended: false,
	},
	{
		action: RestrictedAction.LIKE_PROJECT,
		title: "限制新朋友点赞作品",
		description: "可阻止刷赞行为，通常默认允许。",
		recommended: false,
	},
	{
		action: RestrictedAction.BOOKMARK_PROJECT,
		title: "限制新朋友收藏作品",
		description: "若需驱动注册，可限制收藏功能。",
		recommended: false,
	},
];

export const VISITOR_RESTRICTION_GROUPS: VisitorRestrictionGroup[] = [
	{
		title: "内容创建",
		hint: "控制新朋友发起活动、组织与作品的入口。",
		actions: [
			RestrictedAction.CREATE_EVENT,
			RestrictedAction.CREATE_ORGANIZATION,
			RestrictedAction.CREATE_PROJECT,
		],
	},
	{
		title: "互动与社交",
		hint: "评论、点赞、收藏等互动行为，可用于引导注册。",
		actions: [
			RestrictedAction.CREATE_COMMENT,
			RestrictedAction.LIKE_PROJECT,
			RestrictedAction.BOOKMARK_PROJECT,
		],
	},
];

export const COMMENT_CONFIG_ENTRIES: CommentConfigEntry[] = [
	{
		key: "comments.enabled",
		label: "启用评论功能",
		description: "关闭后全站将隐藏评论区模块。",
		type: "boolean",
		defaultValue: true,
	},
	{
		key: "comments.allow_anonymous",
		label: "允许匿名评论",
		description: "允许未登录或新朋友身份直接发表评论。",
		type: "boolean",
		defaultValue: false,
	},
	{
		key: "comments.max_length",
		label: "评论字数上限",
		description: "超过设定字数时会提示用户精简内容。",
		type: "number",
		defaultValue: 2000,
		suffix: "字",
	},
	{
		key: "comments.rate_limit",
		label: "每分钟评论上限",
		description: "限制单个用户在一分钟内发送的评论数量。",
		type: "number",
		defaultValue: 60,
		suffix: "条",
	},
];

export const COMMENT_CONFIG_KEY_SET = new Set(
	COMMENT_CONFIG_ENTRIES.map((entry) => entry.key),
);

export const COMMENT_CONFIG_SAVING_KEY = "comments_group";

export const DEFAULT_SITE_SETTINGS: SiteSettingsConfig = {
	site_name: "周周黑客松",
	site_description: "连接创新者，共建技术社区",
	announcement: "",
	maintenance_mode: false,
};
