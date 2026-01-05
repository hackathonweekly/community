"use client";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Maximize2,
	Minimize2,
	Play,
	X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useEventSubmissions } from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import type { HackathonVoting } from "@/features/hackathon/config";
import { cn } from "@/lib/utils";
import { createFallbackCaptionSrc } from "./utils";

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function stripHtmlToText(value: string) {
	if (!value) return "";
	try {
		const doc = new DOMParser().parseFromString(value, "text/html");
		return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
	} catch {
		return value
			.replace(/<[^>]*>/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}

function extractHighlights(
	value: string | null | undefined,
	{
		maxItems = 4,
		limitPerItem = 80,
	}: { maxItems?: number; limitPerItem?: number } = {},
) {
	if (!value) return [];
	const normalized = value.replace(/\r\n/g, "\n").trim();
	if (!normalized) return [];

	let segments = normalized
		.split(/\n+/)
		.map((segment) => segment.replace(/\s+/g, " ").trim())
		.filter(Boolean);

	if (segments.length <= 1) {
		segments = normalized
			.split(/[、，,；;。.!?]/)
			.map((segment) => segment.replace(/\s+/g, " ").trim())
			.filter(Boolean);
	}

	const unique: string[] = [];
	for (const segment of segments) {
		if (!unique.includes(segment)) {
			unique.push(segment);
		}
		if (unique.length >= maxItems * 2) break;
	}

	const result: string[] = [];
	for (const segment of unique) {
		const trimmed = segment.trim();
		if (!trimmed) continue;
		if (trimmed.length <= limitPerItem) {
			result.push(trimmed);
		} else {
			const cut = trimmed.slice(0, limitPerItem);
			const lastSep = cut.lastIndexOf(" ");
			result.push(
				lastSep > Math.floor(limitPerItem * 0.5)
					? `${cut.slice(0, lastSep)}...`
					: `${cut}...`,
			);
		}
		if (result.length >= maxItems) break;
	}

	return result;
}

function getSubmissionMedia(submission: EventSubmission) {
	if (submission.coverImage) {
		return { type: "image" as const, url: submission.coverImage };
	}
	const first = submission.attachments?.[0];
	if (!first) return null;
	if (first.fileType === "image") {
		return { type: "image" as const, url: first.fileUrl };
	}
	if (first.fileType === "video") {
		return { type: "video" as const, url: first.fileUrl };
	}
	return null;
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success("链接已复制");
		return;
	} catch {
		// ignore and fallback
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	try {
		document.execCommand("copy");
		toast.success("链接已复制");
	} catch {
		toast.error("复制失败，请手动复制");
	} finally {
		document.body.removeChild(textArea);
	}
}

export interface SubmissionsSlideDeckProps {
	eventId: string;
	locale: string;
	eventTitle: string;
	baseUrl: string;
	isVotingOpen: boolean;
	showResults: boolean;
	votingConfig?: HackathonVoting | null;
}

export function SubmissionsSlideDeck({
	eventId,
	locale,
	eventTitle,
	baseUrl,
	isVotingOpen,
	showResults,
}: SubmissionsSlideDeckProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const startId = searchParams.get("start");

	const [onlyApproved, setOnlyApproved] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isQrCollapsed, setIsQrCollapsed] = useState(false);
	const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const { data, isLoading } = useEventSubmissions(eventId, {
		sort: "createdAt",
		order: "asc",
		includeVotes: false,
	});

	const submissions = useMemo(() => {
		const list = data?.submissions ?? [];
		if (!onlyApproved) return list;
		return list.filter(
			(s) => s.status === "APPROVED" || s.status === "AWARDED",
		);
	}, [data?.submissions, onlyApproved]);

	useEffect(() => {
		if (!startId || submissions.length === 0) return;
		const idx = submissions.findIndex((s) => s.id === startId);
		if (idx >= 0) {
			setCurrentIndex(idx);
		}
	}, [startId, submissions]);

	useEffect(() => {
		setCurrentIndex((prev) =>
			clamp(prev, 0, Math.max(submissions.length - 1, 0)),
		);
	}, [submissions.length]);

	const currentSubmission = submissions[currentIndex] ?? null;
	const total = submissions.length;
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < total - 1;

	const currentSubmissionDetailUrl = useMemo(() => {
		if (!currentSubmission) return "";
		const normalizedBase = baseUrl.endsWith("/")
			? baseUrl.slice(0, -1)
			: baseUrl;
		return `${normalizedBase}/${locale}/events/${eventId}/submissions/${currentSubmission.id}`;
	}, [baseUrl, locale, eventId, currentSubmission]);

	const currentSubmissionVoteUrl = useMemo(() => {
		if (!currentSubmission) return "";
		const normalizedBase = baseUrl.endsWith("/")
			? baseUrl.slice(0, -1)
			: baseUrl;
		return `${normalizedBase}/${locale}/events/${eventId}/submissions/${currentSubmission.id}/vote`;
	}, [baseUrl, locale, eventId, currentSubmission]);

	const qrUrl = useMemo(() => {
		if (!currentSubmission) return "";
		return isVotingOpen
			? currentSubmissionVoteUrl
			: currentSubmissionDetailUrl;
	}, [
		currentSubmission,
		currentSubmissionDetailUrl,
		currentSubmissionVoteUrl,
		isVotingOpen,
	]);

	const voteLabel = useMemo(() => {
		if (!isVotingOpen) return "扫码查看作品";
		return "扫码投票";
	}, [isVotingOpen]);

	const slideMaxWidth = useMemo(() => {
		const reserved = 180;
		return `min(100vw, calc((100vh - ${reserved}px) * 16 / 9))`;
	}, []);

	const toggleFullscreen = useCallback(async () => {
		const element = containerRef.current;
		if (!element) return;

		try {
			if (!document.fullscreenElement) {
				await element.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch {
			// ignore fullscreen errors
		}
	}, []);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(Boolean(document.fullscreenElement));
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			);
	}, []);

	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => clamp(prev - 1, 0, Math.max(total - 1, 0)));
	}, [total]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => clamp(prev + 1, 0, Math.max(total - 1, 0)));
	}, [total]);

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (isQrZoomOpen) return;
			if (event.key === "ArrowRight" || event.key === " ") {
				event.preventDefault();
				handleNext();
			}
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				handlePrev();
			}
			if (event.key.toLowerCase() === "f") {
				event.preventDefault();
				void toggleFullscreen();
			}
			if (event.key.toLowerCase() === "q") {
				event.preventDefault();
				setIsQrCollapsed((prev) => !prev);
			}
			if (event.key === "Escape" && document.fullscreenElement) {
				event.preventDefault();
				void document.exitFullscreen();
			}
		};

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [handleNext, handlePrev, isQrZoomOpen, toggleFullscreen]);

	const descriptionText = useMemo(() => {
		if (!currentSubmission) return "";
		return stripHtmlToText(currentSubmission.description ?? "");
	}, [currentSubmission]);

	const highlights = useMemo(() => {
		const list = extractHighlights(descriptionText, {
			maxItems: 4,
			limitPerItem: 88,
		});
		if (list.length > 0) return list;
		if (!currentSubmission?.tagline) return [];
		return [currentSubmission.tagline];
	}, [descriptionText, currentSubmission?.tagline]);

	const media = useMemo(() => {
		if (!currentSubmission) return null;
		return getSubmissionMedia(currentSubmission);
	}, [currentSubmission]);

	const captionLang = locale === "en" ? "en" : "zh";
	const captionLabel = locale === "en" ? "Captions" : "字幕";
	const fallbackCaptionSrc = useMemo(() => {
		if (!currentSubmission) return "";
		return createFallbackCaptionSrc(
			currentSubmission.tagline ?? currentSubmission.name,
			locale === "en" ? "Video content" : "视频内容",
		);
	}, [currentSubmission, locale]);

	const handleExit = () => {
		router.push(`/${locale}/events/${eventId}/submissions`);
	};

	return (
		<div
			ref={containerRef}
			className="w-screen h-[100svh] bg-slate-950 text-white overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black"
		>
			<div className="mx-auto flex h-full w-full flex-col gap-4 p-4 sm:p-6 relative z-10">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="border-white/20 text-white/70 bg-white/5 backdrop-blur-sm"
							>
								Slide Mode
							</Badge>
							<div className="text-xs font-medium uppercase tracking-wide text-white/50">
								{eventTitle}
							</div>
						</div>
						<p className="mt-1 text-sm text-white/40 font-light tracking-wide">
							← / → / 空格切换作品，F 进入全屏
						</p>
					</div>

					<div className="flex items-center gap-2">
						<div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 transition-colors hover:bg-white/10">
							<span className="text-xs text-white/70">
								仅展示已通过
							</span>
							<Switch
								checked={onlyApproved}
								onCheckedChange={setOnlyApproved}
								className="scale-75 data-[state=checked]:bg-emerald-500"
							/>
						</div>

						<Button
							variant="outline"
							size="icon"
							onClick={() => void toggleFullscreen()}
							className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
							aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
						>
							{isFullscreen ? (
								<Minimize2 className="h-4 w-4" />
							) : (
								<Maximize2 className="h-4 w-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={handleExit}
							className="rounded-full text-white/50 hover:text-white hover:bg-white/10"
							aria-label="退出"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex-1 flex items-center justify-center min-h-0">
					<div
						className="w-full transition-all duration-500 ease-in-out"
						style={{ maxWidth: slideMaxWidth }}
					>
						<div className="relative w-full aspect-video rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden ring-1 ring-white/5 group">
							{/* Background shine effect */}
							<div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

							{isLoading ? (
								<div className="flex h-full items-center justify-center text-white/60">
									<div className="animate-pulse flex flex-col items-center gap-4">
										<div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
										<p>正在加载作品…</p>
									</div>
								</div>
							) : !currentSubmission ? (
								<div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-white/60">
									<div className="p-4 rounded-full bg-white/5 border border-white/10">
										<Play className="h-8 w-8 text-white/40 ml-1" />
									</div>
									<div className="text-center">
										<p className="text-xl font-semibold text-white/80">
											暂无可展示的作品
										</p>
										<p className="text-sm mt-1 text-white/40">
											{onlyApproved
												? "当前列表为空，可尝试关闭「仅已通过」过滤"
												: "还没有人提交作品"}
										</p>
									</div>
								</div>
							) : (
								<div className="relative z-10 w-full h-full flex">
									{/* Navigation Buttons */}
									<div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
										<Button
											variant="ghost"
											size="icon"
											disabled={!hasPrev}
											onClick={handlePrev}
											className={cn(
												"h-12 w-12 rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md hover:bg-white/10 hover:text-white disabled:opacity-0 shadow-lg",
											)}
										>
											<ChevronLeft className="h-6 w-6" />
										</Button>
									</div>
									<div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
										<Button
											variant="ghost"
											size="icon"
											disabled={!hasNext}
											onClick={handleNext}
											className={cn(
												"h-12 w-12 rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md hover:bg-white/10 hover:text-white disabled:opacity-0 shadow-lg",
											)}
										>
											<ChevronRight className="h-6 w-6" />
										</Button>
									</div>

									<div className="w-full h-full min-h-0 grid grid-cols-12">
										{/* Left Column: Media */}
										<div className="col-span-8 h-full min-h-0 bg-black/20 border-r border-white/5 p-5 flex flex-col backdrop-blur-[2px]">
											{/* Media Box */}
											<div
												key={currentSubmission.id}
												className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-inner relative group/media"
											>
												{media?.type === "image" ? (
													<img
														key={media.url}
														src={media.url}
														alt={
															currentSubmission.name
														}
														className="block h-full w-full object-contain p-1 transition-transform duration-700 hover:scale-105"
													/>
												) : media?.type === "video" ? (
													<video
														key={media.url}
														controls
														preload="metadata"
														playsInline
														className="block h-full w-full bg-black object-contain"
													>
														<source
															src={media.url}
														/>
														<track
															default
															kind="captions"
															srcLang={
																captionLang
															}
															label={captionLabel}
															src={
																fallbackCaptionSrc
															}
														/>
														您的浏览器不支持视频播放
													</video>
												) : (
													<div className="flex h-full flex-col items-center justify-center gap-3 text-white/30">
														<div className="p-4 rounded-full bg-white/5">
															<Maximize2 className="h-6 w-6" />
														</div>
														<p>暂无演示素材</p>
													</div>
												)}

												{/* Hover Actions */}
												{currentSubmission.demoUrl && (
													<div className="absolute top-4 right-4 opacity-0 group-hover/media:opacity-100 transition-opacity">
														<Button
															size="sm"
															variant="secondary"
															className="shadow-lg"
															onClick={() =>
																void copyText(
																	currentSubmission.demoUrl!,
																)
															}
														>
															复制演示链接
														</Button>
													</div>
												)}
											</div>
										</div>

										{/* Right Column: Content & QR */}
										<div className="col-span-4 h-full min-h-0 flex flex-col p-8 lg:p-10 relative overflow-hidden">
											{/* Subtle decorative elements */}
											<div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
											<div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

											<div className="relative z-10 flex flex-col h-full">
												<div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
													<Badge
														variant="secondary"
														className="bg-white/10 text-white border-none px-3 py-1"
													>
														#{currentIndex + 1}
													</Badge>
													{showResults && (
														<Badge
															variant="outline"
															className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1"
														>
															{
																currentSubmission.voteCount
															}{" "}
															票
														</Badge>
													)}
													{currentSubmission.status ===
														"AWARDED" && (
														<Badge className="bg-amber-500 text-black hover:bg-amber-400 border-none px-3 py-1">
															🏆 获奖作品
														</Badge>
													)}
												</div>

												<div className="mt-8 flex-1 min-h-0 space-y-6 overflow-hidden">
													<div>
														<h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
															{
																currentSubmission.name
															}
														</h1>
														{currentSubmission.tagline && (
															<p className="mt-4 text-xl lg:text-2xl text-white/70 font-light leading-relaxed break-words whitespace-normal animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
																{
																	currentSubmission.tagline
																}
															</p>
														)}
													</div>

													<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
														<div className="h-px w-20 bg-gradient-to-r from-white/30 to-transparent" />
														{highlights.length >
														0 ? (
															<ul className="grid gap-3">
																{highlights.map(
																	(
																		item,
																		i,
																	) => (
																		<li
																			key={
																				i
																			}
																			className="flex min-w-0 items-start gap-3 group/item"
																		>
																			<span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover/item:scale-125 transition-transform" />
																			<span className="min-w-0 text-lg text-white/80 leading-relaxed font-light break-words whitespace-normal">
																				{
																					item
																				}
																			</span>
																		</li>
																	),
																)}
															</ul>
														) : (
															<p className="text-lg text-white/50 italic font-light">
																这个作品很神秘，没有提供详细介绍...
															</p>
														)}
													</div>

													<div className="flex flex-wrap items-center gap-3 animate-in fade-in duration-700 delay-500">
														{currentSubmission
															.teamLeader
															?.name && (
															<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
																<span className="text-white/40">
																	队长
																</span>
																<span className="font-medium text-white/90">
																	{
																		currentSubmission
																			.teamLeader
																			.name
																	}
																</span>
															</div>
														)}
														{currentSubmission.teamMembers &&
															currentSubmission
																.teamMembers
																.length > 0 && (
																<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
																	<span className="text-white/40">
																		团队
																	</span>
																	<span className="font-medium text-white/90">
																		{
																			currentSubmission
																				.teamMembers
																				.length
																		}{" "}
																		人
																	</span>
																</div>
															)}
													</div>
												</div>

												{/* QR Code Section */}
												<div className="mt-auto pt-6 shrink-0">
													<Collapsible
														open={!isQrCollapsed}
														onOpenChange={(open) =>
															setIsQrCollapsed(
																!open,
															)
														}
														className="shrink-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:bg-white/10"
													>
														<div
															className="flex items-center justify-between p-4 cursor-pointer"
															onClick={() =>
																setIsQrCollapsed(
																	(prev) =>
																		!prev,
																)
															}
														>
															<div>
																<p className="text-sm font-semibold text-white/90 flex items-center gap-2">
																	{voteLabel}
																	{isVotingOpen && (
																		<span className="relative flex h-2 w-2">
																			<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
																			<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
																		</span>
																	)}
																</p>
															</div>
															<CollapsibleTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-white/50 hover:text-white"
																>
																	{isQrCollapsed ? (
																		<ChevronDown className="h-4 w-4" />
																	) : (
																		<ChevronUp className="h-4 w-4" />
																	)}
																</Button>
															</CollapsibleTrigger>
														</div>
														<CollapsibleContent>
															<div className="px-4 pb-4">
																<div className="flex gap-4">
																	<button
																		type="button"
																		className="shrink-0 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5 transition-transform hover:scale-[1.01] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-zoom-in w-[clamp(180px,15vw,260px)]"
																		onClick={() =>
																			setIsQrZoomOpen(
																				true,
																			)
																		}
																		aria-label="放大二维码"
																	>
																		<QRCode
																			value={
																				qrUrl ||
																				" "
																			}
																			size={
																				1024
																			}
																			style={{
																				height: "auto",
																				width: "100%",
																			}}
																			className="h-auto w-full"
																		/>
																	</button>
																	<div className="flex flex-col justify-center gap-2 min-w-0">
																		<p className="text-xs text-white/50 leading-relaxed">
																			{isVotingOpen
																				? "手机扫码即可投票"
																				: "手机扫码即可查看作品详情"}
																		</p>
																		<div className="flex flex-col gap-2">
																			<Button
																				variant="outline"
																				size="sm"
																				className="h-7 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white justify-start"
																				onClick={() =>
																					void copyText(
																						qrUrl,
																					)
																				}
																			>
																				复制链接
																			</Button>
																			<Button
																				variant="outline"
																				size="sm"
																				className="h-7 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white justify-start"
																				onClick={() =>
																					setIsQrZoomOpen(
																						true,
																					)
																				}
																			>
																				放大二维码
																			</Button>
																		</div>
																		{isVotingOpen ? (
																			<div className="text-emerald-400 text-xs flex items-center gap-1.5">
																				<CheckCircle2 className="h-3 w-3" />
																				投票进行中
																			</div>
																		) : (
																			<div className="text-white/30 text-xs">
																				投票已结束
																			</div>
																		)}
																	</div>
																</div>
															</div>
														</CollapsibleContent>
													</Collapsible>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<Dialog open={isQrZoomOpen} onOpenChange={setIsQrZoomOpen}>
					<DialogContent
						showCloseButton={false}
						className="max-w-none sm:max-w-none w-[calc(min(92vw,70vh)+40px)] max-h-[calc(100vh-2rem)] rounded-3xl border-white/10 bg-slate-950 p-5 text-white"
					>
						<div className="flex items-start justify-between gap-3">
							<h2 className="text-4xl lg:text-5xl min-w-0 font-semibold leading-tight text-white/90">
								<span className="block truncate">
									{currentSubmission?.name ?? voteLabel}
								</span>
							</h2>
							<DialogClose asChild>
								<button
									type="button"
									className="shrink-0 rounded-full bg-white/5 p-2 text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
									aria-label="关闭"
								>
									<X className="h-4 w-4" />
								</button>
							</DialogClose>
						</div>

						<button
							type="button"
							className="mt-4 w-full aspect-square rounded-3xl bg-white p-4 shadow-xl ring-1 ring-black/5 cursor-copy"
							onClick={() => void copyText(qrUrl)}
							aria-label="点击复制链接"
						>
							<QRCode
								value={qrUrl || " "}
								size={1024}
								style={{
									height: "100%",
									width: "100%",
								}}
								className="h-full w-full"
							/>
						</button>
					</DialogContent>
				</Dialog>

				{/* Footer Controls */}
				<div className="flex items-center justify-between text-sm text-white/30 px-2">
					<div className="flex items-center gap-4">
						<span>
							{isLoading
								? "加载中…"
								: total > 0
									? `共 ${total} 个作品`
									: "暂无作品"}
						</span>
						{!isLoading && total > 0 && (
							<div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
								<div
									className="h-full bg-white/40 transition-all duration-300"
									style={{
										width: `${((currentIndex + 1) / total) * 100}%`,
									}}
								/>
							</div>
						)}
					</div>

					<div className="flex items-center gap-2">
						<span className="hidden sm:inline">
							Tip: 按空格键切换下一个
						</span>
						<div className="h-4 w-px bg-white/10 mx-2" />
						<Button
							variant="ghost"
							size="sm"
							disabled={!hasPrev}
							onClick={handlePrev}
							className="h-8 px-3 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
						>
							上一个
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={!hasNext}
							onClick={handleNext}
							className="h-8 px-3 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
						>
							下一个
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function CheckCircle2({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}
