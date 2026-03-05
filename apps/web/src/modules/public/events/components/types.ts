export interface Project {
	id: string;
	shortId?: string | null;
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
	priceTiers?: Array<{
		quantity: number;
		price: number;
		currency?: string;
	}>;
	maxQuantity?: number;
	currentQuantity: number;
	isActive: boolean;
}

export interface UserProfile {
	name?: string;
	bio?: string;
	userRoleString?: string;
	currentWorkOn?: string;
	preferredContact?: string;
	phoneNumber?: string;
	wechatId?: string;
	email?: string;
	emailVerified?: boolean | null;
	showWechat?: boolean;
	showEmail?: boolean;
	lifeStatus?: string;
	shippingAddress?: string;
}

export interface EventRegistration {
	id: string;
	status:
		| "PENDING_PAYMENT"
		| "PENDING"
		| "APPROVED"
		| "WAITLISTED"
		| "REJECTED"
		| "CANCELLED";
	eventId?: string;
	userId?: string;
	ticketTypeId?: string | null;
	orderId?: string | null;
	orderInviteId?: string | null;
	inviteId?: string | null;
	registeredAt?: string;
}

export interface Event {
	id: string;
	title: string;
	requireApproval: boolean;
	requireProjectSubmission?: boolean;
	shortDescription?: string | null;
	questions: Question[];
	ticketTypes: TicketType[];
	registrationFieldConfig?: any;
}
