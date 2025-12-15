"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Clock,
	Play,
	Pause,
	RotateCcw,
	Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CountdownPageProps {
	params: Promise<{ locale: string; eventId: string }>;
}

export default function CountdownPage({ params }: CountdownPageProps) {
	const router = useRouter();
	const [locale, setLocale] = useState("");
	const [eventId, setEventId] = useState("");
	const [countdownTitle, setCountdownTitle] = useState("倒计时");

	// Countdown state
	const [deadline, setDeadline] = useState<Date | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	// Settings dialog state
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [hours, setHours] = useState("0");
	const [minutes, setMinutes] = useState("30");
	const [seconds, setSeconds] = useState("0");

	// Parse params
	useEffect(() => {
		params.then(({ locale: l, eventId: e }) => {
			setLocale(l);
			setEventId(e);
		});
	}, [params]);

	useEffect(() => {
		if (!eventId) return;
		try {
			const savedTitle = localStorage.getItem(
				`eventCountdownTitle:${eventId}`,
			);
			if (savedTitle?.trim()) {
				setCountdownTitle(savedTitle);
			}
		} catch {
			// ignore
		}
	}, [eventId]);

	useEffect(() => {
		if (!eventId) return;
		try {
			const nextTitle = countdownTitle.trim();
			if (!nextTitle) {
				localStorage.removeItem(`eventCountdownTitle:${eventId}`);
				return;
			}
			localStorage.setItem(`eventCountdownTitle:${eventId}`, nextTitle);
		} catch {
			// ignore
		}
	}, [eventId, countdownTitle]);

	// Countdown logic
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		isNegative: false,
	});
	const [isTimeUp, setIsTimeUp] = useState(false);

	useEffect(() => {
		if (!deadline || isPaused) return;

		const calculateTimeLeft = () => {
			const now = new Date();
			const difference = deadline.getTime() - now.getTime();
			const isNegative = difference < 0;
			const absDifference = Math.abs(difference);

			const days = Math.floor(absDifference / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(absDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			);
			const minutes = Math.floor(
				(absDifference % (1000 * 60 * 60)) / (1000 * 60),
			);
			const seconds = Math.floor((absDifference % (1000 * 60)) / 1000);

			setTimeLeft({ days, hours, minutes, seconds, isNegative });

			// Auto stop when time is up
			if (isNegative && isRunning) {
				setIsRunning(false);
				setIsPaused(true);
				setIsTimeUp(true);
			}
		};

		calculateTimeLeft();
		const interval = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(interval);
	}, [deadline, isPaused, isRunning]);

	// Start countdown
	const handleStart = () => {
		const h = Number.parseInt(hours) || 0;
		const m = Number.parseInt(minutes) || 0;
		const s = Number.parseInt(seconds) || 0;

		if (h === 0 && m === 0 && s === 0) {
			return;
		}

		const now = new Date();
		const targetTime = new Date(
			now.getTime() + h * 3600000 + m * 60000 + s * 1000,
		);

		setDeadline(targetTime);
		setIsRunning(true);
		setIsPaused(false);
		setIsTimeUp(false);
		setSettingsOpen(false);
	};

	// Pause/Resume
	const handlePauseResume = () => {
		setIsPaused(!isPaused);
	};

	// Reset
	const handleReset = () => {
		setDeadline(null);
		setIsRunning(false);
		setIsPaused(false);
		setIsTimeUp(false);
		setTimeLeft({
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isNegative: false,
		});
	};

	// Open settings dialog
	const handleOpenSettings = () => {
		setSettingsOpen(true);
	};

	// Determine color based on time left
	const getColorClass = () => {
		if (timeLeft.isNegative) return "text-gray-500";

		const totalMinutes =
			timeLeft.days * 24 * 60 + timeLeft.hours * 60 + timeLeft.minutes;

		if (totalMinutes <= 1) {
			// Less than 1 minute - blinking red
			return "text-red-600 animate-pulse";
		}
		if (totalMinutes <= 10) {
			// Less than 10 minutes - red
			return "text-red-500";
		}
		if (totalMinutes <= 60) {
			// Less than 1 hour - orange
			return "text-orange-500";
		}
		return "text-blue-600";
	};

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
			{/* Header */}
			<div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
				<Button
					onClick={() => router.back()}
					variant="ghost"
					size="sm"
					className="text-muted-foreground"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					返回
				</Button>
				<h1 className="text-lg font-semibold text-muted-foreground">
					{countdownTitle.trim() || "倒计时大屏"}
				</h1>
				<div className="w-20" /> {/* Spacer for centering */}
			</div>

			{/* Main countdown display */}
			<div className="flex-1 flex flex-col items-center justify-center p-8">
				{!isRunning && !isTimeUp ? (
					// Setup screen
					<div className="text-center space-y-8">
						<div className="space-y-4">
							<Clock className="w-24 h-24 mx-auto text-blue-600" />
							<h2 className="text-4xl font-bold text-gray-900">
								设置倒计时时间
							</h2>
							<p className="text-2xl font-semibold text-gray-800">
								{countdownTitle.trim() || "倒计时"}
							</p>
							<p className="text-xl text-muted-foreground">
								点击下方按钮开始设置倒计时
							</p>
						</div>

						<Button
							size="lg"
							className="text-lg px-8 py-6"
							onClick={handleOpenSettings}
						>
							<Settings className="w-5 h-5 mr-2" />
							设置时间
						</Button>
					</div>
				) : isTimeUp ? (
					// Time up screen
					<div className="text-center space-y-8">
						<div className="space-y-4">
							<div className="text-9xl font-bold text-red-600 animate-pulse">
								时间到！
							</div>
							<p className="text-2xl text-muted-foreground">
								倒计时已结束
							</p>
						</div>
						<Button
							size="lg"
							className="text-lg px-8 py-6"
							onClick={handleOpenSettings}
						>
							<Settings className="w-5 h-5 mr-2" />
							重新设置时间
						</Button>
					</div>
				) : (
					// Countdown display
					<div className="text-center space-y-12">
						<p className="text-4xl font-semibold text-gray-900">
							{countdownTitle.trim() || "倒计时"}
						</p>

						{/* Status text */}
						<div className="space-y-2">
							<h2
								className={cn(
									"text-5xl font-bold",
									getColorClass(),
								)}
							>
								{timeLeft.isNegative
									? "时间到！"
									: "倒计时进行中"}
							</h2>
							{isPaused && !timeLeft.isNegative && (
								<p className="text-2xl text-orange-500 font-semibold">
									已暂停
								</p>
							)}
						</div>

						{/* Countdown numbers */}
						<div className="flex items-center justify-center gap-8">
							{/* Days */}
							{timeLeft.days > 0 && (
								<>
									<div className="flex flex-col items-center">
										<div
											className={cn(
												"text-9xl font-bold tabular-nums leading-none",
												getColorClass(),
											)}
										>
											{String(timeLeft.days).padStart(
												2,
												"0",
											)}
										</div>
										<div className="text-2xl text-muted-foreground mt-4">
											天
										</div>
									</div>
									<div
										className={cn(
											"text-8xl font-bold leading-none",
											getColorClass(),
										)}
									>
										:
									</div>
								</>
							)}

							{/* Hours */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"text-9xl font-bold tabular-nums leading-none",
										getColorClass(),
									)}
								>
									{String(timeLeft.hours).padStart(2, "0")}
								</div>
								<div className="text-2xl text-muted-foreground mt-4">
									时
								</div>
							</div>

							<div
								className={cn(
									"text-8xl font-bold leading-none",
									getColorClass(),
								)}
							>
								:
							</div>

							{/* Minutes */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"text-9xl font-bold tabular-nums leading-none",
										getColorClass(),
									)}
								>
									{String(timeLeft.minutes).padStart(2, "0")}
								</div>
								<div className="text-2xl text-muted-foreground mt-4">
									分
								</div>
							</div>

							<div
								className={cn(
									"text-8xl font-bold leading-none",
									getColorClass(),
								)}
							>
								:
							</div>

							{/* Seconds */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"text-9xl font-bold tabular-nums leading-none",
										getColorClass(),
									)}
								>
									{String(timeLeft.seconds).padStart(2, "0")}
								</div>
								<div className="text-2xl text-muted-foreground mt-4">
									秒
								</div>
							</div>
						</div>

						{/* Warning messages */}
						{!timeLeft.isNegative && !isPaused && (
							<div className="text-center space-y-2">
								{timeLeft.days === 0 &&
									timeLeft.hours === 0 &&
									timeLeft.minutes <= 10 && (
										<p className="text-3xl font-bold text-red-600 animate-pulse">
											⚠️ 即将结束！
										</p>
									)}
								{timeLeft.days === 0 &&
									timeLeft.hours === 0 &&
									timeLeft.minutes <= 1 && (
										<p className="text-2xl font-bold text-red-700">
											🚨 最后一分钟！
										</p>
									)}
							</div>
						)}

						{/* Control buttons */}
						<div className="flex items-center justify-center gap-4">
							{!timeLeft.isNegative && (
								<Button
									onClick={handlePauseResume}
									size="lg"
									variant="outline"
									className="text-lg px-8"
								>
									{isPaused ? (
										<>
											<Play className="w-5 h-5 mr-2" />
											继续
										</>
									) : (
										<>
											<Pause className="w-5 h-5 mr-2" />
											暂停
										</>
									)}
								</Button>
							)}
							<Button
								onClick={handleReset}
								size="lg"
								variant="outline"
								className="text-lg px-8"
							>
								<RotateCcw className="w-5 h-5 mr-2" />
								重新设置
							</Button>
						</div>
					</div>
				)}
			</div>

			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>设置倒计时时间</DialogTitle>
						<DialogDescription>
							设置倒计时标题与时长
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-6 py-4">
						<div className="space-y-2">
							<Label htmlFor="countdown-title">倒计时标题</Label>
							<Input
								id="countdown-title"
								value={countdownTitle}
								onChange={(e) =>
									setCountdownTitle(e.target.value)
								}
								placeholder="例如：提交作品倒计时"
							/>
							<div className="grid grid-cols-3 gap-2">
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("组队倒计时")
									}
								>
									组队倒计时
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("提交作品倒计时")
									}
								>
									提交作品
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("投票倒计时")
									}
								>
									投票倒计时
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("路演倒计时")
									}
								>
									路演倒计时
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("休息倒计时")
									}
								>
									休息倒计时
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setCountdownTitle("开场倒计时")
									}
								>
									开场倒计时
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="hours">小时</Label>
								<Input
									id="hours"
									type="number"
									min="0"
									max="23"
									value={hours}
									onChange={(e) => setHours(e.target.value)}
									className="text-center text-2xl"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="minutes">分钟</Label>
								<Input
									id="minutes"
									type="number"
									min="0"
									max="59"
									value={minutes}
									onChange={(e) => setMinutes(e.target.value)}
									className="text-center text-2xl"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="seconds">秒</Label>
								<Input
									id="seconds"
									type="number"
									min="0"
									max="59"
									value={seconds}
									onChange={(e) => setSeconds(e.target.value)}
									className="text-center text-2xl"
								/>
							</div>
						</div>

						{/* Quick presets */}
						<div className="space-y-2">
							<Label>快速设置</Label>
							<div className="grid grid-cols-4 gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setHours("0");
										setMinutes("1");
										setSeconds("0");
									}}
								>
									1分钟
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("0");
										setMinutes("5");
										setSeconds("0");
									}}
								>
									5分钟
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("0");
										setMinutes("10");
										setSeconds("0");
									}}
								>
									10分钟
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("0");
										setMinutes("30");
										setSeconds("0");
									}}
								>
									30分钟
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("1");
										setMinutes("0");
										setSeconds("0");
									}}
								>
									1小时
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("2");
										setMinutes("0");
										setSeconds("0");
									}}
								>
									2小时
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("3");
										setMinutes("0");
										setSeconds("0");
									}}
								>
									3小时
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setHours("0");
										setMinutes("0");
										setSeconds("10");
									}}
								>
									10秒
								</Button>
							</div>
						</div>

						<Button
							onClick={handleStart}
							size="lg"
							className="w-full"
						>
							<Play className="w-5 h-5 mr-2" />
							开始倒计时
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
