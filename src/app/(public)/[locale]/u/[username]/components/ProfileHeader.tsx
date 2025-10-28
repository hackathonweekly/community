"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InteractiveBadge } from "@/components/ui/interactive-badge";
import { TruncatedText } from "@/components/ui/truncated-text";
import { UserFollowButton } from "@/components/ui/user-follow-button";
import { UserLikeButton } from "@/components/ui/user-like-button";
import type { ProfileUser } from "@/modules/public/shared/components/UserSlideDeckUtils";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import {
	Copy,
	ExternalLinkIcon,
	EyeIcon,
	GithubIcon,
	GlobeIcon,
	Handshake,
	MailIcon,
	MessageSquareIcon,
	Phone,
	QrCodeIcon,
	Send,
	Share2,
	Star,
	Trophy,
	TwitterIcon,
	Users,
	X,
	ChevronDown,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { ProfileSlideModeLauncher } from "../ProfileSlideModeLauncher";
import type { UserProfile } from "../types";
import { getImageUrl, getLifeStatusLabel } from "../types";

interface ProfileHeaderProps {
	user: UserProfile;
	currentUserId?: string;
	translations: {
		editProfile: string;
		eventsCreated: string;
		participants: string;
		collaborationInfo: string;
		whatICanOffer: string;
		whatIAmLookingFor: string;
		ourConnection: string;
		sharedEvents: string;
		badgesSection: string;
		badgeReason: string;
		certificatesSection: string;
	};
	profileUser: ProfileUser;
}

export function ProfileHeader({
	user,
	currentUserId,
	translations,
	profileUser,
}: ProfileHeaderProps) {
	const [showQR, setShowQR] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isSendingCard, setIsSendingCard] = useState(false);
	const [showContactInfo, setShowContactInfo] = useState(false);

	const skills = user.skills || [];
	const normalizedSkills = Array.isArray(skills)
		? skills.filter(
				(skill): skill is string =>
					typeof skill === "string" && skill.trim().length > 0,
			)
		: [];
	const isSelfProfile = currentUserId === user.id;
	const contactInfoUnlocked = user.canViewContacts;
	const contactAvailability = user.contactAvailability || {
		email: false,
		phone: false,
		wechat: false,
	};

	// 检测移动端
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// 阻止移动端背景滚动
	useEffect(() => {
		if (showQR && isMobile) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [showQR, isMobile]);

	// 检查当前用户信息是否完善
	const checkProfileComplete = () => {
		if (!currentUserId) return false;
		if (!user.name || !user.bio || !user.userRoleString) {
			return false;
		}
		return true;
	};

	// 发送名片功能
	const handleSendCard = async () => {
		if (!currentUserId) {
			// 未登录用户跳转到登录页面，带 redirectTo 参数
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
						// 完善信息后应该回到自己的名片页面
						window.location.href = `/app/profile?redirectAfterProfile=/u/${window.location.pathname.split("/").pop() || ""}`;
					},
				},
			});
			return;
		}

		setIsSendingCard(true);
		const profileUrl = `${window.location.origin}/zh/u/${user.username}`;

		try {
			await navigator.clipboard.writeText(profileUrl);
			toast.success("名片链接已复制", {
				description: "可以粘贴分享给对方了",
			});
		} catch (error) {
			toast.error("复制失败，请稍后重试");
		} finally {
			setIsSendingCard(false);
		}
	};

	// 回发名片功能 - 专门为未登录用户设计
	const handleSendCardBack = async () => {
		if (!currentUserId) {
			// 未登录用户跳转到登录页面，设置特殊的回发标识
			const currentPath = window.location.pathname;
			const targetUsername = user.username;
			// 设置回发标识，登录后会跳转到用户自己的名片页面
			window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}&sendCardBack=true&targetUser=${targetUsername}`;
			return;
		}

		// 已登录用户直接调用发送名片功能
		handleSendCard();
	};

	const handleShareProfile = useCallback(async () => {
		if (typeof window === "undefined" || !user.username) return;

		const profileUrl = `${window.location.origin}/zh/u/${user.username}`;
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
					console.error("Share failed:", error);
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
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("复制失败，请稍后重试");
			return;
		}

		if (shareError) {
			toast.info("系统分享未成功，但链接已复制");
		}
	}, [user.name, user.username]);

	const profileUrl = user.username
		? `${typeof window !== "undefined" ? window.location.origin : ""}/zh/u/${user.username}`
		: "";

	const showFollowAction =
		!!currentUserId && !isSelfProfile && currentUserId !== user.id;

	const shouldShowMobileFloatingBar =
		isMobile && (showFollowAction || isSelfProfile || !currentUserId);

	// 未登录用户是否显示回发名片按钮
	const shouldShowSendCardBackButton = !currentUserId && !isSelfProfile;

	const unlockedContactLabels = [
		user.wechatId || user.wechatQrCode ? "微信" : null,
		user.email ? "邮箱" : null,
		user.phoneNumber ? "电话" : null,
	].filter((label): label is string => Boolean(label));
	const lockedContactLabels = [
		contactAvailability.wechat ? "微信" : null,
		contactAvailability.email ? "邮箱" : null,
		contactAvailability.phone ? "电话" : null,
	].filter((label): label is string => Boolean(label));
	const hasUnlockedContactInfo = unlockedContactLabels.length > 0;
	const hasLockedContactInfo = lockedContactLabels.length > 0;
	const resolvedWechatQr = user.wechatQrCode
		? getImageUrl(user.wechatQrCode) || undefined
		: null;
	const copyToClipboard = useCallback((value: string, label: string) => {
		if (!value) return;
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			toast.error(`复制${label}失败，请手动复制`);
			return;
		}
		navigator.clipboard
			.writeText(value)
			.then(() => {
				toast.success(`${label}已复制`);
			})
			.catch(() => {
				toast.error(`复制${label}失败，请稍后重试`);
			});
	}, []);

	const CopyButton = ({
		value,
		label,
	}: {
		value: string;
		label: string;
	}) => (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={(event) => {
				event.preventDefault();
				event.stopPropagation();
				copyToClipboard(value, label);
			}}
			className="h-8 w-8 shrink-0 text-slate-400 transition-colors hover:text-emerald-600"
		>
			<Copy className="h-4 w-4" />
			<span className="sr-only">复制{label}</span>
		</Button>
	);

	return (
		<>
			{/* Logo button - floating top left */}
			<a
				href="/"
				className="fixed top-4 left-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-md"
			>
				<img
					src="/images/logo-stack.png"
					alt="Logo"
					className="w-10 h-10"
				/>
			</a>

			{/* Share button - floating top right */}
			<Button
				variant="ghost"
				size="icon"
				onClick={handleShareProfile}
				className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-md"
			>
				<Share2 className="h-5 w-5" />
			</Button>

			<div className="mb-8">
				{/* Mobile-first responsive layout */}
				<div className="space-y-6">
					{/* Desktop edit button - top right corner */}
					{currentUserId === user.id && (
						<a
							href="/app/profile"
							className="hidden sm:flex absolute top-4 right-4 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
						>
							{translations.editProfile}
						</a>
					)}

					{/* Avatar and basic info */}
					<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
						{/* Avatar */}
						<div className="flex-shrink-0">
							{user.image ? (
								<img
									src={getImageUrl(user.image) || undefined}
									alt={user.name || "User"}
									className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100"
								/>
							) : (
								<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
									{(user.name || "User")
										.charAt(0)
										.toUpperCase()}
								</div>
							)}
						</div>

						{/* Basic info */}
						<div className="flex-1 text-center sm:text-left">
							<h1 className="text-2xl sm:text-3xl font-bold mb-2">
								{user.name || "User"}
							</h1>

							{/* User level badges */}
							<div className="mb-3 flex justify-center sm:justify-start">
								<UserLevelBadges user={user} size="md" />
							</div>

							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
								{/* Current Work */}
								{user.currentWorkOn && (
									<Badge
										variant="default"
										className="text-sm font-medium max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[450px] truncate"
										title={user.currentWorkOn}
									>
										{user.currentWorkOn}
									</Badge>
								)}

								{/* User Role String */}
								{user.userRoleString && (
									<Badge
										variant="secondary"
										className="text-sm max-w-[160px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] truncate"
										title={user.userRoleString}
									>
										{user.userRoleString}
									</Badge>
								)}

								{/* Gender */}
								{user.gender &&
									user.gender !== "NOT_SPECIFIED" && (
										<div className="flex items-center text-sm text-muted-foreground">
											<Users className="h-4 w-4 mr-1" />
											{user.gender === "MALE"
												? "男"
												: user.gender === "FEMALE"
													? "女"
													: "其他"}
										</div>
									)}

								{/* Region */}
								{user.region && (
									<div className="flex items-center text-sm text-muted-foreground">
										<GlobeIcon className="h-4 w-4 mr-1" />
										{user.region}
									</div>
								)}

								{/* Life Status */}
								{user.lifeStatus && (
									<Badge
										variant="outline"
										className="text-sm"
									>
										{getLifeStatusLabel(user.lifeStatus)}
									</Badge>
								)}
							</div>

							{user.bio && (
								<div className="mb-4">
									<TruncatedText
										text={user.bio}
										maxLines={4}
										maxLength={180}
										className="text-muted-foreground text-center sm:text-left"
									/>
								</div>
							)}

							{/* Skills */}
							{normalizedSkills.length > 0 && (
								<div className="mb-4">
									<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 justify-center sm:justify-start">
										<Star className="h-4 w-4" />
										<span>技能</span>
									</div>
									<div className="flex flex-wrap gap-1 justify-center sm:justify-start">
										{normalizedSkills
											.slice(0, 5)
											.map((skill, index) => (
												<Badge
													key={index}
													variant="outline"
													className="text-xs bg-blue-50 border-blue-200 text-blue-700"
												>
													{skill}
												</Badge>
											))}
										{normalizedSkills.length > 5 && (
											<Badge
												variant="secondary"
												className="text-xs bg-blue-100 text-blue-800"
											>
												+{normalizedSkills.length - 5}
											</Badge>
										)}
									</div>
								</div>
							)}

							{/* Public social links */}
							{(user.githubUrl ||
								user.twitterUrl ||
								user.websiteUrl) && (
								<div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
									{user.githubUrl && (
										<a
											href={user.githubUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
										>
											<GithubIcon className="h-4 w-4 mr-1" />
											GitHub
										</a>
									)}

									{user.twitterUrl && (
										<a
											href={user.twitterUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
										>
											<TwitterIcon className="h-4 w-4 mr-1" />
											Twitter
										</a>
									)}

									{user.websiteUrl && (
										<a
											href={user.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
										>
											<ExternalLinkIcon className="h-4 w-4 mr-1" />
											Website
										</a>
									)}
								</div>
							)}

							{/* Mutual-follow contact privilege card - hidden for self profile */}
							{!isSelfProfile && (
								<div className="mt-4">
									<div
										onClick={() =>
											contactInfoUnlocked &&
											setShowContactInfo(!showContactInfo)
										}
										className={`rounded-xl border p-3 sm:p-4 transition-all cursor-pointer ${
											contactInfoUnlocked
												? "bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-emerald-200 shadow-sm hover:shadow-md"
												: "bg-slate-50 border-dashed border-slate-300 cursor-not-allowed"
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<div
													className={`grid h-7 w-7 place-items-center rounded-lg ${
														contactInfoUnlocked
															? "bg-emerald-100 text-emerald-600"
															: "bg-slate-100 text-slate-500"
													}`}
												>
													<Handshake className="h-3.5 w-3.5" />
												</div>
												<div>
													<p className="text-sm font-semibold text-slate-800">
														{contactInfoUnlocked
															? "联系方式已解锁"
															: "互关可见联系方式"}
													</p>
													{contactInfoUnlocked &&
														hasUnlockedContactInfo && (
															<p className="text-xs text-slate-500">
																{showContactInfo
																	? "点击收起"
																	: "点击查看"}{" "}
																{unlockedContactLabels.join(
																	"、",
																)}
															</p>
														)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Badge
													variant={
														contactInfoUnlocked
															? "default"
															: "outline"
													}
													className={`text-xs ${
														contactInfoUnlocked
															? ""
															: "border-slate-300 text-slate-500"
													}`}
												>
													仅互关
												</Badge>
												{contactInfoUnlocked &&
													hasUnlockedContactInfo && (
														<ChevronDown
															className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
																showContactInfo
																	? "rotate-180"
																	: ""
															}`}
														/>
													)}
											</div>
										</div>

										{/* 展开的联系方式内容 */}
										<div
											className={`overflow-hidden transition-all duration-300 ${
												showContactInfo &&
												contactInfoUnlocked
													? "max-h-96 opacity-100 mt-4"
													: "max-h-0 opacity-0"
											}`}
										>
											{contactInfoUnlocked && (
												<div className="space-y-3 text-sm text-slate-700 border-t border-emerald-200 pt-4">
													{hasUnlockedContactInfo ? (
														<>
															{user.email && (
																<div className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2">
																	<a
																		href={`mailto:${user.email}`}
																		className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-emerald-600"
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																	>
																		<MailIcon className="h-4 w-4 text-emerald-600" />
																		<span className="break-all">
																			{
																				user.email
																			}
																		</span>
																	</a>
																	<CopyButton
																		value={
																			user.email
																		}
																		label="邮箱"
																	/>
																</div>
															)}

															{user.phoneNumber && (
																<div className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2">
																	<a
																		href={`tel:${user.phoneNumber}`}
																		className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-emerald-600"
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																	>
																		<Phone className="h-4 w-4 text-emerald-600" />
																		<span className="break-all">
																			{
																				user.phoneNumber
																			}
																		</span>
																	</a>
																	<CopyButton
																		value={
																			user.phoneNumber
																		}
																		label="电话"
																	/>
																</div>
															)}

															{(user.wechatId ||
																resolvedWechatQr) && (
																<div className="space-y-2 rounded-md bg-white/60 px-3 py-3">
																	{user.wechatId && (
																		<div className="flex items-center justify-between gap-2 text-sm">
																			<div className="flex items-center gap-2 text-sm">
																				<MessageSquareIcon className="h-4 w-4 text-emerald-600" />
																				<span className="font-medium text-slate-700 break-all">
																					微信号：
																					{
																						user.wechatId
																					}
																				</span>
																			</div>
																			<CopyButton
																				value={
																					user.wechatId!
																				}
																				label="微信号"
																			/>
																		</div>
																	)}
																	{resolvedWechatQr && (
																		<div>
																			<span className="text-xs text-slate-500">
																				微信二维码
																			</span>
																			<div className="mt-2 w-32 overflow-hidden rounded border border-emerald-200 bg-white p-2">
																				<img
																					src={
																						resolvedWechatQr
																					}
																					alt="微信二维码"
																					className="h-28 w-full object-contain"
																				/>
																			</div>
																		</div>
																	)}
																</div>
															)}

															{!contactAvailability.wechat && (
																<p className="text-xs text-slate-400">
																	对方暂未填写微信。
																</p>
															)}
														</>
													) : (
														<p className="text-sm text-slate-500">
															对方暂未填写联系方式。
														</p>
													)}
												</div>
											)}
										</div>

										{/* 锁定状态的提示信息 */}
										{!contactInfoUnlocked && (
											<div className="mt-2">
												<p className="text-xs text-slate-500">
													{user.isFollowed
														? `等待对方回关解锁${hasLockedContactInfo ? `：${lockedContactLabels.join("、")}` : ""}`
														: `关注后互相关注解锁${hasLockedContactInfo ? `：${lockedContactLabels.join("、")}` : ""}`}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Top Badges Display */}
							{user.userBadges && user.userBadges.length > 0 && (
								<div className="mt-4">
									<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
										{user.userBadges
											.slice(0, 3)
											.map((userBadge: any) => {
												const badge = userBadge.badge;
												const rarityColors: Record<
													string,
													string
												> = {
													COMMON: "from-gray-400 to-gray-600",
													UNCOMMON:
														"from-green-400 to-green-600",
													RARE: "from-blue-400 to-blue-600",
													EPIC: "from-purple-400 to-purple-600",
													LEGENDARY:
														"from-yellow-400 to-yellow-600",
												};
												const bgGradient =
													rarityColors[
														badge.rarity
													] || rarityColors.COMMON;

												return (
													<InteractiveBadge
														key={userBadge.id}
														className="flex items-center gap-1 p-1.5 border rounded-lg hover:shadow-sm transition-shadow bg-gradient-to-r from-background to-muted/30 cursor-pointer"
														scrollToTarget="badges-section"
													>
														<div
															className={`w-5 h-5 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center`}
														>
															<Trophy className="w-3 h-3 text-white" />
														</div>
														<span className="text-xs font-medium text-muted-foreground">
															{badge.name}
														</span>
													</InteractiveBadge>
												);
											})}
										{user.userBadges.length > 3 && (
											<InteractiveBadge
												className="flex items-center gap-1 p-1.5 border rounded-lg hover:shadow-sm transition-shadow bg-muted/30 cursor-pointer"
												scrollToTarget="badges-section"
											>
												<Trophy className="w-4 h-4 text-muted-foreground" />
												<span className="text-xs text-muted-foreground">
													+
													{user.userBadges.length - 3}
												</span>
											</InteractiveBadge>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Desktop Action buttons */}
					<div className="hidden sm:flex flex-col sm:flex-row items-center gap-3">
						<div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
							{/* Follow and like buttons - can't follow/like yourself */}
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
							{/* 发送名片按钮 - 仅自己可见 */}
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

							{/* 二维码按钮 - 仅自己可见 */}
							{isSelfProfile && user.username && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowQR(true)}
									className="flex items-center gap-2"
								>
									<QrCodeIcon className="h-4 w-4" />
									二维码
								</Button>
							)}

							<ProfileSlideModeLauncher user={profileUser} />
							<div className="flex items-center text-sm text-muted-foreground">
								<EyeIcon className="h-4 w-4 mr-1" />
								{user.profileViews} 浏览
							</div>
						</div>
					</div>

					{/* Mobile Action buttons - only non-critical actions, main actions moved to fixed bar */}
					<div className="flex sm:hidden flex-wrap items-center justify-center gap-2">
						{/* Mobile edit button for self profile */}
						{isSelfProfile && (
							<a
								href="/app/profile"
								className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
							>
								{translations.editProfile}
							</a>
						)}

						{/* Mobile utility buttons for self-profile only */}
						{isSelfProfile && (
							<>
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
										onClick={() => setShowQR(true)}
										className="flex items-center gap-2"
									>
										<QrCodeIcon className="h-4 w-4" />
										二维码
									</Button>
								)}
							</>
						)}

						{/* Mobile non-action buttons */}
						<div className="flex items-center gap-2">
							<div className="hidden sm:block">
								<ProfileSlideModeLauncher user={profileUser} />
							</div>
							<div className="flex items-center text-sm text-muted-foreground">
								<EyeIcon className="h-4 w-4 mr-1" />
								{user.profileViews}
							</div>
						</div>
					</div>

					{/* 二维码弹窗 */}
					{showQR &&
						user.username &&
						(isMobile ? (
							// 移动端全屏显示
							<div className="fixed inset-0 bg-white z-50 flex flex-col">
								<div className="flex justify-between items-center p-4 border-b">
									<h3 className="text-lg font-semibold">
										个人名片二维码
									</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowQR(false)}
										className="p-2"
									>
										<X className="h-5 w-5" />
									</Button>
								</div>
								<div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6">
									<div className="bg-white p-6 rounded-lg shadow-sm border">
										<QRCode
											value={profileUrl}
											size={Math.min(
												typeof window !== "undefined"
													? window.innerWidth - 120
													: 300,
												300,
											)}
											level="M"
										/>
									</div>
									<div className="text-center space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												扫码查看我的个人主页
											</p>
											<code className="text-sm bg-muted px-2 py-1 rounded">
												@{user.username}
											</code>
										</div>
										<div className="space-y-2">
											<Button
												onClick={async () => {
													try {
														await navigator.clipboard.writeText(
															profileUrl,
														);
														toast.success(
															"链接已复制",
														);
													} catch (error) {
														toast.error("复制失败");
													}
												}}
												className="w-full"
											>
												复制链接
											</Button>
											<Button
												variant="outline"
												onClick={() => setShowQR(false)}
												className="w-full"
											>
												关闭
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							// 桌面端弹窗显示
							<>
								<div
									className="fixed inset-0 bg-black/20 z-40"
									onClick={() => setShowQR(false)}
								/>
								<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-lg p-6 z-50 min-w-[320px]">
									<div className="flex justify-center mb-4">
										<div className="bg-white p-3 rounded border">
											<QRCode
												value={profileUrl}
												size={240}
												level="M"
											/>
										</div>
									</div>
									<div className="text-center mb-4">
										<p className="text-sm text-muted-foreground mb-2">
											个人名片二维码
										</p>
										<code className="text-sm bg-muted px-2 py-1 rounded">
											@{user.username}
										</code>
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={async () => {
												try {
													await navigator.clipboard.writeText(
														profileUrl,
													);
													toast.success("链接已复制");
												} catch (error) {
													toast.error("复制失败");
												}
											}}
											className="flex-1"
										>
											复制链接
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowQR(false)}
											className="flex-1"
										>
											关闭
										</Button>
									</div>
								</div>
							</>
						))}
				</div>
			</div>

			{/* Mobile Fixed Bottom Action Buttons */}
			{shouldShowMobileFloatingBar && (
				<div className="fixed inset-x-0 bottom-6 z-40 sm:hidden flex justify-center px-4">
					<div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3">
						{isSelfProfile ? (
							// 访问自己的名片：显示发名片和二维码按钮
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={handleSendCard}
									disabled={isSendingCard}
									className="h-12 flex-1 min-w-[140px] rounded-full px-5 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
								>
									<Send className="h-4 w-4" />
									发名片
								</Button>
								{user.username && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowQR(true)}
										className="h-12 flex-1 min-w-[140px] rounded-full px-5 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
									>
										<QrCodeIcon className="h-4 w-4" />
										二维码
									</Button>
								)}
							</>
						) : (
							// 访问他人名片
							<>
								{shouldShowSendCardBackButton ? (
									// 未登录用户：只显示回发名片按钮
									<Button
										variant="default"
										size="sm"
										onClick={handleSendCardBack}
										disabled={isSendingCard}
										className="h-12 flex-1 min-w-[160px] rounded-full px-5 text-base bg-primary hover:bg-primary/90 text-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
									>
										<Send className="h-4 w-4 mr-2" />
										回发名片
									</Button>
								) : (
									// 已登录用户：显示回发名片和关注两个按钮
									currentUserId && (
										<>
											{/* 回发名片按钮 */}
											<Button
												variant="outline"
												size="sm"
												onClick={handleSendCard}
												disabled={isSendingCard}
												className="h-12 flex-1 min-w-[140px] rounded-full px-5 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
											>
												<Send className="h-4 w-4" />
												回发名片
											</Button>

											{/* 关注按钮 */}
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
													className="h-12 flex-1 min-w-[140px] rounded-full px-5 text-base shadow-[0_12px_24px_-12px_rgba(15,23,42,0.45)]"
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
