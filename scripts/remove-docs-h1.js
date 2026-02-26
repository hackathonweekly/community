#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const defaultDocsDir = path.join(rootDir, "apps", "web", "content", "docs");
const allowedExtensions = new Set([".md", ".mdx"]);

function printHelp() {
	console.log("Remove the first H1 (level-1) heading from docs MD/MDX files.");
	console.log("");
	console.log("Usage:");
	console.log("  node scripts/remove-docs-h1.js [--dry-run] [--dir <path>]");
	console.log("");
	console.log("Options:");
	console.log("  --dry-run       Show files that would change without writing");
	console.log("  --dir <path>    Override target directory (default: apps/web/content/docs)");
}

function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		dryRun: false,
		dir: defaultDocsDir
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}
		if (arg === "--dir") {
			const dirArg = args[i + 1];
			if (!dirArg) {
				console.error("Missing value for --dir");
				process.exit(1);
			}
			options.dir = path.isAbsolute(dirArg)
				? dirArg
				: path.resolve(rootDir, dirArg);
			i++;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			printHelp();
			process.exit(0);
		}
		console.error(`Unknown argument: ${arg}`);
		printHelp();
		process.exit(1);
	}

	return options;
}

async function listMarkdownFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			const nested = await listMarkdownFiles(fullPath);
			files.push(...nested);
			continue;
		}
		if (!entry.isFile()) {
			continue;
		}
		const ext = path.extname(entry.name).toLowerCase();
		if (allowedExtensions.has(ext)) {
			files.push(fullPath);
		}
	}

	return files;
}

function findFrontMatterEndIndex(lines) {
	if (!lines.length) {
		return 0;
	}
	if (!/^---\s*$/.test(lines[0])) {
		return 0;
	}
	for (let i = 1; i < lines.length; i++) {
		if (/^---\s*$/.test(lines[i])) {
			return i + 1;
		}
	}
	return 0;
}

function stripFirstH1(content) {
	const lines = content.split(/\r?\n/);
	const startIndex = findFrontMatterEndIndex(lines);
	let inCodeFence = false;
	let fenceMarker = "";

	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		if (!inCodeFence) {
			if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
				inCodeFence = true;
				fenceMarker = trimmed.slice(0, 3);
				continue;
			}

			if (/^\s{0,3}#\s+/.test(line)) {
				const nextLines = lines.slice(0, i).concat(lines.slice(i + 1));
				if (
					i < nextLines.length
					&& nextLines[i] === ""
					&& (i === 0 || nextLines[i - 1] === "")
				) {
					nextLines.splice(i, 1);
				}
				return {
					removed: true,
					content: nextLines.join("\n")
				};
			}
		} else if (trimmed.startsWith(fenceMarker)) {
			inCodeFence = false;
			fenceMarker = "";
		}
	}

	return { removed: false, content };
}

async function run() {
	const options = parseArgs();
	let stats = {
		checked: 0,
		changed: 0,
		skipped: 0
	};

	let files;
	try {
		files = await listMarkdownFiles(options.dir);
	} catch (error) {
		console.error(`Failed to read directory: ${options.dir}`);
		console.error(error);
		process.exit(1);
	}

	for (const filePath of files) {
		stats.checked++;
		const original = await fs.readFile(filePath, "utf8");
		const result = stripFirstH1(original);
		if (!result.removed) {
			stats.skipped++;
			continue;
		}
		stats.changed++;
		const relativePath = path.relative(rootDir, filePath);
		console.log(`${options.dryRun ? "[dry-run] " : ""}removed H1: ${relativePath}`);
		if (!options.dryRun) {
			await fs.writeFile(filePath, result.content, "utf8");
		}
	}

	console.log("");
	console.log(`Checked: ${stats.checked}`);
	console.log(`Updated: ${stats.changed}`);
	console.log(`No H1:   ${stats.skipped}`);

	if (options.dryRun) {
		console.log("");
		console.log("Dry-run mode: no files were modified.");
	}
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
