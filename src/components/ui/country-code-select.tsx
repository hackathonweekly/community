"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { countryCodes } from "@/lib/country-codes";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CountryCodeSelectProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function CountryCodeSelect({
	value,
	onChange,
	className,
}: CountryCodeSelectProps) {
	const [open, setOpen] = useState(false);

	const selectedCountry = countryCodes.find(
		(country) => country.code === value,
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className={cn(
						// 使用与Input相同的样式
						"border-input flex h-9 w-[100px] min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
						// 特定样式：右边不圆角，右边无边框
						"rounded-r-none border-r-0 justify-between",
						className,
					)}
				>
					<span className="truncate text-foreground">
						{selectedCountry ? selectedCountry.code : "+86"}
					</span>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索国家或地区..." />
					<CommandList>
						<CommandEmpty>未找到匹配的国家或地区</CommandEmpty>
						<CommandGroup>
							{countryCodes.map((country) => (
								<CommandItem
									key={country.code}
									value={`${country.country} ${country.code} ${country.iso}`}
									onSelect={() => {
										onChange(country.code);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === country.code
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									<div className="flex items-center justify-between w-full">
										<span className="truncate mr-2">
											{country.country}
										</span>
										<span className="text-muted-foreground text-sm">
											{country.code}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
