"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowDownTrayIcon,
	ShareIcon,
	StarIcon,
	TrophyIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface Certificate {
	id: string;
	recipientName: string;
	projectTitle: string;
	awardName: string;
	eventTitle: string;
	awardLevel:
		| "FIRST"
		| "SECOND"
		| "THIRD"
		| "EXCELLENCE"
		| "PARTICIPATION"
		| "SPECIAL";
	awardCategory:
		| "GENERAL"
		| "TECHNICAL"
		| "CREATIVE"
		| "COMMERCIAL"
		| "SOCIAL"
		| "SPECIAL";
	issuedDate: string;
	organizationName?: string;
	description?: string;
	score?: number;
}

interface CertificateTemplateProps {
	certificate: Certificate;
	variant?: "default" | "compact" | "detailed";
	showActions?: boolean;
}

const awardLevelConfig = {
	FIRST: {
		label: "一等奖",
		color: "text-yellow-600",
		bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50",
		borderColor: "border-yellow-300",
		stars: 5,
		icon: "🥇",
	},
	SECOND: {
		label: "二等奖",
		color: "text-gray-600",
		bgColor: "bg-gradient-to-br from-gray-50 to-slate-50",
		borderColor: "border-gray-300",
		stars: 4,
		icon: "🥈",
	},
	THIRD: {
		label: "三等奖",
		color: "text-orange-600",
		bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
		borderColor: "border-orange-300",
		stars: 3,
		icon: "🥉",
	},
	EXCELLENCE: {
		label: "优秀奖",
		color: "text-blue-600",
		bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
		borderColor: "border-blue-300",
		stars: 3,
		icon: "⭐",
	},
	PARTICIPATION: {
		label: "参与奖",
		color: "text-green-600",
		bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
		borderColor: "border-green-300",
		stars: 2,
		icon: "🎖️",
	},
	SPECIAL: {
		label: "特殊奖",
		color: "text-purple-600",
		bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
		borderColor: "border-purple-300",
		stars: 4,
		icon: "🏆",
	},
};

const categoryConfig = {
	GENERAL: "综合奖项",
	TECHNICAL: "技术奖项",
	CREATIVE: "创意奖项",
	COMMERCIAL: "商业奖项",
	SOCIAL: "社会影响奖项",
	SPECIAL: "特殊奖项",
};

function StarRating({
	count,
	className = "",
}: { count: number; className?: string }) {
	return (
		<div className={`flex items-center gap-1 ${className}`}>
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i}>
					{i < count ? (
						<StarSolidIcon className="w-5 h-5 text-yellow-400" />
					) : (
						<StarIcon className="w-5 h-5 text-gray-300" />
					)}
				</div>
			))}
		</div>
	);
}

function DefaultTemplate({ certificate }: { certificate: Certificate }) {
	const config = awardLevelConfig[certificate.awardLevel];

	return (
		<div
			className={`relative p-8 rounded-2xl border-4 ${config.bgColor} ${config.borderColor} min-h-[500px]`}
		>
			{/* 背景装饰 */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute top-4 left-4 text-6xl">
					{config.icon}
				</div>
				<div className="absolute top-4 right-4 text-6xl">
					{config.icon}
				</div>
				<div className="absolute bottom-4 left-4 text-6xl">
					{config.icon}
				</div>
				<div className="absolute bottom-4 right-4 text-6xl">
					{config.icon}
				</div>
			</div>

			{/* 主要内容 */}
			<div className="relative z-10 text-center space-y-6">
				{/* 标题 */}
				<div className="space-y-2">
					<div className="text-4xl font-bold text-gray-800">
						电子荣誉证书
					</div>
					<div className="text-lg text-gray-600">
						Electronic Certificate of Honor
					</div>
				</div>

				{/* 分割线 */}
				<div className="flex items-center justify-center space-x-4">
					<div className="w-16 h-px bg-gray-400" />
					<TrophyIcon className={`w-8 h-8 ${config.color}`} />
					<div className="w-16 h-px bg-gray-400" />
				</div>

				{/* 获奖信息 */}
				<div className="space-y-4">
					<div className="text-2xl font-semibold text-gray-800">
						兹证明
					</div>

					<div className="text-3xl font-bold text-gray-900 border-b-2 border-dashed border-gray-300 pb-2 inline-block">
						{certificate.recipientName}
					</div>

					<div className="text-lg text-gray-700 space-y-2">
						<div>
							在「
							<span className="font-semibold text-gray-800">
								{certificate.eventTitle}
							</span>
							」活动中
						</div>
						<div>
							凭借作品「
							<span className="font-semibold text-gray-800">
								{certificate.projectTitle}
							</span>
							」
						</div>
						<div>荣获</div>
					</div>

					<div
						className={`text-4xl font-bold ${config.color} space-y-2`}
					>
						<div className="flex items-center justify-center gap-3">
							<span className="text-5xl">{config.icon}</span>
							<span>{config.label}</span>
						</div>
						<div className="text-xl font-medium text-gray-600">
							{certificate.awardName}
						</div>
					</div>

					{/* 星级评价 */}
					<StarRating
						count={config.stars}
						className="justify-center"
					/>

					{/* 分数显示 */}
					{certificate.score && (
						<div className="text-lg text-gray-600">
							评分：
							<span className="font-bold text-gray-800">
								{certificate.score.toFixed(1)}
							</span>{" "}
							分
						</div>
					)}

					{/* 类别 */}
					<div className="text-sm text-gray-500">
						{categoryConfig[certificate.awardCategory]}
					</div>
				</div>

				{/* 底部信息 */}
				<div className="pt-6 space-y-3 border-t border-gray-300">
					<div className="text-gray-600">
						{certificate.organizationName && (
							<div>颁发机构：{certificate.organizationName}</div>
						)}
						<div>
							颁发日期：
							{new Date(
								certificate.issuedDate,
							).toLocaleDateString("zh-CN")}
						</div>
					</div>

					{/* 官方印章区域 */}
					<div className="flex justify-between items-end">
						<div className="text-left">
							<div className="w-20 h-20 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 text-xs font-bold transform rotate-12">
								官方认证
							</div>
						</div>
						<div className="text-right text-sm text-gray-500">
							<div>
								证书编号：
								{certificate.id.slice(-8).toUpperCase()}
							</div>
							<div>HackathonWeekly 社区</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function CompactTemplate({ certificate }: { certificate: Certificate }) {
	const config = awardLevelConfig[certificate.awardLevel];

	return (
		<div
			className={`relative p-6 rounded-xl border-2 ${config.bgColor} ${config.borderColor} min-h-[300px]`}
		>
			<div className="flex items-center gap-6">
				{/* 左侧奖项图标 */}
				<div className="text-center">
					<div className="text-6xl mb-2">{config.icon}</div>
					<StarRating
						count={config.stars}
						className="justify-center"
					/>
				</div>

				{/* 右侧信息 */}
				<div className="flex-1 space-y-3">
					<div className="text-2xl font-bold text-gray-800">
						电子证书
					</div>

					<div className="space-y-2">
						<div className="text-lg">
							<span className="text-gray-600">获奖者：</span>
							<span className="font-semibold text-gray-800">
								{certificate.recipientName}
							</span>
						</div>

						<div className="text-lg">
							<span className="text-gray-600">作品：</span>
							<span className="font-semibold text-gray-800">
								{certificate.projectTitle}
							</span>
						</div>

						<div className="text-lg">
							<span className="text-gray-600">奖项：</span>
							<span className={`font-bold ${config.color}`}>
								{config.label}
							</span>
						</div>

						<div className="text-sm text-gray-500">
							{certificate.eventTitle} •{" "}
							{new Date(
								certificate.issuedDate,
							).toLocaleDateString("zh-CN")}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailedTemplate({ certificate }: { certificate: Certificate }) {
	const config = awardLevelConfig[certificate.awardLevel];

	return (
		<div
			className={`relative p-10 rounded-3xl border-4 ${config.bgColor} ${config.borderColor} min-h-[600px]`}
		>
			{/* 华丽的背景装饰 */}
			<div className="absolute inset-0 opacity-10">
				<svg
					className="w-full h-full"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
				>
					<defs>
						<pattern
							id="stars"
							x="0"
							y="0"
							width="20"
							height="20"
							patternUnits="userSpaceOnUse"
						>
							<circle cx="10" cy="10" r="1" fill="currentColor" />
						</pattern>
					</defs>
					<rect width="100" height="100" fill="url(#stars)" />
				</svg>
			</div>

			<div className="relative z-10 text-center space-y-8">
				{/* 顶部装饰 */}
				<div className="flex items-center justify-center space-x-4">
					<div className="w-24 h-px bg-gradient-to-r from-transparent to-gray-400" />
					<div className={`text-6xl ${config.color}`}>
						{config.icon}
					</div>
					<div className="w-24 h-px bg-gradient-to-l from-transparent to-gray-400" />
				</div>

				{/* 主标题 */}
				<div className="space-y-3">
					<div className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
						荣誉证书
					</div>
					<div className="text-xl text-gray-600 font-light">
						CERTIFICATE OF HONOR
					</div>
				</div>

				{/* 主要内容 */}
				<div className="space-y-6 py-8">
					<div className="text-xl text-gray-700">此证书授予</div>

					<div className="text-4xl font-bold text-gray-900 p-4 border-2 border-dashed border-gray-400 rounded-lg bg-white bg-opacity-50">
						{certificate.recipientName}
					</div>

					<div className="space-y-3 text-lg text-gray-700">
						<div>
							在「
							<span className="font-bold text-gray-800">
								{certificate.eventTitle}
							</span>
							」活动中表现卓越
						</div>
						<div>
							作品「
							<span className="font-bold text-gray-800">
								{certificate.projectTitle}
							</span>
							」获得认可
						</div>
						{certificate.description && (
							<div className="text-base text-gray-600 italic">
								"{certificate.description}"
							</div>
						)}
					</div>

					<div
						className={
							"space-y-4 p-6 rounded-2xl bg-white bg-opacity-30"
						}
					>
						<div className={`text-5xl font-bold ${config.color}`}>
							{config.label}
						</div>
						<div className="text-2xl font-semibold text-gray-700">
							{certificate.awardName}
						</div>
						<StarRating
							count={config.stars}
							className="justify-center scale-125"
						/>
						{certificate.score && (
							<div className="text-xl text-gray-600">
								最终评分：
								<span className="font-bold text-gray-800">
									{certificate.score.toFixed(1)}
								</span>{" "}
								/ 10.0
							</div>
						)}
					</div>
				</div>

				{/* 底部签名区 */}
				<div className="flex justify-between items-end pt-8 border-t-2 border-gray-300">
					<div className="text-left">
						<div className="w-24 h-24 rounded-full border-3 border-red-500 flex items-center justify-center text-red-500 text-sm font-bold transform rotate-12 bg-white">
							<div className="text-center">
								<div>官方</div>
								<div>认证</div>
							</div>
						</div>
						<div className="text-sm text-gray-500 mt-2">
							官方印章
						</div>
					</div>

					<div className="text-center">
						<div className="text-lg font-semibold text-gray-700">
							{certificate.organizationName ||
								"HackathonWeekly 社区"}
						</div>
						<div className="text-sm text-gray-500">
							{new Date(
								certificate.issuedDate,
							).toLocaleDateString("zh-CN", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</div>
					</div>

					<div className="text-right text-sm text-gray-500">
						<div>证书编号</div>
						<div className="font-mono font-bold">
							{certificate.id.slice(-12).toUpperCase()}
						</div>
						<div className="mt-2">扫码验证真伪</div>
						{/* 这里可以放二维码 */}
						<div className="w-16 h-16 bg-gray-200 rounded border mt-1 flex items-center justify-center text-xs">
							QR Code
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function CertificateTemplate({
	certificate,
	variant = "default",
	showActions = true,
}: CertificateTemplateProps) {
	const certificateRef = useRef<HTMLDivElement>(null);

	const downloadCertificate = async () => {
		if (!certificateRef.current) {
			return;
		}

		try {
			const canvas = await html2canvas(certificateRef.current, {
				scale: 2,
				backgroundColor: "#ffffff",
				useCORS: true,
			});

			const link = document.createElement("a");
			link.download = `certificate-${certificate.recipientName}-${certificate.awardName}.png`;
			link.href = canvas.toDataURL();
			link.click();

			toast.success("证书下载成功！");
		} catch (error) {
			console.error("Error downloading certificate:", error);
			toast.error("证书下载失败");
		}
	};

	const shareCertificate = async () => {
		if (!certificateRef.current) {
			return;
		}

		try {
			const canvas = await html2canvas(certificateRef.current, {
				scale: 2,
				backgroundColor: "#ffffff",
				useCORS: true,
			});

			canvas.toBlob(async (blob) => {
				if (blob && navigator.share) {
					const file = new File([blob], "certificate.png", {
						type: "image/png",
					});
					await navigator.share({
						title: `我获得了${certificate.awardName}！`,
						text: `在${certificate.eventTitle}中，我的作品"${certificate.projectTitle}"获得了${awardLevelConfig[certificate.awardLevel].label}！`,
						files: [file],
					});
				} else {
					// 回退到复制链接
					const url = window.location.href;
					await navigator.clipboard.writeText(url);
					toast.success("证书链接已复制到剪贴板！");
				}
			});
		} catch (error) {
			console.error("Error sharing certificate:", error);
			toast.error("分享失败");
		}
	};

	const renderTemplate = () => {
		switch (variant) {
			case "compact":
				return <CompactTemplate certificate={certificate} />;
			case "detailed":
				return <DetailedTemplate certificate={certificate} />;
			default:
				return <DefaultTemplate certificate={certificate} />;
		}
	};

	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<div ref={certificateRef}>{renderTemplate()}</div>

				{showActions && (
					<div className="p-4 bg-gray-50 border-t flex items-center justify-between">
						<div className="text-sm text-gray-600">
							证书ID: {certificate.id.slice(-8).toUpperCase()}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={shareCertificate}
							>
								<ShareIcon className="w-4 h-4 mr-2" />
								分享
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={downloadCertificate}
							>
								<ArrowDownTrayIcon className="w-4 h-4 mr-2" />
								下载
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
