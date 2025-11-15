"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { useParticipantSearch } from "@/features/event-submissions/hooks";
import type { UserSearchResult } from "@/features/event-submissions/types";

interface UserSearchComboboxProps {
	eventId: string;
	scope?: "event" | "global";
	excludeIds?: string[];
	placeholder?: string;
	onSelect: (user: UserSearchResult) => void;
	triggerLabel?: string;
	disabled?: boolean;
}

export function UserSearchCombobox({
	eventId,
	scope = "event",
	excludeIds = [],
	onSelect,
	placeholder = "搜索用户...",
	triggerLabel = "搜索",
	disabled = false,
}: UserSearchComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 400);
	const { data, isLoading } = useParticipantSearch({
		eventId,
		query: debouncedQuery,
		scope,
		excludeIds,
		enabled: open,
	});

	const handleSelect = (user: UserSearchResult) => {
		onSelect(user);
		setOpen(false);
		setQuery("");
	};

	const handleOpenChange = (next: boolean) => {
		if (disabled) return;
		setOpen(next);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="justify-between"
					disabled={disabled}
				>
					<Search className="mr-2 h-4 w-4" />
					{triggerLabel}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0" align="start">
				{/* Disable client-side filtering; results are already filtered server-side */}
				<Command shouldFilter={false}>
					<div className="relative">
						<CommandInput
							placeholder={placeholder}
							value={query}
							onValueChange={setQuery}
						/>
						{isLoading && (
							<Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>
					<CommandList>
						{debouncedQuery.length < 2 && (
							<CommandEmpty>请输入至少两个字符</CommandEmpty>
						)}
						{debouncedQuery.length >= 2 &&
							!isLoading &&
							data?.length === 0 && (
								<CommandEmpty>未找到匹配的用户</CommandEmpty>
							)}
						<CommandGroup>
							{data?.map((user) => (
								<CommandItem
									key={user.id}
									value={
										[user.name, user.username, user.email]
											.filter(Boolean)
											.join(" ") || user.id
									}
									onSelect={() => handleSelect(user)}
								>
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={user.image ?? undefined}
											/>
											<AvatarFallback>
												{user.name?.slice(0, 2) ?? "?"}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium">
												{user.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{user.username
													? `@${user.username}`
													: user.email}
											</p>
										</div>
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
