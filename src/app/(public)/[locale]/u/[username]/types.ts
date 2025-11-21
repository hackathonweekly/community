import { getLifeStatusLabel as getLifeStatusLabelUtil } from "@/lib/utils/life-status";
import { config } from "@/config";

export interface UserFunctionalRoleAssignment {
	id: string;
	roleType: "system" | "custom";
	status: "ACTIVE" | "UPCOMING" | "HISTORICAL" | "INACTIVE";
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	functionalRole: {
		id: string;
		name: string;
		description: string;
		applicableScope: string | null;
		organizationId?: string | null;
	};
	organization: {
		id: string;
		name: string;
		slug: string;
	} | null;
}

export interface ContactAvailability {
	email: boolean;
	phone: boolean;
	wechat: boolean;
}

export interface UserProfile {
	id: string;
	name: string | null;
	email: string | null;
	username: string | null;
	image: string | null;
	bio: string | null;
	region: string | null;
	phoneNumber: string | null;
	gender: string | null;
	userRoleString: string | null;
	currentWorkOn: string | null;
	skills: string[];
	whatICanOffer: string | null;
	whatIAmLookingFor: string | null;
	lifeStatus: string | null;
	lastProfileUpdate: Date | null;
	githubUrl: string | null;
	twitterUrl: string | null;
	websiteUrl: string | null;
	wechatId: string | null;
	wechatQrCode: string | null;
	profilePublic: boolean;
	showEmail: boolean;
	showWechat: boolean;
	canViewContacts: boolean;
	contactAvailability: ContactAvailability;
	cpValue: number | null;
	joinedAt: Date | null;
	profileViews: number;
	membershipLevel: string | null;
	creatorLevel: string | null;
	mentorLevel: string | null;
	contributorLevel: string | null;
	projects: any[];
	members: any[];
	events: any[];
	userBadges: any[];
	certificates: any[];
	functionalRoles: UserFunctionalRoleAssignment[];
	isFollowed: boolean;
	isMutualFollow: boolean;
	isLiked: boolean;
	sharedEvents: any[];
}

export const eventStatusColors = {
	DRAFT: "bg-gray-100 text-gray-800",
	PUBLISHED: "bg-blue-100 text-blue-800",
	CANCELLED: "bg-red-100 text-red-800",
	COMPLETED: "bg-green-100 text-green-800",
};

export const eventStatusLabels = {
	DRAFT: "草稿",
	PUBLISHED: "已发布",
	CANCELLED: "已取消",
	COMPLETED: "已完成",
};

export const getEventStatusLabel = (status: string, t: any) => {
	return (
		t(`userProfile.eventStatus.${status}`) ||
		eventStatusLabels[status as keyof typeof eventStatusLabels] ||
		status
	);
};

export const getBadgeRarityLabel = (rarity: string, t: any) => {
	return t(`badgeRarity.${rarity}`) || rarity;
};

export const getImageUrl = (imageUrl: string | null) => {
	if (!imageUrl) {
		return null;
	}
	if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
		return imageUrl;
	}
	if (imageUrl.startsWith("/")) {
		return imageUrl;
	}
	// 统一从全局 config 读取公开存储端点
	const s3Endpoint = config.storage.endpoints.public;
	return `${s3Endpoint}/${imageUrl}`;
};

export const getRoleDisplayName = (role: string) => {
	const roleMap: Record<string, string> = {
		ADMIN: "组织者",
		OWNER: "管理员",
		MEMBER: "成员",
		admin: "组织者",
		owner: "管理员",
		member: "成员",
	};
	return roleMap[role] || role;
};

export const getLifeStatusLabel = getLifeStatusLabelUtil;

export const formatDate = (date: Date) => {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
	}).format(date);
};
