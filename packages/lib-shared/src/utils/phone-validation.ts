/**
 * 手机号验证工具函数
 */

// 各国手机号规则配置
interface PhoneValidationRule {
	countryCode: string;
	countryName: string;
	minLength: number;
	maxLength: number;
	pattern?: RegExp;
	example: string;
}

const phoneValidationRules: PhoneValidationRule[] = [
	{
		countryCode: "+86",
		countryName: "中国大陆",
		minLength: 11,
		maxLength: 11,
		pattern: /^1[3-9]\d{9}$/,
		example: "13800138000",
	},
	{
		countryCode: "+852",
		countryName: "香港",
		minLength: 8,
		maxLength: 8,
		pattern: /^[2-9]\d{7}$/,
		example: "91234567",
	},
	{
		countryCode: "+853",
		countryName: "澳门",
		minLength: 8,
		maxLength: 8,
		pattern: /^6\d{7}$/,
		example: "61234567",
	},
	{
		countryCode: "+886",
		countryName: "台湾",
		minLength: 9,
		maxLength: 10,
		pattern: /^[0-9]\d{8,9}$/,
		example: "912345678",
	},
	{
		countryCode: "+1",
		countryName: "美国/加拿大",
		minLength: 10,
		maxLength: 10,
		pattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
		example: "2125551234",
	},
	{
		countryCode: "+65",
		countryName: "新加坡",
		minLength: 8,
		maxLength: 8,
		pattern: /^[89]\d{7}$/,
		example: "91234567",
	},
	{
		countryCode: "+44",
		countryName: "英国",
		minLength: 10,
		maxLength: 11,
		pattern: /^[1-9]\d{9,10}$/,
		example: "7912345678",
	},
	{
		countryCode: "+81",
		countryName: "日本",
		minLength: 10,
		maxLength: 11,
		pattern: /^[7-9]\d{9,10}$/,
		example: "9012345678",
	},
	{
		countryCode: "+82",
		countryName: "韩国",
		minLength: 10,
		maxLength: 11,
		pattern: /^[1-9]\d{8,9}$/,
		example: "1012345678",
	},
];

// 通用规则（用于没有具体规则的国家）
const defaultRule: PhoneValidationRule = {
	countryCode: "",
	countryName: "",
	minLength: 6,
	maxLength: 15,
	pattern: /^\d+$/,
	example: "",
};

export interface PhoneValidationResult {
	isValid: boolean;
	errorMessage?: string;
	suggestion?: string;
}

/**
 * 验证手机号码格式
 * @param countryCode 国家代码 (如: +86)
 * @param phoneNumber 手机号码（不包含国家代码）
 * @returns 验证结果
 */
export function validatePhoneNumber(
	countryCode: string,
	phoneNumber: string,
): PhoneValidationResult {
	if (!phoneNumber.trim()) {
		return {
			isValid: false,
			errorMessage: "请输入手机号码",
		};
	}

	// 获取对应国家的验证规则
	const rule =
		phoneValidationRules.find((r) => r.countryCode === countryCode) ||
		defaultRule;
	const cleanNumber = phoneNumber.replace(/\D/g, ""); // 移除非数字字符

	// 长度验证
	if (cleanNumber.length < rule.minLength) {
		return {
			isValid: false,
			errorMessage: `${rule.countryName}手机号至少需要${rule.minLength}位数字`,
			suggestion: rule.example ? `示例: ${rule.example}` : undefined,
		};
	}

	if (cleanNumber.length > rule.maxLength) {
		return {
			isValid: false,
			errorMessage: `${rule.countryName}手机号不能超过${rule.maxLength}位数字`,
			suggestion: rule.example ? `示例: ${rule.example}` : undefined,
		};
	}

	// 格式验证
	if (rule.pattern && !rule.pattern.test(cleanNumber)) {
		return {
			isValid: false,
			errorMessage: `请输入有效的${rule.countryName}手机号`,
			suggestion: rule.example ? `示例: ${rule.example}` : undefined,
		};
	}

	return {
		isValid: true,
	};
}

/**
 * 验证完整的手机号（包含国家代码）
 * @param fullPhoneNumber 完整手机号 (如: +8613800138000)
 * @returns 验证结果
 */
export function validateFullPhoneNumber(
	fullPhoneNumber: string,
): PhoneValidationResult {
	if (!fullPhoneNumber.trim()) {
		return {
			isValid: false,
			errorMessage: "请输入手机号码",
		};
	}

	// 查找匹配的国家代码
	const matchingRule = phoneValidationRules.find((rule) =>
		fullPhoneNumber.startsWith(rule.countryCode),
	);

	if (!matchingRule) {
		// 使用通用规则验证
		if (fullPhoneNumber.startsWith("+")) {
			const parts = fullPhoneNumber.match(/^(\+\d+)(.*)$/);
			if (parts && parts.length === 3) {
				return validatePhoneNumber(parts[1], parts[2]);
			}
		}
		return {
			isValid: false,
			errorMessage: "不支持的国家代码",
		};
	}

	const phoneNumber = fullPhoneNumber.slice(matchingRule.countryCode.length);
	return validatePhoneNumber(matchingRule.countryCode, phoneNumber);
}

/**
 * 获取国家的手机号规则
 * @param countryCode 国家代码
 * @returns 验证规则或undefined
 */
export function getPhoneValidationRule(
	countryCode: string,
): PhoneValidationRule | undefined {
	return phoneValidationRules.find(
		(rule) => rule.countryCode === countryCode,
	);
}

/**
 * 格式化手机号显示
 * @param countryCode 国家代码
 * @param phoneNumber 手机号
 * @returns 格式化后的手机号
 */
export function formatPhoneNumber(
	countryCode: string,
	phoneNumber: string,
): string {
	const cleanNumber = phoneNumber.replace(/\D/g, "");

	// 中国手机号格式化: 138 0013 8000
	if (countryCode === "+86" && cleanNumber.length === 11) {
		return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 7)} ${cleanNumber.slice(7)}`;
	}

	// 美国/加拿大格式化: (212) 555-1234
	if (countryCode === "+1" && cleanNumber.length === 10) {
		return `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
	}

	// 其他国家暂不格式化
	return cleanNumber;
}
