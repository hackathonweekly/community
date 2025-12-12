import type { HackathonStage } from "@/features/hackathon/config";

// Shared type definitions for different event configurations

export interface HackathonConfig {
	settings: {
		maxTeamSize: number;
		allowSolo: boolean;
	};
	voting: {
		allowPublicVoting: boolean;
		enableJudgeVoting: boolean;
		judgeWeight: number;
		publicWeight: number;
		publicVotingScope: "ALL" | "REGISTERED" | "PARTICIPANTS";
	};
	awards: Array<{
		id: string;
		name: string;
		description: string;
		awardType: "JUDGE" | "PUBLIC";
		maxWinners: number;
	}>;
	resources?: {
		tutorials: Array<{
			title: string;
			url: string;
			description?: string;
		}>;
		tools: Array<{
			name: string;
			url: string;
			description?: string;
		}>;
		examples: Array<{
			title: string;
			url: string;
			description?: string;
		}>;
	};
	/**
	 * @deprecated 使用 Event.registrationOpen / submissionsOpen / votingOpen 控制流程
	 */
	stage?: {
		current: HackathonStage;
		lastUpdatedAt?: string;
		lastUpdatedBy?: string;
		history?: Array<{
			stage: HackathonStage;
			changedAt: string;
			changedBy?: string;
		}>;
	};
}

export interface BuildingConfig {
	duration: number;
	requiredCheckIns: number;
	depositAmount: number;
	refundRate: number;
	isPublic: boolean;
	allowAnonymous: boolean;
	enableVoting: boolean;
	paymentType?: string;
	paymentUrl?: string;
	paymentQRCode?: string;
	paymentNote?: string;
}

// Event type definitions
export type EventType = "MEETUP" | "HACKATHON" | "BUILDING_PUBLIC";

export interface BaseEvent {
	id: string;
	title: string;
	description: string;
	type: EventType;
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
}

export interface EventWithConfigs extends BaseEvent {
	buildingConfig?: BuildingConfig;
	hackathonConfig?: HackathonConfig;
}
