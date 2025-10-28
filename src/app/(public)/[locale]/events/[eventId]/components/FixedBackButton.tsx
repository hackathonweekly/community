"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function FixedBackButton() {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(false);

	// 只在移动端显示，且在滚动后显示
	useEffect(() => {
		const handleScroll = () => {
			setIsVisible(window.scrollY > 100);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // 初始检查

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	if (!isVisible) {
		return null;
	}

	return (
		<div className="fixed top-4 left-4 z-40 md:hidden">
			<Button
				variant="outline"
				size="icon"
				onClick={() => router.back()}
				className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white"
			>
				<ArrowLeftIcon className="h-4 w-4" />
			</Button>
		</div>
	);
}
