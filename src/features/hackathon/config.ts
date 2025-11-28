import { z } from "zod";

// 黑客松阶段已废弃，保留类型兼容性
/**
 * @deprecated 使用 Event.registrationOpen / submissionsOpen / votingOpen 控制流程
 */
export const HACKATHON_STAGE_VALUES = [
	"REGISTRATION",
	"DEVELOPMENT",
	"SUBMISSION",
	"VOTING",
	"RESULTS",
] as const;

/**
 * @deprecated 使用 Event.registrationOpen / submissionsOpen / votingOpen 控制流程
 */
export const HackathonStageEnum = z.enum(HACKATHON_STAGE_VALUES);

/**
 * @deprecated 使用 Event.registrationOpen / submissionsOpen / votingOpen 控制流程
 */
export type HackathonStage = z.infer<typeof HackathonStageEnum>;

export const HackathonSettingsSchema = z.object({
	maxTeamSize: z.number().int().min(1).max(20).default(5),
	allowSolo: z.boolean().default(true),
	requireProject: z.boolean().default(false),
});

export const HackathonVotingSchema = z.object({
	allowPublicVoting: z.boolean().default(true),
	enableJudgeVoting: z.boolean().default(true),
	judgeWeight: z.number().min(0).max(1).default(0.7),
	publicWeight: z.number().min(0).max(1).default(0.3),
	publicVotingScope: z
		.enum(["ALL", "REGISTERED", "PARTICIPANTS"])
		.default("PARTICIPANTS"),
});

const HackathonAwardSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	awardType: z.enum(["JUDGE", "PUBLIC"]).default("JUDGE"),
	maxWinners: z.number().min(1).default(1),
});

const HackathonResourceItemSchema = z.object({
	title: z.string().optional(),
	name: z.string().optional(),
	url: z.string().url(),
	description: z.string().optional(),
});

const HackathonResourcesSchema = z.object({
	tutorials: z
		.array(
			HackathonResourceItemSchema.extend({
				title: z.string(),
				name: z.string().optional(),
			}),
		)
		.optional(),
	tools: z
		.array(
			HackathonResourceItemSchema.extend({
				name: z.string(),
				title: z.string().optional(),
			}),
		)
		.optional(),
	examples: z
		.array(
			HackathonResourceItemSchema.extend({
				title: z.string(),
				name: z.string().optional(),
			}),
		)
		.optional(),
});

export type HackathonSettings = z.infer<typeof HackathonSettingsSchema>;
export type HackathonVoting = z.infer<typeof HackathonVotingSchema>;
export type HackathonAward = z.infer<typeof HackathonAwardSchema>;
export interface HackathonResources {
	tutorials: Array<{ title: string; url: string; description?: string }>;
	tools: Array<{ name: string; url: string; description?: string }>;
	examples: Array<{ title: string; url: string; description?: string }>;
}

export const DEFAULT_HACKATHON_SETTINGS: HackathonSettings = {
	maxTeamSize: 5,
	allowSolo: true,
	requireProject: false,
};

export const DEFAULT_HACKATHON_VOTING: HackathonVoting = {
	allowPublicVoting: true,
	enableJudgeVoting: true,
	judgeWeight: 0.7,
	publicWeight: 0.3,
	publicVotingScope: "PARTICIPANTS",
};

export const DEFAULT_HACKATHON_RESOURCES: HackathonResources = {
	tutorials: [],
	tools: [],
	examples: [],
};

export const DEFAULT_STAGE_NOW = () => {
	const now = new Date().toISOString();
	return {
		current: "REGISTRATION" as HackathonStage,
		lastUpdatedAt: now,
		history: [
			{
				stage: "REGISTRATION" as HackathonStage,
				changedAt: now,
			},
		],
	};
};

const HackathonStageHistoryEntrySchema = z.object({
	stage: HackathonStageEnum,
	changedAt: z.string(),
	changedBy: z.string().optional(),
	note: z.string().optional(),
});

export type HackathonStageHistoryEntry = z.infer<
	typeof HackathonStageHistoryEntrySchema
>;

/**
 * @deprecated 使用开关控制流程；仅保留历史兼容
 */
export const HackathonStageStateSchema = z.object({
	current: HackathonStageEnum.default("REGISTRATION"),
	lastUpdatedAt: z.string().optional(),
	lastUpdatedBy: z.string().optional(),
	history: z.array(HackathonStageHistoryEntrySchema).optional(),
});

export type HackathonStageState = z.infer<typeof HackathonStageStateSchema>;

export const HackathonConfigSchema = z.object({
	settings: HackathonSettingsSchema.optional(),
	voting: HackathonVotingSchema.optional(),
	awards: z.array(HackathonAwardSchema).optional(),
	resources: HackathonResourcesSchema.optional(),
	stage: HackathonStageStateSchema.optional(),
});

export type HackathonConfig = z.infer<typeof HackathonConfigSchema>;

export interface NormalizedHackathonConfig {
	settings: HackathonSettings;
	voting: HackathonVoting;
	awards: HackathonAward[];
	resources: HackathonResources;
	stage: HackathonStageState;
}

export function withHackathonConfigDefaults(
	config?: HackathonConfig | null,
	options?: { changedBy?: string },
): NormalizedHackathonConfig {
	const base = config ?? {};

	const settings: HackathonSettings = {
		...DEFAULT_HACKATHON_SETTINGS,
		...(base.settings ?? {}),
	};

	const voting: HackathonVoting = {
		...DEFAULT_HACKATHON_VOTING,
		...(base.voting ?? {}),
	};

	const awards: HackathonAward[] = Array.isArray(base.awards)
		? base.awards
		: [];

	const resources: HackathonResources = {
		tutorials: base.resources?.tutorials
			? [...base.resources.tutorials]
			: [],
		tools: base.resources?.tools ? [...base.resources.tools] : [],
		examples: base.resources?.examples ? [...base.resources.examples] : [],
	};

	const now = new Date().toISOString();
	const stageState: Partial<HackathonStageState> = base.stage ?? {};
	const currentStage = stageState.current ?? "REGISTRATION";
	const history: HackathonStageHistoryEntry[] =
		stageState.history && stageState.history.length > 0
			? stageState.history
			: [
					{
						stage: currentStage,
						changedAt: stageState.lastUpdatedAt ?? now,
						changedBy:
							stageState.lastUpdatedBy ?? options?.changedBy,
					},
				];

	return {
		settings,
		voting,
		awards,
		resources,
		stage: {
			current: currentStage,
			lastUpdatedAt: stageState.lastUpdatedAt ?? now,
			lastUpdatedBy: stageState.lastUpdatedBy ?? options?.changedBy,
			history,
		},
	};
}
