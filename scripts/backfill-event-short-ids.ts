import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const EVENT_SHORT_ID_LENGTH = 8;

function generateEventShortId(): string {
	return nanoid(EVENT_SHORT_ID_LENGTH);
}

async function main() {
	console.log("Backfilling shortId for existing events...");

	const events = await db.event.findMany({
		where: { shortId: null },
		select: { id: true },
	});

	console.log(`Found ${events.length} events without shortId`);

	let updated = 0;
	for (const event of events) {
		let shortId = generateEventShortId();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await db.event.findUnique({
				where: { shortId },
				select: { id: true },
			});
			if (!existing) break;
			shortId = generateEventShortId();
			attempts++;
		}

		await db.event.update({
			where: { id: event.id },
			data: { shortId },
		});
		updated++;
	}

	console.log(`Updated ${updated} events with shortId`);
}

main()
	.catch((e) => {
		console.error("Error:", e);
		process.exit(1);
	})
	.finally(() => db.$disconnect());
