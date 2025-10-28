"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Search, Users, Plus, X, Loader2, UserPlus } from "lucide-react";

interface TeamMember {
	id: string;
	name: string;
	image?: string;
	username?: string;
	userRoleString?: string;
}

interface TeamMemberSelectorProps {
	selectedMembers: string[];
	onMembersChange: (memberIds: string[]) => void;
	maxMembers?: number;
	projectId?: string;
}

export function TeamMemberSelector({
	selectedMembers,
	onMembersChange,
	maxMembers = 4,
	projectId,
}: TeamMemberSelectorProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
	const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
	const [selectedMemberDetails, setSelectedMemberDetails] = useState<
		TeamMember[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Load selected member details
	useEffect(() => {
		const loadMemberDetails = async () => {
			if (selectedMembers.length === 0) {
				setSelectedMemberDetails([]);
				return;
			}

			try {
				// Load member details for selected IDs
				const promises = selectedMembers.map(async (id) => {
					const response = await fetch(`/api/users/${id}`);
					if (response.ok) {
						const data = await response.json();
						return data.data;
					}
					return null;
				});

				const members = await Promise.all(promises);
				setSelectedMemberDetails(members.filter(Boolean));
			} catch (error) {
				console.error("Error loading member details:", error);
			}
		};

		loadMemberDetails();
	}, [selectedMembers]);

	// Search users
	useEffect(() => {
		const searchUsers = async () => {
			if (
				!debouncedSearchQuery.trim() ||
				debouncedSearchQuery.length < 2
			) {
				setSearchResults([]);
				return;
			}

			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/users/search?query=${encodeURIComponent(debouncedSearchQuery)}&limit=10`,
				);
				if (response.ok) {
					const data = await response.json();
					// Filter out already selected members
					const filteredResults =
						data.data?.filter(
							(user: TeamMember) =>
								!selectedMembers.includes(user.id),
						) || [];
					setSearchResults(filteredResults);
				}
			} catch (error) {
				console.error("Error searching users:", error);
			} finally {
				setIsLoading(false);
			}
		};

		searchUsers();
	}, [debouncedSearchQuery, selectedMembers]);

	const handleAddMember = (member: TeamMember) => {
		if (selectedMembers.length >= maxMembers) {
			return; // Max members reached
		}

		const newMembers = [...selectedMembers, member.id];
		onMembersChange(newMembers);
		setSearchQuery("");
		setSearchResults([]);
		setOpen(false);
	};

	const handleRemoveMember = (memberId: string) => {
		const newMembers = selectedMembers.filter((id) => id !== memberId);
		onMembersChange(newMembers);
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Users className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						{t("hackathon.team.members", {
							current: selectedMembers.length,
							max: maxMembers,
						})}
					</span>
				</div>

				{/* Add Member Button */}
				{selectedMembers.length < maxMembers && (
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="ml-auto"
							>
								<Plus className="w-4 h-4 mr-1" />
								{t("hackathon.team.addMember")}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="end">
							<Command>
								<div className="flex items-center border-b px-3">
									<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
									<input
										placeholder={t(
											"hackathon.team.searchPlaceholder",
										)}
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
								<div className="max-h-60 overflow-auto">
									{isLoading ? (
										<div className="flex items-center justify-center p-4">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span className="ml-2 text-sm text-muted-foreground">
												{t("common.searching")}
											</span>
										</div>
									) : searchResults.length > 0 ? (
										<CommandGroup
											heading={t(
												"hackathon.team.searchResults",
											)}
										>
											{searchResults.map((user) => (
												<CommandItem
													key={user.id}
													onSelect={() =>
														handleAddMember(user)
													}
													className="flex items-center space-x-2 p-2 cursor-pointer"
												>
													<Avatar className="h-6 w-6">
														<AvatarImage
															src={user.image}
															alt={user.name}
														/>
														<AvatarFallback className="text-xs">
															{getInitials(
																user.name,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">
															{user.name}
														</p>
														{user.username && (
															<p className="text-xs text-muted-foreground">
																@{user.username}
															</p>
														)}
													</div>
													<UserPlus className="h-4 w-4 text-muted-foreground" />
												</CommandItem>
											))}
										</CommandGroup>
									) : debouncedSearchQuery.trim() &&
										debouncedSearchQuery.length >= 2 ? (
										<CommandEmpty className="p-4 text-center">
											<div className="text-sm text-muted-foreground">
												{t("hackathon.team.noResults")}
											</div>
										</CommandEmpty>
									) : (
										<div className="p-4 text-center">
											<div className="text-sm text-muted-foreground">
												{t(
													"hackathon.team.startTyping",
												)}
											</div>
										</div>
									)}
								</div>
							</Command>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{/* Selected Members */}
			{selectedMemberDetails.length > 0 ? (
				<div className="space-y-2">
					{selectedMemberDetails.map((member) => (
						<Card key={member.id} className="p-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={member.image}
											alt={member.name}
										/>
										<AvatarFallback className="text-xs">
											{getInitials(member.name)}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium text-sm">
											{member.name}
										</p>
										<div className="flex items-center space-x-2">
											{member.username && (
												<span className="text-xs text-muted-foreground">
													@{member.username}
												</span>
											)}
											{member.userRoleString && (
												<Badge
													variant="secondary"
													className="text-xs"
												>
													{member.userRoleString}
												</Badge>
											)}
										</div>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										handleRemoveMember(member.id)
									}
									className="text-muted-foreground hover:text-destructive"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</Card>
					))}
				</div>
			) : (
				<Card className="p-6">
					<div className="text-center text-muted-foreground">
						<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">
							{t("hackathon.team.noMembers")}
						</p>
						<p className="text-xs mt-1">
							{t("hackathon.team.addMembersHelp")}
						</p>
					</div>
				</Card>
			)}

			{/* Team Size Warning */}
			{selectedMembers.length >= maxMembers && (
				<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0" />
						<p className="text-sm text-amber-700">
							{t("hackathon.team.maxMembersReached", {
								max: maxMembers,
							})}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
