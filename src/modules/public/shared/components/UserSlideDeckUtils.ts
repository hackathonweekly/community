import type { SlideDeckUser, SlideDeckWork } from "./UserSlideDeck";
import { getLifeStatusLabel } from "@/lib/utils/life-status";

// 通用的用户数据接口
interface BaseUser {
	id: string;
	name: string;
	username?: string | null;
	image?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
	bio?: string | null;
	region?: string | null;
	skills?: string[] | null;
	whatICanOffer?: string | null;
	whatIAmLookingFor?: string | null;
	lifeStatus?: string | null;
	cpValue?: number | null;
	profileViews?: number | null;
	joinedAt?: Date | null;
	showEmail?: boolean;
	email?: string | null;
	showWechat?: boolean;
	wechatId?: string | null;
	githubUrl?: string | null;
	twitterUrl?: string | null;
	websiteUrl?: string | null;
}

// 项目数据接口
interface BaseProject {
	id: string;
	title: string;
	subtitle?: string | null;
	description?: string | null;
	projectTags?: string[];
	url?: string | null;
}

// 项目提交数据接口（用于活动参与者）
export interface ProjectSubmission {
	id: string;
	title: string;
	description: string;
	project: {
		id: string;
		title: string;
		subtitle?: string;
		description?: string;
		screenshots: string[];
		stage: string;
		projectTags: string[];
		url?: string;
		user: {
			id: string;
			name: string;
			image?: string;
			username?: string;
			userRoleString?: string;
		};
		_count: {
			likes: number;
			bookmarks: number;
			members: number;
		};
	};
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
		userRoleString?: string;
	};
}

// 参与者数据接口（用于活动参与者列表）
export interface ParticipantUser extends BaseUser {
	// 签到状态
	checkedIn?: boolean;
}

// 完整用户数据接口（用于个人主页）
export interface ProfileUser extends BaseUser {
	projects?: BaseProject[];
	wechatQrCode?: string | null;
	isFollowed?: boolean;
	isMutualFollow?: boolean;
	wechatInfo?: {
		wechatId?: string | null;
		wechatQrCode?: string | null;
	} | null;
}

// 处理图片URL的工具函数
import { config } from "@/config";

function getImageUrl(imageUrl: string | null | undefined): string | null {
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
}

// 格式化日期的工具函数
function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
	}).format(date);
}

// 生成链接标签的工具函数
function linkLabel(url: string): string {
	return url
		.replace(/^https?:\/\//i, "")
		.replace(/^www\./i, "")
		.replace(/\/$/, "");
}

// 为活动参与者创建 SlideDeckUser 对象
export function createParticipantSlideDeckUser(
	participant: ParticipantUser,
	projectSubmissions: ProjectSubmission[] = [],
): SlideDeckUser {
	const highlights: string[] = [];
	if (participant.userRoleString) {
		highlights.push(participant.userRoleString);
	}
	if (participant.lifeStatus) {
		highlights.push(
			getLifeStatusLabel(participant.lifeStatus) ||
				participant.lifeStatus,
		);
	}

	// 处理项目提交数据 - 使用更复杂的项目结构
	const userSubmissions = projectSubmissions.filter(
		(submission) => submission.user.id === participant.id,
	);
	const works: SlideDeckWork[] = userSubmissions
		.slice(0, 2)
		.map((submission) => {
			const { project } = submission;
			const summarySource =
				project.subtitle ||
				project.description ||
				submission.description;
			return {
				id: project.id,
				title: project.title,
				summary: summarySource,
				tags: project.projectTags?.slice(0, 3) ?? [],
				url: project.url || `/projects/${project.id}`,
			};
		});

	// 统计信息 - 优先显示重要信息，限制到前3个
	const stats: SlideDeckUser["stats"] = [];
	if (works.length > 0) {
		stats.push({ label: "作品提交", value: works.length });
	}
	if (typeof participant.cpValue === "number" && participant.cpValue > 0) {
		stats.push({ label: "CP 值", value: participant.cpValue });
	}
	// 浏览次数和加入时间相对不重要，只在前面数据不足时显示
	if (
		stats.length < 3 &&
		typeof participant.profileViews === "number" &&
		participant.profileViews > 0
	) {
		stats.push({ label: "浏览", value: participant.profileViews });
	}

	// 联系方式
	const contacts: SlideDeckUser["contacts"] = [];
	if (participant.showEmail && participant.email) {
		contacts.push({
			label: "Email",
			value: participant.email,
			href: `mailto:${participant.email}`,
		});
	}
	if (participant.showWechat && participant.wechatId) {
		contacts.push({ label: "WeChat", value: participant.wechatId });
	}
	if (participant.githubUrl) {
		contacts.push({
			label: "GitHub",
			value: linkLabel(participant.githubUrl),
			href: participant.githubUrl,
		});
	}
	if (participant.websiteUrl) {
		contacts.push({
			label: "Website",
			value: linkLabel(participant.websiteUrl),
			href: participant.websiteUrl,
		});
	}
	if (participant.twitterUrl) {
		contacts.push({
			label: "Twitter",
			value: linkLabel(participant.twitterUrl),
			href: participant.twitterUrl,
		});
	}

	// 规范化技能数据
	const normalizedSkills = Array.isArray(participant.skills)
		? participant.skills.filter(
				(skill): skill is string =>
					typeof skill === "string" && skill.trim().length > 0,
			)
		: [];

	return {
		id: participant.id,
		name: participant.name,
		username: participant.username,
		avatarUrl: getImageUrl(participant.image),
		headline: participant.userRoleString || null,
		subheading:
			participant.currentWorkOn ||
			getLifeStatusLabel(participant.lifeStatus) ||
			null,
		bio: participant.bio,
		region: participant.region,
		skills: normalizedSkills,
		offers: participant.whatICanOffer,
		lookingFor: participant.whatIAmLookingFor,
		highlights,
		stats: stats.length > 0 ? stats : undefined,
		contacts: contacts.length > 0 ? contacts : undefined,
		works: works.length > 0 ? works : undefined,
		checkedIn: participant.checkedIn,
		// 添加三个新字段
		lifeStatus: participant.lifeStatus
			? getLifeStatusLabel(participant.lifeStatus) ||
				participant.lifeStatus
			: null,
		userRoleString: participant.userRoleString,
		currentWorkOn: participant.currentWorkOn,
	};
}

// 为个人主页创建 SlideDeckUser 对象
export function createProfileSlideDeckUser(user: ProfileUser): SlideDeckUser {
	const highlightItems: string[] = [];
	if (user.lifeStatus) {
		highlightItems.push(
			getLifeStatusLabel(user.lifeStatus) || user.lifeStatus,
		);
	}

	// 作品亮点
	const spotlightWorks: SlideDeckWork[] = Array.isArray(user.projects)
		? user.projects.slice(0, 3).map((project) => {
				const tags = Array.isArray(project.projectTags)
					? project.projectTags.slice(0, 4)
					: [];
				const summarySource = project.subtitle || project.description;
				return {
					id: project.id,
					title: project.title,
					summary: summarySource,
					tags,
					url: project.url ? project.url : `/projects/${project.id}`,
				};
			})
		: [];

	// 统计信息 - 优先显示重要信息，限制到前3个
	const stats: SlideDeckUser["stats"] = [];
	if (spotlightWorks.length > 0) {
		stats.push({ label: "作品数", value: spotlightWorks.length });
	}
	if (typeof user.cpValue === "number" && user.cpValue > 0) {
		stats.push({ label: "CP 值", value: user.cpValue });
	}
	// 浏览次数相对不重要，只在前面数据不足时显示
	if (
		stats.length < 3 &&
		typeof user.profileViews === "number" &&
		user.profileViews > 0
	) {
		stats.push({ label: "浏览", value: user.profileViews });
	}

	// 联系方式
	const contacts: SlideDeckUser["contacts"] = [];
	if (user.showEmail && user.email) {
		contacts.push({
			label: "Email",
			value: user.email,
			href: `mailto:${user.email}`,
		});
	}
	if (user.showWechat && user.wechatId) {
		contacts.push({ label: "WeChat", value: user.wechatId });
	}
	if (user.githubUrl) {
		contacts.push({
			label: "GitHub",
			value: linkLabel(user.githubUrl),
			href: user.githubUrl,
		});
	}
	if (user.websiteUrl) {
		contacts.push({
			label: "Website",
			value: linkLabel(user.websiteUrl),
			href: user.websiteUrl,
		});
	}
	if (user.twitterUrl) {
		contacts.push({
			label: "Twitter",
			value: linkLabel(user.twitterUrl),
			href: user.twitterUrl,
		});
	}

	// 规范化技能数据
	const normalizedSkills = Array.isArray(user.skills)
		? user.skills.filter(
				(skill): skill is string =>
					typeof skill === "string" && skill.trim().length > 0,
			)
		: [];

	return {
		id: user.id,
		name: user.name,
		username: user.username,
		avatarUrl: getImageUrl(user.image),
		headline: user.userRoleString || null,
		subheading:
			user.currentWorkOn || getLifeStatusLabel(user.lifeStatus) || null,
		bio: user.bio,
		region: user.region,
		skills: normalizedSkills,
		offers: user.whatICanOffer,
		lookingFor: user.whatIAmLookingFor,
		highlights: highlightItems,
		stats: stats.length > 0 ? stats : undefined,
		contacts: contacts.length > 0 ? contacts : undefined,
		works: spotlightWorks.length > 0 ? spotlightWorks : undefined,
		// 添加三个新字段
		lifeStatus: user.lifeStatus
			? getLifeStatusLabel(user.lifeStatus) || user.lifeStatus
			: null,
		userRoleString: user.userRoleString,
		currentWorkOn: user.currentWorkOn,
	};
}
