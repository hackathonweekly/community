#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const nodeMajor = Number((process.versions.node || "0").split(".")[0]);
const prismaCliPath = path.join(
	process.cwd(),
	"node_modules",
	"prisma",
	"build",
	"index.js",
);

if (!fs.existsSync(prismaCliPath)) {
	console.error(
		`Prisma CLI not found at ${prismaCliPath}. Did you run 'bun install'?`,
	);
	process.exit(1);
}

const nodeArgs = [];
if (nodeMajor > 0 && nodeMajor < 20) {
	nodeArgs.push("--experimental-wasm-reftypes");
}

const result = spawnSync(
	process.execPath,
	nodeArgs.concat([prismaCliPath]).concat(process.argv.slice(2)),
	{ stdio: "inherit" },
);

process.exit(result.status === null ? 1 : result.status);

