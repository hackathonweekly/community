"use client";

import { config } from "@community/config";
import { useEffect } from "react";

interface VersionInfo {
	version: string;
	buildTime: string;
	nodeVersion: string;
	gitCommit?: string;
	environment: string;
	imageModeration: {
		lastModified: string;
		version: string;
	};
}

declare global {
	interface Window {
		__APP_VERSION__?: VersionInfo;
		__HW_CONSOLE_WELCOME__?: boolean;
		__HW_VERSION_LOGGED__?: boolean;
	}
}

const REPO_URL = "https://github.com/hackathonweekly/community";
const MAKER_WECHAT_ID = "makerjackie";
const DEV_GUIDE_PATH = "/docs/dev-guide";
const CONSOLE_BANNER_STYLE = [
	"display:inline-block",
	"margin:12px 0 6px",
	"padding:10px 14px",
	"border-radius:10px",
	"background:linear-gradient(135deg, #111827 0%, #1f2937 55%, #0f766e 100%)",
	"color:#f8fafc",
	"font-size:18px",
	"font-weight:700",
	"font-family:Space Grotesk, Inter, sans-serif",
	"letter-spacing:0.02em",
].join(";");
const CONSOLE_SUBTITLE_STYLE = [
	"color:#475569",
	"font-size:12px",
	"font-weight:600",
	"font-family:Inter, sans-serif",
].join(";");
const CONSOLE_LABEL_STYLE = [
	"color:#0f172a",
	"font-weight:700",
	"font-family:Inter, sans-serif",
].join(";");
const CONSOLE_VALUE_STYLE = [
	"color:#0f766e",
	"font-weight:600",
	"font-family:JetBrains Mono, monospace",
].join(";");

function logConsoleWelcome() {
	if (window.__HW_CONSOLE_WELCOME__) return;
	window.__HW_CONSOLE_WELCOME__ = true;

	const origin = window.location.origin;
	const devGuideUrl = `${origin}${DEV_GUIDE_PATH}`;

	console.log(`%c${config.appName}`, CONSOLE_BANNER_STYLE);
	console.log("%c中文", CONSOLE_SUBTITLE_STYLE);
	console.log(
		"%cHackathonWeekly 是一个面向黑客松和 AI Builder 的开源社区。",
		CONSOLE_SUBTITLE_STYLE,
	);
	console.log(
		"%c在这里你可以发现活动、发布项目、加入组织，一起把点子做成 demo。",
		CONSOLE_SUBTITLE_STYLE,
	);
	console.log(
		"%cGitHub：%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		REPO_URL,
	);
	console.log(
		"%c开发文档：%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		devGuideUrl,
	);
	console.log(
		"%c联系开发者：%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		`微信 ${MAKER_WECHAT_ID}`,
	);
	console.log("%cEnglish", CONSOLE_SUBTITLE_STYLE);
	console.log(
		"%cHackathonWeekly is an open-source community for hackathons and AI builders.",
		CONSOLE_SUBTITLE_STYLE,
	);
	console.log(
		"%cYou can discover events, share projects, join organizations, and ship ideas into demos here.",
		CONSOLE_SUBTITLE_STYLE,
	);
	console.log(
		"%cGitHub:%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		REPO_URL,
	);
	console.log(
		"%cDev Guide:%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		devGuideUrl,
	);
	console.log(
		"%cContact:%c%s",
		CONSOLE_LABEL_STYLE,
		CONSOLE_VALUE_STYLE,
		`WeChat ${MAKER_WECHAT_ID}`,
	);
}

export function VersionLogger() {
	useEffect(() => {
		let didTriggerReload = false;

		const maybeReloadForDeploymentMismatch = (message?: string) => {
			if (!message) return;

			const shouldReload =
				message.includes("Failed to find Server Action") ||
				message.includes("failed-to-find-server-action") ||
				message.includes("older or newer deployment");

			if (!shouldReload) return;

			if (didTriggerReload) return;

			const storageKey = "__HW__deployment_mismatch_reload";
			try {
				if (sessionStorage.getItem(storageKey) === "1") return;
				sessionStorage.setItem(storageKey, "1");
			} catch {
				// If storage isn't available, still attempt a single reload.
			}

			console.warn(
				"[version] Detected deployment mismatch, reloading to resync:",
				message,
			);
			didTriggerReload = true;
			window.location.reload();
		};

		const onError = (event: ErrorEvent) => {
			maybeReloadForDeploymentMismatch(event.message);
		};

		const onUnhandledRejection = (event: PromiseRejectionEvent) => {
			const reason = event.reason as unknown;
			const message =
				typeof reason === "string"
					? reason
					: reason instanceof Error
						? reason.message
						: reason &&
								typeof reason === "object" &&
								"message" in reason
							? String((reason as { message?: unknown }).message)
							: undefined;

			maybeReloadForDeploymentMismatch(message);
		};

		window.addEventListener("error", onError);
		window.addEventListener("unhandledrejection", onUnhandledRejection);

		logConsoleWelcome();

		const logVersionInfo = async () => {
			if (window.__HW_VERSION_LOGGED__) return;
			window.__HW_VERSION_LOGGED__ = true;

			try {
				const response = await fetch("/api/version");
				if (response.ok) {
					const versionInfo = (await response.json()) as VersionInfo;

					console.groupCollapsed("🚀 应用版本信息");
					console.log("版本:", versionInfo.version);
					console.log("构建时间:", versionInfo.buildTime);
					console.log("Node.js版本:", versionInfo.nodeVersion);
					console.log("Git提交:", versionInfo.gitCommit);
					console.log("环境:", versionInfo.environment);
					console.log(
						"图片审核版本:",
						versionInfo.imageModeration.version,
					);
					console.log(
						"图片审核最后修改:",
						versionInfo.imageModeration.lastModified,
					);
					console.groupEnd();

					// 添加到全局对象方便调试
					window.__APP_VERSION__ = versionInfo;

					// 在页面标题或某个地方添加版本标识
					document.documentElement.setAttribute(
						"data-app-version",
						versionInfo.imageModeration.version,
					);
				}
			} catch (error) {
				console.warn("无法获取版本信息:", error);
			}
		};

		logVersionInfo();

		return () => {
			window.removeEventListener("error", onError);
			window.removeEventListener(
				"unhandledrejection",
				onUnhandledRejection,
			);
		};
	}, []);

	// 这个组件不渲染任何内容
	return null;
}
