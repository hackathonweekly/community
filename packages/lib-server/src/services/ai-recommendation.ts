import type {
	Event,
	EventRegistration,
	User,
	EventProjectSubmission,
	RecommendationType,
} from "@prisma/client";

interface AIProviderConfig {
	apiKey: string;
	baseUrl: string;
	model: string;
}

const aiConfig: AIProviderConfig = {
	apiKey:
		process.env.AI_API_KEY ??
		process.env.ARK_API_KEY ??
		process.env.OPENAI_API_KEY ??
		"",
	baseUrl:
		process.env.AI_BASE_URL ??
		process.env.ARK_BASE_URL ??
		process.env.OPENAI_BASE_URL ??
		"https://ark.cn-beijing.volces.com/api/v3",
	model:
		process.env.AI_MODEL ??
		process.env.ARK_MODEL ??
		process.env.OPENAI_MODEL ??
		"doubao-seed-2-0-mini-260215",
};

// 推荐结果的类型定义
export interface RecommendedPerson {
	userId: string;
	name: string;
	username?: string;
	image?: string;
	userRoleString?: string;
	skills: string[];
	region?: string;
	matchReason: string;
	matchScore: number;
	profileUrl: string;
}

export interface RecommendedProject {
	projectId: string;
	title: string;
	description: string;
	stage?: string;
	matchReason: string;
	projectUrl: string;
}

export interface RecommendedContent {
	type: "event" | "organization" | "article";
	id: string;
	title: string;
	description: string;
	reason: string;
	url: string;
}

export interface AIRecommendation {
	people: RecommendedPerson[];
	projects: RecommendedProject[];
	content: RecommendedContent[];
	generatedAt: Date;
	metadata?: {
		participantCount?: number;
		generationReason?: string;
	};
}

// 用户画像数据（隐私处理后）
interface SafeUserProfile {
	id: string;
	name: string;
	username?: string;
	image?: string;
	region?: string;
	userRoleString?: string;
	skills: string[];
	currentWorkOn?: string;
	whatICanOffer?: string;
	whatIAmLookingFor?: string;
	bio?: string;
	profilePublic: boolean;
}

// 将用户数据转换为安全的画像数据
function toSafeUserProfile(user: Partial<User>): SafeUserProfile {
	return {
		id: user.id || "",
		name: user.name || "",
		username: user.username || undefined,
		image: user.image || undefined,
		region: user.region || undefined,
		userRoleString: user.userRoleString || undefined,
		skills: user.skills || [],
		currentWorkOn: user.currentWorkOn || undefined,
		whatICanOffer: user.whatICanOffer || undefined,
		whatIAmLookingFor: user.whatIAmLookingFor || undefined,
		bio: user.bio || undefined,
		profilePublic: user.profilePublic ?? true,
	};
}

// 调用 OpenAI 兼容 API（默认使用火山引擎 Ark）
async function callAIAPI(prompt: string): Promise<any> {
	try {
		const normalizedBaseUrl = aiConfig.baseUrl.replace(/\/+$/, "");
		const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${aiConfig.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: aiConfig.model,
				messages: [
					{
						role: "system",
						content:
							"你是一个专业的活动推荐助手，帮助用户发现有价值的连接和机会。请用JSON格式返回推荐结果。",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 2000,
				response_format: { type: "json_object" },
			}),
		});

		if (!response.ok) {
			throw new Error(`AI API error: ${response.statusText}`);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error("No content returned from AI API");
		}

		return JSON.parse(content);
	} catch (error) {
		console.error("Error calling AI API:", error);
		throw error;
	}
}

// 生成个性化推荐的prompt
function generatePersonalPrompt(
	user: SafeUserProfile,
	event: Partial<Event>,
	participants: SafeUserProfile[],
	projects?: Partial<EventProjectSubmission>[],
): string {
	const prompt = `
基于以下信息，为用户生成个性化的活动推荐。请返回JSON格式的推荐结果。

## 当前用户信息
- ID: ${user.id}
- 姓名: ${user.name}
- 角色: ${user.userRoleString || "未设置"}
- 技能: ${user.skills.join(", ") || "未设置"}
- 地区: ${user.region || "未设置"}
- 正在做: ${user.currentWorkOn || "未设置"}
- 可以提供: ${user.whatICanOffer || "未设置"}
- 正在寻找: ${user.whatIAmLookingFor || "未设置"}

## 活动信息
- 名称: ${event.title}
- 类型: ${event.type}
- 标签: ${event.tags?.join(", ") || "无"}
- 描述: ${event.richContent?.slice(0, 200) || event.shortDescription?.slice(0, 200)}...

## 其他参与者（${participants.length}人）
${participants
	.slice(0, 20)
	.map(
		(p) => `
- ${p.name} (ID: ${p.id})
  角色: ${p.userRoleString || "未设置"}
  技能: ${p.skills.join(", ") || "未设置"}
  寻找: ${p.whatIAmLookingFor || "未设置"}
  提供: ${p.whatICanOffer || "未设置"}
  地区: ${p.region || "未设置"}
`,
	)
	.join("")}

${
	projects && projects.length > 0
		? `
## 活动相关项目（${projects.length}个）
${projects
	.slice(0, 10)
	.map(
		(p) => `
- ${p.title}: ${p.description?.slice(0, 100)}...
`,
	)
	.join("")}
`
		: ""
}

请基于以上信息，推荐：
1. 3-5个最匹配的参与者，说明具体的匹配理由（如技能互补、需求匹配、地区相近等）
2. 2-3个可能感兴趣的项目方向或合作机会
3. 1-2个相关的内容推荐（其他活动、组织等）

注意：
- 匹配理由要具体且有价值，避免泛泛而谈
- 优先推荐技能互补、资源匹配的用户
- 考虑地理位置的便利性
- 不要推荐用户自己

返回JSON格式：
{
  "people": [
    {
      "userId": "用户ID",
      "matchReason": "具体的匹配理由",
      "matchScore": 0-100的匹配分数
    }
  ],
  "projects": [
    {
      "title": "项目标题",
      "description": "项目描述",
      "reason": "推荐理由"
    }
  ],
  "content": [
    {
      "type": "event/organization/article",
      "title": "标题",
      "description": "描述",
      "reason": "推荐理由"
    }
  ]
}
`;

	return prompt;
}

// 生成统一推荐的prompt
function generateUnifiedPrompt(
	event: Partial<Event>,
	participants: SafeUserProfile[],
	projects?: Partial<EventProjectSubmission>[],
): string {
	const prompt = `
基于以下活动信息，生成一个通用的推荐列表，展示这个活动的亮点参与者和机会。

## 活动信息
- 名称: ${event.title}
- 类型: ${event.type}
- 标签: ${event.tags?.join(", ") || "无"}
- 描述: ${event.richContent?.slice(0, 300) || event.shortDescription?.slice(0, 300)}...

## 已报名参与者（${participants.length}人）
${participants
	.slice(0, 30)
	.map(
		(p) => `
- ${p.name}
  角色: ${p.userRoleString || "未设置"}
  技能: ${p.skills.join(", ") || "未设置"}
  正在做: ${p.currentWorkOn || "未设置"}
  地区: ${p.region || "未设置"}
`,
	)
	.join("")}

${
	projects && projects.length > 0
		? `
## 活动相关项目（${projects.length}个）
${projects
	.slice(0, 15)
	.map(
		(p) => `
- ${p.title}: ${p.description?.slice(0, 100)}...
`,
	)
	.join("")}
`
		: ""
}

请选出：
1. 5-8个最有代表性的参与者（考虑多样性、影响力、技能覆盖）
2. 3-5个有潜力的项目或合作方向
3. 2-3个相关推荐

注意：
- 选择有代表性和吸引力的参与者
- 突出活动的核心价值和机会
- 推荐理由要吸引人

返回JSON格式（同上）
`;

	return prompt;
}

// 处理AI返回的推荐结果
async function processRecommendationResult(
	aiResult: any,
	participants: SafeUserProfile[],
	event: Partial<Event>,
): Promise<AIRecommendation> {
	const participantMap = new Map(participants.map((p) => [p.id, p]));

	// 处理推荐的人
	const people: RecommendedPerson[] = (aiResult.people || [])
		.filter((p: any) => participantMap.has(p.userId))
		.map((p: any) => {
			const user = participantMap.get(p.userId)!;
			return {
				userId: user.id,
				name: user.name,
				username: user.username,
				image: user.image,
				userRoleString: user.userRoleString,
				skills: user.skills,
				region: user.region,
				matchReason: p.matchReason || "可能感兴趣的伙伴",
				matchScore: p.matchScore || 75,
				profileUrl: `/profile/${user.username || user.id}`,
			};
		});

	// 处理项目推荐
	const projects: RecommendedProject[] = (aiResult.projects || []).map(
		(p: any) => ({
			projectId: p.id || `project-${Date.now()}-${Math.random()}`,
			title: p.title || "潜在项目机会",
			description: p.description || "",
			stage: p.stage,
			matchReason: p.reason || "可能感兴趣的项目",
			projectUrl: p.url || "#",
		}),
	);

	// 处理内容推荐
	const content: RecommendedContent[] = (aiResult.content || []).map(
		(c: any) => ({
			type: c.type || "event",
			id: c.id || `content-${Date.now()}-${Math.random()}`,
			title: c.title || "相关推荐",
			description: c.description || "",
			reason: c.reason || "你可能感兴趣",
			url: c.url || "#",
		}),
	);

	return {
		people,
		projects,
		content,
		generatedAt: new Date(),
		metadata: {
			participantCount: participants.length,
		},
	};
}

// 主要的推荐生成函数
export async function generateEventRecommendations(
	type: RecommendationType,
	event: Event & {
		registrations?: (EventRegistration & { user: User })[];
		projectSubmissions?: EventProjectSubmission[];
	},
	currentUser?: User,
): Promise<AIRecommendation> {
	try {
		// 获取参与者信息（排除当前用户）
		const participants = (event.registrations || [])
			.filter(
				(reg) =>
					reg.status === "APPROVED" && reg.userId !== currentUser?.id,
			)
			.map((reg) => toSafeUserProfile(reg.user))
			.filter((user) => user.profilePublic);

		// 如果参与者太少，返回空推荐
		if (participants.length < 3) {
			return {
				people: [],
				projects: [],
				content: [],
				generatedAt: new Date(),
				metadata: {
					participantCount: participants.length,
					generationReason: "参与者太少，暂无推荐",
				},
			};
		}

		let prompt: string;

		if (type === "PERSONAL" && currentUser) {
			// 个性化推荐
			const userProfile = toSafeUserProfile(currentUser);
			prompt = generatePersonalPrompt(
				userProfile,
				event,
				participants,
				event.projectSubmissions,
			);
		} else {
			// 统一推荐
			prompt = generateUnifiedPrompt(
				event,
				participants,
				event.projectSubmissions,
			);
		}

		// 调用AI API
		const aiResult = await callAIAPI(prompt);

		// 处理结果
		const recommendation = await processRecommendationResult(
			aiResult,
			participants,
			event,
		);

		return recommendation;
	} catch (error) {
		console.error("Error generating recommendations:", error);

		// 返回降级推荐（基于简单规则）
		return generateFallbackRecommendations(event, currentUser);
	}
}

// 降级推荐方案（当AI服务不可用时）
function generateFallbackRecommendations(
	event: Event & {
		registrations?: (EventRegistration & { user: User })[];
	},
	currentUser?: User,
): AIRecommendation {
	const participants = (event.registrations || [])
		.filter(
			(reg) =>
				reg.status === "APPROVED" && reg.userId !== currentUser?.id,
		)
		.map((reg) => toSafeUserProfile(reg.user))
		.filter((user) => user.profilePublic);

	// 随机选择一些参与者
	const recommendedPeople = participants
		.sort(() => Math.random() - 0.5)
		.slice(0, 5)
		.map((user) => ({
			userId: user.id,
			name: user.name,
			username: user.username,
			image: user.image,
			userRoleString: user.userRoleString,
			skills: user.skills,
			region: user.region,
			matchReason: "活动参与者",
			matchScore: 70,
			profileUrl: `/profile/${user.username || user.id}`,
		}));

	return {
		people: recommendedPeople,
		projects: [],
		content: [],
		generatedAt: new Date(),
		metadata: {
			participantCount: participants.length,
			generationReason: "fallback",
		},
	};
}
