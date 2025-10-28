"use client";

import { authClient } from "@/lib/auth/client";
import { config } from "@/config";
import { clearCache } from "@/lib/cache";
import { LeaveOrganizationDialog } from "@dashboard/organizations/components/LeaveOrganizationDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, MoreVerticalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UserMenuActionsProps = {
	variant: "dropdown" | "inline";
	canManageOrganization: boolean;
	activeOrganization: { slug: string } | null;
	onActionComplete?: () => void; // For closing mobile sidebar
};

export function UserMenuActions({
	variant,
	canManageOrganization,
	activeOrganization,
	onActionComplete,
}: UserMenuActionsProps) {
	const t = useTranslations();
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					try {
						await clearCache();
					} catch (error) {
						console.error(
							"Failed to clear cache after logout",
							error,
						);
					}
					window.location.href = new URL(
						config.auth.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	const handleLeaveOrganization = () => {
		onActionComplete?.();
		setLeaveDialogOpen(true);
	};

	// Inline variant for mobile
	if (variant === "inline") {
		return (
			<>
				{activeOrganization && !canManageOrganization && (
					<button
						type="button"
						onClick={handleLeaveOrganization}
						className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors mb-2"
					>
						<LogOutIcon className="size-5 shrink-0" />
						<span className="text-base">
							{t(
								"organizations.settings.members.leaveOrganization",
							)}
						</span>
					</button>
				)}
				<button
					type="button"
					onClick={onLogout}
					className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
				>
					<LogOutIcon className="size-5 shrink-0" />
					<span className="text-base">
						{t("app.userMenu.logout")}
					</span>
				</button>

				<LeaveOrganizationDialog
					open={leaveDialogOpen}
					onOpenChange={setLeaveDialogOpen}
				/>
			</>
		);
	}

	// Dropdown variant for desktop
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center justify-center size-8 rounded-lg hover:bg-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="User menu"
					>
						<MoreVerticalIcon className="size-4" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="top">
					{activeOrganization && !canManageOrganization && (
						<DropdownMenuItem
							onClick={handleLeaveOrganization}
							className="text-destructive"
						>
							<LogOutIcon className="mr-2 size-4" />
							{t(
								"organizations.settings.members.leaveOrganization",
							)}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={onLogout}>
						<LogOutIcon className="mr-2 size-4" />
						{t("app.userMenu.logout")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<LeaveOrganizationDialog
				open={leaveDialogOpen}
				onOpenChange={setLeaveDialogOpen}
			/>
		</>
	);
}
