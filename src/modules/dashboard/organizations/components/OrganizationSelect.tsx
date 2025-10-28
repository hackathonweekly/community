"use client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { config } from "@/config";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@dashboard/organizations/lib/api";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useRouter } from "@/hooks/router";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { OrganizationLogo } from "./OrganizationLogo";

export function OrganzationSelect({ className }: { className?: string }) {
	const t = useTranslations();
	const { user } = useSession();
	const router = useRouter();
	const { activeOrganization, setActiveOrganization } =
		useActiveOrganization();
	const { data: allOrganizations } = useOrganizationListQuery();

	if (!user) {
		return null;
	}

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left outline-none focus-visible:bg-primary/10 focus-visible:ring-none">
					<div className="flex flex-1 items-center justify-start gap-2 text-sm overflow-hidden">
						{activeOrganization ? (
							<>
								<OrganizationLogo
									name={activeOrganization.name}
									logoUrl={activeOrganization.logo}
									className="hidden size-6 sm:block"
								/>
								<span className="block flex-1 truncate">
									{activeOrganization.name}
								</span>
							</>
						) : (
							<>
								<UserAvatar
									className="hidden size-6 sm:block"
									name={user.name ?? ""}
									avatarUrl={user.image}
								/>
								<span className="block truncate">
									{t(
										"organizations.organizationSelect.personalAccount",
									)}
								</span>
							</>
						)}
					</div>

					<ChevronsUpDownIcon className="block size-4 opacity-50" />
				</DropdownMenuTrigger>
				<DropdownMenuContent className="min-w-[200px]" align="start">
					{!config.organizations.requireOrganization && (
						<>
							<DropdownMenuRadioGroup
								value={activeOrganization?.id ?? user.id}
								onValueChange={(value: string) => {
									if (value === user.id) {
										router.replace("/app");
									}
								}}
							>
								<DropdownMenuLabel className="text-foreground/60 text-xs">
									{t(
										"organizations.organizationSelect.personalAccount",
									)}
								</DropdownMenuLabel>
								<DropdownMenuRadioItem
									value={user.id}
									className="flex cursor-pointer items-center justify-center gap-2 pl-3"
								>
									<div className="flex flex-1 items-center justify-start gap-2">
										<UserAvatar
											className="size-8"
											name={user.name ?? ""}
											avatarUrl={user.image}
										/>
										{user.name}
									</div>
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuRadioGroup
						value={activeOrganization?.id}
						onValueChange={(organizationId: string) => {
							const selectedOrg = allOrganizations?.find(
								(org) => org.id === organizationId,
							);
							console.log("Selected organization:", selectedOrg);

							if (selectedOrg?.slug) {
								console.log(
									"Setting active organization with slug:",
									selectedOrg.slug,
								);
								setActiveOrganization(selectedOrg.slug);
							}
						}}
					>
						<DropdownMenuLabel className="text-foreground/60 text-xs">
							{t(
								"organizations.organizationSelect.organizations",
							)}
						</DropdownMenuLabel>
						{allOrganizations?.map((organization) => (
							<DropdownMenuRadioItem
								key={organization.id}
								value={organization.id}
								className="flex cursor-pointer items-center justify-center gap-2 pl-3"
							>
								<div className="flex flex-1 items-center justify-start gap-2">
									<OrganizationLogo
										className="size-8"
										name={organization.name}
										logoUrl={organization.logo}
									/>
									{organization.name}
								</div>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>

					{config.organizations.enableUsersToCreateOrganizations && (
						<DropdownMenuGroup>
							<DropdownMenuItem
								asChild
								className="text-primary! cursor-pointer text-sm"
							>
								<Link href="/app/new-organization">
									<PlusIcon className="mr-2 size-6 rounded-md bg-primary/20 p-1" />
									{t(
										"organizations.organizationSelect.createNewOrganization",
									)}
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
