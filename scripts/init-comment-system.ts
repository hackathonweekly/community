import { db } from "@/lib/database/prisma/client";

async function initCommentSystem() {
	console.log("初始化评论系统配置...");

	try {
		// 查找一个系统管理员用户
		const adminUser = await db.user.findFirst({
			where: { role: "super_admin" },
			select: { id: true, email: true },
		});

		if (!adminUser) {
			throw new Error("未找到系统管理员用户，请先创建管理员账户");
		}

		console.log(`使用管理员用户: ${adminUser.email}`);

		// 初始化评论系统配置
		const defaultConfig = {
			enabled: true,
			requireApproval: false,
			maxLength: 2000,
			allowAnonymous: false,
			rateLimit: 10,
		};

		await db.systemConfig.upsert({
			where: { key: "comment_system" },
			create: {
				key: "comment_system",
				value: defaultConfig,
				description: "评论系统全局配置",
				updatedBy: adminUser.id,
			},
			update: {
				value: defaultConfig,
				description: "评论系统全局配置",
				updatedBy: adminUser.id,
				updatedAt: new Date(),
			},
		});

		console.log("✅ 评论系统配置初始化完成");
		console.log("配置内容:", defaultConfig);
	} catch (error) {
		console.error("❌ 初始化失败:", error);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

if (require.main === module) {
	initCommentSystem();
}

export { initCommentSystem };
