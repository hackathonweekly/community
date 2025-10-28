// 联系方式工具函数
export interface ContactInfo {
	type: "PHONE" | "WECHAT" | "EMAIL";
	value: string;
	icon: string;
	label: string;
}

interface User {
	phoneNumber?: string | null;
	wechatId?: string | null;
	email: string;
	showWechat?: boolean;
	showEmail?: boolean;
}

/**
 * 获取用户首选的联系方式
 * 按优先级：手机号 > 微信号 > 邮箱（不推荐）
 */
export function getPreferredContact(user: User): ContactInfo | null {
	// 优先级：手机号 > 微信号，不自动显示邮箱
	if (user.phoneNumber) {
		return {
			type: "PHONE",
			value: user.phoneNumber,
			icon: "📱",
			label: "手机号",
		};
	}

	if (user.wechatId && user.showWechat) {
		return {
			type: "WECHAT",
			value: user.wechatId,
			icon: "💬",
			label: "微信号",
		};
	}

	// 不自动显示邮箱，除非用户明确选择显示邮箱
	if (user.showEmail) {
		return {
			type: "EMAIL",
			value: user.email,
			icon: "📧",
			label: "邮箱",
		};
	}

	return null;
}
