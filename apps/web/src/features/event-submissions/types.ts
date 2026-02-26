export type SubmissionAttachment = {
	id: string;
	fileName: string;
	fileUrl: string;
	fileType: string;
	mimeType?: string | null;
	fileSize: number;
	order: number;
};

export type SubmissionAttachmentInput = {
	fileName: string;
	fileUrl: string;
	fileType: string;
	mimeType?: string;
	fileSize: number;
	order?: number;
};

export type SubmissionTeamMember = {
	id: string;
	name: string;
	avatar?: string | null;
	username?: string | null;
	bio?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	wechatId?: string | null;
	region?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
	role: string;
};

export type SubmissionSubmitter = {
	id: string;
	name: string;
	image?: string | null;
	username?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	wechatId?: string | null;
	region?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
};

export type SubmissionEventSummary = {
	id: string;
	title: string;
	startTime?: string | null;
	endTime?: string | null;
};

export type SubmissionAward = {
	id: string;
	award: {
		id: string;
		name: string;
		description?: string | null;
		iconUrl?: string | null;
		badgeUrl?: string | null;
		level?: string | null;
		category?: string | null;
	};
};

export interface EventSubmission {
	id: string;
	submissionId: string;
	projectId: string;
	eventId: string;
	name: string;
	tagline?: string | null;
	description?: string | null;
	demoUrl?: string | null;
	communityUseAuthorization: boolean;
	status: string;
	voteCount: number;
	baseVoteCount?: number;
	manualVoteAdjustment?: number;
	rank?: number | null;
	submittedAt?: string | null;
	updatedAt?: string | null;
	coverImage?: string | null;
	attachments: SubmissionAttachment[];
	teamLeader: SubmissionTeamMember | null;
	teamMembers: SubmissionTeamMember[];
	teamSize: number;
	submitter: SubmissionSubmitter;
	event: SubmissionEventSummary;
	awards?: SubmissionAward[];
	customFieldAnswers?: SubmissionCustomFieldAnswer[];
	customFields?: Record<string, unknown> | null;
}

export interface SubmissionListResponse {
	submissions: EventSubmission[];
	total: number;
	userVotes: string[];
	remainingVotes: number | null;
	publicVoting: {
		allowPublicVoting: boolean;
		scope: "ALL" | "REGISTERED" | "PARTICIPANTS";
		mode: "FIXED_QUOTA" | "PER_PROJECT_LIKE";
		quota: number | null;
	};
}

export interface SubmissionVoteResponse {
	success: boolean;
	voteCount: number;
	remainingVotes: number | null;
}

export interface SubmissionFormValues {
	name: string;
	tagline?: string;
	description?: string;
	demoUrl?: string;
	teamLeaderId?: string;
	teamMemberIds: string[];
	attachments?: SubmissionAttachmentInput[];
	communityUseAuthorization: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	customFields?: Record<string, any>;
}

export interface SubmissionCustomFieldAnswer {
	key: string;
	label: string;
	type: SubmissionFieldType;
	required: boolean;
	enabled: boolean;
	publicVisible: boolean;
	order: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
	description?: string;
}

export interface VoteStatsSummary {
	totalVotes: number;
	totalParticipants: number;
	votedParticipants: number;
	topSubmissions: Array<{
		id: string;
		projectId: string;
		name: string;
		voteCount: number;
		rank: number;
	}>;
}

export interface UserSearchResult {
	id: string;
	name: string;
	username?: string | null;
	image?: string | null;
	email?: string | null;
	bio?: string | null;
	userRoleString?: string | null;
	isParticipant?: boolean;
}

// Submission form configuration types
export type SubmissionFieldType =
	| "text"
	| "textarea"
	| "url"
	| "phone"
	| "email"
	| "image"
	| "file"
	| "select"
	| "radio"
	| "checkbox";

export interface SubmissionFormField {
	key: string;
	label: string;
	type: SubmissionFieldType;
	required: boolean;
	enabled: boolean;
	publicVisible: boolean;
	placeholder?: string;
	description?: string;
	options?: string[];
	order: number;
}

export type SubmissionBaseFieldKey = "tagline" | "demoUrl" | "attachments";

export interface SubmissionBaseFieldConfig {
	label?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	enabled?: boolean;
}

export interface SubmissionFormConfig {
	fields?: SubmissionFormField[];
	baseFields?: Partial<
		Record<SubmissionBaseFieldKey, SubmissionBaseFieldConfig>
	>;
	settings?: {
		attachmentsEnabled?: boolean;
		communityUseAuthorizationEnabled?: boolean;
		workAuthorizationAgreementMarkdown?: string;
	};
}
