import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const BATCH_SIZE = 500;
const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const dryRun = process.argv.includes("--dry-run");

interface LegacyPathMapping {
	pathname: string;
	query?: Record<string, string>;
}

function mapLegacyAppPath(pathname: string): LegacyPathMapping | null {
	if (!pathname.startsWith("/app")) {
		return null;
	}

	if (pathname === "/app" || pathname === "/app/") {
		return { pathname: "/" };
	}

	if (pathname === "/app/events") {
		return { pathname: "/events", query: { tab: "my" } };
	}

	if (pathname === "/app/projects") {
		return { pathname: "/projects", query: { tab: "my" } };
	}

	if (pathname === "/app/tasks") {
		return { pathname: "/tasks", query: { tab: "my" } };
	}

	if (pathname.startsWith("/app/organization-invitation")) {
		return {
			pathname: pathname.replace(
				"/app/organization-invitation",
				"/orgs/organization-invitation",
			),
		};
	}

	if (pathname.startsWith("/app/profile")) {
		return { pathname: pathname.replace("/app/profile", "/me") };
	}

	if (pathname.startsWith("/app/settings")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/admin")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/notifications")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/events/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/projects/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	if (pathname.startsWith("/app/tasks/")) {
		return { pathname: pathname.replace("/app", "") };
	}

	const orgMatch = pathname.match(/^\/app\/([^/]+)(\/.*)?$/);
	if (orgMatch) {
		const slug = orgMatch[1];
		const rest = orgMatch[2] ?? "";
		return { pathname: `/orgs/${slug}/manage${rest}` };
	}

	return { pathname: pathname.replace("/app", "") };
}

function normalizeNotificationActionUrl(actionUrl: string): string {
	const trimmedUrl = actionUrl.trim();
	if (!trimmedUrl) {
		return actionUrl;
	}

	try {
		if (trimmedUrl.startsWith("//")) {
			return actionUrl;
		}

		if (ABSOLUTE_URL_PATTERN.test(trimmedUrl)) {
			const parsedUrl = new URL(trimmedUrl);
			const legacyMapping = mapLegacyAppPath(parsedUrl.pathname);
			if (!legacyMapping) {
				return actionUrl;
			}

			const searchParams = new URLSearchParams(parsedUrl.search);
			if (legacyMapping.query) {
				for (const [key, value] of Object.entries(legacyMapping.query)) {
					searchParams.set(key, value);
				}
			}
			const search = searchParams.toString();
			return `${legacyMapping.pathname}${search ? `?${search}` : ""}${parsedUrl.hash}`;
		}

		const parsedUrl = new URL(trimmedUrl, "https://community.local");
		const legacyMapping = mapLegacyAppPath(parsedUrl.pathname);
		if (!legacyMapping) {
			return actionUrl;
		}

		const searchParams = new URLSearchParams(parsedUrl.search);
		if (legacyMapping.query) {
			for (const [key, value] of Object.entries(legacyMapping.query)) {
				searchParams.set(key, value);
			}
		}
		const search = searchParams.toString();
		return `${legacyMapping.pathname}${search ? `?${search}` : ""}${parsedUrl.hash}`;
	} catch {
		return actionUrl;
	}
}

async function main() {
	console.log(
		`${dryRun ? "[dry-run] " : ""}Backfilling legacy notification action URLs...`,
	);

	let cursor: string | undefined;
	let scanned = 0;
	let matched = 0;
	let updated = 0;
	const sampleChanges: Array<{ id: string; from: string; to: string }> = [];

	while (true) {
		const rows = await db.notification.findMany({
			where: {
				actionUrl: {
					not: null,
				},
			},
			select: {
				id: true,
				actionUrl: true,
			},
			orderBy: {
				id: "asc",
			},
			take: BATCH_SIZE,
			...(cursor
				? {
						cursor: { id: cursor },
						skip: 1,
					}
				: {}),
		});

		if (rows.length === 0) {
			break;
		}

		cursor = rows[rows.length - 1].id;
		scanned += rows.length;

		for (const row of rows) {
			if (!row.actionUrl) {
				continue;
			}

			const normalized = normalizeNotificationActionUrl(row.actionUrl);
			if (normalized === row.actionUrl) {
				continue;
			}

			matched += 1;
			if (sampleChanges.length < 10) {
				sampleChanges.push({
					id: row.id,
					from: row.actionUrl,
					to: normalized,
				});
			}

			if (dryRun) {
				continue;
			}

			await db.notification.update({
				where: { id: row.id },
				data: { actionUrl: normalized },
			});
			updated += 1;
		}

		console.log(`Scanned ${scanned} notifications...`);
	}

	console.log(`Scanned total: ${scanned}`);
	console.log(`Legacy actionUrl matched: ${matched}`);
	console.log(`${dryRun ? "Would update" : "Updated"}: ${dryRun ? matched : updated}`);

	if (sampleChanges.length > 0) {
		console.log("Sample changes:");
		for (const sample of sampleChanges) {
			console.log(`- ${sample.id}`);
			console.log(`  from: ${sample.from}`);
			console.log(`  to:   ${sample.to}`);
		}
	}
}

main()
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
		await pool.end();
	});
