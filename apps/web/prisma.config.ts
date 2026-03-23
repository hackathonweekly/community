import { defineConfig } from "prisma/config";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv();
loadDotenv({ path: resolve(process.cwd(), ".env.local") });
loadDotenv({ path: resolve(process.cwd(), ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env.local") });
loadDotenv({ path: resolve(process.cwd(), "../../.env") });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
	schema: "../../packages/lib-server/src/database/prisma/schema.prisma",
	datasource: databaseUrl
		? {
				url: databaseUrl,
			}
		: undefined,
	migrations: {
		path: "../../packages/lib-server/src/database/prisma/migrations",
	},
});
