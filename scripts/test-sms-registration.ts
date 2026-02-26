#!/usr/bin/env tsx

/**
 * 测试短信发送脚本 - 活动审核通知
 * 
 * 使用完全固定的腾讯云短信模板，不传入任何参数
 * 必须使用 TENCENT_SMS_EVENT_APPROVED_TEMPLATE_ID 和 TENCENT_SMS_EVENT_REJECTED_TEMPLATE_ID
 * 
 * 使用方法：
 * pnpm tsx scripts/test-sms-registration.ts +8613000000000 APPROVED
 * pnpm tsx scripts/test-sms-registration.ts +8613000000000 REJECTED
 */

import { sendEventReviewNotificationSMS } from "@community/lib-server/sms/tencent-sms";

async function testSMSRegistration() {
	// 从命令行参数获取手机号和状态
	const args = process.argv.slice(2);
	
	if (args.length < 2) {
		console.error("使用方法: pnpm tsx scripts/test-sms-registration.ts <手机号> <状态>");
		console.error("示例: pnpm tsx scripts/test-sms-registration.ts +8613000000000 APPROVED");
		console.error("状态可选值: APPROVED | REJECTED");
		process.exit(1);
	}

	const [phoneNumber, statusArg] = args;

	// 验证状态参数
	if (statusArg !== "APPROVED" && statusArg !== "REJECTED") {
		console.error("状态参数错误，只能是 APPROVED 或 REJECTED");
		process.exit(1);
	}

	const status = statusArg as "APPROVED" | "REJECTED";

	console.log("📱 开始发送活动审核通知短信测试...");
	console.log(`手机号: ${phoneNumber}`);
	console.log(`审核状态: ${status}`);
	console.log(`使用模板: ${status === "APPROVED" ? "TENCENT_SMS_EVENT_APPROVED_TEMPLATE_ID" : "TENCENT_SMS_EVENT_REJECTED_TEMPLATE_ID"}`);
	console.log("⚠️  注意：使用完全固定模板，不传入任何参数（包括活动标题）");
	console.log("---");

	try {
		// 传入空字符串作为活动标题（保持兼容性，但不会被使用）
		const result = await sendEventReviewNotificationSMS(
			phoneNumber,
			"", // 空字符串，不会被使用
			status
		);

		if (result.success) {
			console.log("✅ 短信发送成功!");
			console.log(`请求ID: ${result.requestId}`);
			console.log(`返回消息: ${result.message}`);
		} else {
			console.error("❌ 短信发送失败:");
			console.error(result.message);
		}
	} catch (error) {
		console.error("❌ 发送过程中出现错误:");
		console.error(error);
	}
}

// 运行测试
testSMSRegistration().catch(console.error);
