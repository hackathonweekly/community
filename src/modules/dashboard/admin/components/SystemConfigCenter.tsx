"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { config as appConfig } from "@/config";
import {
	DEFAULT_BETA_BANNER_CONFIG,
	DEFAULT_CONTACT_FORM_CONFIG,
	DEFAULT_CUSTOMER_SERVICE_CONFIG,
} from "@/config/constants";
import type {
	BetaBannerConfig,
	ContactFormConfig,
	CustomerServiceConfig,
} from "@/config/types";
import {
	DEFAULT_VISITOR_RESTRICTIONS,
	RestrictedAction,
	type VisitorRestrictionConfig as VisitorRestrictionsConfig,
} from "@/features/permissions";
import {
	AlertCircle,
	Check,
	CheckCircle,
	Copy,
	RotateCcw,
	Save,
	Shield,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface SystemConfig {
	key: string;
	value: any;
	description?: string;
	updatedAt: string;
	updatedBy?: {
		name: string;
		email: string;
	};
}

interface SiteSettingsConfig {
	site_name: string;
	site_description: string;
	announcement: string;
	maintenance_mode: boolean;
}

interface AppConfigBooleanEntry {
	path: string;
	label: string;
	section: string;
	value: boolean;
}

interface VisitorRestrictionOption {
	action: RestrictedAction;
	title: string;
	description: string;
	recommended?: boolean;
}

interface VisitorRestrictionGroup {
	title: string;
	hint: string;
	actions: RestrictedAction[];
}

interface CommentConfigEntry {
	key: string;
	label: string;
	description: string;
	type: "boolean" | "number";
	defaultValue: boolean | number;
	suffix?: string;
}

const PRIMARY_BETA_LOCALE = "zh" as const;
const PRIMARY_BETA_LOCALE_LABEL = "简体中文";

const APP_CONFIG_SECTION_LABELS: Record<string, string> = {
	auth: "认证",
	contactForm: "联系表单",
	customerService: "客服系统",
	organizations: "组织",
	ui: "界面",
	users: "用户",
};

const APP_CONFIG_BOOLEAN_ENTRIES: AppConfigBooleanEntry[] = [
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
	{
		path: "customerService.enabled",
		label: "启用客服入口",
		section: "customerService",
		value: appConfig.customerService.enabled,
	},
	{
		path: "customerService.aiChat.enabled",
		label: "AI 客服",
		section: "customerService",
		value: appConfig.customerService.aiChat.enabled,
	},
	{
		path: "customerService.community.enabled",
		label: "社区客服",
		section: "customerService",
		value: appConfig.customerService.community.enabled,
	},
	{
		path: "customerService.community.qrCodeUpload",
		label: "客服二维码上传",
		section: "customerService",
		value: appConfig.customerService.community.qrCodeUpload,
	},
	{
		path: "customerService.feedback.enabled",
		label: "启用反馈收集",
		section: "customerService",
		value: appConfig.customerService.feedback.enabled,
	},
	{
		path: "customerService.feedback.docsIntegration",
		label: "文档反馈集成",
		section: "customerService",
		value: appConfig.customerService.feedback.docsIntegration,
	},
];

const VISITOR_RESTRICTION_OPTIONS: VisitorRestrictionOption[] = [
	{
		action: RestrictedAction.CREATE_COMMENT,
		title: "限制新朋友发表评论",
		description: "仍可浏览评论内容，发布需要成为共创伙伴。",
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
		description: "仅允许共创伙伴或更高角色创建组织实体。",
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

const VISITOR_RESTRICTION_GROUPS: VisitorRestrictionGroup[] = [
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

const COMMENT_CONFIG_ENTRIES: CommentConfigEntry[] = [
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

const COMMENT_CONFIG_KEY_SET = new Set(
	COMMENT_CONFIG_ENTRIES.map((entry) => entry.key),
);

const COMMENT_CONFIG_SAVING_KEY = "comments_group";

const DEFAULT_SITE_SETTINGS: SiteSettingsConfig = {
	site_name: "周周黑客松",
	site_description: "连接创新者，共建技术社区",
	announcement: "",
	maintenance_mode: false,
};

export function SystemConfigCenter() {
	const [configs, setConfigs] = useState<SystemConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<string | null>(null);
	const [copiedPath, setCopiedPath] = useState<string | null>(null);
	const [editingConfigs, setEditingConfigs] = useState<Record<string, any>>(
		{},
	);
	const copyResetTimerRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (copyResetTimerRef.current) {
				window.clearTimeout(copyResetTimerRef.current);
			}
		};
	}, []);

	const groupedAppConfigEntries = useMemo(() => {
		return APP_CONFIG_BOOLEAN_ENTRIES.reduce(
			(result, entry) => {
				if (!result[entry.section]) {
					result[entry.section] = [];
				}
				result[entry.section]?.push(entry);
				return result;
			},
			{} as Record<string, AppConfigBooleanEntry[]>,
		);
	}, []);

	const configsMap = useMemo(() => {
		const map = new Map<string, SystemConfig>();
		configs.forEach((config) => {
			map.set(config.key, config);
		});
		return map;
	}, [configs]);

	const buildEditableBetaBannerConfig = (
		value?: BetaBannerConfig,
	): BetaBannerConfig => {
		const defaultLocales = DEFAULT_BETA_BANNER_CONFIG.locales ?? {};
		const mergedLocales = {
			...defaultLocales,
			...(value?.locales ?? {}),
		};
		const primaryLocale = mergedLocales[PRIMARY_BETA_LOCALE] ?? {
			label: defaultLocales[PRIMARY_BETA_LOCALE]?.label ?? "Beta",
			message:
				defaultLocales[PRIMARY_BETA_LOCALE]?.message ??
				"我们正在 Beta 内测阶段，欢迎你的反馈与建议！",
		};

		return {
			enabled: value?.enabled ?? DEFAULT_BETA_BANNER_CONFIG.enabled,
			locales: {
				...mergedLocales,
				[PRIMARY_BETA_LOCALE]: primaryLocale,
			},
		};
	};

	const buildEditableSiteSettingsConfig = (
		value?: SiteSettingsConfig,
	): SiteSettingsConfig => ({
		site_name: value?.site_name ?? DEFAULT_SITE_SETTINGS.site_name,
		site_description:
			value?.site_description ?? DEFAULT_SITE_SETTINGS.site_description,
		announcement: value?.announcement ?? DEFAULT_SITE_SETTINGS.announcement,
		maintenance_mode:
			value?.maintenance_mode ?? DEFAULT_SITE_SETTINGS.maintenance_mode,
	});

	const buildEditableVisitorRestrictionsConfig = (
		value?: VisitorRestrictionsConfig,
	): VisitorRestrictionsConfig => ({
		...DEFAULT_VISITOR_RESTRICTIONS,
		...(value ?? {}),
	});

	const buildEditableContactFormConfig = (
		value?: ContactFormConfig,
	): ContactFormConfig => ({
		...DEFAULT_CONTACT_FORM_CONFIG,
		...(value ?? {}),
	});

	const buildEditableCustomerServiceConfig = (
		value?: CustomerServiceConfig,
	): CustomerServiceConfig => ({
		...DEFAULT_CUSTOMER_SERVICE_CONFIG,
		...value,
		aiChat: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.aiChat,
			...(value?.aiChat ?? {}),
		},
		community: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.community,
			...(value?.community ?? {}),
		},
		feedback: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.feedback,
			...(value?.feedback ?? {}),
		},
	});

	useEffect(() => {
		fetchConfigs();
	}, []);

	const normalizeBetaBannerConfig = (
		serverConfigs: SystemConfig[],
	): SystemConfig[] => {
		const hasBetaBanner = serverConfigs.some(
			(config) => config.key === "beta_banner",
		);
		if (hasBetaBanner) {
			return serverConfigs;
		}

		return [
			...serverConfigs,
			{
				key: "beta_banner",
				value: JSON.parse(
					JSON.stringify(DEFAULT_BETA_BANNER_CONFIG),
				) as BetaBannerConfig,
				description: "Beta 横幅配置",
				updatedAt: new Date().toISOString(),
			},
		];
	};

	const fetchConfigs = async () => {
		try {
			const response = await fetch("/api/super-admin/config");
			if (!response.ok) {
				throw new Error("Failed to fetch system configs");
			}

			const data = await response.json();
			const ensureConfigEntry = (
				configs: SystemConfig[],
				key: string,
				defaultValue: any,
				description: string,
			) => {
				if (configs.some((item) => item.key === key)) {
					return configs;
				}

				return [
					...configs,
					{
						key,
						value: JSON.parse(JSON.stringify(defaultValue)),
						description,
						updatedAt: new Date().toISOString(),
					},
				];
			};

			const normalized = normalizeBetaBannerConfig(data.configs ?? []);
			const withContactForm = ensureConfigEntry(
				normalized,
				"contact_form",
				DEFAULT_CONTACT_FORM_CONFIG,
				"联系表单配置",
			);
			const withCustomerService = ensureConfigEntry(
				withContactForm,
				"customer_service",
				DEFAULT_CUSTOMER_SERVICE_CONFIG,
				"客服系统配置",
			);
			const withCommentConfigs = COMMENT_CONFIG_ENTRIES.reduce(
				(acc, entry) =>
					ensureConfigEntry(
						acc,
						entry.key,
						entry.defaultValue,
						entry.description,
					),
				withCustomerService,
			);
			const sortedConfigs = withCommentConfigs.sort(
				(a: SystemConfig, b: SystemConfig) =>
					a.key.localeCompare(b.key),
			);

			setConfigs(sortedConfigs);

			const initialState: Record<string, any> = {};
			sortedConfigs.forEach((config) => {
				initialState[config.key] = JSON.parse(
					JSON.stringify(config.value ?? null),
				);
			});
			setEditingConfigs(initialState);
		} catch (error) {
			console.error("Failed to fetch configs:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCopyConfigPath = async (path: string) => {
		if (typeof window === "undefined" || !navigator?.clipboard) {
			console.warn("Clipboard API 不可用，无法复制配置路径");
			return;
		}

		try {
			await navigator.clipboard.writeText(path);
			setCopiedPath(path);
			if (copyResetTimerRef.current) {
				window.clearTimeout(copyResetTimerRef.current);
			}
			copyResetTimerRef.current = window.setTimeout(() => {
				setCopiedPath(null);
				copyResetTimerRef.current = null;
			}, 1500);
		} catch (error) {
			console.error("复制配置路径失败:", error);
		}
	};

	const handleSaveConfig = async (key: string) => {
		setSaving(key);

		try {
			const response = await fetch(`/api/super-admin/config/${key}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					value: editingConfigs[key],
					description: `更新${getConfigDisplayName(key)}配置`,
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to save config ${key}`);
			}

			fetchConfigs();
		} catch (error) {
			console.error("Failed to save config:", error);
		} finally {
			setSaving(null);
		}
	};

	const handleResetConfig = (key: string) => {
		const originalConfig = configs.find((config) => config.key === key);
		if (!originalConfig) {
			return;
		}

		setEditingConfigs((prev) => ({
			...prev,
			[key]: JSON.parse(JSON.stringify(originalConfig.value ?? null)),
		}));
	};

	const getConfigDisplayName = (key: string) => {
		const nameMap: Record<string, string> = {
			cp_values: "CP值配置",
			user_levels: "用户等级配置",
			badge_conditions: "勋章条件配置",
			event_settings: "活动设置",
			organization_settings: "组织设置",
			beta_banner: "Beta 横幅",
			site_settings: "站点信息",
			visitor_restrictions: "新朋友权限限制",
			contact_form: "联系表单",
			customer_service: "客服系统",
		};
		return nameMap[key] || key;
	};

	const getConfigDescription = (key: string) => {
		const descMap: Record<string, string> = {
			cp_values: "设置各种贡献行为的CP值奖励",
			user_levels: "定义用户等级晋升所需的CP值",
			badge_conditions: "配置自动勋章的获得条件",
			event_settings: "活动相关的全局设置",
			organization_settings: "组织功能的全局配置",
			beta_banner: "配置 Beta 横幅的开关与多语言文案",
			site_settings: "更新站点名称、简介与维护模式",
			visitor_restrictions:
				"细化新朋友可执行的操作，未勾选的功能默认放开",
			contact_form: "控制联系页面的可用性与邮件目标",
			customer_service: "配置浮动客服入口与社群、反馈等子模块",
		};
		return descMap[key] || "系统配置项";
	};

	const renderConfigMeta = (config: SystemConfig) => {
		const hasMeta = config.updatedAt || config.updatedBy;
		if (!hasMeta) {
			return null;
		}

		return (
			<div className="border-t border-dashed border-border/60 pt-2 text-xs text-muted-foreground">
				{config.updatedAt && (
					<div>
						最后更新：
						{new Date(config.updatedAt).toLocaleString("zh-CN")}
					</div>
				)}
				{config.updatedBy && (
					<div>
						更新人：{config.updatedBy.name} (
						{config.updatedBy.email})
					</div>
				)}
			</div>
		);
	};

	const renderConfigCard = (
		config: SystemConfig,
		hasChanges: boolean,
		body: ReactNode,
		options: { colSpan?: "full" | "half" } = {},
	) => {
		const colSpanClass =
			options.colSpan === "full" ? "col-span-full" : "col-span-1";

		return (
			<div key={config.key} className={`${colSpanClass} min-w-0`}>
				<Card className="border border-border/60 shadow-none">
					<CardHeader className="p-3 pb-2">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle className="text-sm font-semibold tracking-tight">
									{getConfigDisplayName(config.key)}
								</CardTitle>
								<CardDescription className="text-[11px] leading-relaxed">
									{getConfigDescription(config.key)}
								</CardDescription>
							</div>
							<div className="flex flex-col items-end gap-2">
								{hasChanges && (
									<Badge
										variant="outline"
										className="flex items-center gap-1 border-orange-300 bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700"
									>
										<AlertCircle className="h-3 w-3" />
										未保存
									</Badge>
								)}
								<Badge
									variant="secondary"
									className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
								>
									{config.key}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 p-3 pt-1 text-sm leading-relaxed">
						<div className="space-y-2">{body}</div>
						{renderConfigMeta(config)}
						<div className="flex justify-end gap-2 pt-1">
							<Button
								className="bg-green-600 hover:bg-green-700"
								size="sm"
								onClick={() => handleSaveConfig(config.key)}
								disabled={!hasChanges || saving === config.key}
							>
								<Save className="mr-1 h-4 w-4" />
								{saving === config.key
									? "保存中..."
									: "保存配置"}
							</Button>
							{hasChanges && (
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										handleResetConfig(config.key)
									}
								>
									<RotateCcw className="mr-1 h-4 w-4" />
									重置
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	const renderBetaBannerConfig = (config: SystemConfig) => {
		const currentValue = buildEditableBetaBannerConfig(
			editingConfigs[config.key] as BetaBannerConfig,
		);
		const originalValue = buildEditableBetaBannerConfig(config.value);
		const hasChanges =
			JSON.stringify(currentValue) !== JSON.stringify(originalValue);

		const updateEnabled = (enabled: boolean) => {
			setEditingConfigs((prev) => {
				const next = buildEditableBetaBannerConfig(
					prev[config.key] as BetaBannerConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						enabled,
					},
				};
			});
		};

		const updateLocaleField = (
			field: "label" | "message",
			value: string,
		) => {
			setEditingConfigs((prev) => {
				const next = buildEditableBetaBannerConfig(
					prev[config.key] as BetaBannerConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						locales: {
							...next.locales,
							[PRIMARY_BETA_LOCALE]: {
								...next.locales[PRIMARY_BETA_LOCALE],
								[field]: value,
							},
						},
					},
				};
			});
		};

		const body = (
			<>
				<div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
					<div className="space-y-1">
						<p className="text-sm font-medium">启用 Beta 横幅</p>
						<p className="text-[11px] text-muted-foreground">
							关闭后将不会展示顶部提示，并恢复页面高度。
						</p>
					</div>
					<Switch
						checked={currentValue.enabled}
						onCheckedChange={updateEnabled}
					/>
				</div>

				<div className="space-y-2 rounded-md border border-border/50 bg-background p-3">
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-medium">
							{PRIMARY_BETA_LOCALE_LABEL}
						</p>
						<Badge
							variant="outline"
							className="font-mono text-[10px]"
						>
							{PRIMARY_BETA_LOCALE}
						</Badge>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							标题
						</label>
						<Input
							value={
								currentValue.locales[PRIMARY_BETA_LOCALE]
									?.label ?? "Beta"
							}
							onChange={(event) =>
								updateLocaleField("label", event.target.value)
							}
							placeholder="例如：Beta"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							提示文案
						</label>
						<Textarea
							value={
								currentValue.locales[PRIMARY_BETA_LOCALE]
									?.message ??
								"我们正在 Beta 内测阶段，欢迎你的反馈与建议！"
							}
							onChange={(event) =>
								updateLocaleField("message", event.target.value)
							}
							rows={3}
							className="font-mono text-xs"
							placeholder="请输入要展示的提示文案"
						/>
					</div>
				</div>

				<p className="text-[11px] leading-relaxed text-muted-foreground">
					提示：保存后几分钟内对所有访客生效；修改文案会重新展示横幅。
				</p>
			</>
		);

		return renderConfigCard(config, hasChanges, body, { colSpan: "full" });
	};

	const renderVisitorRestrictionsConfig = (config: SystemConfig) => {
		const currentValue = buildEditableVisitorRestrictionsConfig(
			editingConfigs[config.key] as VisitorRestrictionsConfig,
		);
		const originalValue = buildEditableVisitorRestrictionsConfig(
			config.value as VisitorRestrictionsConfig,
		);
		const hasChanges =
			JSON.stringify(currentValue) !== JSON.stringify(originalValue);
		const restrictedCount =
			Object.values(currentValue).filter(Boolean).length;

		const optionMap = VISITOR_RESTRICTION_OPTIONS.reduce(
			(acc, option) => {
				acc[option.action] = option;
				return acc;
			},
			{} as Partial<Record<RestrictedAction, VisitorRestrictionOption>>,
		);

		const updateRestriction = (
			action: RestrictedAction,
			restricted: boolean,
		) => {
			setEditingConfigs((prev) => {
				const next = buildEditableVisitorRestrictionsConfig(
					prev[config.key] as VisitorRestrictionsConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						[action]: restricted,
					},
				};
			});
		};

		const body = (
			<>
				<div className="flex items-start justify-between gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
					<div className="flex items-start gap-2">
						<Shield className="mt-0.5 h-4 w-4 text-blue-600" />
						<div className="space-y-1">
							<p className="text-sm font-medium">
								新朋友默认限制
							</p>
							<p className="text-[11px] text-muted-foreground">
								限制勾选后，新朋友将看到引导提示，需升级为共创伙伴才能继续操作。
							</p>
						</div>
					</div>
					<Badge variant="outline" className="font-mono text-[11px]">
						限制 {restrictedCount}
					</Badge>
				</div>

				<div className="space-y-2.5">
					{VISITOR_RESTRICTION_GROUPS.map((group) => {
						const items = group.actions
							.map((action) => optionMap[action])
							.filter(Boolean) as VisitorRestrictionOption[];
						const restrictedInGroup = items.filter(
							(item) => currentValue[item.action],
						).length;

						if (items.length === 0) {
							return null;
						}

						return (
							<div
								key={group.title}
								className="space-y-1.5 rounded-md border border-border/60 bg-background/70 p-2.5"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-0.5">
										<p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
											{group.title}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{group.hint}
										</p>
									</div>
									<Badge
										variant="outline"
										className="font-mono text-[10px]"
									>
										已限制 {restrictedInGroup}/
										{items.length}
									</Badge>
								</div>

								<div className="space-y-1.5">
									{items.map((option) => {
										const restricted =
											currentValue[option.action];
										return (
											<div
												key={option.action}
												className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-background px-3 py-2"
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<p className="text-sm font-medium">
															{option.title}
														</p>
														{option.recommended && (
															<Badge
																variant="secondary"
																className="px-1.5 py-0.5 text-[10px]"
															>
																推荐
															</Badge>
														)}
													</div>
													<p className="text-[11px] leading-relaxed text-muted-foreground">
														{option.description}
													</p>
												</div>
												<Switch
													checked={restricted}
													disabled={
														saving === config.key
													}
													onCheckedChange={(value) =>
														updateRestriction(
															option.action,
															value,
														)
													}
												/>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				<p className="text-[11px] leading-relaxed text-muted-foreground">
					提示：限制开启后，相关 API 会返回 403
					并附带引导消息，前端可结合自定义提示提升转化。
				</p>
			</>
		);

		return renderConfigCard(config, hasChanges, body, { colSpan: "full" });
	};

	const renderContactFormConfig = (config: SystemConfig) => {
		const currentValue = buildEditableContactFormConfig(
			editingConfigs[config.key] as ContactFormConfig,
		);
		const originalValue = buildEditableContactFormConfig(
			config.value as ContactFormConfig,
		);
		const hasChanges =
			JSON.stringify(currentValue) !== JSON.stringify(originalValue);

		const updateField = <K extends keyof ContactFormConfig>(
			field: K,
			value: ContactFormConfig[K],
		) => {
			setEditingConfigs((prev) => {
				const next = buildEditableContactFormConfig(
					prev[config.key] as ContactFormConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						[field]: value,
					},
				};
			});
		};

		const body = (
			<>
				<div className="space-y-3">
					<div className="flex items-start justify-between gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">联系页面入口</p>
							<p className="text-[11px] text-muted-foreground">
								关闭后 /contact 将自动跳转首页。
							</p>
						</div>
						<Switch
							checked={currentValue.enabled}
							disabled={saving === config.key}
							onCheckedChange={(checked) =>
								updateField("enabled", checked)
							}
						/>
					</div>

					<div className="grid gap-2.5">
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								收件邮箱
							</label>
							<Input
								value={currentValue.to}
								onChange={(event) =>
									updateField("to", event.target.value)
								}
								placeholder="contact@example.com"
							/>
							<p className="text-[11px] text-muted-foreground">
								营销站联系表单会发送到此邮箱。
							</p>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								邮件主题
							</label>
							<Input
								value={currentValue.subject}
								onChange={(event) =>
									updateField("subject", event.target.value)
								}
								placeholder="Contact form message"
							/>
							<p className="text-[11px] text-muted-foreground">
								修改后立即生效，建议包含品牌名称。
							</p>
						</div>
					</div>
				</div>
			</>
		);

		return renderConfigCard(config, hasChanges, body, { colSpan: "full" });
	};

	const renderSiteSettingsConfig = (config: SystemConfig) => {
		const currentValue = buildEditableSiteSettingsConfig(
			editingConfigs[config.key] as SiteSettingsConfig,
		);
		const originalValue = buildEditableSiteSettingsConfig(config.value);
		const hasChanges =
			JSON.stringify(currentValue) !== JSON.stringify(originalValue);

		const updateField = <K extends keyof SiteSettingsConfig>(
			field: K,
			value: SiteSettingsConfig[K],
		) => {
			setEditingConfigs((prev) => {
				const next = buildEditableSiteSettingsConfig(
					prev[config.key] as SiteSettingsConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						[field]: value,
					},
				};
			});
		};

		const body = (
			<>
				<div className="grid gap-3">
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							站点名称
						</label>
						<Input
							value={currentValue.site_name}
							onChange={(event) =>
								updateField("site_name", event.target.value)
							}
							placeholder="请输入站点名称"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							站点简介
						</label>
						<Textarea
							value={currentValue.site_description}
							onChange={(event) =>
								updateField(
									"site_description",
									event.target.value,
								)
							}
							rows={3}
							placeholder="展示在公开页面的简短介绍"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							公告
						</label>
						<Textarea
							value={currentValue.announcement}
							onChange={(event) =>
								updateField("announcement", event.target.value)
							}
							rows={3}
							placeholder="可选提醒，将展示在站点显眼位置"
						/>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
					<div className="space-y-1">
						<p className="text-sm font-medium">维护模式</p>
						<p className="text-xs text-muted-foreground">
							开启后只有管理员可以访问站点内容。
						</p>
					</div>
					<Switch
						checked={currentValue.maintenance_mode}
						onCheckedChange={(checked) =>
							updateField("maintenance_mode", checked)
						}
					/>
				</div>
			</>
		);

		return renderConfigCard(config, hasChanges, body, { colSpan: "full" });
	};

	const renderCustomerServiceConfig = (config: SystemConfig) => {
		const currentValue = buildEditableCustomerServiceConfig(
			editingConfigs[config.key] as CustomerServiceConfig,
		);
		const originalValue = buildEditableCustomerServiceConfig(
			config.value as CustomerServiceConfig,
		);
		const hasChanges =
			JSON.stringify(currentValue) !== JSON.stringify(originalValue);

		const updateRoot = (value: Partial<CustomerServiceConfig>) => {
			setEditingConfigs((prev) => {
				const next = buildEditableCustomerServiceConfig(
					prev[config.key] as CustomerServiceConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						...value,
					},
				};
			});
		};

		const updateNested = <
			Section extends "aiChat" | "community" | "feedback",
			Field extends keyof CustomerServiceConfig[Section],
		>(
			section: Section,
			field: Field,
			value: CustomerServiceConfig[Section][Field],
		) => {
			setEditingConfigs((prev) => {
				const next = buildEditableCustomerServiceConfig(
					prev[config.key] as CustomerServiceConfig,
				);
				return {
					...prev,
					[config.key]: {
						...next,
						[section]: {
							...next[section],
							[field]: value,
						},
					},
				};
			});
		};

		const body = (
			<>
				<div className="flex items-start justify-between gap-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
					<div className="space-y-1">
						<p className="text-sm font-medium">客服入口浮标</p>
						<p className="text-[11px] text-muted-foreground">
							关闭后隐藏浮动按钮与快捷入口。
						</p>
					</div>
					<Switch
						checked={currentValue.enabled}
						disabled={saving === config.key}
						onCheckedChange={(checked) =>
							updateRoot({ enabled: checked })
						}
					/>
				</div>

				<div className="grid gap-2.5">
					<div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-background px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">社群入口</p>
							<p className="text-[11px] text-muted-foreground">
								显示二维码、客服联系方式等社群信息。
							</p>
						</div>
						<Switch
							checked={currentValue.community.enabled}
							disabled={saving === config.key}
							onCheckedChange={(checked) =>
								updateNested("community", "enabled", checked)
							}
						/>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-background px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">
								允许上传社群二维码
							</p>
							<p className="text-[11px] text-muted-foreground">
								用于后台上传新的社群二维码资源。
							</p>
						</div>
						<Switch
							checked={currentValue.community.qrCodeUpload}
							disabled={
								!currentValue.community.enabled ||
								saving === config.key
							}
							onCheckedChange={(checked) =>
								updateNested(
									"community",
									"qrCodeUpload",
									checked,
								)
							}
						/>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-background px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">反馈中心</p>
							<p className="text-[11px] text-muted-foreground">
								开启后保留反馈链接，关闭则仅保留社群。
							</p>
						</div>
						<Switch
							checked={currentValue.feedback.enabled}
							disabled={saving === config.key}
							onCheckedChange={(checked) =>
								updateNested("feedback", "enabled", checked)
							}
						/>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-background px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">文档反馈入口</p>
							<p className="text-[11px] text-muted-foreground">
								展示帮助文档快捷入口，适合知识库同步。
							</p>
						</div>
						<Switch
							checked={currentValue.feedback.docsIntegration}
							disabled={
								!currentValue.feedback.enabled ||
								saving === config.key
							}
							onCheckedChange={(checked) =>
								updateNested(
									"feedback",
									"docsIntegration",
									checked,
								)
							}
						/>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-background px-3 py-2">
						<div className="space-y-1">
							<p className="text-sm font-medium">
								AI 客服（预留）
							</p>
							<p className="text-[11px] text-muted-foreground">
								暂未开放，提前控制聚合入口状态。
							</p>
						</div>
						<Switch
							checked={currentValue.aiChat.enabled}
							disabled={saving === config.key}
							onCheckedChange={(checked) =>
								updateNested("aiChat", "enabled", checked)
							}
						/>
					</div>
				</div>

				<p className="text-[11px] leading-relaxed text-muted-foreground">
					提示：客服设置会直接影响浮动按钮内容，修改后刷新页面即可看到效果。
				</p>
			</>
		);

		return renderConfigCard(config, hasChanges, body, { colSpan: "full" });
	};

	const renderDefaultConfig = (config: SystemConfig) => {
		const value = editingConfigs[config.key];
		const hasChanges =
			JSON.stringify(value) !== JSON.stringify(config.value);

		if (typeof value === "boolean") {
			const body = (
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							{value ? "当前已启用" : "当前已禁用"}
						</p>
						<p className="text-[11px] text-muted-foreground">
							切换开关即可即时更新该配置，无需手动编辑 JSON。
						</p>
					</div>
					<Switch
						checked={value}
						onCheckedChange={(checked) =>
							setEditingConfigs((prev) => ({
								...prev,
								[config.key]: checked,
							}))
						}
					/>
				</div>
			);

			return renderConfigCard(config, hasChanges, body);
		}

		const body = (
			<>
				<div className="space-y-2">
					<label className="text-xs font-medium text-muted-foreground">
						配置内容
					</label>
					<Textarea
						value={
							typeof value === "string"
								? value
								: JSON.stringify(value, null, 2)
						}
						onChange={(event) => {
							const raw = event.target.value;
							try {
								const parsed = JSON.parse(raw);
								setEditingConfigs((prev) => ({
									...prev,
									[config.key]: parsed,
								}));
							} catch {
								setEditingConfigs((prev) => ({
									...prev,
									[config.key]: raw,
								}));
							}
						}}
						className="font-mono text-xs min-h-[96px]"
						placeholder="输入 JSON 格式的配置..."
					/>
				</div>
				<p className="text-xs text-muted-foreground">
					保持 JSON 格式以便后端解析。
				</p>
			</>
		);

		return renderConfigCard(config, hasChanges, body);
	};

	const renderConfigEditor = (config: SystemConfig) => {
		if (config.key === "beta_banner") {
			return renderBetaBannerConfig(config);
		}

		if (config.key === "site_settings") {
			return renderSiteSettingsConfig(config);
		}

		if (config.key === "visitor_restrictions") {
			return renderVisitorRestrictionsConfig(config);
		}

		if (config.key === "contact_form") {
			return renderContactFormConfig(config);
		}

		if (config.key === "customer_service") {
			return renderCustomerServiceConfig(config);
		}

		return renderDefaultConfig(config);
	};

	const renderCommentConfigCard = () => {
		const items = COMMENT_CONFIG_ENTRIES.map((entry) => {
			const config = configsMap.get(entry.key);
			const fallbackValue = entry.defaultValue;
			const rawOriginal = config?.value ?? fallbackValue;
			const normalizedOriginal =
				entry.type === "boolean"
					? typeof rawOriginal === "boolean"
						? rawOriginal
						: rawOriginal === undefined
							? Boolean(fallbackValue)
							: String(rawOriginal) === "true"
					: typeof rawOriginal === "number"
						? rawOriginal
						: (() => {
								const parsed = Number(
									rawOriginal ?? fallbackValue,
								);
								return Number.isNaN(parsed)
									? Number(fallbackValue)
									: parsed;
							})();
			const editingValue = editingConfigs[entry.key];

			let current: boolean | number | "" = normalizedOriginal;

			if (entry.type === "boolean") {
				if (typeof editingValue === "boolean") {
					current = editingValue;
				} else if (editingValue === undefined) {
					current = normalizedOriginal;
				} else {
					current = Boolean(editingValue);
				}
			} else {
				if (editingValue === "" || editingValue === null) {
					current = "";
				} else if (typeof editingValue === "number") {
					current = editingValue;
				} else if (editingValue === undefined) {
					current = normalizedOriginal;
				} else {
					const parsed = Number(editingValue);
					current = Number.isNaN(parsed) ? "" : parsed;
				}
			}

			return {
				entry,
				config,
				original: normalizedOriginal as boolean | number,
				current,
			};
		});

		const hasChanges = items.some((item) => {
			if (item.entry.type === "boolean") {
				return item.current !== item.original;
			}
			if (item.current === "") {
				return true;
			}
			return item.current !== item.original;
		});

		const hasInvalidNumber = items.some(
			(item) => item.entry.type === "number" && item.current === "",
		);
		const isSaving = saving === COMMENT_CONFIG_SAVING_KEY;

		const latestConfig = items
			.map((item) => item.config)
			.filter((config): config is SystemConfig =>
				Boolean(config?.updatedAt || config?.updatedBy),
			)
			.sort((a, b) => {
				const aTime = a?.updatedAt
					? new Date(a.updatedAt).getTime()
					: 0;
				const bTime = b?.updatedAt
					? new Date(b.updatedAt).getTime()
					: 0;
				return bTime - aTime;
			})[0];

		const updateBoolean = (key: string, value: boolean) => {
			setEditingConfigs((prev) => ({
				...prev,
				[key]: value,
			}));
		};

		const updateNumber = (key: string, rawValue: string) => {
			if (rawValue === "") {
				setEditingConfigs((prev) => ({
					...prev,
					[key]: "",
				}));
				return;
			}

			const parsed = Number(rawValue);
			if (Number.isNaN(parsed)) {
				return;
			}

			setEditingConfigs((prev) => ({
				...prev,
				[key]: parsed,
			}));
		};

		const handleSaveCommentConfigs = async () => {
			if (!hasChanges || hasInvalidNumber) {
				return;
			}

			const targets = items.filter((item) => {
				if (item.entry.type === "boolean") {
					return item.current !== item.original;
				}
				if (item.current === "") {
					return false;
				}
				return item.current !== item.original;
			});

			if (targets.length === 0) {
				return;
			}

			setSaving(COMMENT_CONFIG_SAVING_KEY);

			try {
				for (const target of targets) {
					const valueToSave =
						target.entry.type === "number"
							? Number(target.current)
							: target.current;
					const response = await fetch(
						`/api/super-admin/config/${target.entry.key}`,
						{
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								value: valueToSave,
								description: target.entry.description,
							}),
						},
					);

					if (!response.ok) {
						throw new Error(
							`Failed to save comment config ${target.entry.key}`,
						);
					}
				}

				fetchConfigs();
			} catch (error) {
				console.error("Failed to save comment configs:", error);
			} finally {
				setSaving(null);
			}
		};

		const handleResetCommentConfigs = () => {
			setEditingConfigs((prev) => {
				const next = { ...prev };
				items.forEach((item) => {
					next[item.entry.key] = item.original;
				});
				return next;
			});
		};

		return (
			<div
				key={COMMENT_CONFIG_SAVING_KEY}
				className="col-span-full min-w-0"
			>
				<Card className="border border-border/60 shadow-none">
					<CardHeader className="p-3 pb-2">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle className="text-sm font-semibold tracking-tight">
									评论系统
								</CardTitle>
								<CardDescription className="text-[11px] leading-relaxed">
									统一管理评论模块开关与限制，保存后立即生效。
								</CardDescription>
							</div>
							<div className="flex flex-col items-end gap-2">
								{hasChanges && (
									<Badge
										variant="outline"
										className="flex items-center gap-1 border-orange-300 bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700"
									>
										<AlertCircle className="h-3 w-3" />
										未保存
									</Badge>
								)}
								<Badge
									variant="secondary"
									className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
								>
									comments.*
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 p-3 pt-1 text-sm leading-relaxed">
						<div className="space-y-2.5">
							{items.map((item) => (
								<div
									key={item.entry.key}
									className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
								>
									<div className="space-y-1">
										<p className="text-sm font-medium">
											{item.entry.label}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{item.entry.description}
										</p>
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
											{item.entry.key}
										</p>
									</div>
									<div className="flex items-center gap-1.5">
										{item.entry.type === "boolean" ? (
											<Switch
												checked={Boolean(item.current)}
												onCheckedChange={(checked) =>
													updateBoolean(
														item.entry.key,
														checked,
													)
												}
												disabled={isSaving}
											/>
										) : (
											<div className="flex items-center gap-1.5">
												<Input
													type="number"
													inputMode="numeric"
													className={`w-24 text-right text-sm ${
														item.current === ""
															? "border-orange-300 focus-visible:ring-orange-400"
															: ""
													}`}
													value={
														item.current === ""
															? ""
															: String(
																	item.current,
																)
													}
													onChange={(event) =>
														updateNumber(
															item.entry.key,
															event.target.value,
														)
													}
													disabled={isSaving}
												/>
												{item.entry.suffix && (
													<span className="text-xs text-muted-foreground">
														{item.entry.suffix}
													</span>
												)}
											</div>
										)}
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() =>
												handleCopyConfigPath(
													item.entry.key,
												)
											}
											disabled={isSaving}
											title="复制配置路径"
										>
											{copiedPath === item.entry.key ? (
												<Check className="h-3.5 w-3.5 text-green-600" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
										</Button>
									</div>
								</div>
							))}
						</div>

						{latestConfig?.updatedAt && (
							<div className="border-t border-dashed border-border/60 pt-2 text-xs text-muted-foreground">
								<div>
									最后更新：
									{new Date(
										latestConfig.updatedAt,
									).toLocaleString("zh-CN")}
								</div>
								{latestConfig.updatedBy && (
									<div>
										更新人：
										{latestConfig.updatedBy.name} (
										{latestConfig.updatedBy.email})
									</div>
								)}
							</div>
						)}

						<div className="flex justify-end gap-2 pt-1">
							<Button
								className="bg-green-600 hover:bg-green-700"
								size="sm"
								onClick={handleSaveCommentConfigs}
								disabled={
									!hasChanges || hasInvalidNumber || isSaving
								}
							>
								<Save className="mr-1 h-4 w-4" />
								{isSaving ? "保存中..." : "保存全部"}
							</Button>
							{hasChanges && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleResetCommentConfigs}
									disabled={isSaving}
								>
									<RotateCcw className="mr-1 h-4 w-4" />
									重置
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	const renderConfigGrid = () => {
		if (configs.length === 0) {
			return (
				<Card className="col-span-full border border-dashed border-border/60 bg-muted/20 shadow-none">
					<CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
						暂无系统配置
					</CardContent>
				</Card>
			);
		}

		const nodes: ReactNode[] = [];
		let commentCardInserted = false;

		configs.forEach((config) => {
			if (COMMENT_CONFIG_KEY_SET.has(config.key)) {
				if (!commentCardInserted) {
					const card = renderCommentConfigCard();
					if (card) {
						nodes.push(card);
						commentCardInserted = true;
					}
				}
				return;
			}

			const element = renderConfigEditor(config);
			if (element) {
				nodes.push(element);
			}
		});

		if (!commentCardInserted) {
			const card = renderCommentConfigCard();
			if (card) {
				nodes.push(card);
			}
		}

		return nodes;
	};

	const renderAppConfigOverview = () => {
		const sections = Object.entries(groupedAppConfigEntries);
		if (sections.length === 0) {
			return null;
		}

		return (
			<Card className="border border-border/60 bg-background shadow-none">
				<CardHeader className="p-3 pb-2">
					<div className="flex items-start justify-between gap-3">
						<div className="space-y-1">
							<CardTitle className="text-sm font-semibold tracking-tight">
								代码配置参考
							</CardTitle>
							<CardDescription className="text-[11px] leading-relaxed">
								来自 src/config/index.ts
								的布尔开关，当前为只读，方便评估迁移到系统配置。
							</CardDescription>
						</div>
						<Badge
							variant="outline"
							className="px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
						>
							code
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 p-3 pt-1">
					{sections.map(([section, entries]) => {
						const sortedEntries = [...entries].sort((a, b) =>
							a.path.localeCompare(b.path),
						);
						const sectionLabel =
							APP_CONFIG_SECTION_LABELS[section] || section;

						return (
							<div
								key={section}
								className="space-y-2 rounded-md border border-dashed border-border/60 bg-muted/10 p-3"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-semibold text-foreground/90">
										{sectionLabel}
									</p>
									<Badge
										variant="secondary"
										className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
									>
										{section}
									</Badge>
								</div>
								<div className="space-y-2.5">
									{sortedEntries.map((entry) => (
										<div
											key={entry.path}
											className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
										>
											<div className="space-y-0.5">
												<p className="text-sm font-medium">
													{entry.label}
												</p>
												<p className="font-mono text-[11px] text-muted-foreground">
													{entry.path}
												</p>
											</div>
											<div className="flex items-center gap-1.5">
												<Switch
													checked={entry.value}
													disabled
													aria-label={entry.label}
												/>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7"
													onClick={() =>
														handleCopyConfigPath(
															entry.path,
														)
													}
													title="复制配置路径"
												>
													{copiedPath ===
													entry.path ? (
														<Check className="h-3.5 w-3.5 text-green-600" />
													) : (
														<Copy className="h-3.5 w-3.5" />
													)}
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-4 p-4 md:p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">
						系统配置
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						管理系统全局配置参数
					</p>
				</div>
				<Badge
					variant="outline"
					className="flex items-center gap-1 rounded-full border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] text-green-700"
				>
					<CheckCircle className="h-3 w-3" /> 系统正常运行
				</Badge>
			</div>

			<Card className="border border-dashed border-border/60 bg-muted/20 shadow-none">
				<CardContent className="flex items-start gap-2.5 p-3 text-[13px] leading-relaxed text-muted-foreground">
					<AlertCircle className="h-5 w-5 text-blue-600" />
					<div className="space-y-1">
						<p>
							修改系统配置会即时生效，请在低峰期操作并确认格式正确。
						</p>
						<p>
							推荐优先使用开关与表单控件，减少手动调整 JSON
							带来的风险。
						</p>
					</div>
				</CardContent>
			</Card>

			{loading ? (
				<div className="grid gap-3 md:grid-cols-2">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={index}
							className="col-span-1 h-32 animate-pulse rounded-lg border border-dashed border-border/40 bg-muted/30"
						/>
					))}
				</div>
			) : (
				<div className="grid gap-3 md:grid-cols-2">
					{renderConfigGrid()}
				</div>
			)}

			{renderAppConfigOverview()}
		</div>
	);
}
