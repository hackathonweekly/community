#!/usr/bin/env tsx

import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { sendEmail } from "@community/lib-server/mail";
import { config } from "@community/config";

type OptionKey = "to" | "subject" | "text" | "html";

type ParsedCli = {
	flags: Partial<Record<OptionKey, string>>;
	positional: string[];
	showHelp: boolean;
};

const FLAG_MAP: Record<string, OptionKey> = {
	to: "to",
	subject: "subject",
	text: "text",
	html: "html",
};

function loadEnvFile(path: string, override = false) {
	if (!existsSync(path)) {
		return;
	}

	loadEnv({ path, override });
}

function parseCliArgs(args: string[]): ParsedCli {
	const flags: ParsedCli["flags"] = {};
	const positional: string[] = [];
	let showHelp = false;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			showHelp = true;
			continue;
		}

		if (!arg.startsWith("--")) {
			positional.push(arg);
			continue;
		}

		const trimmed = arg.slice(2);
		const [rawKey, valueFromEq] = trimmed.split("=", 2);
		const key = FLAG_MAP[rawKey];

		if (!key) {
			console.warn(`Ignoring unknown flag: --${rawKey}`);
			continue;
		}

		let value = valueFromEq;

		if (value === undefined) {
			const next = args[i + 1];
			if (next && !next.startsWith("--")) {
				value = next;
				i += 1;
			}
		}

		if (value === undefined || value.length === 0) {
			console.error(`Missing value for flag: --${rawKey}`);
			process.exit(1);
		}

		flags[key] = value;
	}

	return { flags, positional, showHelp };
}

function escapeHtml(value: string) {
	return value.replace(/[&<>]/g, (char) => {
		switch (char) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			default:
				return char;
		}
	});
}

function textToHtml(text: string) {
	const lines = text.split(/\r?\n/);
	return lines.map((line) => `<p>${line.length > 0 ? escapeHtml(line) : "&nbsp;"}</p>`).join("\n");
}

function printHelp() {
	console.log(`Usage: pnpm tsx scripts/test-email.ts [options] [to] [subject] [message]

Options:
  --to <email>        Override the recipient (default: contact@hackathonweekly.com)
  --subject <text>    Override the subject line
  --text <text>       Use custom plain text body
  --html <html>       Use custom HTML body (skips automatic conversion)
  -h, --help          Show this help message

Examples:
  pnpm tsx scripts/test-email.ts
  pnpm tsx scripts/test-email.ts teammate@example.com "Quick test"
  pnpm tsx scripts/test-email.ts --to teammate@example.com --text "Line 1\\nLine 2"
  pnpm tsx scripts/test-email.ts --html '<strong>Hello</strong>'
`);
}

async function main() {
	loadEnvFile("apps/web/.env");
	loadEnvFile("apps/web/.env.local", true);

	const { flags, positional, showHelp } = parseCliArgs(process.argv.slice(2));

	if (showHelp) {
		printHelp();
		return;
	}

	const timestamp = new Date().toISOString();
	const defaultRecipient = config.contactForm?.to ?? "contact@hackathonweekly.com";
	const to = (flags.to ?? positional[0] ?? defaultRecipient).trim();
	const subject = flags.subject ?? positional[1] ?? `HackathonWeekly email test (${timestamp})`;

	if (!to) {
		console.error("Recipient email is required.");
		process.exit(1);
	}

	const fallbackText = positional.slice(2).join(" ").trim();
	const textBody = flags.text ?? (fallbackText.length > 0 ? fallbackText : null);
	const defaultText = `Hello from HackathonWeekly!\n\nThis test message was sent at ${timestamp}.\nIf you received this, the mail integration is working.`;
	const text = textBody ?? defaultText;
	const html = flags.html ?? textToHtml(text);

	if (!process.env.PLUNK_API_KEY) {
		console.warn("PLUNK_API_KEY is not set. The request will likely fail.");
	}

	console.log("Preparing to send a test email with the following details:");
	console.log(`  To: ${to}`);
	console.log(`  Subject: ${subject}`);
	console.log(`  Text length: ${text.length} chars`);
	console.log(`  HTML length: ${html.length} chars`);
	console.log("Sending...");

	try {
		const result = await sendEmail({ to, subject, text, html });

		if (result) {
			console.log("Email sent successfully.");
		} else {
			console.error("Email send attempt returned false.");
			process.exit(1);
		}
	} catch (error) {
		console.error("Failed to send email:");
		console.error(error);
		process.exit(1);
	}
}

void main();
