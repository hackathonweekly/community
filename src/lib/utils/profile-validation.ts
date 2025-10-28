/**
 * 用户资料完整性验证工具
 * 支持必填与推荐字段的统一校验和提示
 */

export type ProfileFieldKey =
	| "name"
	| "phoneNumber"
	| "email"
	| "bio"
	| "userRoleString"
	| "currentWorkOn"
	| "lifeStatus"
	| "wechatId"
	| "skills"
	| "whatICanOffer"
	| "whatIAmLookingFor";

export type ProfileSectionId =
	| "essential-info"
	| "role-info"
	| "resource-matching"
	| "skills";

interface ProfileRequirementDefinition {
	key: ProfileFieldKey;
	label: string;
	sectionId: ProfileSectionId;
	isSatisfied: (user: UserForValidation) => boolean;
}

export interface ProfileRequirementStatus extends ProfileRequirementDefinition {
	isComplete: boolean;
}

export interface UserProfileValidation {
	isComplete: boolean;
	missingFields: string[];
	missingCount: number;
	completedCount: number;
	totalRequiredFields: number;
	completionPercentage: number;
	requiredFields: ProfileRequirementStatus[];
	recommendedFields: ProfileRequirementStatus[];
	missingRecommendedFields: string[];
}

export interface UserForValidation {
	name?: string | null;
	phoneNumber?: string | null;
	email?: string | null;
	bio?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
	lifeStatus?: string | null;
	wechatId?: string | null;
	skills?: string[] | null;
	whatICanOffer?: string | null;
	whatIAmLookingFor?: string | null;
}

const stringFilled = (value?: string | null) =>
	!!value && value.trim().length > 0;

const arrayFilled = (value?: string[] | null) =>
	Array.isArray(value) && value.length > 0;

const REQUIRED_PROFILE_FIELDS: ProfileRequirementDefinition[] = [
	{
		key: "name",
		label: "姓名",
		sectionId: "essential-info",
		isSatisfied: (user) => stringFilled(user.name),
	},
	{
		key: "phoneNumber",
		label: "手机号",
		sectionId: "essential-info",
		isSatisfied: (user) => stringFilled(user.phoneNumber),
	},
	{
		key: "email",
		label: "邮箱",
		sectionId: "essential-info",
		isSatisfied: (user) => stringFilled(user.email),
	},
	{
		key: "bio",
		label: "个人简介",
		sectionId: "role-info",
		isSatisfied: (user) => stringFilled(user.bio),
	},
	{
		key: "userRoleString",
		label: "主要角色",
		sectionId: "role-info",
		isSatisfied: (user) => stringFilled(user.userRoleString),
	},
	{
		key: "currentWorkOn",
		label: "当前在做",
		sectionId: "role-info",
		isSatisfied: (user) => stringFilled(user.currentWorkOn),
	},
	{
		key: "lifeStatus",
		label: "当前状态",
		sectionId: "role-info",
		isSatisfied: (user) => stringFilled(user.lifeStatus),
	},
];

const RECOMMENDED_PROFILE_FIELDS: ProfileRequirementDefinition[] = [
	{
		key: "wechatId",
		label: "微信号",
		sectionId: "essential-info",
		isSatisfied: (user) => stringFilled(user.wechatId),
	},
	{
		key: "skills",
		label: "技能标签",
		sectionId: "skills",
		isSatisfied: (user) => arrayFilled(user.skills),
	},
	{
		key: "whatICanOffer",
		label: "可以提供的帮助",
		sectionId: "resource-matching",
		isSatisfied: (user) => stringFilled(user.whatICanOffer),
	},
	{
		key: "whatIAmLookingFor",
		label: "寻找什么",
		sectionId: "resource-matching",
		isSatisfied: (user) => stringFilled(user.whatIAmLookingFor),
	},
];

function evaluateRequirements(
	user: UserForValidation,
	definitions: ProfileRequirementDefinition[],
): ProfileRequirementStatus[] {
	return definitions.map((definition) => ({
		...definition,
		isComplete: definition.isSatisfied(user),
	}));
}

function buildProfileValidation(
	user: UserForValidation,
): UserProfileValidation {
	const requiredFields = evaluateRequirements(user, REQUIRED_PROFILE_FIELDS);
	const recommendedFields = evaluateRequirements(
		user,
		RECOMMENDED_PROFILE_FIELDS,
	);

	const missingRequired = requiredFields.filter((field) => !field.isComplete);
	const missingRecommended = recommendedFields.filter(
		(field) => !field.isComplete,
	);

	const totalRequiredFields = requiredFields.length;
	const completedRequiredFields =
		totalRequiredFields - missingRequired.length;
	const completionPercentage =
		totalRequiredFields === 0
			? 100
			: Math.round((completedRequiredFields / totalRequiredFields) * 100);

	return {
		isComplete: missingRequired.length === 0,
		missingFields: missingRequired.map((field) => field.label),
		missingCount: missingRequired.length,
		completedCount: completedRequiredFields,
		totalRequiredFields,
		completionPercentage,
		requiredFields,
		recommendedFields,
		missingRecommendedFields: missingRecommended.map(
			(field) => field.label,
		),
	};
}

/**
 * 获取必填字段缺失列表（字符串形式，兼容旧调用方）
 */
export function getMissingProfileFields(user: UserForValidation): string[] {
	return buildProfileValidation(user).missingFields;
}

/**
 * 获取推荐字段缺失列表
 */
export function getMissingRecommendedProfileFields(
	user: UserForValidation,
): string[] {
	return buildProfileValidation(user).missingRecommendedFields;
}

/**
 * 检查用户是否具备申请组织的基本条件
 * 必填字段包含：姓名、手机号、邮箱、个人简介、主要角色、当前在做、当前状态
 */
export function validateProfileForOrganizationApplication(
	user: UserForValidation,
): UserProfileValidation {
	return buildProfileValidation(user);
}

/**
 * 检查用户核心资料是否完整
 */
export function validateCoreProfile(
	user: UserForValidation,
): UserProfileValidation {
	return buildProfileValidation(user);
}

/**
 * 生成用户友好的资料完善提示消息
 */
export function getProfileCompletionMessage(
	validation: UserProfileValidation,
): {
	title: string;
	description: string;
	actionText: string;
} {
	const hasRecommendedGaps =
		validation.missingRecommendedFields &&
		validation.missingRecommendedFields.length > 0;

	if (validation.isComplete) {
		return {
			title: "资料已完善",
			description: hasRecommendedGaps
				? `必填项已完成，建议补充：${validation.missingRecommendedFields
						.slice(0, 3)
						.join("、")}${
						validation.missingRecommendedFields.length > 3
							? "等"
							: ""
					}`
				: "您的资料信息已完整，可以正常申请加入组织或参与活动。",
			actionText: hasRecommendedGaps ? "继续完善" : "继续申请",
		};
	}

	if (validation.missingCount === 1) {
		return {
			title: "资料待完善",
			description: `还需要完善 1 项信息：${validation.missingFields[0]}`,
			actionText: "完善资料",
		};
	}

	return {
		title: "资料待完善",
		description: `还需要完善 ${validation.missingCount} 项信息，包括：${validation.missingFields
			.slice(0, 3)
			.join("、")}${validation.missingCount > 3 ? "等" : ""}`,
		actionText: "完善资料",
	};
}
