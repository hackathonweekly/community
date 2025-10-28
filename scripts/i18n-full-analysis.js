#!/usr/bin/env node

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

console.log("🌍 Starting comprehensive i18n analysis...\n");

// 创建报告目录
if (!fs.existsSync("reports")) {
	fs.mkdirSync("reports");
}

// 时间戳
const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
const reportDir = `reports/${timestamp}`;
fs.mkdirSync(reportDir, { recursive: true });

// 执行命令并捕获输出
function runCommand(command, description, outputFile = null) {
	console.log(`🔍 ${description}...`);
	try {
		const output = execSync(command, {
			encoding: "utf8",
			cwd: process.cwd(),
		});

		if (outputFile) {
			fs.writeFileSync(path.join(reportDir, outputFile), output);
		}

		// 检查输出中的关键信息
		const lines = output.split("\n");
		const summary = lines.find(
			(line) =>
				line.includes("No missing keys found") ||
				line.includes("Found") ||
				line.includes("missing keys") ||
				line.includes("unused keys") ||
				line.includes("invalid keys"),
		);

		if (summary) {
			if (
				summary.includes("No missing keys") ||
				summary.includes("No invalid")
			) {
				console.log(`  ✅ ${summary.trim()}`);
			} else {
				console.log(`  ⚠️  ${summary.trim()}`);
			}
		}

		return output;
	} catch (error) {
		console.log(`  ❌ Error: ${error.message.split("\n")[0]}`);
		if (outputFile) {
			fs.writeFileSync(
				path.join(reportDir, outputFile),
				`Error: ${error.message}`,
			);
		}
		return error.stdout || error.message;
	}
}

// 分析函数
async function runFullAnalysis() {
	console.log("📊 Running full i18n analysis for both languages\n");

	const results = {
		timestamp: new Date().toISOString(),
		summary: {},
		details: {},
	};

	// 1. 英文完整检查
	console.log("🇺🇸 === ENGLISH ANALYSIS ===");
	results.details.english = {};

	results.details.english.fullCheck = runCommand(
		"bun run i18n:check",
		"Complete English check",
		"en-full-check.txt",
	);

	results.details.english.missing = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source en --format next-intl --only missingKeys",
		"Missing English translations",
		"en-missing.txt",
	);

	results.details.english.unused = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source en --format next-intl --only unused --unused src",
		"Unused English translations",
		"en-unused.txt",
	);

	results.details.english.summary = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source en --format next-intl --reporter summary",
		"English summary report",
		"en-summary.txt",
	);

	// 2. 中文完整检查
	console.log("\n🇨🇳 === CHINESE ANALYSIS ===");
	results.details.chinese = {};

	results.details.chinese.fullCheck = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source zh --format next-intl",
		"Complete Chinese check",
		"zh-full-check.txt",
	);

	results.details.chinese.missing = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source zh --format next-intl --only missingKeys",
		"Missing Chinese translations",
		"zh-missing.txt",
	);

	results.details.chinese.summary = runCommand(
		"npx i18n-check --locales src/lib/i18n/translations --source zh --format next-intl --reporter summary",
		"Chinese summary report",
		"zh-summary.txt",
	);

	// 3. 生成统计摘要
	console.log("\n📈 === GENERATING SUMMARY ===");

	// 解析结果
	const enFullCheck = results.details.english.fullCheck;
	const zhFullCheck = results.details.chinese.fullCheck;
	const unusedKeys = results.details.english.unused;

	// 计算统计信息
	results.summary = {
		english: {
			hasValidationErrors: enFullCheck.includes("Found invalid keys"),
			hasMissingKeys:
				enFullCheck.includes("missing keys found") &&
				!enFullCheck.includes("No missing keys"),
			validationPassed:
				enFullCheck.includes("No missing keys found") &&
				enFullCheck.includes("No invalid translations found"),
		},
		chinese: {
			hasValidationErrors: zhFullCheck.includes("Found invalid keys"),
			hasMissingKeys:
				zhFullCheck.includes("missing keys found") &&
				!zhFullCheck.includes("No missing keys"),
			validationPassed:
				zhFullCheck.includes("No missing keys found") &&
				zhFullCheck.includes("No invalid translations found"),
		},
		unused: {
			count: (unusedKeys.match(/│ src\/lib\/i18n\/translations/g) || [])
				.length,
			hasUnusedKeys: unusedKeys.includes("Found unused keys"),
		},
	};

	// 生成总体报告
	const overallReport = generateOverallReport(results);
	fs.writeFileSync(
		path.join(reportDir, "00-OVERALL-REPORT.md"),
		overallReport,
	);

	// 保存详细结果
	fs.writeFileSync(
		path.join(reportDir, "analysis-results.json"),
		JSON.stringify(results, null, 2),
	);

	// 输出最终摘要
	console.log(`\n${"=".repeat(80)}`);
	console.log("🎯 FINAL SUMMARY");
	console.log("=".repeat(80));

	console.log(`\n📁 Reports saved to: ${reportDir}/`);
	console.log(`📄 Overall report: ${reportDir}/00-OVERALL-REPORT.md`);

	// 显示报告内容
	console.log(`\n${"=".repeat(80)}`);
	console.log("📄 DETAILED REPORT");
	console.log("=".repeat(80));
	try {
		const reportContent = fs.readFileSync(
			path.join(reportDir, "00-OVERALL-REPORT.md"),
			"utf8",
		);
		console.log(reportContent);
	} catch (error) {
		console.log("❌ Could not read report file");
	}

	console.log("\n🇺🇸 English:");
	console.log(
		`  ${results.summary.english.validationPassed ? "✅" : "❌"} Validation: ${results.summary.english.validationPassed ? "PASSED" : "FAILED"}`,
	);
	console.log(
		`  ${results.summary.english.hasMissingKeys ? "⚠️" : "✅"} Missing keys: ${results.summary.english.hasMissingKeys ? "FOUND" : "NONE"}`,
	);

	console.log("\n🇨🇳 Chinese:");
	console.log(
		`  ${results.summary.chinese.validationPassed ? "✅" : "❌"} Validation: ${results.summary.chinese.validationPassed ? "PASSED" : "FAILED"}`,
	);
	console.log(
		`  ${results.summary.chinese.hasMissingKeys ? "⚠️" : "✅"} Missing keys: ${results.summary.chinese.hasMissingKeys ? "FOUND" : "NONE"}`,
	);

	console.log("\n🧹 Cleanup opportunities:");
	console.log(
		`  ${results.summary.unused.hasUnusedKeys ? "⚠️" : "✅"} Unused keys: ${results.summary.unused.count || 0} found`,
	);

	const overallStatus =
		results.summary.english.validationPassed &&
		results.summary.chinese.validationPassed &&
		!results.summary.unused.hasUnusedKeys;

	console.log(
		`\n🎉 Overall status: ${overallStatus ? "✅ EXCELLENT" : "⚠️ NEEDS ATTENTION"}`,
	);

	if (!overallStatus) {
		console.log("\n🔧 Next steps:");
		if (!results.summary.english.validationPassed) {
			console.log("  - Fix English validation errors");
		}
		if (!results.summary.chinese.validationPassed) {
			console.log("  - Fix Chinese validation errors");
		}
		if (results.summary.unused.hasUnusedKeys) {
			console.log("  - Consider removing unused translation keys");
		}
	}

	console.log(`\n${"=".repeat(80)}`);
}

// 生成总体报告
function generateOverallReport(results) {
	const timestamp = new Date().toLocaleString();

	return `# i18n Analysis Report

Generated: ${timestamp}

## Summary

### English Translation Status
- **Validation**: ${results.summary.english.validationPassed ? "✅ PASSED" : "❌ FAILED"}
- **Missing Keys**: ${results.summary.english.hasMissingKeys ? "⚠️ FOUND" : "✅ NONE"}

### Chinese Translation Status  
- **Validation**: ${results.summary.chinese.validationPassed ? "✅ PASSED" : "❌ FAILED"}
- **Missing Keys**: ${results.summary.chinese.hasMissingKeys ? "⚠️ FOUND" : "✅ NONE"}

### Cleanup Opportunities
- **Unused Keys**: ${results.summary.unused.count || 0} found

## Detailed Reports

### English
- **Full Check**: \`en-full-check.txt\`
- **Missing Keys**: \`en-missing.txt\`
- **Unused Keys**: \`en-unused.txt\`
- **Summary**: \`en-summary.txt\`

### Chinese
- **Full Check**: \`zh-full-check.txt\`
- **Missing Keys**: \`zh-missing.txt\`
- **Summary**: \`zh-summary.txt\`

## Recommendations

${!results.summary.english.validationPassed ? "- 🔧 Fix English validation errors\n" : ""}
${!results.summary.chinese.validationPassed ? "- 🔧 Fix Chinese validation errors\n" : ""}
${results.summary.unused.hasUnusedKeys ? "- 🧹 Consider removing unused translation keys\n" : ""}
${results.summary.english.validationPassed && results.summary.chinese.validationPassed && !results.summary.unused.hasUnusedKeys ? "- 🎉 All translations are in excellent condition!\n" : ""}

## Usage

To run this analysis again:
\`\`\`bash
bun run i18n:analyze    # Full comprehensive analysis
bun run i18n:check      # Quick English validation
\`\`\`
`;
}

// 运行分析
runFullAnalysis().catch((error) => {
	console.error("❌ Analysis failed:", error);
	process.exit(1);
});
