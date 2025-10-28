"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ScrollBackButtonProps {
	href?: string;
	onClick?: () => void;
	className?: string;
}

export function ScrollBackButton({
	href = "/projects",
	onClick,
	className = "",
}: ScrollBackButtonProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			// 当滚动超过100px时显示按钮
			setIsVisible(window.scrollY > 100);
		};

		// 初始检查
		handleScroll();

		// 添加滚动监听
		window.addEventListener("scroll", handleScroll);

		// 清理监听
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	if (!isVisible) {
		return null;
	}

	const handleClick = () => {
		if (onClick) {
			onClick();
		} else if (href) {
			window.location.href = href;
		}
	};

	return (
		<div
			className={`
				fixed top-4 left-4 z-50
				md:hidden
				transition-all duration-300 ease-in-out
				${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
				${className}
			`}
		>
			<Button
				variant="outline"
				size="icon"
				onClick={handleClick}
				className="shadow-lg bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200"
				aria-label="返回"
			>
				<ArrowLeft className="h-4 w-4 text-gray-700" />
			</Button>
		</div>
	);
}
