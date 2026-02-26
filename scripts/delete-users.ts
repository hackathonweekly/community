#!/usr/bin/env tsx
// 使用方法，修改 userIdsToDelete 数组，然后运行：
//    bun run tsx scripts / delete -users.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const adapter = new PrismaPg(
	new Pool({ connectionString: process.env.DATABASE_URL }),
);
const prisma = new PrismaClient({ adapter });

// 要删除的用户ID列表 - 在这里修改需要删除的用户ID
const userIdsToDelete: any = [
	// 'user_id_1',
	// 'user_id_2',
	// 'user_id_3',
];

async function deleteUsers() {
	if (userIdsToDelete.length === 0) {
		console.log("⚠️  请在脚本中设置要删除的用户ID列表");
		return;
	}

	console.log("🗑️  开始删除用户...");
	console.log("要删除的用户ID:", userIdsToDelete);

	try {
		// 首先检查这些用户是否存在及其组织的活动
		console.log("\n📋 检查用户信息...");
		for (const userId of userIdsToDelete) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					email: true,
					username: true,
					createdAt: true,
					// 获取一些关联数据的计数
					_count: {
						select: {
							projects: true,
							contributions: true,
							organizedEvents: true,
							eventRegistrations: true,
							members: true,
						},
					},
					// 获取组织的活动详情
					organizedEvents: {
						select: {
							id: true,
							title: true,
							status: true,
							startTime: true,
							_count: {
								select: {
									registrations: true,
									projectSubmissions: true,
								},
							},
						},
					},
				},
			});

			if (user) {
				console.log(`✅ 找到用户: ${user.name} (${user.email})`);
				console.log(`   - 用户名: ${user.username || "未设置"}`);
				console.log(`   - 注册时间: ${user.createdAt.toISOString()}`);
				console.log(`   - 项目数: ${user._count.projects}`);
				console.log(`   - 贡献数: ${user._count.contributions}`);
				console.log(`   - 组织活动数: ${user._count.organizedEvents}`);
				console.log(
					`   - 活动报名数: ${user._count.eventRegistrations}`,
				);
				console.log(`   - 组织成员身份数: ${user._count.members}`);

				if (user.organizedEvents.length > 0) {
					console.log("   📅 组织的活动:");
					for (const event of user.organizedEvents) {
						console.log(`      - ${event.title} (${event.status})`);
						console.log(
							`        报名人数: ${event._count.registrations}, 项目提交数: ${event._count.projectSubmissions}`,
						);
						console.log(
							`        开始时间: ${event.startTime.toISOString()}`,
						);
					}
				}
				console.log("---");
			} else {
				console.log(`❌ 用户 ${userId} 不存在`);
			}
		}

		// 确认删除
		console.log("\n⚠️  警告: 删除用户将同时删除所有相关数据!");
		console.log(
			"包括: 项目、评论、点赞、书签、活动报名、贡献记录、组织的活动等所有相关数据",
		);
		console.log(
			"⚠️  注意: 如果用户是活动组织者，其组织的活动也将被完全删除!",
		);

		// 在生产环境中，你可能想要添加一个确认步骤
		// 这里我们直接执行删除

		console.log("\n🚀 开始执行删除操作...");

		let deletedCount = 0;

		for (const userId of userIdsToDelete) {
			try {
				// 使用事务确保数据一致性
				await prisma.$transaction(async (tx) => {
					// 首先处理用户组织的活动
					const userEvents = await tx.event.findMany({
						where: { organizerId: userId },
						select: { id: true, title: true },
					});

					if (userEvents.length > 0) {
						console.log(
							`🗑️  正在删除用户组织的 ${userEvents.length} 个活动...`,
						);
						for (const event of userEvents) {
							console.log(`   - 删除活动: ${event.title}`);
						}

						// 删除所有该用户组织的活动
						// 这将触发级联删除，删除所有相关的报名、签到、反馈等数据
						await tx.event.deleteMany({
							where: { organizerId: userId },
						});
					}

					// 现在可以安全删除用户了
					const deletedUser = await tx.user.delete({
						where: { id: userId },
					});

					console.log(
						`✅ 成功删除用户: ${deletedUser.name} (${deletedUser.email})`,
					);
					deletedCount++;
				});
			} catch (error: any) {
				if (error.code === "P2025") {
					console.log(`⚠️  用户 ${userId} 不存在，跳过`);
				} else {
					console.error(
						`❌ 删除用户 ${userId} 时出错:`,
						error.message,
					);
				}
			}
		}

		console.log(`\n🎉 删除完成! 共删除了 ${deletedCount} 个用户`);
	} catch (error) {
		console.error("❌ 执行过程中出现错误:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// 运行脚本
deleteUsers().catch(console.error);
