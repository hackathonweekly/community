/**
 * 手机号格式化工具
 * 统一为 +86 格式
 */

/**
 * 标准化手机号格式
 * @param phoneNumber 原始手机号
 * @returns 标准化后的手机号格式：+国家代码+号码
 */
export function normalizePhoneNumber(phoneNumber: string): string {
	if (!phoneNumber) return "";

	// 移除所有非数字字符
	const cleaned = phoneNumber.replace(/\D/g, "");

	// 如果以86开头且长度为13位，添加+号
	if (cleaned.startsWith("86") && cleaned.length === 13) {
		return `+${cleaned}`;
	}

	// 如果是11位中国手机号，添加+86
	if (cleaned.length === 11 && cleaned.startsWith("1")) {
		return `+86${cleaned}`;
	}

	// 如果已经是标准格式，返回
	if (phoneNumber.startsWith("+")) {
		return phoneNumber;
	}

	// 默认添加+号
	return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * 验证手机号是否为标准格式
 * @param phoneNumber 手机号
 * @returns 是否为标准格式
 */
export function isStandardPhoneNumber(phoneNumber: string): boolean {
	return /^\+\d+/.test(phoneNumber);
}

/**
 * 格式化手机号用于显示
 * @param phoneNumber 标准格式手机号
 * @returns 格式化后的显示文本
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
	if (!phoneNumber) return "";

	const normalized = normalizePhoneNumber(phoneNumber);

	// 中国大陆号码格式化：+86 138 1234 5678
	if (normalized.startsWith("+86") && normalized.length === 14) {
		const number = normalized.slice(3);
		return `+86 ${number.slice(0, 3)} ${number.slice(3, 7)} ${number.slice(7)}`;
	}

	return normalized;
}
