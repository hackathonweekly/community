/**
 * 微信OAuth插件 - 使用Better Auth的genericOAuth
 *
 * 解决方案：
 * 1. 使用Better Auth原生的OAuth流程
 * 2. 通过genericOAuth处理微信特殊参数
 * 3. 支持PC和Mobile不同的授权URL
 * 4. 完全兼容Better Auth的session管理
 */

import { getBaseUrl } from "@/lib/utils";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { createHash } from "crypto";

interface WeChatOAuthOptions {
	/** 微信应用ID */
	appId: string;
	/** 微信应用密钥 */
	appSecret: string;
	/** 重定向URI，可选 */
	redirectURI?: string;
}

// 通用映射逻辑：将微信Profile映射到Better Auth的User模型
const mapProfileToUser = (profile: any) => {
	if (!profile.unionid && !profile.openid) {
		throw new Error("WeChat user info error: missing openid and unionid");
	}

	// 🔧 关键修复：强制使用 unionid 作为账户标识符（如果存在）
	// 这确保PC端和移动端微信登录始终使用相同的accountId
	let accountId: string;

	if (profile.unionid) {
		// 有 unionid 时，必须使用 unionid 作为主要标识符
		accountId = profile.unionid;
	} else if (profile.openid) {
		// 没有 unionid 时，才使用 openid（仅开发环境或特殊情况）
		accountId = profile.openid;
		console.warn(
			"[WECHAT_AUTH] No unionid available, using openid as fallback:",
			profile.openid,
		);
	} else {
		throw new Error(
			"WeChat user info error: missing both openid and unionid",
		);
	}

	// 使用accountId生成唯一邮箱
	const shortId = createHash("md5")
		.update(accountId)
		.digest("hex")
		.substring(0, 12);

	return {
		id: accountId, // Better Auth将使用此ID作为providerUserId进行账户匹配
		name: profile.nickname,
		email: `${shortId}@wechat.app`,
		image: profile.headimgurl,
		emailVerified: false,
		// 保存微信特有字段到数据库
		wechatOpenId: profile.openid,
		// 🔧 移除 wechatUnionId 设置，避免用户创建时的唯一性约束冲突
		// wechatUnionId 将在账户关联逻辑中正确设置
		// wechatUnionId: profile.unionid,
	};
};

// 通用用户信息获取逻辑
const getUserInfo = async (tokens: {
	accessToken?: string;
	openid?: string;
	scopes?: string[];
}) => {
	let openid = tokens.openid;
	let unionid: string | undefined;

	// 如果 openid 或 unionid 不存在，尝试从 scopes 数组中解析
	if (tokens.scopes) {
		if (!openid) {
			const openidPart = tokens.scopes.find((part) =>
				part.startsWith("openid:"),
			);
			if (openidPart) {
				openid = openidPart.split(":")[1];
			}
		}
		const unionidPart = tokens.scopes.find((part) =>
			part.startsWith("unionid:"),
		);
		if (unionidPart) {
			unionid = unionidPart.split(":")[1];
		}
	}

	// 关键修复：微信的 userinfo 接口必须同时提供 access_token 和 openid
	if (!tokens.accessToken || !openid) {
		throw new Error("WeChat authentication failed: invalid credentials.");
	}

	const userInfoUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
	userInfoUrl.searchParams.set("access_token", tokens.accessToken);
	userInfoUrl.searchParams.set("openid", openid); // 必须参数
	userInfoUrl.searchParams.set("lang", "zh_CN");

	const response = await fetch(userInfoUrl.toString());
	const userInfo = await response.json();

	if (userInfo.errcode) {
		throw new Error(`WeChat user info error: ${userInfo.errmsg}`);
	}

	// 关键补充：如果API没有返回unionid，但我们从scope中解析出来了，就用scope中的
	if (unionid && !userInfo.unionid) {
		userInfo.unionid = unionid;
	}

	if (!userInfo.openid && !userInfo.unionid) {
		throw new Error(
			"WeChat user info error: missing essential user identification",
		);
	}

	// 关键修复：将 unionid 映射到 id 字段，better-auth 会自动将其作为 providerUserId
	return {
		...userInfo,
		id: userInfo.unionid || userInfo.openid,
	};
};

export function createWeChatOAuthPlugin(options: WeChatOAuthOptions) {
	const baseUrl = getBaseUrl();
	const redirectURI =
		options.redirectURI || `${baseUrl}/api/auth/oauth2/callback`;

	return genericOAuth({
		config: [
			// PC端微信登录 - QR码扫描
			{
				providerId: "wechat-pc",
				authorizationUrl:
					"https://open.weixin.qq.com/connect/qrconnect",
				tokenUrl: `${baseUrl}/api/auth/wechat/token`,
				userInfoUrl: "https://api.weixin.qq.com/sns/userinfo", // 这个URL实际上不会被直接使用，因为我们覆盖了getUserInfo
				clientId: options.appId,
				clientSecret: options.appSecret,
				authorizationUrlParams: {
					appid: options.appId,
					redirect_uri: `${redirectURI}/wechat-pc`,
					response_type: "code",
					scope: "snsapi_login",
				},
				getUserInfo: getUserInfo,
				mapProfileToUser: mapProfileToUser,
				authentication: "post",
				disableImplicitSignUp: false,
			},

			// 移动端微信登录 - 在微信内打开
			{
				providerId: "wechat-mobile",
				authorizationUrl:
					"https://open.weixin.qq.com/connect/oauth2/authorize",
				tokenUrl: `${baseUrl}/api/auth/wechat/token`,
				userInfoUrl: "https://api.weixin.qq.com/sns/userinfo", // 同上，不会被直接使用
				clientId: options.appId,
				clientSecret: options.appSecret,
				authorizationUrlParams: {
					appid: options.appId,
					redirect_uri: `${redirectURI}/wechat-mobile`,
					response_type: "code",
					scope: "snsapi_userinfo",
				},
				getUserInfo: getUserInfo,
				mapProfileToUser: mapProfileToUser,
				authentication: "post",
				disableImplicitSignUp: false,
			},
		],
	});
}

/**
 * 双provider微信OAuth插件 - 支持PC端和移动端
 */
export function createDualWeChatOAuthPlugin(options: {
	website: { appId: string; appSecret: string };
	serviceAccount: { appId: string; appSecret: string };
}) {
	const baseUrl = getBaseUrl();
	const redirectURI = `${baseUrl}/api/auth/oauth2/callback`;

	return genericOAuth({
		config: [
			// PC端配置（使用网站应用）
			{
				providerId: "wechat-pc",
				authorizationUrl:
					"https://open.weixin.qq.com/connect/qrconnect",
				tokenUrl: `${baseUrl}/api/auth/wechat/token`,
				userInfoUrl: "https://api.weixin.qq.com/sns/userinfo",
				clientId: options.website.appId,
				clientSecret: options.website.appSecret,
				authorizationUrlParams: {
					appid: options.website.appId,
					redirect_uri: `${redirectURI}/wechat-pc`,
					response_type: "code",
					scope: "snsapi_login",
				},
				getUserInfo: getUserInfo,
				mapProfileToUser: mapProfileToUser,
				authentication: "post",
				disableImplicitSignUp: false,
			},

			// 手机端配置（使用服务号）
			{
				providerId: "wechat-mobile",
				authorizationUrl:
					"https://open.weixin.qq.com/connect/oauth2/authorize",
				tokenUrl: `${baseUrl}/api/auth/wechat/token`,
				userInfoUrl: "https://api.weixin.qq.com/sns/userinfo",
				clientId: options.serviceAccount.appId,
				clientSecret: options.serviceAccount.appSecret,
				authorizationUrlParams: {
					appid: options.serviceAccount.appId,
					redirect_uri: `${redirectURI}/wechat-mobile`,
					response_type: "code",
					scope: "snsapi_userinfo",
				},
				getUserInfo: getUserInfo,
				mapProfileToUser: mapProfileToUser,
				authentication: "post",
				disableImplicitSignUp: false,
			},
		],
	});
}

/**
 * 检测设备类型并返回合适的provider ID
 * 增加对小程序webview的检测支持
 */
export function getWeChatProviderId(
	userAgent?: string,
): "wechat-pc" | "wechat-mobile" {
	if (!userAgent) {
		return "wechat-pc";
	}

	// 检测是否在小程序webview中
	const isMiniProgramWebview =
		userAgent.toLowerCase().includes("miniprogram") &&
		userAgent.toLowerCase().includes("micromessenger");

	// 如果是小程序webview，使用移动端配置
	if (isMiniProgramWebview) {
		return "wechat-mobile";
	}

	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|MicroMessenger/i.test(
			userAgent,
		);
	return isMobile ? "wechat-mobile" : "wechat-pc";
}

/**
 * 便捷函数：根据环境变量创建微信OAuth插件
 */
export function wechatOAuth() {
	// PC端配置（网站应用）
	const websiteAppId = process.env.WECHAT_WEBSITE_APP_ID;
	const websiteAppSecret = process.env.WECHAT_WEBSITE_APP_SECRET;

	// 服务号配置（手机端）
	const serviceAccountAppId = process.env.WECHAT_SERVICE_ACCOUNT_APP_ID;
	const serviceAccountAppSecret =
		process.env.WECHAT_SERVICE_ACCOUNT_APP_SECRET;

	// 如果两套配置都存在，创建双provider配置
	if (
		websiteAppId &&
		websiteAppSecret &&
		serviceAccountAppId &&
		serviceAccountAppSecret
	) {
		return createDualWeChatOAuthPlugin({
			website: { appId: websiteAppId, appSecret: websiteAppSecret },
			serviceAccount: {
				appId: serviceAccountAppId,
				appSecret: serviceAccountAppSecret,
			},
		});
	}

	// 如果只有网站应用配置，使用当前实现（向后兼容）
	if (websiteAppId && websiteAppSecret) {
		return createWeChatOAuthPlugin({
			appId: websiteAppId,
			appSecret: websiteAppSecret,
		});
	}

	// 如果只有服务号配置，也支持单独使用
	if (serviceAccountAppId && serviceAccountAppSecret) {
		return createWeChatOAuthPlugin({
			appId: serviceAccountAppId,
			appSecret: serviceAccountAppSecret,
		});
	}

	throw new Error(
		"WeChat OAuth configuration error: required environment variables not found",
	);
}
