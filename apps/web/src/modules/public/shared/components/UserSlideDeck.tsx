"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { Input } from "@community/ui/ui/input";
import { Switch } from "@community/ui/ui/switch";
import {
	AlertTriangle,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	MapPin,
	Maximize2,
	TimerReset,
	X,
} from "lucide-react";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { cn } from "@community/lib-shared/utils";
import { usePathname } from "next/navigation";
import QRCode from "react-qr-code";

interface SlideDeckContact {
	label: string;
	value: string;
	href?: string;
}

interface SlideDeckStat {
	label: string;
	value: string | number;
}

export interface SlideDeckWork {
	id?: string;
	title: string;
	summary?: string | null;
	tags?: string[];
	url?: string | null;
}

export type SlideZoomLevel = "xs" | "small" | "medium" | "large" | "xl";

export interface SlideDeckUser {
	id: string;
	name: string;
	username?: string | null;
	avatarUrl?: string | null;
	headline?: string | null;
	subheading?: string | null;
	bio?: string | null;
	region?: string | null;
	skills?: string[];
	offers?: string | null;
	lookingFor?: string | null;
	highlights?: string[];
	stats?: SlideDeckStat[];
	contacts?: SlideDeckContact[];
	checkedIn?: boolean;
	works?: SlideDeckWork[];
	// 添加三个新字段
	lifeStatus?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
}

const ZOOM_OPTIONS: ReadonlyArray<{
	value: SlideZoomLevel;
	label: string;
	hint: string;
}> = [
	{ value: "xs", label: "超小", hint: "最小字体" },
	{ value: "small", label: "小", hint: "适中字体" },
	{ value: "medium", label: "中", hint: "标准字体" },
	{ value: "large", label: "大", hint: "放大字体" },
	{ value: "xl", label: "超大", hint: "最大字体" },
];

const FINAL_COUNTDOWN_DURATION = 3;

function condenseWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function truncateText(
	value: string | null | undefined,
	limit: number,
): string | null {
	if (!value) {
		return null;
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}
	if (trimmed.length <= limit) {
		return trimmed;
	}
	let truncated = trimmed.slice(0, limit);
	const lastSeparator = truncated.lastIndexOf(" ");
	if (lastSeparator > Math.floor(limit * 0.4)) {
		truncated = truncated.slice(0, lastSeparator);
	}
	return `${truncated}...`;
}

function extractHighlights(
	value: string | null | undefined,
	limitPerItem = 60,
	maxItems = 3,
): string[] {
	if (!value) {
		return [];
	}
	const normalized = value.replace(/\r\n/g, "\n").trim();
	if (!normalized) {
		return [];
	}
	let segments = normalized
		.split(/\n+/)
		.map((segment) => condenseWhitespace(segment))
		.filter(Boolean);

	if (segments.length <= 1) {
		segments = normalized
			.split(/[、，,；;。]/)
			.map((segment) => condenseWhitespace(segment))
			.filter(Boolean);
	}

	const unique: string[] = [];
	for (const segment of segments) {
		if (!unique.includes(segment)) {
			unique.push(segment);
		}
		if (unique.length >= maxItems) {
			break;
		}
	}

	return unique.map(
		(segment) => truncateText(segment, limitPerItem) ?? segment,
	);
}

type SlideRecord =
	| { type: "profile"; user: SlideDeckUser }
	| { type: "end" }
	| { type: "empty" };

export interface UserSlideDeckModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	users: SlideDeckUser[];
	initialIndex?: number;
	headerLabel?: string;
	closingNote?: string;
	closingSubNote?: string;
	enableCheckInFilter?: boolean;
	countdownDefaultSeconds?: number;
}

export function UserSlideDeckModal({
	open,
	onOpenChange,
	users,
	initialIndex = 0,
	headerLabel = "PPT 展示模式",
	closingNote = "所有介绍已完成",
	closingSubNote = "感谢大家的关注与参与",
	enableCheckInFilter = false,
	countdownDefaultSeconds = 15,
}: UserSlideDeckModalProps) {
	const [onlyCheckedIn, setOnlyCheckedIn] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [countdownEnabled, setCountdownEnabled] = useState(false);
	const [countdownBaseSeconds, setCountdownBaseSeconds] = useState(
		Math.max(countdownDefaultSeconds, 0),
	);
	const [timeLeft, setTimeLeft] = useState(
		Math.max(countdownDefaultSeconds, 0) + FINAL_COUNTDOWN_DURATION,
	);
	const [timeIsUp, setTimeIsUp] = useState(false);
	const [soundPlayed, setSoundPlayed] = useState(false);
	const [zoomLevel, setZoomLevel] = useState<SlideZoomLevel>("small");
	const audioContextRef = useRef<AudioContext | null>(null);

	const ensureAudioContext = useCallback((): AudioContext | null => {
		if (typeof window === "undefined") {
			return null;
		}
		const AudioContextClass =
			window.AudioContext ||
			(
				window as typeof window & {
					webkitAudioContext?: typeof AudioContext;
				}
			).webkitAudioContext;
		if (!AudioContextClass) {
			return null;
		}
		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContextClass();
		}
		const context = audioContextRef.current;
		if (context.state === "suspended") {
			void context.resume().catch(() => {
				// Ignore resume errors (e.g. user hasn't interacted yet)
			});
		}
		return context;
	}, []);

	const playFinalCountdownSound = useCallback(() => {
		const context = ensureAudioContext();
		if (!context) {
			return;
		}

		// 更清脆短促的音效：单次较高音调的短促 beep
		const baseStart = context.currentTime + 0.05;
		for (let i = 0; i < FINAL_COUNTDOWN_DURATION; i += 1) {
			const oscillator = context.createOscillator();
			oscillator.type = "sine";
			// 使用更高的频率，音调更清脆
			const frequency = 1200;
			oscillator.frequency.setValueAtTime(frequency, baseStart + i);

			const gainNode = context.createGain();
			const startTime = baseStart + i;
			// 更短促的音效持续时间
			gainNode.gain.setValueAtTime(0.0001, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.4, startTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(
				0.0001,
				startTime + 0.15,
			);

			oscillator.connect(gainNode);
			gainNode.connect(context.destination);

			oscillator.start(startTime);
			oscillator.stop(startTime + 0.16);
		}
	}, [ensureAudioContext]);

	const reservedSpaceByLevel: Record<SlideZoomLevel, number> = {
		xs: 320,
		small: 280,
		medium: 250,
		large: 220,
		xl: 180,
	};
	const slideMaxWidth = `min(100vw, calc((100vh - ${reservedSpaceByLevel[zoomLevel]}px) * 16 / 9))`;

	const filteredUsers = useMemo(() => {
		if (!enableCheckInFilter || !onlyCheckedIn) {
			return users;
		}
		return users.filter((user) => user.checkedIn);
	}, [enableCheckInFilter, onlyCheckedIn, users]);

	const slides: SlideRecord[] = useMemo(() => {
		if (filteredUsers.length === 0) {
			return [{ type: "empty" }];
		}

		return [
			...filteredUsers.map(
				(user) => ({ type: "profile", user }) as SlideRecord,
			),
			{ type: "end" },
		];
	}, [filteredUsers]);

	const safeIndex = Math.min(currentIndex, Math.max(slides.length - 1, 0));
	const currentSlide = slides[safeIndex];
	const isEndSlide = currentSlide.type === "end";
	const isEmptySlide = currentSlide.type === "empty";
	const totalSlides = slides.length;
	const hasNext = safeIndex < totalSlides - 1;
	const hasPrev = safeIndex > 0;

	// 获取接下来的两位小伙伴
	const nextUsers: SlideDeckUser[] = [];
	for (let i = 1; i <= 2; i++) {
		const nextIndex = safeIndex + i;
		if (nextIndex < slides.length) {
			const nextSlide = slides[nextIndex];
			if (nextSlide.type === "profile") {
				nextUsers.push(nextSlide.user);
			}
		}
	}

	const totalCountdownSeconds =
		Math.max(countdownBaseSeconds, 0) + FINAL_COUNTDOWN_DURATION;
	const shouldRunCountdown =
		open &&
		countdownEnabled &&
		totalCountdownSeconds > 0 &&
		currentSlide.type === "profile";

	useEffect(() => {
		if (open) {
			setCurrentIndex(initialIndex);
			setOnlyCheckedIn(false);
			setTimeIsUp(false);
		}
	}, [open, initialIndex]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setCurrentIndex((prev) => {
			if (prev >= slides.length) {
				return Math.max(slides.length - 1, 0);
			}
			return prev;
		});

		if (shouldRunCountdown) {
			setTimeLeft(totalCountdownSeconds);
			setTimeIsUp(false);
			setSoundPlayed(false);
			return;
		}

		setTimeLeft(0);
		setSoundPlayed(false);
	}, [
		open,
		shouldRunCountdown,
		totalCountdownSeconds,
		slides.length,
		safeIndex,
	]);

	useEffect(() => {
		if (!shouldRunCountdown) {
			return;
		}

		const timer = window.setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					window.clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => window.clearInterval(timer);
	}, [shouldRunCountdown, safeIndex, totalCountdownSeconds]);

	useEffect(() => {
		if (!shouldRunCountdown) {
			return;
		}
		if (
			soundPlayed ||
			timeLeft <= 0 ||
			timeLeft > FINAL_COUNTDOWN_DURATION
		) {
			return;
		}
		playFinalCountdownSound();
		setSoundPlayed(true);
	}, [shouldRunCountdown, timeLeft, soundPlayed, playFinalCountdownSound]);

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => {
			if (prev >= slides.length - 1) {
				return prev;
			}
			return prev + 1;
		});
		setTimeIsUp(false);
	}, [slides.length]);

	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => {
			if (prev <= 0) {
				return prev;
			}
			return prev - 1;
		});
		setTimeIsUp(false);
	}, []);

	useEffect(() => {
		if (!shouldRunCountdown || !open) {
			return;
		}
		if (timeLeft > 0) {
			return;
		}

		setTimeIsUp(true);
		// 移除自动切换，改为手动控制
	}, [timeLeft, shouldRunCountdown, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handleKey = (event: KeyboardEvent) => {
			if (event.key === "ArrowRight" || event.key === " ") {
				event.preventDefault();
				handleNext();
			}
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				handlePrev();
			}
		};

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [open, handleNext, handlePrev]);

	const handleCountdownToggle = useCallback(
		(checked: boolean) => {
			setCountdownEnabled(checked);
			if (checked) {
				setTimeLeft(totalCountdownSeconds);
				setTimeIsUp(false);
				setSoundPlayed(false);
			} else {
				setTimeLeft(0);
				setTimeIsUp(false);
				setSoundPlayed(false);
			}
		},
		[totalCountdownSeconds],
	);

	const handleCountdownInput = useCallback((value: string) => {
		const numericValue = Number.parseInt(value, 10);
		if (Number.isNaN(numericValue) || numericValue < 0) {
			setCountdownBaseSeconds(0);
			return;
		}
		setCountdownBaseSeconds(Math.min(numericValue, 999));
	}, []);

	const countdownDisplay = shouldRunCountdown
		? `${Math.max(timeLeft, 0)}s`
		: countdownEnabled && totalCountdownSeconds > 0
			? `${totalCountdownSeconds}s`
			: "--";
	const countdownLabel = shouldRunCountdown ? "剩余" : "总计";

	const finalCountdownValue =
		shouldRunCountdown &&
		timeLeft > 0 &&
		timeLeft <= FINAL_COUNTDOWN_DURATION
			? Math.ceil(timeLeft)
			: null;

	const activeZoomOption =
		ZOOM_OPTIONS.find((option) => option.value === zoomLevel) ??
		ZOOM_OPTIONS[1]; // 默认为 "small"

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="w-screen h-screen max-w-none rounded-none border-none bg-slate-950 p-6 text-white shadow-none sm:p-10 sm:max-w-none top-0 left-0 translate-x-0 translate-y-0"
				showCloseButton={false}
			>
				<div className="mx-auto flex h-full w-full flex-col gap-6">
					<div className="flex items-start justify-between gap-4">
						<DialogHeader className="text-white">
							<DialogTitle className="text-lg font-semibold uppercase tracking-wide text-white/80">
								{headerLabel}
							</DialogTitle>
							<p className="text-sm text-white/60">
								使用左右切换或空格键介绍参与者，搭配倒计时在现场快速完成亮相。
							</p>
						</DialogHeader>

						<div className="flex items-center gap-3">
							{/* 即将上台预览 - 移到右上角 */}
							{nextUsers.length > 0 && (
								<div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-2">
									<span className="text-xs font-semibold text-amber-200">
										即将上台：
									</span>
									<div className="flex items-center gap-1.5">
										{nextUsers.map((user, index) => (
											<div
												key={user.id}
												className="flex items-center gap-1.5"
											>
												<UserAvatar
													name={user.name}
													avatarUrl={
														user.avatarUrl ??
														undefined
													}
													className="h-7 w-7 border border-white/20"
												/>
												<span className="text-sm font-medium text-white/90">
													{user.name}
												</span>
												{index <
													nextUsers.length - 1 && (
													<span className="mx-1 text-white/40">
														·
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							<Button
								variant="ghost"
								size="icon"
								onClick={handleClose}
								className="h-9 w-9 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>

					<div className="flex flex-1 items-center justify-center overflow-hidden">
						<div
							className="relative w-full transition-all duration-200"
							style={{
								maxWidth: slideMaxWidth,
							}}
						>
							<div
								className="aspect-[16/9] w-full overflow-y-auto overflow-x-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40"
								style={{
									maxHeight: `calc(100vh - ${reservedSpaceByLevel[zoomLevel]}px)`,
									scrollbarWidth: "thin",
									scrollbarColor:
										"rgba(255, 255, 255, 0.2) transparent",
								}}
							>
								{isEmptySlide ? (
									<div className="flex h-full flex-col items-center justify-center text-center">
										<AlertTriangle className="mb-4 h-12 w-12 text-yellow-300" />
										<p className="text-2xl font-semibold">
											暂无可以展示的用户
										</p>
										{enableCheckInFilter &&
											onlyCheckedIn && (
												<p className="mt-2 text-sm text-white/70">
													当前没有已签到的参与者，取消筛选即可查看全部报名者。
												</p>
											)}
									</div>
								) : isEndSlide ? (
									<div className="flex h-full flex-col items-center justify-center text-center">
										<CheckCircle2 className="mb-4 h-14 w-14 text-emerald-300" />
										<p className="text-3xl font-bold tracking-tight">
											{closingNote}
										</p>
										<p className="mt-3 max-w-xl text-base text-white/70">
											{closingSubNote}
										</p>
									</div>
								) : (
									<ProfileSlide
										user={currentSlide.user}
										showTimeIsUp={timeIsUp}
										zoomLevel={zoomLevel}
										finalCountdownValue={
											finalCountdownValue
										}
									/>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm md:flex-row md:items-center md:justify-between md:gap-6">
						<div className="flex flex-wrap items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrev}
								disabled={!hasPrev}
								className="h-9 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
							>
								<ChevronLeft className="mr-2 h-4 w-4" />
								上一页
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNext}
								disabled={!hasNext}
								className="h-9 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
							>
								下一页
								<ChevronRight className="ml-2 h-4 w-4" />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-9 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
									>
										<Maximize2 className="mr-2 h-4 w-4" />
										字体尺寸：{activeZoomOption.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									sideOffset={8}
									className="w-44 rounded-lg border border-white/10 bg-slate-900/95 p-1 text-white shadow-lg backdrop-blur"
								>
									{ZOOM_OPTIONS.map((option) => (
										<DropdownMenuItem
											key={option.value}
											onSelect={() =>
												setZoomLevel(option.value)
											}
											className={cn(
												"flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-white/80 focus:bg-white/10 focus:text-white",
												option.value === zoomLevel &&
													"bg-white/10 text-white",
											)}
										>
											<div className="flex flex-col">
												<span className="font-medium text-white">
													{option.label} 档
												</span>
												<span className="text-xs text-white/60">
													{option.hint}
												</span>
											</div>
											{option.value === zoomLevel && (
												<Check className="h-4 w-4" />
											)}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
							<div className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-wider text-white/80">
								{safeIndex + 1} / {totalSlides}
							</div>
							{enableCheckInFilter && (
								<label className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
									<Switch
										checked={onlyCheckedIn}
										onCheckedChange={(checked) => {
											setOnlyCheckedIn(checked);
											setCurrentIndex(0);
											setTimeIsUp(false);
										}}
										className="data-[state=checked]:bg-emerald-400"
									/>
									只看已签到
								</label>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<Switch
									checked={countdownEnabled}
									onCheckedChange={handleCountdownToggle}
									className="data-[state=checked]:bg-emerald-400"
								/>
								<span>启用倒计时</span>
							</div>
							<div className="flex items-center gap-2">
								<TimerReset className="h-4 w-4" />
								<Input
									type="number"
									inputMode="numeric"
									min={0}
									max={999}
									value={countdownBaseSeconds}
									onChange={(event) =>
										handleCountdownInput(event.target.value)
									}
									disabled={!countdownEnabled}
									className="h-9 w-20 rounded-full border-white/30 bg-white/10 text-center text-white outline-none focus-visible:ring-white/50 disabled:opacity-60"
								/>
								<span>主讲秒数（额外 +3s 倒计时）</span>
							</div>
							<div className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
								<Clock3 className="h-4 w-4" />
								<span>
									{countdownLabel} {countdownDisplay}
								</span>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface ProfileSlideProps {
	user: SlideDeckUser;
	showTimeIsUp: boolean;
	zoomLevel: SlideZoomLevel;
	finalCountdownValue?: number | null;
}

function ProfileSlide({
	user,
	showTimeIsUp,
	zoomLevel,
	finalCountdownValue,
}: ProfileSlideProps) {
	const {
		name,
		username,
		avatarUrl,
		headline,
		subheading,
		bio,
		region,
		skills,
		offers,
		lookingFor,
		highlights,
		stats,
		contacts,
		checkedIn,
		works,
		lifeStatus,
		userRoleString,
		currentWorkOn,
	} = user;

	const containerGapClass: Record<SlideZoomLevel, string> = {
		xs: "gap-6",
		small: "gap-8",
		medium: "gap-10",
		large: "gap-12",
		xl: "gap-14",
	};
	const avatarSizeClass: Record<SlideZoomLevel, string> = {
		xs: "h-20 w-20 md:h-24 md:w-24",
		small: "h-28 w-28 md:h-32 md:w-32",
		medium: "h-32 w-32 md:h-36 md:w-36",
		large: "h-36 w-36 md:h-40 md:w-40",
		xl: "h-40 w-40 md:h-44 md:w-44",
	};
	const heroTitleClass: Record<SlideZoomLevel, string> = {
		xs: "text-4xl md:text-5xl",
		small: "text-5xl md:text-6xl",
		medium: "text-6xl md:text-7xl",
		large: "text-7xl md:text-8xl",
		xl: "text-8xl md:text-9xl",
	};
	const headlineTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-xl",
		small: "text-2xl",
		medium: "text-3xl",
		large: "text-4xl",
		xl: "text-5xl",
	};
	const subheadingTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-base",
		small: "text-lg",
		medium: "text-xl",
		large: "text-2xl",
		xl: "text-3xl",
	};
	const metadataTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-sm",
		small: "text-base",
		medium: "text-lg",
		large: "text-xl",
		xl: "text-2xl",
	};
	const timeUpTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-base",
		small: "text-lg",
		medium: "text-xl",
		large: "text-2xl",
		xl: "text-3xl",
	};
	const sectionHeadingClass: Record<SlideZoomLevel, string> = {
		xs: "text-base",
		small: "text-lg",
		medium: "text-xl",
		large: "text-2xl",
		xl: "text-3xl",
	};
	const bodyTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-lg",
		small: "text-xl",
		medium: "text-2xl",
		large: "text-3xl",
		xl: "text-4xl",
	};
	const skillTagTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-sm",
		small: "text-base",
		medium: "text-lg",
		large: "text-xl",
		xl: "text-2xl",
	};
	const statValueTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-3xl",
		small: "text-4xl",
		medium: "text-5xl",
		large: "text-6xl",
		xl: "text-7xl",
	};
	const statLabelTextClass: Record<SlideZoomLevel, string> = {
		xs: "mt-1 text-sm",
		small: "mt-2 text-base",
		medium: "mt-2 text-lg",
		large: "mt-3 text-xl",
		xl: "mt-3 text-2xl",
	};
	const contactTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-sm",
		small: "text-base",
		medium: "text-lg",
		large: "text-xl",
		xl: "text-2xl",
	};
	const cardTitleTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-lg",
		small: "text-xl",
		medium: "text-2xl",
		large: "text-3xl",
		xl: "text-4xl",
	};
	const cardCaptionTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-sm",
		small: "text-base",
		medium: "text-lg",
		large: "text-xl",
		xl: "text-2xl",
	};
	const listTextClass: Record<SlideZoomLevel, string> = {
		xs: "text-base",
		small: "text-lg",
		medium: "text-xl",
		large: "text-2xl",
		xl: "text-3xl",
	};
	const finalCountdownNumberClass: Record<SlideZoomLevel, string> = {
		xs: "text-[6rem] md:text-[7rem]",
		small: "text-[7rem] md:text-[8rem]",
		medium: "text-[8rem] md:text-[9rem]",
		large: "text-[9rem] md:text-[10rem]",
		xl: "text-[10rem] md:text-[11rem]",
	};

	const pathname = usePathname();
	const localeSegment = useMemo(() => {
		if (!pathname) {
			return "zh";
		}
		const segments = pathname.split("/").filter(Boolean);
		return segments[0] || "zh";
	}, [pathname]);

	const profilePath = username
		? `/${localeSegment}/u/${encodeURIComponent(username)}`
		: null;
	const [qrValue, setQrValue] = useState<string | null>(null);

	useEffect(() => {
		if (!profilePath) {
			setQrValue(null);
			return;
		}
		if (typeof window === "undefined") {
			setQrValue(profilePath);
			return;
		}
		const origin = window.location.origin;
		setQrValue(`${origin}${profilePath}`);
	}, [profilePath]);

	const showQrCode = Boolean(qrValue && username);

	const truncatedBio = truncateText(bio, 240);
	const offerHighlights = extractHighlights(offers, 70);
	const lookingForHighlights = extractHighlights(lookingFor, 70);
	const fallbackOffer = truncateText(offers, 160);
	const fallbackLookingFor = truncateText(lookingFor, 160);
	const offerLines =
		offerHighlights.length > 0
			? offerHighlights
			: fallbackOffer
				? [fallbackOffer]
				: [];
	const lookingForLines =
		lookingForHighlights.length > 0
			? lookingForHighlights
			: fallbackLookingFor
				? [fallbackLookingFor]
				: [];
	const spotlightWorks = Array.isArray(works) ? works.slice(0, 2) : [];

	return (
		<div
			className={cn(
				"relative flex h-full flex-col text-white",
				containerGapClass[zoomLevel],
			)}
		>
			{typeof finalCountdownValue === "number" &&
				finalCountdownValue > 0 && (
					<div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
						<span
							key={finalCountdownValue}
							className={cn(
								"font-black tracking-widest text-white drop-shadow-[0_0_30px_rgba(15,23,42,0.4)] transition-transform duration-150",
								finalCountdownNumberClass[zoomLevel],
							)}
						>
							{finalCountdownValue}
						</span>
					</div>
				)}

			{showQrCode && (
				<div className="pointer-events-none absolute top-6 right-6 z-30 flex flex-col items-center gap-2">
					<div className="pointer-events-auto rounded-xl bg-white/95 p-2 shadow-2xl">
						<QRCode
							value={qrValue ?? ""}
							size={96}
							bgColor="#ffffff"
							fgColor="#0f172a"
						/>
					</div>
					{profilePath && (
						<a
							href={profilePath}
							target="_blank"
							rel="noreferrer"
							className="pointer-events-auto rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-medium text-white/85 backdrop-blur hover:bg-white/20 hover:text-white"
						>
							扫码查看名片
						</a>
					)}
				</div>
			)}

			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex items-start gap-4">
					<UserAvatar
						name={name}
						avatarUrl={avatarUrl ?? undefined}
						className={cn(
							avatarSizeClass[zoomLevel],
							"border-4 border-white/20 shadow-xl",
						)}
					/>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h1
								className={cn(
									"font-bold tracking-tight",
									heroTitleClass[zoomLevel],
								)}
							>
								{name}
							</h1>
							{checkedIn && (
								<Badge className="bg-emerald-400/20 text-emerald-200">
									已签到
								</Badge>
							)}
						</div>
						{headline && (
							<p
								className={cn(
									"font-medium text-white/80",
									headlineTextClass[zoomLevel],
								)}
							>
								{headline}
							</p>
						)}
						{subheading && (
							<p
								className={cn(
									"text-white/70",
									subheadingTextClass[zoomLevel],
								)}
							>
								{subheading}
							</p>
						)}
						<div
							className={cn(
								"flex flex-wrap items-center gap-2 text-white/70",
								metadataTextClass[zoomLevel],
							)}
						>
							{username && <span>@{username}</span>}
							{region && (
								<span className="flex items-center gap-1">
									<MapPin className="h-4 w-4" />
									{region}
								</span>
							)}
							{lifeStatus &&
								lifeStatus !== headline &&
								lifeStatus !== subheading && (
									<Badge
										variant="outline"
										className="border-white/30 text-white/80"
									>
										{lifeStatus}
									</Badge>
								)}
						</div>
					</div>
				</div>
				{showTimeIsUp && (
					<div
						className={cn(
							"animate-pulse rounded-full border border-red-500/60 bg-red-600/25 px-4 py-1 font-semibold text-red-100 shadow-lg absolute top-6 right-32 z-20",
							timeUpTextClass[zoomLevel],
						)}
					>
						时间到 · 请切换下一位
					</div>
				)}
			</div>

			<div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-5">
				<div className="md:col-span-3 space-y-4">
					{truncatedBio && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								个人简介
							</h2>
							<p
								className={cn(
									"mt-2 leading-relaxed text-white/90",
									bodyTextClass[zoomLevel],
								)}
							>
								{truncatedBio}
							</p>
						</section>
					)}

					{(offerLines.length > 0 || lookingForLines.length > 0) && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								资源匹配
							</h2>
							<div
								className={cn(
									"mt-3 grid gap-3",
									offerLines.length > 0 &&
										lookingForLines.length > 0
										? "sm:grid-cols-2"
										: "sm:grid-cols-1",
								)}
							>
								{offerLines.length > 0 && (
									<div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
										<p
											className={cn(
												"font-semibold text-emerald-100",
												cardTitleTextClass[zoomLevel],
											)}
										>
											我能提供
										</p>
										<ul
											className={cn(
												"mt-2 space-y-2 text-emerald-50/90",
												listTextClass[zoomLevel],
											)}
										>
											{offerLines.map((line, index) => (
												<li
													key={`offer-${index}`}
													className="flex items-start gap-2"
												>
													<span className="mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-300" />
													<span className="flex-1">
														{line}
													</span>
												</li>
											))}
										</ul>
									</div>
								)}
								{lookingForLines.length > 0 && (
									<div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
										<p
											className={cn(
												"font-semibold text-sky-100",
												cardTitleTextClass[zoomLevel],
											)}
										>
											我在寻找
										</p>
										<ul
											className={cn(
												"mt-2 space-y-2 text-sky-50/90",
												listTextClass[zoomLevel],
											)}
										>
											{lookingForLines.map(
												(line, index) => (
													<li
														key={`seek-${index}`}
														className="flex items-start gap-2"
													>
														<span className="mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300" />
														<span className="flex-1">
															{line}
														</span>
													</li>
												),
											)}
										</ul>
									</div>
								)}
							</div>
						</section>
					)}

					{spotlightWorks.length > 0 && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								作品亮点
							</h2>
							<div className="mt-3 space-y-3">
								{spotlightWorks.map((work, index) => {
									const summary =
										truncateText(work.summary, 120) ??
										work.summary;
									const tags = work.tags?.slice(0, 3) ?? [];
									return (
										<div
											key={
												work.id ??
												`${work.title}-${index}`
											}
											className="rounded-2xl border border-white/10 bg-white/5 p-4"
										>
											<div className="flex flex-col gap-2">
												<div className="flex items-start justify-between gap-3">
													<p
														className={cn(
															"font-semibold text-white",
															cardTitleTextClass[
																zoomLevel
															],
														)}
													>
														{work.title}
													</p>
													{work.url && (
														<a
															href={work.url}
															target="_blank"
															rel="noreferrer"
															className={cn(
																"text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline",
																cardCaptionTextClass[
																	zoomLevel
																],
															)}
														>
															了解更多
														</a>
													)}
												</div>
												{summary && (
													<p
														className={cn(
															"text-white/80",
															listTextClass[
																zoomLevel
															],
														)}
													>
														{summary}
													</p>
												)}
												{tags.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{tags.map((tag) => (
															<span
																key={tag}
																className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-wide text-white/60"
															>
																{tag}
															</span>
														))}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</section>
					)}
				</div>

				<div className="md:col-span-2 space-y-4">
					{skills && skills.length > 0 && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								关键词
							</h2>
							<div className="mt-3 flex flex-wrap gap-2">
								{skills.slice(0, 8).map((skill) => (
									<span
										key={skill}
										className={cn(
											"rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80",
											skillTagTextClass[zoomLevel],
										)}
									>
										{skill}
									</span>
								))}
								{skills.length > 8 && (
									<span
										className={cn(
											"rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80",
											skillTagTextClass[zoomLevel],
										)}
									>
										+{skills.length - 8}
									</span>
								)}
							</div>
						</section>
					)}

					{stats && stats.length > 0 && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								数字速览
							</h2>
							<div className="mt-2 grid grid-cols-3 gap-2">
								{stats.slice(0, 3).map((stat) => (
									<div
										key={stat.label}
										className="rounded-lg border border-white/10 bg-white/5 p-2 text-center"
									>
										<div
											className={cn(
												"font-semibold text-white text-lg",
											)}
										>
											{stat.value}
										</div>
										<div
											className={cn(
												"text-white/70 text-xs mt-1",
											)}
										>
											{stat.label}
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{contacts && contacts.length > 0 && (
						<section>
							<h2
								className={cn(
									"uppercase tracking-wide text-white/60",
									sectionHeadingClass[zoomLevel],
								)}
							>
								联系人脉
							</h2>
							<ul
								className={cn(
									"mt-2 space-y-2 text-white/80",
									contactTextClass[zoomLevel],
								)}
							>
								{contacts.slice(0, 3).map((contact) => (
									<li
										key={`${contact.label}-${contact.value}`}
									>
										{contact.href ? (
											<a
												href={contact.href}
												target="_blank"
												rel="noreferrer"
												className="underline-offset-4 hover:underline"
											>
												{contact.label} ·{" "}
												{contact.value}
											</a>
										) : (
											<span>
												{contact.label} ·{" "}
												{contact.value}
											</span>
										)}
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			</div>
		</div>
	);
}
