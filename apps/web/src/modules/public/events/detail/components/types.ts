import type { HackathonConfig } from "../types/event-types";

export interface EventData {
	id: string;
	shortId?: string;
	title: string;
	description: string;
	shortDescription?: string;
	richContent?: string;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	timezone: string;
	isOnline: boolean;
	address?: string;
	onlineUrl?: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	maxAttendees?: number;
	registrationDeadline?: string;
	requireApproval: boolean;
	requireProjectSubmission?: boolean;
	submissionsEnabled?: boolean | null;
	registrationSuccessInfo?: string;
	registrationSuccessImage?: string;
	registrationPendingInfo?: string;
	registrationPendingImage?: string;
	coverImage?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	createdAt: string;
	isEventAdmin?: boolean;
	registrationOpen?: boolean;
	submissionsOpen?: boolean;
	hackathonConfig?: HackathonConfig;
	organizer: {
		id: string;
		name: string;
		email: string;
		image?: string;
		username?: string;
		bio?: string;
		userRoleString?: string;
		city?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug?: string;
		logo?: string;
		summary?: string;
	};
	registrations: Array<{
		id: string;
		status: string;
		registeredAt: string;
		user: {
			id: string;
			name: string;
			image?: string;
			username?: string;
			userRoleString?: string;
			currentWorkOn?: string;
			bio?: string;
			lifeStatus?: string;
			region?: string;
			skills?: string[];
			whatICanOffer?: string;
			whatIAmLookingFor?: string;
			showEmail?: boolean;
			email?: string;
			showWechat?: boolean;
			wechatId?: string;
			githubUrl?: string;
			twitterUrl?: string;
			websiteUrl?: string;
		};
	}>;
	questions: Array<{
		id: string;
		question: string;
		type: string;
		options: string[];
		required: boolean;
		order: number;
	}>;
	feedbacks: Array<{
		id: string;
		rating: number;
		comment?: string;
		suggestions?: string;
		wouldRecommend: boolean;
		createdAt: string;
		user: {
			id: string;
			name: string;
			image?: string;
			username?: string;
		};
	}>;
	_count: {
		registrations: number;
		checkIns: number;
	};
	ticketTypes: Array<{
		id: string;
		name: string;
		description?: string;
		price?: number;
		maxQuantity?: number;
		currentQuantity: number;
		isActive: boolean;
	}>;
	volunteerRoles?: Array<{
		id: string;
		recruitCount: number;
		isRequired: boolean;
		sopUrl?: string;
		wechatQrCode?: string;
		description?: string;
		volunteerRole: {
			id: string;
			name: string;
			description: string;
			detailDescription?: string;
			iconUrl?: string;
			cpPoints: number;
		};
		registrations: Array<{
			id: string;
			status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
			appliedAt: string;
			approvedAt?: string;
			note?: string;
			user: {
				id: string;
				name: string;
				image?: string;
				username?: string;
				userRoleString?: string;
				currentWorkOn?: string;
			};
		}>;
	}>;
	volunteerContactInfo?: string;
	volunteerWechatQrCode?: string;
	organizerContact?: string;
}
