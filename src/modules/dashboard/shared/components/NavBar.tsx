"use client";
import { NotificationCenter } from "@/modules/dashboard/shared/components/NotificationCenter";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@dashboard/shared/components/MobileSidebar";
import { Logo } from "@/components/shared/Logo";
import { NavigationContent } from "@dashboard/shared/components/NavigationContent";
import { useNavigationData } from "@dashboard/shared/hooks/use-navigation-data";
import Link from "next/link";

type NavBarProps = {
	isCollapsed?: boolean;
	onToggle?: () => void;
};

export function NavBar({ isCollapsed = false, onToggle }: NavBarProps) {
	const {
		user,
		menuItems,
		themeOptions,
		currentThemeOption,
		cycleTheme,
		activeOrganization,
		canManageOrganization,
	} = useNavigationData();

	return (
		<>
			{/* Mobile Top Bar */}
			<nav className="w-full md:hidden">
				<div className="container max-w-6xl py-4">
					<div className="flex items-center justify-between gap-4">
						{/* Left: Menu button (opens sidebar) */}
						<MobileSidebar />

						{/* Center: Logo */}
						<div className="flex-1 flex justify-center">
							<Link href="/">
								<Logo />
							</Link>
						</div>

						{/* Right: Notification */}
						<NotificationCenter />
					</div>
				</div>
			</nav>

			{/* Desktop Sidebar - Same structure as MobileSidebar */}
			<nav
				className={cn(
					"hidden md:flex md:fixed md:top-0 md:left-0 md:z-40 md:h-full md:w-[280px] md:flex-col md:border-r md:bg-background",
				)}
			>
				<NavigationContent
					user={user}
					menuItems={menuItems}
					themeOptions={themeOptions}
					currentThemeOption={currentThemeOption}
					cycleTheme={cycleTheme}
					canManageOrganization={canManageOrganization}
					activeOrganization={activeOrganization}
					variant="desktop"
				/>
			</nav>
		</>
	);
}
