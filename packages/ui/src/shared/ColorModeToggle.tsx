"use client";

import { Button } from "@community/ui/ui/button";
import { HardDriveIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsClient } from "usehooks-ts";

export function ColorModeToggle() {
	const { resolvedTheme, setTheme, theme } = useTheme();
	const isClient = useIsClient();

	if (!isClient) {
		return null;
	}

	const cycleTheme = () => {
		const currentTheme = theme ?? "system";
		const themeOrder = ["system", "light", "dark"];
		const currentIndex = themeOrder.indexOf(currentTheme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		setTheme(themeOrder[nextIndex]);
	};

	const getIcon = () => {
		const currentTheme = theme ?? "system";
		if (currentTheme === "system") {
			return <HardDriveIcon className="size-4" />;
		}
		if (currentTheme === "light") {
			return <SunIcon className="size-4" />;
		}
		return <MoonIcon className="size-4" />;
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={cycleTheme}
			data-test="color-mode-toggle"
			aria-label="Color mode"
		>
			{getIcon()}
		</Button>
	);
}
