#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

const OLD_BASE =
	"https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com";
const NEW_BASE = "https://assets.hackathonweekly.com";
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
	for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

function quoteIdentifier(identifier) {
	return `"${identifier.replaceAll('"', '""')}"`;
}

async function findColumns(client) {
	const result = await client.query(
		`
			SELECT
				c.table_schema,
				c.table_name,
				c.column_name,
				pg_catalog.format_type(a.atttypid, a.atttypmod) AS formatted_type
			FROM information_schema.columns c
			JOIN information_schema.tables t
				ON t.table_schema = c.table_schema
				AND t.table_name = c.table_name
			JOIN pg_catalog.pg_namespace n
				ON n.nspname = c.table_schema
			JOIN pg_catalog.pg_class cls
				ON cls.relnamespace = n.oid
				AND cls.relname = c.table_name
			JOIN pg_catalog.pg_attribute a
				ON a.attrelid = cls.oid
				AND a.attname = c.column_name
			WHERE c.table_schema = 'public'
				AND t.table_type = 'BASE TABLE'
				AND (
					c.data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')
					OR c.data_type = 'ARRAY'
				)
			ORDER BY c.table_name, c.ordinal_position
		`,
	);

	const matched = [];
	for (const column of result.rows) {
		const table = `${quoteIdentifier(column.table_schema)}.${quoteIdentifier(column.table_name)}`;
		const field = quoteIdentifier(column.column_name);
		const count = await client.query(
			`SELECT COUNT(*)::integer AS count FROM ${table} WHERE ${field}::text LIKE $1`,
			[`%${OLD_BASE}%`],
		);
		if (count.rows[0].count === 0) continue;

		matched.push({
			tableSchema: column.table_schema,
			tableName: column.table_name,
			columnName: column.column_name,
			formattedType: column.formatted_type,
			rows: count.rows[0].count,
		});
	}

	return matched;
}

async function main() {
	const env = parseEnvFile(envFile);
	const client = new Client({
		connectionString: required(env.DATABASE_URL, "DATABASE_URL"),
	});
	await client.connect();

	try {
		const before = await findColumns(client);
		const timestamp = new Date().toISOString().replaceAll(":", "-");
		const manifestDir = path.join(
			rootDir,
			"temp/storage-migration",
			timestamp,
		);
		fs.mkdirSync(manifestDir, { recursive: true });

		if (!execute) {
			const result = {
				mode: "dry-run",
				oldBase: OLD_BASE,
				newBase: NEW_BASE,
				columns: before,
				totalRows: before.reduce((sum, column) => sum + column.rows, 0),
			};
			fs.writeFileSync(
				path.join(manifestDir, "url-rewrite.json"),
				`${JSON.stringify(result, null, 2)}\n`,
			);
			console.log(JSON.stringify({ ...result, manifestDir }, null, 2));
			return;
		}

		await client.query("BEGIN");
		const updates = [];
		try {
			for (const column of before) {
				const table = `${quoteIdentifier(column.tableSchema)}.${quoteIdentifier(column.tableName)}`;
				const field = quoteIdentifier(column.columnName);
				const formattedType = column.formattedType;
				if (!/^[a-zA-Z0-9_\[\] (),]+$/.test(formattedType)) {
					throw new Error(`Unsafe PostgreSQL type: ${formattedType}`);
				}

				const result = await client.query(
					`UPDATE ${table} SET ${field} = replace(${field}::text, $1, $2)::${formattedType} WHERE ${field}::text LIKE $3`,
					[OLD_BASE, NEW_BASE, `%${OLD_BASE}%`],
				);
				updates.push({
					column: `${column.tableName}.${column.columnName}`,
					rows: result.rowCount,
				});
			}

			const after = await findColumns(client);
			if (after.length > 0) {
				throw new Error(
					`Old storage URLs remain in ${after.length} columns`,
				);
			}
			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}

		const result = {
			mode: "execute",
			oldBase: OLD_BASE,
			newBase: NEW_BASE,
			before,
			updates,
			oldUrlColumnsRemaining: 0,
		};
		fs.writeFileSync(
			path.join(manifestDir, "url-rewrite.json"),
			`${JSON.stringify(result, null, 2)}\n`,
		);
		console.log(JSON.stringify({ ...result, manifestDir }, null, 2));
	} finally {
		await client.end();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
