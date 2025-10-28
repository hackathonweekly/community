import { initializeDefaultBadges } from "@/lib/database/prisma/queries/badges";
import { db } from "@/lib/database";

async function main() {
	console.log("🚀 初始化默认勋章...");

	try {
		const badges = await initializeDefaultBadges();
		console.log(`✅ 成功创建 ${badges.length} 个默认勋章:`);

		for (const badge of badges) {
			console.log(
				`  - ${badge.name} (${badge.rarity}): ${badge.description}`,
			);
		}

		// 检查现有勋章
		const allBadges = await db.badge.findMany();
		console.log(`\n📊 数据库中现有 ${allBadges.length} 个勋章:`);
		for (const badge of allBadges) {
			console.log(
				`  - ${badge.name} (${badge.rarity}): ${badge.description}`,
			);
		}

		console.log("\n✨ 初始化完成！");
	} catch (error) {
		console.error("❌ 初始化失败:", error);
	} finally {
		await db.$disconnect();
	}
}

main();
