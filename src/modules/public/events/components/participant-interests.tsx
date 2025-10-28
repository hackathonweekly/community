"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { HeartIcon, UsersIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface InterestUser {
	id: string;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
		userRoleString?: string;
		currentWorkOn?: string;
		bio?: string;
	};
	createdAt: string;
}

interface ParticipantInterestsProps {
	eventId: string;
	currentUserId?: string;
	showIfEmpty?: boolean;
}

export function ParticipantInterests({
	eventId,
	currentUserId,
	showIfEmpty = true,
}: ParticipantInterestsProps) {
	const t = useTranslations();
	const [interestedInUsers, setInterestedInUsers] = useState<InterestUser[]>(
		[],
	);
	const [interestedByUsers, setInterestedByUsers] = useState<InterestUser[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isInterestedInOpen, setIsInterestedInOpen] = useState(false);
	const [isInterestedByOpen, setIsInterestedByOpen] = useState(false);

	const fetchInterests = async () => {
		if (!currentUserId) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/participant-interests`,
			);

			if (!response.ok) {
				if (response.status === 403) {
					// 用户未参与活动，不显示错误
					return;
				}
				throw new Error("Failed to fetch interests");
			}

			const result = await response.json();
			if (result.success) {
				setInterestedInUsers(result.data.interestedIn || []);
				setInterestedByUsers(result.data.interestedBy || []);
			}
		} catch (error) {
			console.error("Error fetching interests:", error);
			// 静默处理错误，不显示toast
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchInterests();
	}, [eventId, currentUserId]);

	// 如果用户未登录或没有参与活动，不显示组件
	if (!currentUserId) {
		return null;
	}

	// 如果没有任何感兴趣关系且不强制显示，则不显示组件
	if (
		!showIfEmpty &&
		interestedInUsers.length === 0 &&
		interestedByUsers.length === 0
	) {
		return null;
	}

	const renderUserList = (users: InterestUser[]) => (
		<div className="space-y-3">
			{users.length === 0 ? (
				<div className="text-center text-muted-foreground py-8">
					<HeartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
					<p className="text-sm">
						{t("events.participantsSection.noInterests")}
					</p>
				</div>
			) : (
				users.map((interest) => (
					<div
						key={interest.user.id}
						className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
					>
						<div
							className="cursor-pointer flex-shrink-0"
							onClick={() => {
								window.open(
									`/u/${interest.user.username || interest.user.id}`,
									"_blank",
								);
							}}
						>
							<UserAvatar
								name={interest.user.name}
								avatarUrl={interest.user.image}
								className="w-10 h-10 ring-2 ring-transparent hover:ring-blue-200 transition-all"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h4
								className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
								onClick={() => {
									window.open(
										`/u/${interest.user.username || interest.user.id}`,
										"_blank",
									);
								}}
							>
								{interest.user.name}
							</h4>
							<div className="text-xs text-muted-foreground truncate">
								{interest.user.userRoleString && (
									<span>{interest.user.userRoleString}</span>
								)}
								{interest.user.userRoleString &&
									interest.user.currentWorkOn && (
										<span> • </span>
									)}
								{interest.user.currentWorkOn && (
									<span className="italic">
										正在做 {interest.user.currentWorkOn}
									</span>
								)}
							</div>
							{interest.user.bio && (
								<div className="text-xs text-muted-foreground mt-1 line-clamp-2">
									{interest.user.bio}
								</div>
							)}
						</div>
						<div className="flex-shrink-0 text-xs text-muted-foreground">
							{new Date(interest.createdAt).toLocaleDateString(
								"zh-CN",
								{
									month: "short",
									day: "numeric",
								},
							)}
						</div>
					</div>
				))
			)}
		</div>
	);

	return (
		<div className="pt-3 border-t">
			<div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
				<UsersIcon className="w-4 h-4" />
				<span>{t("events.participantsSection.interestSection")}</span>
			</div>

			<div className="flex gap-3">
				{/* 我感兴趣的人 */}
				<Dialog
					open={isInterestedInOpen}
					onOpenChange={setIsInterestedInOpen}
				>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
						>
							<HeartSolidIcon className="w-4 h-4 text-red-500" />
							<span>
								{t("events.participantsSection.myInterests")}
							</span>
							{interestedInUsers.length > 0 && (
								<span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
									{interestedInUsers.length}
								</span>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<HeartSolidIcon className="w-5 h-5 text-red-500" />
								{t("events.participantsSection.myInterests")} (
								{interestedInUsers.length})
							</DialogTitle>
						</DialogHeader>
						<div className="mt-4">
							{renderUserList(interestedInUsers)}
						</div>
					</DialogContent>
				</Dialog>

				{/* 对我感兴趣的人 */}
				<Dialog
					open={isInterestedByOpen}
					onOpenChange={setIsInterestedByOpen}
				>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
						>
							<HeartIcon className="w-4 h-4 text-blue-500" />
							<span>
								{t("events.participantsSection.interestedInMe")}
							</span>
							{interestedByUsers.length > 0 && (
								<span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
									{interestedByUsers.length}
								</span>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<HeartIcon className="w-5 h-5 text-blue-500" />
								{t("events.participantsSection.interestedInMe")}{" "}
								({interestedByUsers.length})
							</DialogTitle>
						</DialogHeader>
						<div className="mt-4">
							{renderUserList(interestedByUsers)}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
