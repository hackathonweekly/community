import { getLifeStatusLabel as getLifeStatusLabelUtil } from "@community/lib-shared/utils/life-status";
import { config } from "@community/config";

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
	projects: any[];
	members: any[];
	userBadges: any[];
	certificates: any[];
	isFollowed: boolean;
	isMutualFollow: boolean;
	isLiked: boolean;
}

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
