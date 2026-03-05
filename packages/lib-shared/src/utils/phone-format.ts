/**
 * 手机号格式化工具
 * 统一为 +86 格式
 */

import { countryCodes } from "../country-codes";

const CHINA_MOBILE_PATTERN = /^1[3-9]\d{9}$/;
const SORTED_COUNTRY_CODES = [...countryCodes]
	.map((entry) => entry.code)
	.sort((a, b) => b.length - a.length);

/**
 * 标准化手机号格式
 * @param phoneNumber 原始手机号
 * @returns 标准化后的手机号格式：+国家代码+号码
 */
export function normalizePhoneNumber(phoneNumber: string): string {
	if (!phoneNumber) return "";

	// 移除所有非数字字符
	const cleaned = phoneNumber.replace(/\D/g, "");
	if (!cleaned) return "";

	// 如果以86开头且长度为13位，添加+号
	if (
		cleaned.startsWith("86") &&
		cleaned.length === 13 &&
		CHINA_MOBILE_PATTERN.test(cleaned.slice(2))
	) {
		return `+${cleaned}`;
	}

	// 如果是11位中国手机号，添加+86
	if (cleaned.length === 11 && CHINA_MOBILE_PATTERN.test(cleaned)) {
		return `+86${cleaned}`;
	}

	// 默认添加+号
	return `+${cleaned}`;
}

/**
 * 验证手机号是否为标准格式
 * @param phoneNumber 手机号
 * @returns 是否为标准格式
 */
export function isStandardPhoneNumber(phoneNumber: string): boolean {
	return /^\+\d{6,15}$/.test(phoneNumber);
}

/**
 * 提取手机号的国家代码
 * @param phoneNumber 标准格式手机号
 * @returns 国家代码（如 +86）
 */
export function extractCountryCode(phoneNumber: string): string {
	if (!phoneNumber || !phoneNumber.trim().startsWith("+")) {
		throw new Error("Invalid phone number format");
	}

	const normalized = `+${phoneNumber.replace(/\D/g, "")}`;
	const match = SORTED_COUNTRY_CODES.find((code) =>
		normalized.startsWith(code),
	);

	if (!match || normalized.length <= match.length) {
		throw new Error("Unsupported country code");
	}

	return match;
}

/**
 * 提取手机号的本地号码部分
 * @param phoneNumber 标准格式手机号
 * @returns 去掉国家代码后的号码
 */
export function extractPhoneNumber(phoneNumber: string): string {
	const countryCode = extractCountryCode(phoneNumber);
	const normalized = `+${phoneNumber.replace(/\D/g, "")}`;
	return normalized.slice(countryCode.length);
}

/**
 * 格式化手机号用于显示
 * @param phoneNumber 标准格式手机号
 * @returns 格式化后的显示文本
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
	if (!phoneNumber) return "";

	const trimmed = phoneNumber.trim();
	if (!trimmed) return "";

	const normalized = normalizePhoneNumber(trimmed);
	if (!normalized || !isStandardPhoneNumber(normalized)) {
		return phoneNumber;
	}

	// 中国大陆号码格式化：+86 138 1234 5678
	if (normalized.startsWith("+86") && normalized.length === 14) {
		const number = normalized.slice(3);
		return `+86 ${number.slice(0, 3)} ${number.slice(3, 7)} ${number.slice(7)}`;
	}

	// 美国/加拿大号码格式化：+1 (202) 555-1234
	if (normalized.startsWith("+1") && normalized.length === 12) {
		const number = normalized.slice(2);
		return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
	}

	return normalized;
}
