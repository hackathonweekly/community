import { auth } from "@/lib/auth";
import { Hono } from "hono";
import { authRateLimit } from "../middleware/rate-limit";

export const authRouter = new Hono()
	// Apply rate limiting to all auth routes
	.use("/auth/*", authRateLimit)
	// 🔧 微信Token代理端点 - 在Better Auth处理之前拦截
	.post("/auth/wechat/token", async (c) => {
		try {
			// 获取Better Auth发送的参数
			const body = await c.req.text();
			const params = new URLSearchParams(body);

			const code = params.get("code");
			const clientId = params.get("client_id"); // Better Auth发送的是client_id
			const clientSecret = params.get("client_secret"); // Better Auth发送的是client_secret
			const redirectUri = params.get("redirect_uri");
			const grantType = params.get("grant_type");

			if (!code || !clientId || !clientSecret) {
				return c.json({ error: "Missing required parameters" }, 400);
			}

			// 构建微信token请求URL（微信使用GET请求和不同的参数名）
			const wechatTokenUrl = new URL(
				"https://api.weixin.qq.com/sns/oauth2/access_token",
			);
			wechatTokenUrl.searchParams.set("appid", clientId); // 转换为微信的appid
			wechatTokenUrl.searchParams.set("secret", clientSecret); // 转换为微信的secret
			wechatTokenUrl.searchParams.set("code", code);
			wechatTokenUrl.searchParams.set("grant_type", "authorization_code");

			// 调用微信token接口（使用GET请求）
			const wechatResponse = await fetch(wechatTokenUrl.toString(), {
				method: "GET",
			});

			const wechatTokenData = await wechatResponse.json();

			// 检查微信是否返回错误
			if (wechatTokenData.errcode) {
				return c.json(
					{
						error: "invalid_grant",
						error_description: "Authentication failed",
					},
					400,
				);
			}

			// 检查必要的字段是否存在
			if (!wechatTokenData.access_token || !wechatTokenData.openid) {
				return c.json(
					{
						error: "invalid_grant",
						error_description: "Authentication failed",
					},
					400,
				);
			}

			// 将微信响应转换为标准OAuth格式，并将openid和unionid嵌入scope
			const scopeParts = [wechatTokenData.scope || ""];
			if (wechatTokenData.openid) {
				scopeParts.push(`openid:${wechatTokenData.openid}`);
			}
			if (wechatTokenData.unionid) {
				scopeParts.push(`unionid:${wechatTokenData.unionid}`);
			}

			const standardTokenResponse = {
				access_token: wechatTokenData.access_token,
				token_type: "Bearer",
				expires_in: wechatTokenData.expires_in || 7200,
				refresh_token: wechatTokenData.refresh_token,
				scope: scopeParts.join(" ").trim(),
			};

			return c.json(standardTokenResponse, {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store",
					Pragma: "no-cache",
				},
			});
		} catch (error) {
			return c.json(
				{
					error: "server_error",
					error_description:
						"Internal server error during token exchange",
				},
				500,
			);
		}
	})
	// ✅ 所有认证路由（包括微信OAuth和手机号验证）都由Better Auth原生处理
	.all("/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});
