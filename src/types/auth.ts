import type { Session } from "@/lib/auth";

// 导出类型化的 Session 类型
export type TypedSession = Session & {
	user: Session["user"] & {
		username?: string;
		role?: string;
		onboardingComplete?: boolean;
		locale?: string;
		bio?: string;
		userRoleString?: string;
		whatICanOffer?: string;
		whatIAmLookingFor?: string;
		skills?: string[];
		membershipLevel?: string;
		creatorLevel?: string;
		mentorLevel?: string;
		contributorLevel?: string;
		wechatId?: string;
		wechatOpenId?: string;
		wechatUnionId?: string;
		preferredContact?: string;
		phoneNumber?: string;
		phoneNumberVerified?: boolean;
		pendingInvitationId?: string;
	};
};
