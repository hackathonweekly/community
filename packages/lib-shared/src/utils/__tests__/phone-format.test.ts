/**
 * 手机号格式化功能测试
 */

import {
	normalizePhoneNumber,
	isStandardPhoneNumber,
	extractCountryCode,
	extractPhoneNumber,
	formatPhoneNumberForDisplay,
} from "../phone-format";

describe("Phone Number Formatting", () => {
	describe("normalizePhoneNumber", () => {
		test("should handle +86 prefix correctly", () => {
			expect(normalizePhoneNumber("+8613812345678")).toBe(
				"+8613812345678",
			);
			expect(normalizePhoneNumber("+86 138 1234 5678")).toBe(
				"+8613812345678",
			);
		});

		test("should handle 86 prefix correctly", () => {
			expect(normalizePhoneNumber("8613812345678")).toBe(
				"+8613812345678",
			);
			expect(normalizePhoneNumber("86 138 1234 5678")).toBe(
				"+8613812345678",
			);
		});

		test("should handle 11-digit Chinese numbers", () => {
			expect(normalizePhoneNumber("13812345678")).toBe("+8613812345678");
			expect(normalizePhoneNumber("138-1234-5678")).toBe(
				"+8613812345678",
			);
		});

		test("should handle international numbers", () => {
			expect(normalizePhoneNumber("+12025551234")).toBe("+12025551234");
			expect(normalizePhoneNumber("12025551234")).toBe("+12025551234");
		});

		test("should handle empty input", () => {
			expect(normalizePhoneNumber("")).toBe("");
			expect(normalizePhoneNumber("   ")).toBe("");
		});

		test("should handle invalid characters", () => {
			expect(normalizePhoneNumber("abc+8613812345678def")).toBe(
				"+8613812345678",
			);
		});
	});

	describe("isStandardPhoneNumber", () => {
		test("should validate standard format correctly", () => {
			expect(isStandardPhoneNumber("+8613812345678")).toBe(true);
			expect(isStandardPhoneNumber("+12025551234")).toBe(true);
			expect(isStandardPhoneNumber("+4420712345678")).toBe(true);
		});

		test("should reject non-standard format", () => {
			expect(isStandardPhoneNumber("8613812345678")).toBe(false);
			expect(isStandardPhoneNumber("13812345678")).toBe(false);
			expect(isStandardPhoneNumber("+86")).toBe(false);
			expect(isStandardPhoneNumber("")).toBe(false);
		});
	});

	describe("extractCountryCode", () => {
		test("should extract country code correctly", () => {
			expect(extractCountryCode("+8613812345678")).toBe("+86");
			expect(extractCountryCode("+12025551234")).toBe("+1");
			expect(extractCountryCode("+4420712345678")).toBe("+44");
		});

		test("should throw error for invalid format", () => {
			expect(() => extractCountryCode("8613812345678")).toThrow();
			expect(() => extractCountryCode("invalid")).toThrow();
		});
	});

	describe("extractPhoneNumber", () => {
		test("should extract phone number correctly", () => {
			expect(extractPhoneNumber("+8613812345678")).toBe("13812345678");
			expect(extractPhoneNumber("+12025551234")).toBe("2025551234");
		});

		test("should throw error for invalid format", () => {
			expect(() => extractPhoneNumber("8613812345678")).toThrow();
		});
	});

	describe("formatPhoneNumberForDisplay", () => {
		test("should format Chinese numbers correctly", () => {
			expect(formatPhoneNumberForDisplay("+8613812345678")).toBe(
				"+86 138 1234 5678",
			);
		});

		test("should format US numbers correctly", () => {
			expect(formatPhoneNumberForDisplay("+12025551234")).toBe(
				"+1 (202) 555-1234",
			);
		});

		test("should return original format for other countries", () => {
			expect(formatPhoneNumberForDisplay("+4420712345678")).toBe(
				"+4420712345678",
			);
		});

		test("should handle invalid input gracefully", () => {
			expect(formatPhoneNumberForDisplay("invalid")).toBe("invalid");
			expect(formatPhoneNumberForDisplay("")).toBe("");
		});
	});
});
