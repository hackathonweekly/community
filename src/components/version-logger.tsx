"use client";

import { useEffect } from "react";

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
							? String(
									(reason as { message?: unknown }).message,
								)
						: undefined;

			maybeReloadForDeploymentMismatch(message);
		};

		window.addEventListener("error", onError);
		window.addEventListener("unhandledrejection", onUnhandledRejection);

		// 在开发环境或需要调试时显示版本信息
		const logVersionInfo = async () => {
			try {
				const response = await fetch("/api/version");
				if (response.ok) {
					const versionInfo = await response.json();

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
					(window as any).__APP_VERSION__ = versionInfo;

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
