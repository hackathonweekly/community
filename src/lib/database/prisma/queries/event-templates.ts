import { EventTemplateType } from "@prisma/client";
import { db } from "..";

// 初始化志愿者角色
async function initializeVolunteerRoles() {
	const volunteerRoles = [
		{
			name: "主持人",
			description: "负责活动流程主持和氛围调动",
			icon: "🎤",
		},
		{
			name: "场地协助",
			description: "负责场地布置、设备调试等",
			icon: "🏢",
		},
		{
			name: "计时员",
			description: "负责各环节时间控制和提醒",
			icon: "⏰",
		},
		{
			name: "签到员",
			description: "负责参与者签到和人员统计",
			icon: "📝",
		},
		{
			name: "技术导师",
			description: "提供技术指导和答疑支持",
			icon: "👨‍💻",
		},
		{
			name: "技术员",
			description: "设备调试、技术支持",
			icon: "🔧",
		},
		{
			name: "财务核实员",
			description: "核实打卡内容，管理押金结算",
			icon: "💰",
		},
		{
			name: "气氛组主持人",
			description: "活跃社群，督促打卡，组织交流",
			icon: "🎉",
		},
	];

	const createdRoles = [];
	for (const role of volunteerRoles) {
		try {
			const created = await db.volunteerRole.upsert({
				where: { name: role.name },
				update: {},
				create: role,
			});
			createdRoles.push(created);
		} catch (error) {
			console.warn(`志愿者角色 ${role.name} 已存在，跳过创建`);
		}
	}

	return createdRoles;
}

// 初始化奖项
async function initializeAwards() {
	const awards = [
		// 黑客松奖项
		{
			name: "一等奖",
			description: "黑客松比赛第一名",
			category: "GENERAL" as const,
			level: "FIRST" as const,
			iconUrl: "🥇",
			cpReward: 200,
		},
		{
			name: "二等奖",
			description: "黑客松比赛第二名",
			category: "GENERAL" as const,
			level: "SECOND" as const,
			iconUrl: "🥈",
			cpReward: 100,
		},
		{
			name: "三等奖",
			description: "黑客松比赛第三名",
			category: "GENERAL" as const,
			level: "THIRD" as const,
			iconUrl: "🥉",
			cpReward: 50,
		},
		{
			name: "最佳技术创新奖",
			description: "在技术创新方面表现突出",
			category: "TECHNICAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "⚡",
			cpReward: 80,
		},
		{
			name: "最佳产品设计奖",
			description: "在产品设计方面表现突出",
			category: "CREATIVE" as const,
			level: "SPECIAL" as const,
			iconUrl: "🎨",
			cpReward: 80,
		},
		{
			name: "最具商业价值奖",
			description: "在商业价值方面表现突出",
			category: "COMMERCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "💼",
			cpReward: 80,
		},
		{
			name: "最佳团队协作奖",
			description: "在团队协作方面表现突出",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "🤝",
			cpReward: 80,
		},
		{
			name: "参与奖",
			description: "参与黑客松活动",
			category: "GENERAL" as const,
			level: "PARTICIPATION" as const,
			iconUrl: "🎯",
			cpReward: 25,
		},
		// Demo Day奖项
		{
			name: "最受观众喜爱奖",
			description: "Demo Day观众投票最高",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "❤️",
			cpReward: 60,
		},
		{
			name: "最具投资价值奖",
			description: "最有投资潜力的项目",
			category: "COMMERCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "💎",
			cpReward: 100,
		},
		{
			name: "最佳演示奖",
			description: "演示效果最佳",
			category: "CREATIVE" as const,
			level: "SPECIAL" as const,
			iconUrl: "🎭",
			cpReward: 60,
		},
		{
			name: "最有潜力奖",
			description: "最有发展潜力的项目",
			category: "GENERAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "🌟",
			cpReward: 60,
		},
		// Building Public奖项
		{
			name: "最佳坚持奖",
			description: "完成所有打卡任务",
			category: "SOCIAL" as const,
			level: "EXCELLENCE" as const,
			iconUrl: "💪",
			cpReward: 50,
		},
		{
			name: "最佳项目奖",
			description: "Building Public最佳项目",
			category: "GENERAL" as const,
			level: "FIRST" as const,
			iconUrl: "🏆",
			cpReward: 100,
		},
		{
			name: "最受关注奖",
			description: "获得点赞和关注最多",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "👀",
			cpReward: 60,
		},
		{
			name: "最具进步奖",
			description: "项目进展最大",
			category: "GENERAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "📈",
			cpReward: 60,
		},
	];

	const createdAwards = [];
	for (const award of awards) {
		try {
			const created = await db.award.upsert({
				where: { name: award.name },
				update: {},
				create: award,
			});
			createdAwards.push(created);
		} catch (error) {
			console.warn(`奖项 ${award.name} 已存在，跳过创建`);
		}
	}

	return createdAwards;
}

// 初始化系统活动模板
export async function initializeEventTemplates() {
	// 先确保志愿者角色和奖项存在
	const volunteerRoles = await initializeVolunteerRoles();
	const awards = await initializeAwards();

	// 获取所有志愿者角色以构建映射
	const allVolunteerRoles = await db.volunteerRole.findMany();
	const roleMap: Record<string, string> = {};
	allVolunteerRoles.forEach((role) => {
		roleMap[role.name] = role.id;
	});

	console.log("志愿者角色映射:", roleMap);

	// 模板数据
	const templates = [
		{
			name: "迷你黑客松",
			type: EventTemplateType.HACKATHON_LEARNING,
			description: "全天学习+开发活动，适合技能提升和项目实践",
			title: "迷你黑客松第{{期数}}期",
			defaultDescription:
				"欢迎参加迷你黑客松活动！这是一个全天的学习和开发活动，上午共学技术知识，下午进行项目开发，最后进行成果展示。",
			duration: 480, // 8小时
			maxAttendees: 50,
			requireApproval: true,
			isSystemTemplate: true,
			isActive: true,
			ticketTypes: [
				{
					name: "参与者",
					description: "活动参与者",
					price: null,
					maxQuantity: null,
					sortOrder: 0,
				},
			],
			volunteerRoles: [
				{
					volunteerRoleId: roleMap.主持人,
					recruitCount: 2,
					description: "负责活动流程主持和氛围调动",
					cpReward: 50,
				},
				{
					volunteerRoleId: roleMap.技术支持组 || roleMap.主持人, // 备选
					recruitCount: 3,
					description: "负责场地布置、设备调试等",
					cpReward: 30,
				},
				{
					volunteerRoleId: roleMap.计时员,
					recruitCount: 1,
					description: "负责各环节时间控制和提醒",
					cpReward: 25,
				},
				{
					volunteerRoleId: roleMap.签到接待组 || roleMap.主持人, // 备选
					recruitCount: 2,
					description: "负责参与者签到和人员统计",
					cpReward: 25,
				},
				{
					volunteerRoleId: roleMap.技术支持组 || roleMap.主持人, // 备选技术导师
					recruitCount: 5,
					description: "提供技术指导和答疑支持",
					cpReward: 80,
				},
			].filter((role) => role.volunteerRoleId), // 过滤掉没有找到对应角色的项
			questions: [
				{
					question: "有什么项目想法想要在活动中实现？",
					type: "TEXTAREA" as const,
					required: false,
					targetRole: "participant",
					order: 1,
				},
				{
					question: "是否愿意与其他参与者组队合作？",
					type: "RADIO" as const,
					options: ["愿意", "不愿意", "看情况"],
					required: true,
					targetRole: "participant",
					order: 2,
				},
			],
			schedules: [
				{
					title: "签到和准备时间",
					startMinute: 0,
					duration: 30,
					type: "CHECK_IN" as const,
					order: 1,
				},
				{
					title: "活动介绍和破冰环节",
					startMinute: 30,
					duration: 30,
					type: "INTRODUCTION" as const,
					order: 2,
				},
				{
					title: "共学时间",
					startMinute: 60,
					duration: 90,
					type: "LEARNING" as const,
					order: 3,
				},
				{
					title: "午餐和休息时间",
					startMinute: 150,
					duration: 90,
					type: "BREAK" as const,
					order: 4,
				},
				{
					title: "开发时间",
					startMinute: 240,
					duration: 180,
					type: "DEVELOPMENT" as const,
					order: 5,
				},
				{
					title: "路演展示时间",
					startMinute: 420,
					duration: 30,
					type: "DEMO" as const,
					order: 6,
				},
				{
					title: "颁奖和总结环节",
					startMinute: 450,
					duration: 30,
					type: "AWARD" as const,
					order: 7,
				},
			],
		},
		{
			name: "客厅 Demo 局 (Demo Day)",
			type: EventTemplateType.MEETUP,
			description: "2小时项目展示交流活动，适合获得反馈和建立连接",
			title: "客厅 Demo 局第{{期数}}期",
			defaultDescription:
				"欢迎参加客厅 Demo 局！在这里，你可以展示正在开发的项目，获得宝贵的反馈，并与其他创作者建立联系。",
			duration: 120, // 2小时
			maxAttendees: 30,
			requireApproval: true,
			isSystemTemplate: true,
			isActive: true,
			ticketTypes: [
				{
					name: "观众票",
					description: "普通观众参与",
					price: null,
					maxQuantity: null,
					requirements: "用户Profile必需有至少一个项目",
					sortOrder: 0,
				},
				{
					name: "分享者票",
					description: "项目分享者",
					price: null,
					maxQuantity: 6,
					requirements: "必须选择一个项目跟当前活动关联",
					sortOrder: 1,
				},
				{
					name: "付费观众票",
					description: "高级观众体验",
					price: 100,
					maxQuantity: null,
					requirements: "优先座位、茶歇、深度交流",
					sortOrder: 2,
				},
			],
			volunteerRoles: [
				{
					volunteerRoleId: roleMap.主持人,
					recruitCount: 1,
					description: "控制活动节奏，引导互动",
					cpReward: 60,
				},
				{
					volunteerRoleId: roleMap.技术支持组 || roleMap.主持人,
					recruitCount: 2,
					description: "场地布置、设备调试",
					cpReward: 30,
				},
				{
					volunteerRoleId: roleMap.技术支持组 || roleMap.主持人,
					recruitCount: 1,
					description: "设备调试、技术支持",
					cpReward: 40,
				},
			].filter((role) => role.volunteerRoleId),
			questions: [
				{
					question: "请选择要分享的项目",
					type: "SELECT" as const,
					required: true,
					targetRole: "speaker",
					order: 1,
				},
				{
					question: "本次主要想展示项目的哪些方面？",
					type: "TEXTAREA" as const,
					required: true,
					targetRole: "speaker",
					order: 2,
				},
				{
					question: "项目当前完成度",
					type: "SELECT" as const,
					options: ["10-30%", "30-50%", "50-70%", "70-90%"],
					required: true,
					targetRole: "speaker",
					order: 3,
				},
				{
					question: "最希望获得哪方面的反馈？",
					type: "CHECKBOX" as const,
					options: [
						"技术架构",
						"产品设计",
						"商业模式",
						"用户体验",
						"市场定位",
					],
					required: true,
					targetRole: "speaker",
					order: 4,
				},
				{
					question: "预计演示时间",
					type: "SELECT" as const,
					options: ["5分钟", "8分钟", "10分钟"],
					required: true,
					targetRole: "speaker",
					order: 5,
				},
				{
					question: "参加Demo Day的主要目的？",
					type: "CHECKBOX" as const,
					options: ["学习", "合作", "投资", "反馈", "网络建设"],
					required: false,
					targetRole: "audience",
					order: 6,
				},
			],
			schedules: [
				{
					title: "主持人介绍活动规则",
					startMinute: 0,
					duration: 5,
					type: "INTRODUCTION" as const,
					order: 1,
				},
				{
					title: "第一轮分享",
					description: "3位分享者 × 10分钟",
					startMinute: 5,
					duration: 30,
					type: "DEMO" as const,
					order: 2,
				},
				{
					title: "自由社交和茶歇时间",
					startMinute: 35,
					duration: 25,
					type: "BREAK" as const,
					order: 3,
				},
				{
					title: "第二轮分享",
					description: "3位分享者 × 10分钟",
					startMinute: 60,
					duration: 30,
					type: "DEMO" as const,
					order: 4,
				},
				{
					title: "总结交流和联系对接",
					startMinute: 90,
					duration: 30,
					type: "BREAK" as const,
					order: 5,
				},
			],
		},
		{
			name: "Building Public",
			type: EventTemplateType.BUILDING_PUBLIC,
			description: "21天线上打卡挑战活动，适合项目推进和习惯养成",
			title: "Building Public 第{{期数}}期",
			defaultDescription:
				"欢迎参加Building Public挑战！在21天内，每天打卡分享你的项目进展，与其他创作者一起公开构建，获得反馈和激励。",
			duration: 30240, // 21天 = 21 * 24 * 60 分钟
			maxAttendees: null,
			requireApproval: true,
			isSystemTemplate: true,
			isActive: true,
			ticketTypes: [
				{
					name: "挑战者",
					description: "Building Public挑战参与者",
					price: 100, // 押金
					maxQuantity: null,
					requirements: "必须关联开发项目，说明21天开发计划",
					sortOrder: 0,
				},
			],
			volunteerRoles: [
				{
					volunteerRoleId: roleMap.物料管理员 || roleMap.主持人, // 财务核实员用物料管理员代替
					recruitCount: 2,
					description: "核实打卡内容，管理押金结算",
					cpReward: 80,
				},
				{
					volunteerRoleId: roleMap.主持人,
					recruitCount: 3,
					description: "活跃社群，督促打卡，组织交流",
					cpReward: 60,
				},
			].filter((role) => role.volunteerRoleId),
			questions: [
				{
					question: "请选择要开发的项目",
					type: "SELECT" as const,
					required: true,
					targetRole: "participant",
					order: 1,
				},
				{
					question: "请描述你的21天开发计划",
					type: "TEXTAREA" as const,
					required: true,
					targetRole: "participant",
					order: 2,
				},
				{
					question: "你希望在21天内达成的具体目标",
					type: "TEXTAREA" as const,
					required: true,
					targetRole: "participant",
					order: 3,
				},
				{
					question: "是否愿意公开分享打卡内容",
					type: "RADIO" as const,
					options: ["完全公开", "仅报名者可见", "仅自己可见"],
					required: true,
					targetRole: "participant",
					order: 4,
				},
			],
		},
	];

	const createdTemplates = [];
	for (const template of templates) {
		try {
			// 检查模板是否已存在
			const existing = await db.eventTemplate.findFirst({
				where: { name: template.name },
			});

			if (existing) {
				console.warn(`模板 ${template.name} 已存在，跳过创建`);
				continue;
			}

			const created = await db.eventTemplate.create({
				data: {
					name: template.name,
					type: template.type,
					description: template.description,
					title: template.title,
					defaultDescription: template.defaultDescription,
					duration: template.duration,
					maxAttendees: template.maxAttendees,
					requireApproval: template.requireApproval,
					isSystemTemplate: template.isSystemTemplate,
					isActive: template.isActive,
					ticketTypes: {
						create: template.ticketTypes,
					},
					volunteerRoles: {
						create: template.volunteerRoles,
					},
					questions: {
						create: template.questions,
					},
					schedules: template.schedules
						? {
								create: template.schedules,
							}
						: undefined,
				},
			});
			createdTemplates.push(created);
		} catch (error) {
			console.warn(`模板 ${template.name} 创建失败:`, error);
		}
	}

	return createdTemplates;
}
