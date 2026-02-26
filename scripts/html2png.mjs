#!/usr/bin/env node
/**
 * HTML to PNG converter using Puppeteer.
 * Usage: node scripts/html2png.mjs <html-file> [output-png] [--width=1300] [--scale=2]
 */
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

const htmlFile = positional[0];
if (!htmlFile) {
	console.error(
		"Usage: node scripts/html2png.mjs <html-file> [output.png] [--width=1300] [--scale=2]",
	);
	process.exit(1);
}

const htmlPath = path.resolve(htmlFile);
const outputPath = path.resolve(
	positional[1] || htmlFile.replace(/\.html?$/i, ".png"),
);

if (!fs.existsSync(htmlPath)) {
	console.error(`File not found: ${htmlPath}`);
	process.exit(1);
}

const getFlag = (name, def) => {
	const f = flags.find((a) => a.startsWith(`--${name}=`));
	return f ? Number(f.split("=")[1]) : def;
};
const viewportWidth = getFlag("width", 1300);
const scale = getFlag("scale", 2);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({
	width: viewportWidth,
	height: 900,
	deviceScaleFactor: scale,
});

await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
await page.screenshot({ path: outputPath, fullPage: true, type: "png" });
await browser.close();

const stat = fs.statSync(outputPath);
const sizeKB = (stat.size / 1024).toFixed(0);
console.log(`Done: ${outputPath} (${sizeKB} KB)`);
