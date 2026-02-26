"use client";

import { Button } from "@community/ui/ui/button";
import { UserFollowButton } from "@community/ui/ui/user-follow-button";
import { UserLikeButton } from "@community/ui/ui/user-like-button";
import type { ProfileUser } from "@/modules/public/shared/components/UserSlideDeckUtils";
import { QrCodeIcon, Send, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSlideModeLauncher } from "../ProfileSlideModeLauncher";
import type { UserProfile } from "../types";

interface ProfileActionsProps {
	user: UserProfile;
	currentUserId?: string;
	profileUser: ProfileUser;
	onShowQR: () => void;
}

export function ProfileActions({
	user,
	currentUserId,
	profileUser,
	onShowQR,
}: ProfileActionsProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isSendingCard, setIsSendingCard] = useState(false);
	const isSelfProfile = currentUserId === user.id;
	const showFollowAction =
		!!currentUserId && !isSelfProfile && currentUserId !== user.id;
	const shouldShowMobileFloatingBar =
		isMobile && (showFollowAction || isSelfProfile || !currentUserId);
	const shouldShowSendCardBackButton = !currentUserId && !isSelfProfile;

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth <= 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const checkProfileComplete = () => {
		if (!currentUserId) return false;
		if (!user.name || !user.bio || !user.userRoleString) return false;
		return true;
	};

	const handleSendCard = async () => {
		if (!currentUserId) {
			const currentPath = window.location.pathname;
			window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;
			return;
		}
		if (!checkProfileComplete()) {
			toast.error("请先完善你的个人信息", {
				description: "需要填写姓名、个人简介和角色后才能发送名片",
				action: {
					label: "去完善",
					onClick: () => {
						window.location.href = `/me/edit?redirectAfterProfile=/u/${window.location.pathname.split("/").pop() || ""}`;
					},
				},
			});
			return;
		}
		setIsSendingCard(true);
		const profileUrl = `${window.location.origin}/u/${user.username}`;
		try {
			await navigator.clipboard.writeText(profileUrl);
			toast.success("名片链接已复制", {
				description: "可以粘贴分享给对方了",
			});
		} catch {
			toast.error("复制失败，请稍后重试");
		} finally {
			setIsSendingCard(false);
		}
	};

	const handleSendCardBack = async () => {
		if (!currentUserId) {
			const currentPath = window.location.pathname;
			const targetUsername = user.username;
			window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}&sendCardBack=true&targetUser=${targetUsername}`;
			return;
		}
		handleSendCard();
	};

	const handleShareProfile = useCallback(async () => {
		if (typeof window === "undefined" || !user.username) return;
		const profileUrl = `${window.location.origin}/u/${user.username}`;
		const shareTitle = user.name
			? `${user.name}的个人主页`
			: "Hackathon Weekly 社区个人主页";

		let shareError: unknown = null;
		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({ title: shareTitle, url: profileUrl });
			} catch (error) {
				if (
					!(error instanceof DOMException) ||
					error.name !== "AbortError"
				) {
					shareError = error;
				}
			}
		}
		try {
			if (typeof navigator !== "undefined" && navigator.clipboard) {
				await navigator.clipboard.writeText(profileUrl);
				toast.success("链接已复制，可直接分享给朋友");
			} else {
				window.prompt("复制链接", profileUrl);
				toast.success("请手动复制链接");
			}
		} catch {
			toast.error("复制失败，请稍后重试");
			return;
		}
		if (shareError) {
			toast.info("系统分享未成功，但链接已复制");
		}
	}, [user.name, user.username]);

	return (
		<>
			{/* Mobile share button - floating top right */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleShareProfile}
				className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-card border border-border hover:bg-muted transition-colors shadow-md lg:hidden"
			>
				<Share2 className="h-5 w-5" />
			</Button>

			{/* Desktop Action buttons */}
			<div className="hidden sm:flex flex-col sm:flex-row items-center gap-3">
				<div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
					{currentUserId && currentUserId !== user.id && (
						<>
							<UserFollowButton
								userId={user.id}
								initialFollowed={user.isFollowed}
								isMutualFollow={user.isMutualFollow}
								isLoggedIn={!!currentUserId}
							/>
							<UserLikeButton
								userId={user.id}
								initialLiked={user.isLiked}
								isLoggedIn={!!currentUserId}
							/>
						</>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{isSelfProfile && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleSendCard}
							disabled={isSendingCard}
							className="flex items-center gap-2"
						>
							<Send className="h-4 w-4" />
							发名片
						</Button>
					)}
					{isSelfProfile && user.username && (
						<Button
							variant="outline"
							size="sm"
							onClick={onShowQR}
							className="flex items-center gap-2"
						>
							<QrCodeIcon className="h-4 w-4" />
							二维码
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={handleShareProfile}
						className="hidden lg:flex items-center gap-2"
					>
						<Share2 className="h-4 w-4" />
						分享
					</Button>
					<ProfileSlideModeLauncher user={profileUser} />
				</div>
			</div>

			{/* Mobile Action buttons */}
			<div className="flex sm:hidden flex-wrap items-center justify-center gap-2">
				{isSelfProfile && (
					<>
						<a
							href="/me/edit"
							className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
						>
							编辑资料
						</a>
						<Button
							variant="outline"
							size="sm"
							onClick={handleSendCard}
							disabled={isSendingCard}
							className="flex items-center gap-2"
						>
							<Send className="h-4 w-4" />
							发名片
						</Button>
						{user.username && (
							<Button
								variant="outline"
								size="sm"
								onClick={onShowQR}
								className="flex items-center gap-2"
							>
								<QrCodeIcon className="h-4 w-4" />
								二维码
							</Button>
						)}
					</>
				)}
			</div>

			{/* Mobile Fixed Bottom Action Buttons */}
			{shouldShowMobileFloatingBar && (
				<div className="fixed inset-x-0 bottom-6 z-40 sm:hidden flex justify-center px-4">
					<div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3">
						{isSelfProfile ? (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={handleSendCard}
									disabled={isSendingCard}
									className="h-12 min-w-0 flex-1 rounded-full px-4 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
								>
									<Send className="h-4 w-4" />
									发名片
								</Button>
								{user.username && (
									<Button
										variant="outline"
										size="sm"
										onClick={onShowQR}
										className="h-12 min-w-0 flex-1 rounded-full px-4 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
									>
										<QrCodeIcon className="h-4 w-4" />
										二维码
									</Button>
								)}
							</>
						) : (
							<>
								{shouldShowSendCardBackButton ? (
									<Button
										variant="default"
										size="sm"
										onClick={handleSendCardBack}
										disabled={isSendingCard}
										className="h-12 min-w-0 flex-1 rounded-full px-4 text-base bg-primary text-foreground shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)] hover:bg-primary/90"
									>
										<Send className="h-4 w-4 mr-2" />
										回发名片
									</Button>
								) : (
									currentUserId && (
										<>
											<Button
												variant="outline"
												size="sm"
												onClick={handleSendCard}
												disabled={isSendingCard}
												className="h-12 min-w-0 flex-1 rounded-full px-4 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
											>
												<Send className="h-4 w-4" />
												回发名片
											</Button>
											{showFollowAction && (
												<UserFollowButton
													userId={user.id}
													initialFollowed={
														user.isFollowed
													}
													isMutualFollow={
														user.isMutualFollow
													}
													isLoggedIn={!!currentUserId}
													className="h-12 min-w-0 flex-1 rounded-full px-4 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
												/>
											)}
										</>
									)
								)}
							</>
						)}
					</div>
				</div>
			)}
		</>
	);
}
