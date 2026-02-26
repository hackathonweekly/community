"use client";

import { useEffect, useState } from "react";

/**
 * 检测移动端虚拟键盘是否弹出的自定义Hook
 *
 * 使用多种方法检测键盘状态：
 * 1. Visual Viewport API (现代浏览器)
 * 2. Window resize 事件 (兼容方案)
 * 3. Input focus/blur 事件 (辅助检测)
 *
 * @returns {boolean} 键盘是否显示
 */
export function useKeyboardDetection(): boolean {
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

	useEffect(() => {
		// 键盘检测逻辑
		const detectKeyboard = () => {
			// 方法1: 使用 Visual Viewport API (现代浏览器)
			if ("visualViewport" in window && window.visualViewport) {
				const viewport = window.visualViewport;
				const initialHeight = viewport.height;

				const handleViewportChange = () => {
					// 当视窗高度显著减少时，认为键盘弹出
					// 通常键盘会占用约25%以上的屏幕高度
					const heightDifference = initialHeight - viewport.height;
					const isKeyboardOpen =
						heightDifference > initialHeight * 0.25;
					setIsKeyboardVisible(isKeyboardOpen);
				};

				viewport.addEventListener("resize", handleViewportChange);

				return () => {
					viewport.removeEventListener(
						"resize",
						handleViewportChange,
					);
				};
			}
			// 方法2: 使用 window resize 事件作为兼容方案
			{
				const initialHeight = window.innerHeight;

				const handleResize = () => {
					// 当窗口高度显著减少时，认为键盘弹出
					const heightDifference = initialHeight - window.innerHeight;
					const isKeyboardOpen =
						heightDifference > initialHeight * 0.25;
					setIsKeyboardVisible(isKeyboardOpen);
				};

				window.addEventListener("resize", handleResize);

				return () => {
					window.removeEventListener("resize", handleResize);
				};
			}
		};

		// 方法3: 监听输入元素的 focus/blur 事件作为辅助检测
		const handleFocusIn = (e: FocusEvent) => {
			const target = e.target as HTMLElement;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.contentEditable === "true")
			) {
				// 延迟设置，等待键盘动画完成
				setTimeout(() => setIsKeyboardVisible(true), 300);
			}
		};

		const handleFocusOut = (e: FocusEvent) => {
			const target = e.target as HTMLElement;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.contentEditable === "true")
			) {
				// 延迟重置，避免快速切换输入框时闪烁
				setTimeout(() => setIsKeyboardVisible(false), 300);
			}
		};

		// 注册事件监听器
		const cleanupViewport = detectKeyboard();
		document.addEventListener("focusin", handleFocusIn);
		document.addEventListener("focusout", handleFocusOut);

		// 清理函数
		return () => {
			if (cleanupViewport) cleanupViewport();
			document.removeEventListener("focusin", handleFocusIn);
			document.removeEventListener("focusout", handleFocusOut);
		};
	}, []);

	return isKeyboardVisible;
}
