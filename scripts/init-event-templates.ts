import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { config } from "dotenv";

// 加载环境变量
config({ path: "apps/web/.env.local" });

const adapter = new PrismaPg(
	new Pool({ connectionString: process.env.DATABASE_URL }),
);
const prisma = new PrismaClient({ adapter });

async function createEventTemplates() {
	console.log("📝 Creating event templates...");

	// 获取所有志愿者角色
	const volunteerRoles = await prisma.volunteerRole.findMany();
	const volunteerRoleMap = new Map(
		volunteerRoles.map((role) => [role.name, role.id]),
	);

	// 1. 迷你黑客松模板
	const hackathonTemplate = await prisma.eventTemplate.create({
		data: {
			name: "迷你黑客松模板",
			type: "HACKATHON_LEARNING",
			description: "全天学习+开发活动模板，适合技能提升和作品孵化",
			title: "AI创新迷你黑客松第{期数}期",
			defaultDescription: `## 活动介绍
本次迷你黑客松专注于AI创新应用开发，邀请大家一起学习最新技术，动手实现有趣的作品。

## 活动亮点
- 🎯 技术大牛现场指导
- 🤝 与志同道合的伙伴组队
- 🚀 48小时打造完整产品原型
- 🏆 优秀作品将获得奖励和展示机会

## 参与要求
- 有一定编程基础
- 带上你的想法和热情
- 准备好迎接挑战

## 注意事项
- 请提前准备开发环境
- 建议携带个人笔记本电脑
- 现场提供茶歇和午餐`,
			duration: 480, // 8小时
			maxAttendees: 50,
			requireApproval: true,
			isSystemTemplate: true,
			isActive: true,
		},
	});

	// 添加迷你黑客松的志愿者角色
	const hackathonVolunteerRoles = [
		{ name: "主持人", count: 1, cpReward: 50 },
		{ name: "场地协助", count: 2, cpReward: 30 },
		{ name: "计时员", count: 1, cpReward: 25 },
		{ name: "签到员", count: 1, cpReward: 25 },
		{ name: "技术导师", count: 3, cpReward: 80 },
	];

	for (const role of hackathonVolunteerRoles) {
		const roleId = volunteerRoleMap.get(role.name);
		if (roleId) {
			await prisma.eventTemplateVolunteerRole.create({
				data: {
					templateId: hackathonTemplate.id,
					volunteerRoleId: roleId,
					recruitCount: role.count,
					cpReward: role.cpReward,
					requireApproval: true,
				},
			});
		}
	}

	// 添加迷你黑客松的预设问题
	const hackathonQuestions = [
		{
			question: "有什么作品想法想要在活动中实现？",
			type: "TEXTAREA",
			required: true,
			targetRole: "all",
			order: 1,
		},
		{
			question: "是否愿意与其他参与者组队合作？",
			type: "RADIO",
			options: ["愿意", "更倾向于独立开发", "看情况"],
			required: true,
			targetRole: "all",
			order: 2,
		},
	];

	for (const question of hackathonQuestions) {
		await prisma.eventTemplateQuestion.create({
			data: {
				templateId: hackathonTemplate.id,
				question: question.question,
				type: question.type as any,
				options: question.options || [],
				required: question.required,
				targetRole: question.targetRole,
				order: question.order,
			},
		});
	}

	// 添加迷你黑客松的流程安排
	const hackathonSchedule = [
		{
			title: "签到和准备时间",
			startMinute: 0,
			duration: 30,
			type: "CHECK_IN",
			order: 1,
		},
		{
			title: "活动介绍和破冰环节",
			startMinute: 30,
			duration: 30,
			type: "INTRODUCTION",
			order: 2,
		},
		{
			title: "共学时间",
			startMinute: 60,
			duration: 90,
			type: "LEARNING",
			order: 3,
		},
		{
			title: "午餐和休息时间",
			startMinute: 150,
			duration: 90,
			type: "BREAK",
			order: 4,
		},
		{
			title: "开发时间",
			startMinute: 240,
			duration: 180,
			type: "DEVELOPMENT",
			order: 5,
		},
		{
			title: "路演展示时间",
			startMinute: 420,
			duration: 30,
			type: "DEMO",
			order: 6,
		},
		{
			title: "颁奖和总结环节",
			startMinute: 450,
			duration: 30,
			type: "AWARD",
			order: 7,
		},
	];

	for (const schedule of hackathonSchedule) {
		await prisma.eventTemplateSchedule.create({
			data: {
				templateId: hackathonTemplate.id,
				title: schedule.title,
				startMinute: schedule.startMinute,
				duration: schedule.duration,
				type: schedule.type as any,
				order: schedule.order,
			},
		});
	}

	console.log("✅ Created 迷你黑客松 template");

	// 2. 常规活动模板 (Demo Day)
	const demoDayTemplate = await prisma.eventTemplate.create({
		data: {
			name: "Demo Day模板",
			type: "MEETUP",
			description: "2小时作品分享交流活动模板，适合获得反馈和展示成果",
			title: "客厅 Demo 局 - Demo Day第{期数}期",
			defaultDescription: `## 活动介绍
Demo Day是一个展示和分享作品的平台，无论你的作品处于什么阶段，都欢迎来分享你的想法和进展。

## 活动形式
- 🎤 每位分享者有10分钟展示时间（5分钟Demo + 5分钟Q&A）
- 👥 最多6位分享者
- 🍵 提供茶歇和轻食
- 💬 自由交流和networking时间

## 适合人群
- 正在开发作品的创作者
- 想要获得反馈的开发者
- 对新作品感兴趣的观众
- 寻找合作伙伴的创业者

## 分享要求
- 必须关联一个实际作品
- 准备简短的演示内容
- 说明当前进度和遇到的挑战`,
			duration: 120, // 2小时
			maxAttendees: 30,
			requireApproval: true,
			isSystemTemplate: true,
			isActive: true,
		},
	});

	// 添加Demo Day的票种
	const demoDayTicketTypes = [
		{
			name: "观众票",
			description: "参与观看和互动",
			price: null,
			maxQuantity: 20,
			requirements: "用户Profile必须有至少一个作品",
			sortOrder: 1,
		},
		{
			name: "分享者票",
			description: "作品分享和展示",
			price: null,
			maxQuantity: 6,
			requirements: "必须选择一个作品与当前活动关联",
			sortOrder: 2,
		},
		{
			name: "付费观众票",
			description: "高级观众体验，包含茶歇",
			price: 100,
			maxQuantity: null,
			requirements: "无特殊要求",
			sortOrder: 3,
		},
	];

	for (const ticketType of demoDayTicketTypes) {
		await prisma.eventTemplateTicketType.create({
			data: {
				templateId: demoDayTemplate.id,
				name: ticketType.name,
				description: ticketType.description,
				price: ticketType.price,
				maxQuantity: ticketType.maxQuantity,
				requirements: ticketType.requirements,
				sortOrder: ticketType.sortOrder,
			},
		});
	}

	// 添加Demo Day的志愿者角色
	const demoDayVolunteerRoles = [
		{ name: "主持人", count: 1, cpReward: 60 },
		{ name: "场地协助", count: 1, cpReward: 30 },
		{ name: "技术员", count: 1, cpReward: 40 },
	];

	for (const role of demoDayVolunteerRoles) {
		const roleId = volunteerRoleMap.get(role.name);
		if (roleId) {
			await prisma.eventTemplateVolunteerRole.create({
				data: {
					templateId: demoDayTemplate.id,
					volunteerRoleId: roleId,
					recruitCount: role.count,
					cpReward: role.cpReward,
					requireApproval: true,
				},
			});
		}
	}

	// 添加Demo Day的预设问题
	const demoDayQuestions = [
		{
			question: "请选择要分享的作品",
			type: "TEXT",
			required: true,
			targetRole: "speaker",
			order: 1,
		},
		{
			question: "本次主要想展示作品的哪些方面？",
			type: "TEXTAREA",
			required: true,
			targetRole: "speaker",
			order: 2,
		},
		{
			question: "作品当前完成度",
			type: "SELECT",
			options: ["10%-30%", "30%-50%", "50%-70%", "70%-90%", "90%以上"],
			required: true,
			targetRole: "speaker",
			order: 3,
		},
		{
			question: "最希望获得哪方面的反馈？",
			type: "CHECKBOX",
			options: [
				"技术实现",
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
			type: "RADIO",
			options: ["5分钟", "8分钟", "10分钟"],
			required: true,
			targetRole: "speaker",
			order: 5,
		},
		{
			question: "参加Demo Day的主要目的？",
			type: "RADIO",
			options: ["学习他人经验", "寻找合作机会", "获得投资", "纯粹兴趣"],
			required: true,
			targetRole: "audience",
			order: 6,
		},
	];

	for (const question of demoDayQuestions) {
		await prisma.eventTemplateQuestion.create({
			data: {
				templateId: demoDayTemplate.id,
				question: question.question,
				type: question.type as any,
				options: question.options || [],
				required: question.required,
				targetRole: question.targetRole,
				order: question.order,
			},
		});
	}

	// 添加Demo Day的流程安排
	const demoDaySchedule = [
		{
			title: "主持人介绍活动规则",
			startMinute: 0,
			duration: 5,
			type: "INTRODUCTION",
			order: 1,
		},
		{
			title: "第一轮分享 (3位分享者)",
			startMinute: 5,
			duration: 30,
			type: "DEMO",
			order: 2,
		},
		{
			title: "自由社交和茶歇时间",
			startMinute: 35,
			duration: 25,
			type: "NETWORKING",
			order: 3,
		},
		{
			title: "第二轮分享 (3位分享者)",
			startMinute: 60,
			duration: 30,
			type: "DEMO",
			order: 4,
		},
		{
			title: "总结交流和联系对接",
			startMinute: 90,
			duration: 30,
			type: "NETWORKING",
			order: 5,
		},
	];

	for (const schedule of demoDaySchedule) {
		await prisma.eventTemplateSchedule.create({
			data: {
				templateId: demoDayTemplate.id,
				title: schedule.title,
				startMinute: schedule.startMinute,
				duration: schedule.duration,
				type: schedule.type as any,
				order: schedule.order,
			},
		});
	}

	console.log("✅ Created Demo Day template");

	return {
		hackathonTemplate,
		demoDayTemplate,
	};
}

async function main() {
	try {
		console.log("🚀 Starting event templates initialization...");

		const templates = await createEventTemplates();

	console.log("📊 Summary:");
	console.log(`- 迷你黑客松模板 ID: ${templates.hackathonTemplate.id}`);
	console.log(`- Demo Day模板 ID: ${templates.demoDayTemplate.id}`);

	console.log(
			"✨ Event templates initialization completed successfully!",
		);
	} catch (error) {
		console.error("❌ Error during templates initialization:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

export { createEventTemplates };
