"use client";

import { cn } from "@community/lib-shared/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Input } from "@community/ui/ui/input";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export interface MemberSearchUser {
	id: string;
	name: string;
	username?: string;
	image?: string;
	userRoleString?: string;
	currentWorkOn?: string;
	phoneNumber?: string;
}

interface MemberSearchInputProps {
	id?: string;
	value: string;
	onValueChange: (value: string) => void;
	onSelect: (user: MemberSearchUser) => void;
	placeholder?: string;
	limit?: number;
	minQueryLength?: number;
	disabled?: boolean;
	excludeUserIds?: string[];
	className?: string;
	inputClassName?: string;
	dropdownClassName?: string;
	emptyText?: string;
}

function getPhoneSuffix(phoneNumber?: string) {
	if (!phoneNumber) return null;
	const digits = phoneNumber.replace(/\D/g, "");
	if (digits.length < 4) return digits || phoneNumber;
	return digits.slice(-4);
}

export function MemberSearchInput({
	id,
	value,
	onValueChange,
	onSelect,
	placeholder = "输入姓名、用户名或手机号搜索...",
	limit = 20,
	minQueryLength = 2,
	disabled = false,
	excludeUserIds = [],
	className,
	inputClassName,
	dropdownClassName,
	emptyText = "未找到匹配用户，请尝试姓名 / 用户名 / 手机号",
}: MemberSearchInputProps) {
	const trimmedQuery = value.trim();
	const debouncedQuery = useDebounce(trimmedQuery, 300);
	const excludeUserIdsKey = excludeUserIds.join(",");

	const [results, setResults] = useState<MemberSearchUser[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const latestQueryRef = useRef(debouncedQuery);
	const canSearch = debouncedQuery.length >= minQueryLength;

	useEffect(() => {
		latestQueryRef.current = debouncedQuery;

		if (!canSearch || disabled) {
			setResults([]);
			setIsSearching(false);
			return;
		}

		const controller = new AbortController();
		const searchUsers = async () => {
			setIsSearching(true);
			try {
				const params = new URLSearchParams({
					query: debouncedQuery,
					limit: `${limit}`,
				});
				const response = await fetch(`/api/users/search?${params}`, {
					signal: controller.signal,
					cache: "no-store",
				});

				if (!response.ok) {
					if (latestQueryRef.current === debouncedQuery) {
						setResults([]);
					}
					return;
				}

				const data = await response.json();
				if (latestQueryRef.current !== debouncedQuery) {
					return;
				}

				const users = Array.isArray(data?.data)
					? (data.data as MemberSearchUser[])
					: [];
				const excludeSet = new Set(
					excludeUserIdsKey ? excludeUserIdsKey.split(",") : [],
				);
				setResults(users.filter((user) => !excludeSet.has(user.id)));
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					return;
				}
				console.error("Error searching members:", error);
				if (latestQueryRef.current === debouncedQuery) {
					setResults([]);
				}
			} finally {
				if (latestQueryRef.current === debouncedQuery) {
					setIsSearching(false);
				}
			}
		};

		searchUsers();
		return () => controller.abort();
	}, [canSearch, debouncedQuery, disabled, excludeUserIdsKey, limit]);

	const showNoResults = canSearch && !isSearching && results.length === 0;
	const showDropdown =
		!disabled && (isSearching || results.length > 0 || showNoResults);

	return (
		<div className={cn("relative", className)}>
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				id={id}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				placeholder={placeholder}
				autoComplete="off"
				disabled={disabled}
				className={cn("pl-9", inputClassName)}
			/>
			{isSearching ? (
				<div className="absolute right-3 top-1/2 -translate-y-1/2">
					<div className="h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground" />
				</div>
			) : null}

			{showDropdown ? (
				<div
					className={cn(
						"absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-md border bg-background shadow",
						dropdownClassName,
					)}
				>
					{results.map((user) => {
						const phoneSuffix = getPhoneSuffix(user.phoneNumber);
						const meta = [
							user.username ? `@${user.username}` : null,
							user.userRoleString ?? null,
							phoneSuffix ? `手机号尾号 ${phoneSuffix}` : null,
						].filter(Boolean);

						return (
							<button
								key={user.id}
								type="button"
								onClick={() => {
									onSelect(user);
									setResults([]);
								}}
								className="flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted"
							>
								<Avatar className="h-8 w-8">
									<AvatarImage src={user.image} />
									<AvatarFallback>
										{user.name[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium leading-tight">
										{user.name}
									</p>
									{meta.length > 0 ? (
										<p className="truncate text-xs text-muted-foreground">
											{meta.join(" • ")}
										</p>
									) : null}
								</div>
							</button>
						);
					})}
					{showNoResults ? (
						<div className="px-4 py-3 text-sm text-muted-foreground">
							{emptyText}
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
