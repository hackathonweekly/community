"use client";

import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { NavigationContent } from "@dashboard/shared/components/NavigationContent";
import { useNavigationData } from "@dashboard/shared/hooks/use-navigation-data";
import { MenuIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type MobileSidebarProps = {
	trigger?: ReactNode;
};

export function MobileSidebar({ trigger }: MobileSidebarProps) {
	const {
		user,
		menuItems,
		themeOptions,
		currentThemeOption,
		cycleTheme,
		activeOrganization,
		canManageOrganization,
	} = useNavigationData();
	const [open, setOpen] = useState(false);

	const handleLinkClick = () => {
		setOpen(false);
	};

	if (!user) {
		return null;
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				{trigger || (
					<button
						type="button"
						className="flex items-center justify-center size-9 rounded-lg hover:bg-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="Open menu"
					>
						<MenuIcon className="size-5" />
					</button>
				)}
			</SheetTrigger>
			<SheetContent side="left" className="w-[280px] flex flex-col p-0">
				<SheetTitle className="sr-only">Navigation menu</SheetTitle>
				<NavigationContent
					user={user}
					menuItems={menuItems}
					themeOptions={themeOptions}
					currentThemeOption={currentThemeOption}
					cycleTheme={cycleTheme}
					canManageOrganization={canManageOrganization}
					activeOrganization={activeOrganization}
					onNavigate={handleLinkClick}
					variant="mobile"
				/>
			</SheetContent>
		</Sheet>
	);
}
