"use client";

import { useSession } from "@dashboard/auth/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	CalendarDays,
	Clock3,
	Heart,
	Info,
	Link as LinkIcon,
	MapPin,
	QrCode,
	Share2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ElementType, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { EventDetailsProps } from "@/app/(public)/[locale]/events/[eventId]/EventDetailsClient";
import { ManagementButton } from "@/app/(public)/[locale]/events/[eventId]/components/ManagementButton";
import { eventKeys } from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import {
	useEventEngagement,
	useEventPhotos,
	useEventProjectSubmissions,
	useEventRegistration,
	useIncrementViewCount,
	useUserFeedback,
} from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import { useRegistrationStatus } from "@/app/(public)/[locale]/events/[eventId]/hooks/useRegistrationStatus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EventShareModal } from "@/modules/dashboard/events/components/EventShareModal";
import { QRGenerator } from "@/modules/dashboard/events/components/QRGenerator";
import {
	EventDescription,
	EventRegistrationModal,
} from "@/modules/public/events/components";
import ContactOrganizerDialog from "@/modules/public/events/components/ContactOrganizerDialog";
import { SimpleEventFeedbackDialog } from "@/modules/public/events/components/SimpleEventFeedbackDialog";
import { RegistrationSuccessModal } from "@/modules/public/events/components/registration-success-modal";

type EventData = EventDetailsProps["event"];

type NewEventClientProps = {
	event: EventData;
	locale?: string;
};

const getEventTypeLabels = (t: any): Record<string, string> => ({
	MEETUP: t("events.types.meetup"),
	HACKATHON: t("events.types.hackathon"),
	BUILDING_PUBLIC: t("events.types.buildingPublic"),
});

export function NewEventPageClient({
	event,
	locale = "zh",
}: NewEventClientProps) {
	const t = useTranslations();
	const { user, loaded } = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	useIncrementViewCount(event.id);

	const { projectSubmissions } = useEventProjectSubmissions(event.id);
	const { photos = [] } = useEventPhotos(event.id, t);
	const { isBookmarked, isLiked, likeCount, toggleBookmark, toggleLike } =
		useEventEngagement(event.id, user?.id);
	const { userFeedback, hasSubmittedFeedback } = useUserFeedback(
		event.id,
		user?.id,
	);
	const { cancelRegistration, isCancellingRegistration, volunteerApply } =
		useEventRegistration(event.id, t);
	const {
		existingRegistration,
		canRegister,
		getRegistrationStatusText,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,
	} = useRegistrationStatus(event, user);

	const [showRegistrationForm, setShowRegistrationForm] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showSuccessInfo, setShowSuccessInfo] = useState(false);
	const [showQRGenerator, setShowQRGenerator] = useState(false);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
	const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [latestRegistration, setLatestRegistration] = useState<any>(null);
	const totalRegistrations =
		event._count?.registrations ?? event.registrations?.length ?? 0;

	const registrationDisabledReason = useMemo(() => {
		if (event.isExternalEvent) return null;
		if (isEventEnded) return "活动已结束";
		if (isRegistrationClosed) return "报名已截止";
		if (isEventFull) return "名额已满";
		return null;
	}, [
		event.isExternalEvent,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,
	]);

	const registerDisabled = useMemo(
		() =>
			event.isExternalEvent
				? false
				: Boolean(
						isEventEnded ||
							isRegistrationClosed ||
							isEventFull ||
							(existingRegistration &&
								existingRegistration.status !== "CANCELLED"),
					),
		[
			event.isExternalEvent,
			isEventEnded,
			isRegistrationClosed,
			isEventFull,
			existingRegistration,
		],
	);

	// 处理 URL 中的注册成功提示
	useEffect(() => {
		const registration = searchParams.get("registration");
		if (registration === "success" || registration === "pending") {
			const timer = setTimeout(() => {
				setShowSuccessInfo(true);
				const url = new URL(window.location.href);
				url.searchParams.delete("registration");
				window.history.replaceState({}, "", url.toString());
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchParams]);

	// 处理从签到页面跳回需要立即报名的情况
	useEffect(() => {
		const openRegistration = searchParams.get("openRegistration");
		if (!openRegistration) return;

		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (!user && loaded) {
			const timer = setTimeout(() => {
				router.push(
					`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
				);
			}, 300);
			return () => clearTimeout(timer);
		}

		const timer = setTimeout(() => {
			setShowRegistrationForm(true);
			const url = new URL(window.location.href);
			url.searchParams.delete("openRegistration");
			window.history.replaceState({}, "", url.toString());
		}, 300);

		return () => clearTimeout(timer);
	}, [searchParams, user, loaded, pathname, router]);

	// URL 带 feedback 参数时提示用户或直接打开反馈弹窗
	useEffect(() => {
		const feedback = searchParams.get("feedback");
		if (feedback !== "true" || !loaded) return;

		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (!user) {
			toast.error("请先登录再提交反馈", {
				action: {
					label: "去登录",
					onClick: () => {
						router.push(
							`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
						);
					},
				},
			});
			return;
		}

		if (existingRegistration?.status === "APPROVED") {
			setIsFeedbackDialogOpen(true);
		} else {
			toast.error("报名后才可提交反馈");
		}
	}, [
		searchParams,
		loaded,
		user,
		existingRegistration?.status,
		pathname,
		router,
	]);

	// 邀请码缓存
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const storageKey = `event-invite-${event.id}`;
		const inviteParam = searchParams.get("invite");

		if (inviteParam) {
			setInviteCode(inviteParam);
			try {
				window.localStorage.setItem(storageKey, inviteParam);
			} catch (error) {
				console.warn("Failed to persist invite code", error);
			}
			return;
		}

		try {
			const storedInvite = window.localStorage.getItem(storageKey);
			setInviteCode(storedInvite);
		} catch (error) {
			console.warn("Failed to read stored invite code", error);
			setInviteCode(null);
		}
	}, [event.id, searchParams]);

	const handleDataRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: eventKeys.detail(event.id),
		});
	};

	const handleRegister = (openModal?: () => void) => {
		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (event.isExternalEvent && event.externalUrl) {
			window.open(event.externalUrl, "_blank", "noopener noreferrer");
			return;
		}
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
			);
			return;
		}
		if (isEventEnded) {
			toast.error("活动已结束，无法报名");
			return;
		}
		if (isRegistrationClosed) {
			toast.error("报名已截止");
			return;
		}
		if (isEventFull) {
			toast.error("名额已满");
			return;
		}
		if (
			existingRegistration &&
			existingRegistration.status !== "CANCELLED"
		) {
			setShowSuccessInfo(true);
			return;
		}
		if (openModal) {
			openModal();
			return;
		}
		setShowRegistrationForm(true);
	};

	const handleRegistrationComplete = (registration: any) => {
		setLatestRegistration(registration);
		setShowSuccessInfo(true);
		toast.success("报名成功！");
		handleDataRefresh();
	};

	const handleCancelRegistration = () => {
		cancelRegistration(undefined, { onSuccess: handleDataRefresh });
	};

	const handleVolunteerApply = (eventVolunteerRoleId: string) => {
		if (!user) {
			const searchString = searchParams.toString();
			const targetPath = searchString
				? `${pathname}?${searchString}`
				: pathname;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
			);
			return;
		}
		volunteerApply(eventVolunteerRoleId, {
			onSuccess: handleDataRefresh,
		});
	};

	const handleFeedbackSubmit = async (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => {
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(pathname)}`,
			);
			return;
		}

		try {
			const isUpdating = hasSubmittedFeedback;
			const method = isUpdating ? "PUT" : "POST";
			const url = `/api/events/${event.id}/feedback`;

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					rating: feedback.rating,
					comment: feedback.comment || undefined,
					suggestions: feedback.suggestions || undefined,
					wouldRecommend: feedback.wouldRecommend,
				}),
			});

			if (response.ok) {
				toast.success(isUpdating ? "反馈修改成功" : "反馈提交成功");
				queryClient.invalidateQueries({
					queryKey: eventKeys.detail(event.id),
				});
				queryClient.invalidateQueries({
					queryKey: eventKeys.userFeedback(event.id, user.id),
				});
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || "反馈提交失败");
			}
		} catch (error) {
			console.error("Error submitting feedback:", error);
			toast.error("反馈提交失败，请重试");
		}
	};

	const registrationStatusText = useMemo(
		() => getRegistrationStatusText(t),
		[getRegistrationStatusText, t],
	);

	const registerLabel = useMemo(() => {
		if (event.isExternalEvent && event.externalUrl) return "前往报名";
		if (!user) return "登录后报名";
		if (registrationDisabledReason) return registrationDisabledReason;
		if (existingRegistration) {
			switch (existingRegistration.status) {
				case "APPROVED":
					return "已报名";
				case "PENDING":
					return "审核中";
				case "WAITLISTED":
					return "等待中";
				default:
					return "重新报名";
			}
		}
		return canRegister ? "立即报名" : "暂不可报名";
	}, [
		canRegister,
		event.externalUrl,
		event.isExternalEvent,
		existingRegistration,
		registrationDisabledReason,
		user,
	]);

	const enabledAnchors = [
		{ id: "overview", label: "信息" },
		{ id: "hosts", label: "主办" },
		{ id: "intro", label: "介绍" },
		{
			id: "awards",
			label: "奖项",
			show: Boolean(event.hackathonConfig?.awards?.length),
		},
		{
			id: "works",
			label: "作品",
			show:
				Boolean(projectSubmissions && projectSubmissions.length > 0) ||
				event.requireProjectSubmission,
		},
		{
			id: "participants",
			label: "报名者",
			show: event.registrations.length > 0,
		},
		{ id: "album", label: "相册", show: photos.length > 0 },
		{
			id: "volunteers",
			label: "志愿者",
			show:
				(event.volunteerRoles && event.volunteerRoles.length > 0) ||
				event.volunteerContactInfo ||
				event.volunteerWechatQrCode,
		},
		{ id: "feedback", label: "反馈", show: true },
	]
		.filter((a) => a.show ?? true)
		.map(({ id, label }) => ({ id, label }));

	const awards = event.hackathonConfig?.awards || [];

	const resourcesGroups = event.hackathonConfig?.resources
		? [
				{
					title: "学习资料",
					items: event.hackathonConfig.resources.tutorials || [],
				},
				{
					title: "工具推荐",
					items: event.hackathonConfig.resources.tools || [],
				},
				{
					title: "示例",
					items: event.hackathonConfig.resources.examples || [],
				},
			].filter((group) => group.items.length > 0)
		: [];

	const works = projectSubmissions
		? projectSubmissions.map((submission) => ({
				title: submission.project?.title || "未命名作品",
				tag: submission.project?.projectTags?.[0] || "作品",
				owner:
					submission.project?.user?.name ||
					submission.user?.name ||
					"参赛者",
			}))
		: [];

	const participants = event.registrations
		.filter(
			(reg) => reg.status !== "CANCELLED" && reg.status !== "REJECTED",
		)
		.slice(0, 8)
		.map((reg) => ({
			name: reg.user.name,
			role: reg.user.userRoleString || reg.user.username || "参赛者",
			region: reg.user.region,
			highlight: reg.user.currentWorkOn || reg.user.bio,
		}));

	const volunteerRoles = event.volunteerRoles ?? [];
	const volunteerStatuses = useMemo(
		() =>
			volunteerRoles.reduce<Record<string, string | null>>(
				(acc, role) => {
					const registration = role.registrations?.find(
						(r) =>
							r.user.id === user?.id && r.status !== "CANCELLED",
					);
					acc[role.id] = registration?.status ?? null;
					return acc;
				},
				{},
			),
		[volunteerRoles, user?.id],
	);

	const userSubmission =
		projectSubmissions?.find(
			(submission) =>
				submission.submitterId === user?.id ||
				submission.userId === user?.id ||
				submission.user?.id === user?.id ||
				submission.submitter?.id === user?.id,
		) || null;

	const canCancel =
		!!existingRegistration &&
		["APPROVED", "PENDING", "WAITLISTED"].includes(
			existingRegistration.status,
		);

	const canContactOrganizer = Boolean(
		event.organizerContact && !event.isExternalEvent,
	);
	const canShowFeedback = true;

	const handleBookmark = () => {
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(pathname)}`,
			);
			return;
		}
		toggleBookmark();
	};

	const handleLike = () => {
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(pathname)}`,
			);
			return;
		}
		toggleLike();
	};

	return (
		<div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
			<Hero
				event={event}
				locale={locale}
				registerLabel={registerLabel}
				onRegister={handleRegister}
				canCancel={canCancel}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onContact={() => setIsContactDialogOpen(true)}
				onToggleBookmark={handleBookmark}
				onToggleLike={handleLike}
				isBookmarked={isBookmarked}
				isLiked={isLiked}
				likeCount={likeCount}
				registrationStatusText={registrationStatusText}
				registerDisabled={registerDisabled}
				isEventAdmin={event.isEventAdmin}
				eventId={event.id}
			/>

			<AnchorNav anchors={enabledAnchors} />

			<div className="container max-w-6xl py-10 space-y-10">
				<div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-8">
						<SectionCard id="overview" title="活动信息">
							<div className="grid gap-3 sm:grid-cols-2">
								<InfoItem
									icon={CalendarDays}
									label="时间"
									value={`${format(new Date(event.startTime), "M月d日 HH:mm")} - ${format(new Date(event.endTime), "M月d日 HH:mm")}`}
									helper={event.timezone}
								/>
								<InfoItem
									icon={Clock3}
									label="报名截止"
									value={
										event.registrationDeadline
											? format(
													new Date(
														event.registrationDeadline,
													),
													"M月d日 HH:mm",
												)
											: "持续开放"
									}
								/>
								<InfoItem
									icon={MapPin}
									label="地点"
									value={
										event.isOnline
											? "线上"
											: event.address || "待定"
									}
									helper={
										event.isOnline && event.onlineUrl
											? "点击报名后获取线上链接"
											: undefined
									}
								/>
								<InfoItem
									icon={Users}
									label="名额/报名"
									value={
										event.maxAttendees
											? `${totalRegistrations}/${event.maxAttendees}`
											: `${totalRegistrations} 位`
									}
									helper={
										event.maxAttendees
											? "含审核中"
											: undefined
									}
								/>
								<InfoItem
									icon={Info}
									label="当前状态"
									value={registrationStatusText || "敬请期待"}
								/>
								{event.isExternalEvent ? (
									<InfoItem
										icon={LinkIcon}
										label="外部报名"
										value="将跳转至外部链接完成报名"
									/>
								) : null}
							</div>
							{registrationDisabledReason ? (
								<div className="mt-3">
									<Badge variant="secondary">
										{registrationDisabledReason}
									</Badge>
								</div>
							) : null}
							{event.tags && event.tags.length > 0 ? (
								<div className="mt-3 flex flex-wrap gap-2">
									{event.tags.map((tag) => (
										<Badge
											key={tag}
											variant="outline"
											className="bg-white"
										>
											{tag}
										</Badge>
									))}
								</div>
							) : null}
						</SectionCard>

						<SectionCard id="hosts" title="主办与社群">
							<div className="grid gap-3 sm:grid-cols-2">
								<HostCard
									title="组织者"
									name={event.organizer?.name}
									username={event.organizer?.username}
									image={event.organizer?.image}
									highlight={
										event.organizer?.bio ||
										event.organizer?.userRoleString
									}
								/>
								{event.organization ? (
									<HostCard
										title="组织/社区"
										name={event.organization.name}
										image={event.organization.logo}
										highlight={event.organization.slug}
									/>
								) : null}
							</div>
							{canContactOrganizer ? (
								<p className="mt-3 text-xs text-muted-foreground">
									有问题？可直接联系组织者，或在下方提交反馈。
								</p>
							) : null}
						</SectionCard>

						<SectionCard id="intro" title="活动介绍">
							<div className="space-y-4">
								<EventDescription
									variant="plain"
									richContent={
										event.richContent ||
										event.description ||
										event.shortDescription ||
										""
									}
								/>
							</div>
						</SectionCard>

						{(awards.length > 0 || resourcesGroups.length > 0) && (
							<SectionCard id="awards" title="奖项 & 资源">
								<div className="grid gap-4 md:grid-cols-2">
									{awards.length > 0 && (
										<Card className="shadow-none border-dashed">
											<CardHeader>
												<CardTitle className="text-base">
													奖项设置
												</CardTitle>
												<CardDescription>
													便于参赛者理解评审标准
												</CardDescription>
											</CardHeader>
											<CardContent className="space-y-3">
												{awards.map((award, idx) => (
													<div
														key={`${award.name}-${idx}`}
														className="rounded-lg border bg-muted/40 p-3"
													>
														<p className="font-medium">
															{award.name}
														</p>
														{award.description ? (
															<p className="text-sm text-muted-foreground">
																{
																	award.description
																}
															</p>
														) : null}
													</div>
												))}
											</CardContent>
										</Card>
									)}

									{resourcesGroups.length > 0 && (
										<Card className="shadow-none border-dashed">
											<CardHeader>
												<CardTitle className="text-base">
													准备资源
												</CardTitle>
												<CardDescription>
													提前告诉参赛者可用的工具与材料
												</CardDescription>
											</CardHeader>
											<CardContent className="space-y-4">
												{resourcesGroups.map(
													(group) => (
														<div
															key={group.title}
															className="space-y-2"
														>
															<p className="font-medium">
																{group.title}
															</p>
															<ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
																{group.items.map(
																	(
																		item: any,
																		idx: number,
																	) => (
																		<li
																			key={
																				idx
																			}
																		>
																			{item.title ||
																				item.name ||
																				item}
																		</li>
																	),
																)}
															</ul>
														</div>
													),
												)}
											</CardContent>
										</Card>
									)}
								</div>
							</SectionCard>
						)}

						{enabledAnchors.find((a) => a.id === "works") && (
							<SectionCard
								id="works"
								title="作品广场"
								ctaLabel="查看全部作品"
								ctaHref={`/${locale}/events/${event.id}/submissions`}
							>
								{works.length > 0 ? (
									<div className="grid gap-3 md:grid-cols-3">
										{works.slice(0, 3).map((work, idx) => (
											<Card
												key={`${work.title}-${idx}`}
												className="shadow-none bg-gradient-to-br from-white to-slate-50"
											>
												<CardHeader className="pb-2">
													<CardTitle className="text-base">
														{work.title}
													</CardTitle>
													<CardDescription>
														{work.tag}
													</CardDescription>
												</CardHeader>
												<CardContent className="pt-0">
													<Badge variant="secondary">
														🙋 {work.owner}
													</Badge>
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										暂未提交作品，入口保留。
									</p>
								)}
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										asChild
										className="gap-2"
									>
										<a
											href={`/${locale}/events/${event.id}/submissions`}
										>
											提交/修改作品
										</a>
									</Button>
									{userSubmission ? (
										<Badge variant="secondary">
											已提交作品
										</Badge>
									) : null}
								</div>
							</SectionCard>
						)}

						{enabledAnchors.find(
							(a) => a.id === "participants",
						) && (
							<SectionCard
								id="participants"
								title="报名者信息"
								ctaLabel="查看全部报名者"
								ctaHref={`/${locale}/events/${event.id}`}
							>
								{participants.length > 0 ? (
									<div className="grid gap-3 sm:grid-cols-2">
										{participants.map((p, idx) => (
											<Card
												key={`${p.name}-${idx}`}
												className="shadow-none border-dashed"
											>
												<CardContent className="pt-4 space-y-1">
													<p className="font-medium">
														{p.name}
													</p>
													<p className="text-sm text-muted-foreground flex flex-wrap gap-2">
														<span>{p.role}</span>
														{p.region ? (
															<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[12px] text-slate-600">
																{p.region}
															</span>
														) : null}
													</p>
													{p.highlight ? (
														<p className="text-xs text-muted-foreground line-clamp-2">
															{p.highlight}
														</p>
													) : null}
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										暂无报名者展示。
									</p>
								)}
							</SectionCard>
						)}

						{enabledAnchors.find((a) => a.id === "album") && (
							<SectionCard
								id="album"
								title="相册预览"
								ctaLabel="进入现场相册"
								ctaHref={`/${locale}/events/${event.id}/photos`}
							>
								{photos.length > 0 ? (
									<div className="grid gap-3 sm:grid-cols-3">
										{photos.slice(0, 3).map((src, idx) => (
											<div
												key={`${src}-${idx}`}
												className="aspect-[4/3] overflow-hidden rounded-xl border bg-white/70"
											>
												<img
													src={src}
													alt="活动照片"
													className="h-full w-full object-cover"
												/>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										暂无相册照片。
									</p>
								)}
							</SectionCard>
						)}

						{enabledAnchors.find((a) => a.id === "volunteers") ? (
							<SectionCard id="volunteers" title="志愿者招募">
								{volunteerRoles.length > 0 ? (
									<div className="space-y-3">
										{volunteerRoles.map((role) => {
											const approvedCount =
												role.registrations?.filter(
													(reg) =>
														reg.status ===
														"APPROVED",
												).length ?? 0;
											const recruitTotal =
												role.recruitCount ?? 0;
											const remaining = Math.max(
												recruitTotal - approvedCount,
												0,
											);
											const userStatus =
												volunteerStatuses[role.id];

											return (
												<Card
													key={role.id}
													className="shadow-none border-dashed"
												>
													<CardContent className="pt-4 space-y-2">
														<div className="flex items-center justify-between gap-3">
															<div>
																<p className="font-medium">
																	{
																		role
																			.volunteerRole
																			.name
																	}
																</p>
																<p className="text-xs text-muted-foreground">
																	{role.description ||
																		role
																			.volunteerRole
																			.description}
																</p>
															</div>
															<Badge variant="secondary">
																剩余 {remaining}
															</Badge>
														</div>
														<Button
															variant="outline"
															disabled={
																userStatus ===
																	"APPROVED" ||
																userStatus ===
																	"APPLIED"
															}
															onClick={() =>
																handleVolunteerApply(
																	role.id,
																)
															}
														>
															{userStatus ===
															"APPROVED"
																? "已加入"
																: userStatus ===
																		"APPLIED"
																	? "审核中"
																	: "申请成为志愿者"}
														</Button>
													</CardContent>
												</Card>
											);
										})}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										当前未开启志愿者招募。
									</p>
								)}

								{event.volunteerContactInfo ||
								event.volunteerWechatQrCode ? (
									<div className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
										<p className="font-medium text-slate-700">
											志愿者联系信息
										</p>
										{event.volunteerContactInfo ? (
											<p>{event.volunteerContactInfo}</p>
										) : null}
										{event.volunteerWechatQrCode ? (
											<p>微信二维码已在报名页提供</p>
										) : null}
									</div>
								) : null}
							</SectionCard>
						) : null}

						<SectionCard id="feedback" title="反馈 / 联系组织者">
							<div className="flex flex-wrap gap-3">
								<Button
									variant="secondary"
									onClick={() =>
										setIsFeedbackDialogOpen(true)
									}
								>
									提交活动反馈
								</Button>
								<Button
									variant="outline"
									onClick={() => setIsContactDialogOpen(true)}
								>
									联系组织者
								</Button>
								<Button
									variant="outline"
									className="gap-2"
									onClick={() => setShowShareModal(true)}
								>
									<LinkIcon className="h-4 w-4" />
									分享活动
								</Button>
							</div>
							<p className="mt-3 text-xs text-muted-foreground">
								反馈、联系、分享、取消报名等动作都在这里整合。
							</p>
						</SectionCard>
					</div>

					<div className="hidden lg:block">
						<RegistrationSidebar
							event={event}
							locale={locale}
							registerLabel={registerLabel}
							onRegister={() =>
								handleRegister(() =>
									setShowRegistrationForm(true),
								)
							}
							canCancel={canCancel}
							onCancel={handleCancelRegistration}
							existingRegistration={existingRegistration}
							isCancelling={isCancellingRegistration}
							onShare={() => setShowShareModal(true)}
							onContact={() => setIsContactDialogOpen(true)}
							onFeedback={() => setIsFeedbackDialogOpen(true)}
							onShowQR={() => setShowQRGenerator(true)}
							registrationStatusText={registrationStatusText}
							registerDisabled={registerDisabled}
							registrationDisabledReason={
								registrationDisabledReason || undefined
							}
						/>
					</div>
				</div>
			</div>

			<MobileCTA
				locale={locale}
				eventId={event.id}
				registerLabel={registerLabel}
				onRegister={() =>
					handleRegister(() => setShowRegistrationForm(true))
				}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onFeedback={() => setIsFeedbackDialogOpen(true)}
				onContact={() => setIsContactDialogOpen(true)}
				onShowQR={() => setShowQRGenerator(true)}
				canCancel={canCancel}
				hasPhotos={photos.length > 0}
				registerDisabled={registerDisabled}
			/>

			{/* Modals */}
			{showShareModal && (
				<EventShareModal
					isOpen={showShareModal}
					onClose={() => setShowShareModal(false)}
					eventId={event.id}
					eventTitle={event.title}
					event={{
						startTime: event.startTime,
						endTime: event.endTime,
						address: event.address,
						isOnline: event.isOnline,
						onlineUrl: event.onlineUrl,
						coverImage: event.coverImage,
						richContent: event.shortDescription || "",
					}}
				/>
			)}

			{showQRGenerator && user && existingRegistration && (
				<QRGenerator
					isOpen={showQRGenerator}
					onClose={() => setShowQRGenerator(false)}
					eventId={event.id}
					userId={user.id}
					eventTitle={event.title}
					userName={user.name || "Unknown User"}
				/>
			)}

			{showSuccessInfo && (
				<RegistrationSuccessModal
					isOpen={showSuccessInfo}
					onClose={() => {
						setShowSuccessInfo(false);
						setLatestRegistration(null);
					}}
					eventTitle={event.title}
					successInfo={event.registrationSuccessInfo}
					successImage={event.registrationSuccessImage}
					requireApproval={event.requireApproval}
					registrationStatus={
						latestRegistration?.status ||
						existingRegistration?.status
					}
					pendingInfo={event.registrationPendingInfo}
					pendingImage={event.registrationPendingImage}
				/>
			)}

			{showRegistrationForm && (
				<EventRegistrationModal
					isOpen={showRegistrationForm}
					onClose={() => setShowRegistrationForm(false)}
					event={event}
					inviteCode={inviteCode ?? undefined}
					onRegistrationComplete={handleRegistrationComplete}
				/>
			)}

			{!event.isExternalEvent && (
				<ContactOrganizerDialog
					open={isContactDialogOpen}
					onOpenChange={setIsContactDialogOpen}
					organizerName={event.organizer?.name}
					organizerUsername={event.organizer?.username}
					email={
						event.organizerContact
							? undefined
							: event.organizer?.email
					}
					contact={event.organizerContact}
					wechatQr={undefined}
				/>
			)}

			{canShowFeedback && (
				<SimpleEventFeedbackDialog
					open={isFeedbackDialogOpen}
					onOpenChange={setIsFeedbackDialogOpen}
					eventTitle={event.title}
					eventId={event.id}
					onSubmit={handleFeedbackSubmit}
					existingFeedback={userFeedback}
					isEditing={hasSubmittedFeedback}
				/>
			)}
		</div>
	);
}

function Hero({
	event,
	locale,
	registerLabel,
	onRegister,
	canCancel,
	onCancel,
	onShare,
	onContact,
	onToggleBookmark,
	onToggleLike,
	isBookmarked,
	isLiked,
	likeCount,
	registrationStatusText,
	registerDisabled,
	isEventAdmin,
	eventId,
}: {
	event: EventData;
	locale: string;
	registerLabel: string;
	onRegister: () => void;
	canCancel: boolean;
	onCancel: () => void;
	onShare: () => void;
	onContact: () => void;
	onToggleBookmark: () => void;
	onToggleLike: () => void;
	isBookmarked?: boolean;
	isLiked?: boolean;
	likeCount?: number;
	registrationStatusText?: string;
	registerDisabled?: boolean;
	isEventAdmin?: boolean;
	eventId?: string;
}) {
	const eventTypeLabels = getEventTypeLabels(useTranslations());

	return (
		<div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
			<div
				className="absolute inset-0 opacity-40"
				style={{
					backgroundImage: event.coverImage
						? `url(${event.coverImage})`
						: undefined,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "blur(2px)",
					transform: "scale(1.05)",
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
			<div className="relative container max-w-6xl py-12 space-y-4">
				<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
					<span className="h-2 w-2 rounded-full bg-emerald-400" />
					{event.isOnline ? "线上" : "线下"} ·{" "}
					{eventTypeLabels[event.type] || event.type}
				</div>
				<h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
					{event.title}
				</h1>
				<div className="flex flex-wrap gap-3 text-sm text-white/90">
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<CalendarDays className="h-4 w-4" />
						{format(new Date(event.startTime), "M月d日 HH:mm")} -{" "}
						{format(new Date(event.endTime), "M月d日 HH:mm")}
					</span>
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<MapPin className="h-4 w-4" />
						{event.isOnline ? "线上" : event.address || "待定"}
					</span>
					<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
						<Users className="h-4 w-4" />
						{event._count?.registrations ??
							event.registrations?.length ??
							0}{" "}
						位报名
					</span>
					{registrationStatusText ? (
						<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
							{registrationStatusText}
						</span>
					) : null}
				</div>
				{(event.tags || []).length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{event.tags.map((tag) => (
							<Badge key={tag} className="bg-white/20 text-white">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="flex flex-wrap items-center gap-3 pt-2">
					<Button
						size="lg"
						className="h-11 px-6"
						onClick={onRegister}
						disabled={registerDisabled}
					>
						{registerLabel}
					</Button>
					<Button
						variant="secondary"
						className="h-11 bg-white text-indigo-700 hover:bg-white/90"
					>
						<a href={`/${locale}/events/${event.id}/submissions`}>
							提交/修改作品
						</a>
					</Button>
					{canCancel ? (
						<Button
							variant="ghost"
							className="h-11 text-white/90 hover:text-white"
							onClick={onCancel}
						>
							取消报名
						</Button>
					) : null}
					<Button
						variant="ghost"
						className="h-11 text-white/90 hover:text-white"
						onClick={onShare}
					>
						<Share2 className="h-4 w-4 mr-2" />
						分享
					</Button>
					<Button
						variant="ghost"
						className="h-11 text-white/90 hover:text-white"
						onClick={onContact}
					>
						联系组织者
					</Button>
					<Button
						variant="ghost"
						className="h-11 text-white/90 hover:text-white"
						onClick={onToggleLike}
					>
						<Heart
							className={cn(
								"h-4 w-4 mr-1",
								isLiked ? "fill-white text-white" : "",
							)}
						/>
						{likeCount ?? 0}
					</Button>
					<ManagementButton
						eventId={eventId || event.id}
						isEventAdmin={Boolean(isEventAdmin)}
					/>
				</div>
				<div className="flex flex-wrap gap-2 text-sm text-white/80">
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"bg-white/10 text-white border-white/30 hover:bg-white/20",
							isBookmarked && "bg-white/20",
						)}
						onClick={onToggleBookmark}
					>
						{isBookmarked ? "已收藏" : "收藏活动"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function AnchorNav({
	anchors,
}: {
	anchors: Array<{ id: string; label: string }>;
}) {
	return (
		<div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
			<div className="container max-w-6xl flex items-center gap-2 overflow-x-auto py-2 md:py-3 text-sm text-muted-foreground flex-nowrap">
				{anchors.map((anchor) => (
					<a
						key={anchor.id}
						href={`#${anchor.id}`}
						className="rounded-full px-3 py-1 transition hover:bg-slate-100 whitespace-nowrap"
					>
						{anchor.label}
					</a>
				))}
			</div>
		</div>
	);
}

function SectionCard({
	id,
	title,
	ctaLabel,
	ctaHref,
	children,
}: {
	id: string;
	title: string;
	ctaLabel?: string;
	ctaHref?: string;
	children: React.ReactNode;
}) {
	return (
		<Card id={id} className="shadow-sm scroll-mt-28">
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<CardTitle className="text-lg">{title}</CardTitle>
				{ctaLabel ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-primary"
						asChild={Boolean(ctaHref)}
					>
						{ctaHref ? <a href={ctaHref}>{ctaLabel}</a> : ctaLabel}
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4">{children}</CardContent>
		</Card>
	);
}

function RegistrationSidebar({
	event,
	locale,
	registerLabel,
	onRegister,
	canCancel,
	onCancel,
	existingRegistration,
	isCancelling,
	onShare,
	onContact,
	onFeedback,
	onShowQR,
	registrationStatusText,
	registerDisabled,
	registrationDisabledReason,
}: {
	event: EventData;
	locale: string;
	registerLabel: string;
	onRegister: () => void;
	canCancel: boolean;
	onCancel: () => void;
	existingRegistration?: { status: string } | null;
	isCancelling: boolean;
	onShare: () => void;
	onContact: () => void;
	onFeedback: () => void;
	onShowQR: () => void;
	registrationStatusText?: string;
	registerDisabled?: boolean;
	registrationDisabledReason?: string;
}) {
	const registrationCount =
		event._count?.registrations ?? event.registrations?.length ?? 0;

	return (
		<Card className="sticky top-24 shadow-lg border-0 bg-white">
			<CardHeader>
				<CardTitle>报名 / 状态</CardTitle>
				<CardDescription>
					右侧固定，集成报名、状态、分享等
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button
					className="w-full h-11 text-base"
					onClick={onRegister}
					disabled={isCancelling || registerDisabled}
				>
					{registerLabel}
				</Button>
				<Button variant="outline" className="w-full h-11" asChild>
					<a href={`/${locale}/events/${event.id}/submissions`}>
						提交/修改作品
					</a>
				</Button>
				{registrationStatusText ? (
					<div className="text-sm text-muted-foreground space-y-1">
						<p className="font-medium text-slate-700">
							当前状态：{registrationStatusText}
						</p>
						{registrationDisabledReason ? (
							<p>{registrationDisabledReason}</p>
						) : null}
					</div>
				) : null}
				{canCancel ? (
					<Button
						variant="ghost"
						className="w-full h-10 text-destructive"
						onClick={onCancel}
						disabled={isCancelling}
					>
						取消报名
					</Button>
				) : null}
				<div className="grid grid-cols-2 gap-2">
					<Button variant="secondary" onClick={onShare}>
						分享
					</Button>
					<Button variant="secondary" onClick={onContact}>
						联系
					</Button>
					<Button variant="outline" onClick={onFeedback}>
						反馈
					</Button>
					<Button
						variant="outline"
						onClick={onShowQR}
						disabled={!existingRegistration}
						className="flex items-center gap-2"
					>
						<QrCode className="h-4 w-4" />
						签到码
					</Button>
				</div>
				<div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground space-y-1">
					<p>
						{event.isOnline
							? "线上活动"
							: event.address || "线下地点待定"}
					</p>
					<p>
						当前报名：{registrationCount}
						{event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
					</p>
					{event.registrationDeadline ? (
						<p>
							截止：
							{format(
								new Date(event.registrationDeadline),
								"M月d日 HH:mm",
							)}
						</p>
					) : (
						<p>报名长期开放</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function MobileCTA({
	locale,
	eventId,
	registerLabel,
	onRegister,
	onCancel,
	onShare,
	onFeedback,
	onContact,
	onShowQR,
	canCancel,
	hasPhotos,
	registerDisabled,
}: {
	locale: string;
	eventId: string;
	registerLabel: string;
	onRegister: () => void;
	onCancel: () => void;
	onShare: () => void;
	onFeedback: () => void;
	onContact: () => void;
	onShowQR: () => void;
	canCancel: boolean;
	hasPhotos: boolean;
	registerDisabled?: boolean;
}) {
	const [isMoreOpen, setIsMoreOpen] = useState(false);

	const moreActions = [
		canCancel
			? {
					key: "cancel",
					label: "取消报名",
					onClick: onCancel,
				}
			: null,
		{
			key: "works",
			label: "提交/查看作品",
			onClick: () =>
				window.location.assign(
					`/${locale}/events/${eventId}/submissions`,
				),
		},
		hasPhotos
			? {
					key: "album",
					label: "查看相册",
					onClick: () =>
						window.location.assign(
							`/${locale}/events/${eventId}/photos`,
						),
				}
			: null,
		{
			key: "feedback",
			label: "反馈",
			onClick: onFeedback,
		},
		{
			key: "contact",
			label: "联系组织者",
			onClick: onContact,
		},
		{
			key: "qr",
			label: "签到码",
			onClick: onShowQR,
			disabled: !canCancel,
		},
	].filter(Boolean) as Array<{
		key: string;
		label: string;
		onClick: () => void;
		disabled?: boolean;
	}>;

	return (
		<>
			<div
				className={cn(
					"fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-lg shadow-black/5 border-t lg:hidden",
				)}
				style={{
					paddingBottom:
						"max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
				}}
			>
				<div className="container max-w-6xl py-3">
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="h-11 px-3"
							onClick={() => setIsMoreOpen(true)}
						>
							更多
						</Button>
						<Button
							variant="outline"
							className="h-11 px-3"
							onClick={onShare}
						>
							分享
						</Button>
						<Button
							className="flex-1 h-11 text-base"
							onClick={onRegister}
							disabled={registerDisabled}
						>
							{registerLabel}
						</Button>
					</div>
				</div>
			</div>

			<Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
				<SheetContent side="bottom" className="rounded-t-3xl pb-8">
					<SheetHeader className="text-left">
						<SheetTitle>更多操作</SheetTitle>
					</SheetHeader>
					<div className="mt-4 space-y-2">
						{moreActions.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								暂无更多操作
							</p>
						) : (
							moreActions.map((action) => (
								<Button
									key={action.key}
									variant="ghost"
									className="w-full justify-start rounded-2xl border text-base"
									disabled={action.disabled}
									onClick={() => {
										setIsMoreOpen(false);
										action.onClick();
									}}
								>
									{action.label}
								</Button>
							))
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

function InfoItem({
	icon: Icon,
	label,
	value,
	helper,
}: {
	icon: ElementType;
	label: string;
	value: string;
	helper?: string;
}) {
	return (
		<div className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm">
			<div className="mt-0.5 text-slate-500">
				<Icon className="h-4 w-4" />
			</div>
			<div className="space-y-0.5">
				<p className="text-xs uppercase tracking-wide text-muted-foreground">
					{label}
				</p>
				<p className="font-medium text-slate-900">{value}</p>
				{helper ? (
					<p className="text-xs text-muted-foreground">{helper}</p>
				) : null}
			</div>
		</div>
	);
}

function HostCard({
	title,
	name,
	username,
	image,
	highlight,
}: {
	title: string;
	name?: string | null;
	username?: string | null;
	image?: string | null;
	highlight?: string | null;
}) {
	const fallback =
		name?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || title[0];

	return (
		<Card className="shadow-none border-dashed">
			<CardHeader className="flex flex-row items-center gap-3 space-y-0">
				<Avatar>
					{image ? (
						<AvatarImage src={image} alt={name || title} />
					) : null}
					<AvatarFallback>{fallback}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-xs text-muted-foreground">{title}</p>
					<p className="font-medium">
						{name || username || "未填写"}
					</p>
				</div>
			</CardHeader>
			{highlight ? (
				<CardContent className="pt-0 text-sm text-muted-foreground">
					{highlight}
				</CardContent>
			) : null}
		</Card>
	);
}
