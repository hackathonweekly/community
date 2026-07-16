#!/usr/bin/env node

const {
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} = require("@aws-sdk/client-s3");
const { Client } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE_BUCKET = "hackweek-public-1303088253";
const OLD_HOST =
	"hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com";
const DESTINATION_BUCKET = "hackathonweekly-assets-prod";
const R2_ACCOUNT_ID = "4103ce09aa914f8f387eb86b66d23376";
const ABANDONED_SUBMISSION_PATTERN = /^events\/[^/]+\/submissions\//;
// The largest retained object is under 200 MB. Buffering two objects avoids
// cross-provider streaming incompatibilities while keeping memory bounded.
const CONCURRENCY = 2;
const REPO_TEMPLATE_KEYS = [
	"public/event-templates/tech-3-technology.jpeg",
	"public/event-templates/tech-4-technology.jpeg",
	"public/event-templates/tech-1-technology.jpeg",
	"public/event-templates/business-1-business.jpeg",
	"public/event-templates/social-1-social.jpeg",
	"public/event-templates/social-4-social.jpeg",
	"public/event-templates/tech-2-technology.jpeg",
	"public/event-templates/business-3-business.jpeg",
];

const rootDir = path.resolve(__dirname, "../../../../..");
const execute = process.argv.includes("--execute");
const envFileArgument = process.argv.find((argument) =>
	argument.startsWith("--env-file="),
);
const envFile = envFileArgument
	? path.resolve(rootDir, envFileArgument.slice("--env-file=".length))
	: path.join(rootDir, "apps/web/.env.local");

function parseEnvFile(filePath) {
	const values = {};
	const contents = fs.readFileSync(filePath, "utf8");

	for (const line of contents.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const separator = trimmed.indexOf("=");
		if (separator < 1) continue;

		const key = trimmed.slice(0, separator).trim();
		let value = trimmed.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values[key] = value;
	}

	return values;
}

function required(value, name) {
	if (!value) throw new Error(`Missing ${name}`);
	return value;
}

function formatBytes(bytes) {
	return `${(bytes / 1024 ** 3).toFixed(3)} GiB`;
}

function quoteIdentifier(identifier) {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function createSourceClient(sourceEnv) {
	const client = new S3Client({
		region: sourceEnv.S3_REGION || "ap-guangzhou",
		endpoint: required(sourceEnv.S3_ENDPOINT, "source S3_ENDPOINT"),
		forcePathStyle: false,
		credentials: {
			accessKeyId: required(
				sourceEnv.S3_ACCESS_KEY_ID,
				"source S3_ACCESS_KEY_ID",
			),
			secretAccessKey: required(
				sourceEnv.S3_SECRET_ACCESS_KEY,
				"source S3_SECRET_ACCESS_KEY",
			),
		},
	});

	client.middlewareStack.add(
		(next, context) => async (args) => {
			args.request.headers = {
				...args.request.headers,
				Appid: "1303088253",
			};

			// Tencent CI automatically applies paid image slimming on ordinary GETs.
			// Request the original so the copied bytes match COS HeadObject/ListObjects.
			if (
				context.commandName === "GetObjectCommand" &&
				/\.(?:avif|bmp|gif|jpe?g|png|webp)$/i.test(args.input.Key)
			) {
				args.request.query = {
					...args.request.query,
					"ci-process": "originImage",
				};
			}
			return next(args);
		},
		{ name: "tencentCosAppid", step: "build" },
	);

	return client;
}

function createDestinationClient() {
	return new S3Client({
		region: "auto",
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		forcePathStyle: false,
		credentials: {
			accessKeyId: required(
				process.env.R2_ACCESS_KEY_ID,
				"R2_ACCESS_KEY_ID",
			),
			secretAccessKey: required(
				process.env.R2_SECRET_ACCESS_KEY,
				"R2_SECRET_ACCESS_KEY",
			),
		},
	});
}

async function listObjects(client, bucket) {
	const objects = [];
	let continuationToken;

	do {
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				ContinuationToken: continuationToken,
			}),
		);

		for (const object of response.Contents ?? []) {
			if (!object.Key) continue;
			objects.push({
				key: object.Key,
				size: Number(object.Size ?? 0),
				etag: object.ETag ?? null,
				lastModified: object.LastModified?.toISOString() ?? null,
			});
		}

		continuationToken = response.IsTruncated
			? response.NextContinuationToken
			: undefined;
	} while (continuationToken);

	return objects.sort((left, right) => left.key.localeCompare(right.key));
}

function extractOldHostKeys(value) {
	const keys = new Set();
	const pattern = new RegExp(
		`https?:\\/\\/${OLD_HOST.replaceAll(".", "\\.")}\\/([^\\s\"'\\\\?#<>\\]\\}\\),]+)`,
		"g",
	);

	for (const match of String(value).matchAll(pattern)) {
		try {
			keys.add(decodeURIComponent(match[1]));
		} catch {
			keys.add(match[1]);
		}
	}

	return keys;
}

async function collectDatabaseReferences(databaseUrl, sourceObjects) {
	const client = new Client({ connectionString: databaseUrl });
	const sourceKeys = new Set(sourceObjects.map((object) => object.key));
	const references = new Set();
	const missingUrlKeys = new Set();
	const matchedColumns = [];

	await client.connect();
	try {
		const columnsResult = await client.query(`
			SELECT c.table_schema, c.table_name, c.column_name
			FROM information_schema.columns c
			JOIN information_schema.tables t
				ON t.table_schema = c.table_schema
				AND t.table_name = c.table_name
			WHERE c.table_schema = 'public'
				AND t.table_type = 'BASE TABLE'
				AND (
					c.data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')
					OR c.data_type = 'ARRAY'
				)
			ORDER BY c.table_name, c.ordinal_position
		`);

		for (const column of columnsResult.rows) {
			const table = `${quoteIdentifier(column.table_schema)}.${quoteIdentifier(column.table_name)}`;
			const field = quoteIdentifier(column.column_name);
			const result = await client.query(
				`SELECT ${field}::text AS value FROM ${table} WHERE ${field}::text LIKE $1`,
				[`%${OLD_HOST}%`],
			);

			if (result.rowCount === 0) continue;
			matchedColumns.push(
				`${column.table_name}.${column.column_name}`,
			);

			for (const row of result.rows) {
				for (const key of extractOldHostKeys(row.value)) {
					if (sourceKeys.has(key)) references.add(key);
					else missingUrlKeys.add(key);
				}
			}
		}
	} finally {
		await client.end();
	}

	for (const key of REPO_TEMPLATE_KEYS) {
		if (sourceKeys.has(key)) references.add(key);
		else missingUrlKeys.add(key);
	}

	return {
		keys: [...references].sort(),
		matchedColumns,
		missingUrlKeys: [...missingUrlKeys].sort(),
	};
}

async function withRetry(action, label, maxAttempts = 4) {
	let lastError;
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			return await action();
		} catch (error) {
			lastError = error;
			if (attempt === maxAttempts) break;
			await new Promise((resolve) =>
				setTimeout(resolve, 500 * 2 ** (attempt - 1)),
			);
		}
	}
	const detail =
		lastError instanceof Error
			? `${lastError.name}: ${lastError.message}`
			: String(lastError);
	throw new Error(`${label} failed after ${maxAttempts} attempts: ${detail}`, {
		cause: lastError,
	});
}

async function copyObject(source, destination, object) {
	const destinationHead = await destination
		.send(
			new HeadObjectCommand({
				Bucket: DESTINATION_BUCKET,
				Key: object.key,
			}),
		)
		.catch((error) => {
			if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
				return null;
			}
			throw error;
		});

	if (destinationHead && Number(destinationHead.ContentLength) === object.size) {
		return "skipped";
	}

	await withRetry(async () => {
		const [head, sourceObject] = await Promise.all([
			source.send(
				new HeadObjectCommand({ Bucket: SOURCE_BUCKET, Key: object.key }),
			),
			source.send(
				new GetObjectCommand({ Bucket: SOURCE_BUCKET, Key: object.key }),
			),
		]);

		if (!sourceObject.Body) {
			throw new Error("Source response did not contain a body");
		}
		const body = await sourceObject.Body.transformToByteArray();
		if (body.byteLength !== object.size) {
			throw new Error(
				`Source body size mismatch: expected ${object.size}, received ${body.byteLength}`,
			);
		}

		await destination.send(
			new PutObjectCommand({
				Bucket: DESTINATION_BUCKET,
				Key: object.key,
				Body: body,
				ContentLength: object.size,
				ContentType: head.ContentType,
				ContentDisposition: head.ContentDisposition,
				ContentEncoding: head.ContentEncoding,
				ContentLanguage: head.ContentLanguage,
				CacheControl: head.CacheControl,
				Expires: head.Expires,
				Metadata: head.Metadata,
			}),
		);
	}, `copy ${object.key}`);

	return "copied";
}

async function runPool(items, worker, concurrency) {
	let index = 0;
	let completed = 0;
	const results = [];

	async function runWorker() {
		while (true) {
			const currentIndex = index;
			index += 1;
			if (currentIndex >= items.length) return;

			results[currentIndex] = await worker(items[currentIndex]);
			completed += 1;
			if (completed % 50 === 0 || completed === items.length) {
				console.log(`Migration progress: ${completed}/${items.length}`);
			}
		}
	}

	await Promise.all(
		Array.from({ length: concurrency }, () => runWorker()),
	);
	return results;
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
	const sourceEnv = parseEnvFile(envFile);
	const source = createSourceClient(sourceEnv);
	const destination = createDestinationClient();
	const sourceObjects = await listObjects(source, SOURCE_BUCKET);
	const databaseReferences = await collectDatabaseReferences(
		required(
			process.env.DATABASE_URL || sourceEnv.DATABASE_URL,
			"DATABASE_URL",
		),
		sourceObjects,
	);

	if (databaseReferences.missingUrlKeys.length > 0) {
		throw new Error(
			`Referenced keys are missing from COS: ${databaseReferences.missingUrlKeys.length}`,
		);
	}

	const referencedKeys = new Set(databaseReferences.keys);
	const excludedObjects = sourceObjects.filter(
		(object) =>
			ABANDONED_SUBMISSION_PATTERN.test(object.key) &&
			!referencedKeys.has(object.key),
	);
	const excludedKeys = new Set(excludedObjects.map((object) => object.key));
	const includedObjects = sourceObjects.filter(
		(object) => !excludedKeys.has(object.key),
	);

	const timestamp = new Date().toISOString().replaceAll(":", "-");
	const manifestDir = path.join(
		rootDir,
		"temp/storage-migration",
		timestamp,
	);
	fs.mkdirSync(manifestDir, { recursive: true });

	const summary = {
		createdAt: new Date().toISOString(),
		mode: execute ? "execute" : "dry-run",
		sourceBucket: SOURCE_BUCKET,
		destinationBucket: DESTINATION_BUCKET,
		source: {
			objects: sourceObjects.length,
			bytes: sourceObjects.reduce((sum, object) => sum + object.size, 0),
		},
		references: {
			objects: databaseReferences.keys.length,
			matchedColumns: databaseReferences.matchedColumns,
		},
		excluded: {
			objects: excludedObjects.length,
			bytes: excludedObjects.reduce((sum, object) => sum + object.size, 0),
		},
		included: {
			objects: includedObjects.length,
			bytes: includedObjects.reduce((sum, object) => sum + object.size, 0),
		},
	};

	writeJson(path.join(manifestDir, "summary.json"), summary);
	writeJson(path.join(manifestDir, "source.json"), sourceObjects);
	writeJson(path.join(manifestDir, "references.json"), databaseReferences);
	writeJson(path.join(manifestDir, "excluded.json"), excludedObjects);
	writeJson(path.join(manifestDir, "included.json"), includedObjects);

	console.log(
		JSON.stringify(
			{
				...summary,
				source: {
					...summary.source,
					displayBytes: formatBytes(summary.source.bytes),
				},
				excluded: {
					...summary.excluded,
					displayBytes: formatBytes(summary.excluded.bytes),
				},
				included: {
					...summary.included,
					displayBytes: formatBytes(summary.included.bytes),
				},
				manifestDir,
			},
			null,
			2,
		),
	);

	if (!execute) return;

	const copyResults = await runPool(
		includedObjects,
		(object) => copyObject(source, destination, object),
		CONCURRENCY,
	);
	const destinationObjects = await listObjects(
		destination,
		DESTINATION_BUCKET,
	);
	const destinationByKey = new Map(
		destinationObjects.map((object) => [object.key, object]),
	);
	const failedVerification = includedObjects.filter((sourceObject) => {
		const destinationObject = destinationByKey.get(sourceObject.key);
		return !destinationObject || destinationObject.size !== sourceObject.size;
	});
	const missingReferences = databaseReferences.keys.filter((key) => {
		const sourceObject = sourceObjects.find((object) => object.key === key);
		const destinationObject = destinationByKey.get(key);
		return !sourceObject || destinationObject?.size !== sourceObject.size;
	});
	const unexpectedDestinationObjects = destinationObjects.filter(
		(object) => !includedObjects.some((included) => included.key === object.key),
	);

	const verification = {
		verifiedAt: new Date().toISOString(),
		copied: copyResults.filter((result) => result === "copied").length,
		skipped: copyResults.filter((result) => result === "skipped").length,
		destinationObjects: destinationObjects.length,
		failedVerification,
		missingReferences,
		unexpectedDestinationObjects,
	};
	writeJson(path.join(manifestDir, "verification.json"), verification);

	if (failedVerification.length > 0 || missingReferences.length > 0) {
		throw new Error(
			`R2 verification failed: ${failedVerification.length} object mismatches, ${missingReferences.length} missing references`,
		);
	}

	console.log(
		`R2 verification passed: ${includedObjects.length} objects, ${formatBytes(summary.included.bytes)}, ${databaseReferences.keys.length} referenced keys`,
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
