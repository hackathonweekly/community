import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
	console.log("Backfilling commentCount for posts...");

	const postResult = await db.$executeRawUnsafe(`
		UPDATE "post" p
		SET "commentCount" = (
			SELECT COUNT(*)::int
			FROM "comment" c
			WHERE c."entityType" = 'POST'
				AND c."entityId" = p."id"
				AND c."isDeleted" = false
		)
	`);

	console.log(`Updated ${postResult} posts with correct commentCount`);

	console.log("Backfilling replyCount for comments...");

	const replyResult = await db.$executeRawUnsafe(`
		UPDATE "comment" c
		SET "replyCount" = (
			SELECT COUNT(*)::int
			FROM "comment" r
			WHERE r."parentId" = c."id"
				AND r."isDeleted" = false
		)
	`);

	console.log(`Updated ${replyResult} comments with correct replyCount`);
}

main()
	.catch((e) => {
		console.error("Error:", e);
		process.exit(1);
	})
	.finally(() => db.$disconnect());
