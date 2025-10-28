import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

// 加载环境变量
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function createVolunteerRoles() {
	console.log("🔧 Creating volunteer roles...");

	const volunteerRoles = [
		// 迷你黑客松志愿者角色
		{
			name: "主持人",
			description: "负责活动流程主持和氛围调动",
			detailDescription:
				"引导活动流程，维护现场秩序，调动参与者积极性，确保活动顺利进行",
			iconUrl: "/icons/volunteer/host.svg",
			cpPoints: 50,
			isActive: true,
			sortOrder: 1,
		},
		{
			name: "场地协助",
			description: "负责场地布置、设备调试等",
			detailDescription:
				"协助场地布置，设备调试，物料准备，维护现场环境整洁",
			iconUrl: "/icons/volunteer/venue.svg",
			cpPoints: 30,
			isActive: true,
			sortOrder: 2,
		},
		{
			name: "计时员",
			description: "负责各环节时间控制和提醒",
			detailDescription:
				"把控活动时间节奏，提醒各环节时间进度，确保活动按时进行",
			iconUrl: "/icons/volunteer/timer.svg",
			cpPoints: 25,
			isActive: true,
			sortOrder: 3,
		},
		{
			name: "签到员",
			description: "负责参与者签到和人员统计",
			detailDescription:
				"组织参与者签到，统计参与人数，发放活动物料，引导入场",
			iconUrl: "/icons/volunteer/checkin.svg",
			cpPoints: 25,
			isActive: true,
			sortOrder: 4,
		},
		{
			name: "技术导师",
			description: "提供技术指导和答疑支持",
			detailDescription:
				"为参与者提供技术指导，解答开发过程中的问题，分享技术经验",
			iconUrl: "/icons/volunteer/mentor.svg",
			cpPoints: 80,
			isActive: true,
			sortOrder: 5,
		},
		{
			name: "技术员",
			description: "设备调试、技术支持",
			detailDescription:
				"负责现场设备调试，解决技术问题，维护网络和音响设备正常运行",
			iconUrl: "/icons/volunteer/tech.svg",
			cpPoints: 40,
			isActive: true,
			sortOrder: 6,
		},
		// Building Public专用志愿者角色
		{
			name: "财务核实员",
			description: "核实打卡内容，管理押金结算",
			detailDescription:
				"审核参与者打卡内容，统计打卡次数，管理押金收取和退还流程",
			iconUrl: "/icons/volunteer/finance.svg",
			cpPoints: 80,
			isActive: true,
			sortOrder: 7,
		},
		{
			name: "气氛组主持人",
			description: "活跃社群，督促打卡，组织交流",
			detailDescription:
				"在社群中活跃氛围，督促大家按时打卡，组织交流分享，维护社群活跃度",
			iconUrl: "/icons/volunteer/community.svg",
			cpPoints: 60,
			isActive: true,
			sortOrder: 8,
		},
	];

	for (const role of volunteerRoles) {
		await prisma.volunteerRole.upsert({
			where: { name: role.name },
			update: role,
			create: role,
		});
	}

	console.log(`✅ Created ${volunteerRoles.length} volunteer roles`);
}

async function createAwards() {
	console.log("🏆 Creating awards...");

	const awards = [
		// 黑客松奖项
		{
			name: "一等奖",
			description: "黑客松活动一等奖",
			category: "GENERAL" as const,
			level: "FIRST" as const,
			iconUrl: "/icons/awards/first.svg",
			badgeUrl: "/badges/first-place.png",
			color: "#FFD700",
			cpReward: 200,
			sortOrder: 1,
		},
		{
			name: "二等奖",
			description: "黑客松活动二等奖",
			category: "GENERAL" as const,
			level: "SECOND" as const,
			iconUrl: "/icons/awards/second.svg",
			badgeUrl: "/badges/second-place.png",
			color: "#C0C0C0",
			cpReward: 100,
			sortOrder: 2,
		},
		{
			name: "三等奖",
			description: "黑客松活动三等奖",
			category: "GENERAL" as const,
			level: "THIRD" as const,
			iconUrl: "/icons/awards/third.svg",
			badgeUrl: "/badges/third-place.png",
			color: "#CD7F32",
			cpReward: 50,
			sortOrder: 3,
		},
		{
			name: "最佳技术创新奖",
			description: "表彰在技术创新方面表现突出的作品",
			category: "TECHNICAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/tech-innovation.svg",
			badgeUrl: "/badges/tech-innovation.png",
			color: "#4F46E5",
			cpReward: 100,
			sortOrder: 4,
		},
		{
			name: "最佳产品设计奖",
			description: "表彰在产品设计方面表现优秀的作品",
			category: "CREATIVE" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/design.svg",
			badgeUrl: "/badges/best-design.png",
			color: "#EC4899",
			cpReward: 100,
			sortOrder: 5,
		},
		{
			name: "最具商业价值奖",
			description: "表彰具有商业潜力和价值的作品",
			category: "COMMERCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/business.svg",
			badgeUrl: "/badges/business-value.png",
			color: "#059669",
			cpReward: 100,
			sortOrder: 6,
		},
		{
			name: "最佳团队协作奖",
			description: "表彰团队协作优秀的作品",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/teamwork.svg",
			badgeUrl: "/badges/teamwork.png",
			color: "#DC2626",
			cpReward: 80,
			sortOrder: 7,
		},
		{
			name: "参与奖",
			description: "感谢积极参与活动的作品",
			category: "GENERAL" as const,
			level: "PARTICIPATION" as const,
			iconUrl: "/icons/awards/participation.svg",
			badgeUrl: "/badges/participation.png",
			color: "#6B7280",
			cpReward: 20,
			sortOrder: 8,
		},
		// Demo Day奖项
		{
			name: "最受观众喜爱奖",
			description: "Demo Day活动中最受观众喜爱的作品",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/audience-choice.svg",
			badgeUrl: "/badges/audience-choice.png",
			color: "#F59E0B",
			cpReward: 120,
			sortOrder: 9,
		},
		{
			name: "最具投资价值奖",
			description: "Demo Day活动中最具投资潜力的作品",
			category: "COMMERCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/investment.svg",
			badgeUrl: "/badges/investment-potential.png",
			color: "#10B981",
			cpReward: 150,
			sortOrder: 10,
		},
		{
			name: "最佳演示奖",
			description: "Demo Day活动中演示效果最佳的作品",
			category: "CREATIVE" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/presentation.svg",
			badgeUrl: "/badges/best-demo.png",
			color: "#8B5CF6",
			cpReward: 100,
			sortOrder: 11,
		},
		{
			name: "最有潜力奖",
			description: "Demo Day活动中最有发展潜力的作品",
			category: "GENERAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/potential.svg",
			badgeUrl: "/badges/potential.png",
			color: "#06B6D4",
			cpReward: 100,
			sortOrder: 12,
		},
		// Building Public奖项
		{
			name: "最佳坚持奖",
			description: "Building Public活动中完成所有打卡的参与者",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/persistence.svg",
			badgeUrl: "/badges/persistence.png",
			color: "#EF4444",
			cpReward: 150,
			sortOrder: 13,
		},
		{
			name: "最佳作品奖",
			description: "Building Public活动中获得最多点赞的作品",
			category: "GENERAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/best-project.svg",
			badgeUrl: "/badges/best-project.png",
			color: "#F97316",
			cpReward: 200,
			sortOrder: 14,
		},
		{
			name: "最受关注奖",
			description: "Building Public活动中获得最多关注的作品",
			category: "SOCIAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/attention.svg",
			badgeUrl: "/badges/most-attention.png",
			color: "#84CC16",
			cpReward: 100,
			sortOrder: 15,
		},
		{
			name: "最具进步奖",
			description: "Building Public活动中进步最大的作品",
			category: "GENERAL" as const,
			level: "SPECIAL" as const,
			iconUrl: "/icons/awards/progress.svg",
			badgeUrl: "/badges/most-progress.png",
			color: "#06B6D4",
			cpReward: 120,
			sortOrder: 16,
		},
	];

	for (const award of awards) {
		await prisma.award.upsert({
			where: { name: award.name },
			update: award,
			create: award,
		});
	}

	console.log(`✅ Created ${awards.length} awards`);
}

async function main() {
	try {
		console.log("🚀 Starting data initialization...");

		await createVolunteerRoles();
		await createAwards();

		console.log("✨ Data initialization completed successfully!");
	} catch (error) {
		console.error("❌ Error during data initialization:", error);
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

export { createVolunteerRoles, createAwards };
