"use client";

import { config } from "@/config";
import { useLocalePathname, useLocaleRouter } from "@i18n/routing";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguagesIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const { locales } = config.i18n;

export function LocaleSwitch({
	withLocaleInUrl = true,
}: {
	withLocaleInUrl?: boolean;
}) {
	const localeRouter = useLocaleRouter();
	const localePathname = useLocalePathname();
	const searchParams = useSearchParams();
	const currentLocale = useLocale();
	const [value, setValue] = useState<string>(currentLocale);

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Language">
					<LanguagesIcon className="size-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(value) => {
						setValue(value);

						if (withLocaleInUrl) {
							localeRouter.replace(
								`${localePathname}?${searchParams.toString()}`,
								{
									locale: value,
								},
							);
						} else {
							// For docs pages, construct the correct localized path
							const targetPath = localePathname.startsWith(
								"/docs",
							)
								? localePathname
								: "/docs";
							localeRouter.push(
								`${targetPath}?${searchParams.toString()}`,
								{
									locale: value,
								},
							);
						}
					}}
				>
					{Object.entries(locales).map(([locale, { label }]) => {
						return (
							<DropdownMenuRadioItem key={locale} value={locale}>
								{label}
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
