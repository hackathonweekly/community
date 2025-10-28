export interface Project {
	id: string;
	title: string;
	description: string | null;
	projectTags: string[];
	stage: string;
	screenshots: string[];
}

export interface Question {
	id: string;
	question: string;
	description?: string;
	type: string;
	options: string[];
	required: boolean;
	order: number;
}

export interface TicketType {
	id: string;
	name: string;
	description?: string;
	price?: number;
	maxQuantity?: number;
	currentQuantity: number;
	isActive: boolean;
}

export interface UserProfile {
	bio?: string;
	userRoleString?: string;
	currentWorkOn?: string;
	name?: string;
	preferredContact?: string;
	phoneNumber?: string;
	wechatId?: string;
	email?: string;
	emailVerified?: boolean | null;
	showWechat?: boolean;
	showEmail?: boolean;
	lifeStatus?: string;
}

export interface Event {
	id: string;
	title: string;
	requireApproval: boolean;
	requireProjectSubmission?: boolean;
	shortDescription?: string | null;
	questions: Question[];
	ticketTypes: TicketType[];
}
