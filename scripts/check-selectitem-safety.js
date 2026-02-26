#!/usr/bin/env node

// Script to detect potential SelectItem empty value issues
// Run with: node scripts/check-selectitem-safety.js

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Patterns that might indicate unsafe SelectItem usage
const unsafePatterns = [
	// Direct property access in SelectItem value
	{
		pattern: /<SelectItem[^>]+value=\{[^}]*\.[^}]+\}/g,
		message: "Direct property access in SelectItem value - may be empty",
		severity: "warning",
	},

	// Map without filter before SelectItem
	{
		pattern:
			/\.map\([^)]*\(\s*[^)]*\)\s*=>\s*[^)]*<SelectItem[^>]+value=\{[^}]*\.[^}]*\}/g,
		message: "Map without filter creating SelectItem with property access",
		severity: "error",
	},

	// SelectItem with variable that might be empty
	{
		pattern: /<SelectItem[^>]+value=\{(?!['"`])[^}]+\}/g,
		message: "SelectItem using variable value - ensure it's not empty",
		severity: "info",
	},
];

function checkFile(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	const issues = [];

	unsafePatterns.forEach(({ pattern, message, severity }) => {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const lines = content.substring(0, match.index).split("\n");
			const lineNumber = lines.length;
			const lineContent = lines[lines.length - 1] + match[0];

			issues.push({
				file: filePath,
				line: lineNumber,
				severity,
				message,
				content: lineContent.trim(),
			});
		}
	});

	return issues;
}

function main() {
	console.log("🔍 Checking for unsafe SelectItem patterns...\n");

	// Find all TypeScript/JavaScript React files
	const files = glob.sync(
		"{apps/web/src,packages/ui/src,packages/lib-client/src,packages/lib-server/src,packages/lib-shared/src,packages/config/src}/**/*.{tsx,jsx,ts,js}",
		{ cwd: process.cwd() },
	);

	let totalIssues = 0;
	const issuesByFile = {};

	files.forEach((file) => {
		const issues = checkFile(file);
		if (issues.length > 0) {
			issuesByFile[file] = issues;
			totalIssues += issues.length;
		}
	});

	// Report results
	if (totalIssues === 0) {
		console.log("✅ No unsafe SelectItem patterns detected!");
		return;
	}

	console.log(`⚠️  Found ${totalIssues} potential issues:\n`);

	Object.entries(issuesByFile).forEach(([file, issues]) => {
		console.log(`📁 ${file}:`);
		issues.forEach(({ line, severity, message, content }) => {
			const icon =
				severity === "error"
					? "❌"
					: severity === "warning"
						? "⚠️"
						: "ℹ️";
			console.log(`  ${icon} Line ${line}: ${message}`);
			console.log(
				`     ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
			);
		});
		console.log("");
	});

	// Provide fix suggestions
	console.log("🔧 Fix suggestions:");
	console.log("1. Add .filter() before .map() to exclude empty values");
	console.log("2. Use fallback values: value={item.slug || item.id}");
	console.log(
		"3. Use the SafeSelectItem component from packages/ui/src/ui/SafeSelectItem.tsx",
	);
	console.log(
		'4. Add runtime checks: item.field && item.field.trim() !== ""',
	);

	process.exit(totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
	main();
}
