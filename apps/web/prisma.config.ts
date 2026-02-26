import { defineConfig } from "prisma/config";

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
