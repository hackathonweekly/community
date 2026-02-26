export const ProjectStage = {
	IDEA_VALIDATION: "IDEA_VALIDATION",
	DEVELOPMENT: "DEVELOPMENT",
	LAUNCH: "LAUNCH",
	GROWTH: "GROWTH",
	MONETIZATION: "MONETIZATION",
	FUNDING: "FUNDING",
	COMPLETED: "COMPLETED",
} as const;

export type ProjectStage = (typeof ProjectStage)[keyof typeof ProjectStage];

export const PricingType = {
	FREE: "FREE",
	PAID: "PAID",
	FREEMIUM: "FREEMIUM",
} as const;

export type PricingType = (typeof PricingType)[keyof typeof PricingType];

export const RegistrationStatus = {
	PENDING_PAYMENT: "PENDING_PAYMENT",
	PENDING: "PENDING",
	APPROVED: "APPROVED",
	WAITLISTED: "WAITLISTED",
	REJECTED: "REJECTED",
	CANCELLED: "CANCELLED",
} as const;

export type RegistrationStatus =
	(typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const CommentEntityType = {
	PROJECT: "PROJECT",
	EVENT: "EVENT",
	TASK: "TASK",
	ARTICLE: "ARTICLE",
	ORGANIZATION: "ORGANIZATION",
	POST: "POST",
} as const;

export type CommentEntityType =
	(typeof CommentEntityType)[keyof typeof CommentEntityType];

export const CommentStatus = {
	ACTIVE: "ACTIVE",
	HIDDEN: "HIDDEN",
	REVIEWING: "REVIEWING",
	REJECTED: "REJECTED",
} as const;

export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

export const MembershipLevel = {
	VISITOR: "VISITOR",
	NEWCOMER: "NEWCOMER",
	MEMBER: "MEMBER",
	ACTIVE: "ACTIVE",
	CORE: "CORE",
	SENIOR: "SENIOR",
	LEGEND: "LEGEND",
} as const;

export type MembershipLevel =
	(typeof MembershipLevel)[keyof typeof MembershipLevel];
