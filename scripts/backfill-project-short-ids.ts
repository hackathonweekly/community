import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const PROJECT_SHORT_ID_LENGTH = 8;

function generateProjectShortId(): string {
	return nanoid(PROJECT_SHORT_ID_LENGTH);
}

async function main() {
	console.log("Backfilling shortId for existing projects...");

	const projects = await db.project.findMany({
		where: { shortId: null },
		select: { id: true },
	});

	console.log(`Found ${projects.length} projects without shortId`);

	let updated = 0;
	for (const project of projects) {
		let shortId = generateProjectShortId();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await db.project.findUnique({
				where: { shortId },
				select: { id: true },
			});
			if (!existing) break;
			shortId = generateProjectShortId();
			attempts++;
		}

		await db.project.update({
			where: { id: project.id },
			data: { shortId },
		});
		updated++;
	}

	console.log(`Updated ${updated} projects with shortId`);
}

main()
	.catch((e) => {
		console.error("Error:", e);
		process.exit(1);
	})
	.finally(() => db.$disconnect());
