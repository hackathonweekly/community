#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 默认志愿者角色配置
const DEFAULT_VOLUNTEER_ROLES = [
	{
		name: "主持人",
		description: "活动流程主持",
		detailDescription:
			"负责活动全程主持，包括开场、介绍嘉宾、时间控制和结束致辞等。",
		iconUrl: "/icons/volunteer/host.svg",
		cpPoints: 20,
		sortOrder: 0,
	},
	{
		name: "签到接待",
		description: "负责签到和引导",
		detailDescription: "负责参与者签到、引导入场、发放物料和回答基本问题。",
		iconUrl: "/icons/volunteer/reception.svg",
		cpPoints: 15,
		sortOrder: 1,
	},
	{
		name: "技术支持",
		description: "技术设备维护",
		detailDescription:
			"负责音响、投影、直播设备的调试和维护，处理技术问题。",
		iconUrl: "/icons/volunteer/tech.svg",
		cpPoints: 15,
		sortOrder: 2,
	},
	{
		name: "记录摄影",
		description: "活动记录和摄影",
		detailDescription:
			"负责活动现场拍照、录像，记录精彩瞬间，后期整理分享。",
		iconUrl: "/icons/volunteer/photo.svg",
		cpPoints: 15,
		sortOrder: 3,
	},
	{
		name: "计时员",
		description: "时间管理和提醒",
		detailDescription:
			"负责各环节时间控制，提醒演讲者时间，确保活动按时进行。",
		iconUrl: "/icons/volunteer/timer.svg",
		cpPoints: 15,
		sortOrder: 4,
	},
	{
		name: "物料管理",
		description: "物料准备和管理",
		detailDescription: "负责活动物料的准备、分发、回收和整理工作。",
		iconUrl: "/icons/volunteer/material.svg",
		cpPoints: 15,
		sortOrder: 5,
	},
];

async function seedVolunteerRoles() {
	console.log("🌱 开始初始化志愿者角色...");

	try {
		// 检查是否已经存在志愿者角色
		const existingRoles = await prisma.volunteerRole.findMany();

		if (existingRoles.length > 0) {
			console.log(
				`📋 数据库中已存在 ${existingRoles.length} 个志愿者角色:`,
			);
			existingRoles.forEach((role, index) => {
				console.log(
					`   ${index + 1}. ${role.name} - ${role.description} (${role.cpPoints} CP)`,
				);
			});

			console.log("\n❓ 是否要清空现有角色并重新创建？");
			console.log(
				"   如果您想继续，请手动清空 volunteer_role 表或修改此脚本",
			);
			return;
		}

		// 使用事务批量创建角色
		const createdRoles = await prisma.$transaction(
			DEFAULT_VOLUNTEER_ROLES.map((role) =>
				prisma.volunteerRole.create({
					data: {
						name: role.name,
						description: role.description,
						detailDescription: role.detailDescription,
						iconUrl: role.iconUrl,
						cpPoints: role.cpPoints,
						sortOrder: role.sortOrder,
						isActive: true,
					},
				}),
			),
		);

		console.log(`✅ 成功创建 ${createdRoles.length} 个志愿者角色:`);
		createdRoles.forEach((role, index) => {
			console.log(
				`   ${index + 1}. ${role.name} - ${role.description} (${role.cpPoints} CP)`,
			);
		});

		console.log("\n🎉 志愿者角色初始化完成！");
		console.log("💡 现在您可以在活动创建页面中看到志愿者设置选项了");
	} catch (error) {
		console.error("❌ 初始化志愿者角色时出错:", error);
		throw error;
	}
}

async function main() {
	try {
		await seedVolunteerRoles();
	} catch (error) {
		console.error("脚本执行失败:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// 如果直接运行此脚本
if (require.main === module) {
	main();
}

export { seedVolunteerRoles };
