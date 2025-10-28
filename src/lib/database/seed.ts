import { initializeDefaultBadges } from "./prisma/queries/badges";
import { initializeEventTemplates } from "./prisma/queries/event-templates";
import { initializeSystemFunctionalRoles } from "./prisma/queries/functional-roles";

async function runSeeds() {
	try {
		console.log("Starting database seeding...");

		// Initialize default badges
		console.log("🚀 初始化默认勋章...");
		const badges = await initializeDefaultBadges();
		console.log(`✅ 成功创建 ${badges.length} 个默认勋章`);

		// Initialize event templates
		console.log("🚀 初始化活动模板...");
		const templates = await initializeEventTemplates();
		console.log(`✅ 成功创建 ${templates.length} 个活动模板`);

		// Initialize system functional roles
		console.log("🚀 初始化系统预设职能角色...");
		const functionalRoles = await initializeSystemFunctionalRoles();
		console.log(`✅ 成功同步 ${functionalRoles.length} 个系统预设职能角色`);

		console.log("Database seeding completed successfully!");
	} catch (error) {
		console.error("Database seeding failed:", error);
		process.exit(1);
	}
}

// Run seeds if this file is executed directly
if (require.main === module) {
	runSeeds();
}

export { runSeeds };
