import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getBaseUrl() {
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Reserved usernames that cannot be used for profiles
export const RESERVED_USERNAMES = [
	"admin",
	"api",
	"app",
	"auth",
	"blog",
	"contact",
	"dashboard",
	"docs",
	"faq",
	"help",
	"login",
	"logout",
	"pricing",
	"privacy",
	"profile",
	"register",
	"settings",
	"signup",
	"support",
	"terms",
	"www",
	"mail",
	"email",
	"test",
	"demo",
	"dev",
	"staging",
	"prod",
	"production",
	"beta",
	"alpha",
	"cdn",
	"static",
	"assets",
	"public",
	"private",
	"secure",
	"ssl",
	"ftp",
	"sftp",
	"ssh",
	"vpn",
	"dns",
	"mx",
	"ns",
	"cname",
	"txt",
	"a",
	"aaaa",
	"srv",
	"ptr",
	"projects",
	"zh",
	"en",
	"hackathonweekly",
	"01mvp",
	"changelog",
	"_next",
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
	"u",
];

/**
 * Sanitize input to create a valid username
 */
export function sanitizeUsername(input: string): string {
	return input
		.toLowerCase()
		.replace(/\s+/g, "_") // Replace spaces with underscores
		.replace(/[^a-z0-9_]/g, "") // Remove non-alphanumeric characters except underscores
		.replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
		.slice(0, 20); // Limit to 20 characters
}

/**
 * Check if username is valid (format and not reserved)
 */
export function isValidUsername(username: string): boolean {
	// Check format: alphanumeric + underscores, no leading/trailing underscores
	const formatRegex = /^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/;

	if (!formatRegex.test(username.toLowerCase())) {
		return false;
	}

	// Check if reserved
	if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
		return false;
	}

	// Check length
	if (username.length < 2 || username.length > 20) {
		return false;
	}

	return true;
}

/**
 * Generate a unique, valid username from a name
 */
export function generateUsername(
	name: string,
	existingUsernames: string[] = [],
): string {
	const sanitized = sanitizeUsername(name);

	// If empty after sanitization (e.g., Chinese characters), generate a better default
	if (!sanitized) {
		const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
		const year = new Date().getFullYear();

		// Try multiple patterns for better defaults
		const patterns = [
			`user_${timestamp}`,
			`member_${timestamp}`,
			`dev_${year}_${timestamp.slice(-4)}`,
			`user${timestamp}${Math.floor(Math.random() * 100)
				.toString()
				.padStart(2, "0")}`,
		];

		for (const pattern of patterns) {
			if (!existingUsernames.includes(pattern.toLowerCase())) {
				return pattern;
			}
		}

		// Fallback with more randomness
		const fallback = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
		return fallback;
	}

	// Generate smart variants for valid sanitized names
	const baseVariants = [
		sanitized, // Original sanitized name
		`${sanitized}_dev`, // Add developer suffix
		`${sanitized}_${new Date().getFullYear()}`, // Add current year
		`${sanitized}_hacker`, // Add hacker suffix for hackathon theme
		`${sanitized}_${Math.floor(Math.random() * 100)
			.toString()
			.padStart(2, "0")}`, // Add 2-digit random number
	];

	// Try base variants first
	for (const variant of baseVariants) {
		if (
			isValidUsername(variant) &&
			!existingUsernames.includes(variant.toLowerCase())
		) {
			return variant;
		}
	}

	// If all base variants are taken, try numbered variants
	let counter = 1;
	let candidate = `${sanitized}${counter}`;

	while (
		!isValidUsername(candidate) ||
		existingUsernames.includes(candidate.toLowerCase())
	) {
		counter++;
		candidate = `${sanitized}${counter}`;

		// If we've tried too many numbers, add more randomness
		if (counter > 99) {
			const timestamp = Date.now().toString().slice(-4);
			const random = Math.floor(Math.random() * 1000)
				.toString()
				.padStart(3, "0");
			candidate = `${sanitized}_${timestamp}_${random}`;
			break;
		}

		// Prevent infinite loop
		if (counter > 9999) {
			const timestamp = Date.now().toString().slice(-4);
			candidate = `user_${timestamp}_${Math.floor(Math.random() * 10000)}`;
			break;
		}
	}

	return candidate;
}

/**
 * Validate display name format
 */
export function isValidDisplayName(name: string): boolean {
	// Allow most characters but prevent obviously problematic ones
	const invalidChars = /[<>"`]/;
	return (
		name.trim().length >= 1 && name.length <= 50 && !invalidChars.test(name)
	);
}

/**
 * Member level configuration based on cpValue
 */
export interface MemberLevel {
	level: number;
	name: string;
	color: string;
	badge: string;
}

/**
 * Get member level based on cpValue
 */
export function getMemberLevel(cpValue: number): MemberLevel {
	if (cpValue >= 200) {
		return {
			level: 4,
			name: "核心贡献者",
			color: "text-purple-600 bg-purple-100",
			badge: "🌟",
		};
	}
	if (cpValue >= 50) {
		return {
			level: 3,
			name: "贡献者",
			color: "text-blue-600 bg-blue-100",
			badge: "⭐",
		};
	}
	if (cpValue >= 10) {
		return {
			level: 2,
			name: "社区成员",
			color: "text-green-600 bg-green-100",
			badge: "🔥",
		};
	}
	if (cpValue > 0) {
		return {
			level: 1,
			name: "注册用户",
			color: "text-yellow-600 bg-yellow-100",
			badge: "👋",
		};
	}
	return {
		level: 0,
		name: "观众",
		color: "text-gray-600 bg-gray-100",
		badge: "👀",
	};
}

/**
 * Check if user can view member QR code based on their level
 */
export function canViewMemberQrCode(cpValue: number): boolean {
	return getMemberLevel(cpValue).level >= 2; // 社区成员及以上
}

/**
 * City options for organizations
 */
export const CITIES = [
	"北京",
	"上海",
	"深圳",
	"广州",
	"杭州",
	"成都",
	"南京",
	"武汉",
	"西安",
	"苏州",
	"厦门",
	"青岛",
	"海外",
	"其他",
];

/**
 * Tag presets for organizations
 */
export const TAG_PRESETS = {
	技术领域: ["AI", "Web3", "硬件", "独立开发", "设计", "出海", "开源"],
	活动类型: [
		"黑客松",
		"线下聚会",
		"线上分享",
		"工作坊",
		"Demo Day",
		"技术沙龙",
	],
	行业方向: ["教育", "医疗", "金融", "游戏", "电商", "企业服务", "消费品"],
};

/**
 * Get all available tags as a flat array
 */
export function getAllTags(): string[] {
	return Object.values(TAG_PRESETS).flat();
}
