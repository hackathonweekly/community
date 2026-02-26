"use client";

import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";
import { useUserOrganizations } from "@account/organizations/hooks/use-user-organizations";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

interface OrganizationSwitcherProps {
	currentSlug: string;
	currentName: string;
	currentLogo?: string | null;
	/** Appended to `/orgs/${slug}` for each link, e.g. "/members" */
	linkSuffix?: string;
}

export function OrganizationSwitcher({
	currentSlug,
	currentName,
	currentLogo,
	linkSuffix = "",
}: OrganizationSwitcherProps) {
	const { organizations } = useUserOrganizations();

	const logoElement = (
		<OrganizationLogo
			name={currentName}
			logoUrl={currentLogo ?? undefined}
			className="h-7 w-7 rounded-md border border-border"
		/>
	);

	const nameElement = (
		<span className="font-brand text-base font-bold text-foreground">
			{currentName}
		</span>
	);

	if (organizations.length <= 1) {
		return (
			<div className="flex items-center gap-2">
				{logoElement}
				{nameElement}
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:opacity-80 transition-opacity">
				{logoElement}
				{nameElement}
				<ChevronDown className="h-3.5 w-3.5 text-gray-400" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{organizations.map((org) => (
					<DropdownMenuItem key={org.id} asChild>
						<Link
							href={`/orgs/${org.slug}${linkSuffix}`}
							className="flex items-center gap-2 cursor-pointer"
						>
							<OrganizationLogo
								name={org.name}
								logoUrl={org.logo ?? undefined}
								className="h-5 w-5 rounded-sm border border-border"
							/>
							<span
								className={`text-sm ${
									org.slug === currentSlug
										? "font-bold text-foreground"
										: "text-gray-600 dark:text-muted-foreground"
								}`}
							>
								{org.name}
							</span>
						</Link>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
