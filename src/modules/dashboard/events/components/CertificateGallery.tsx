"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
	TrophyIcon,
	MagnifyingGlassIcon,
	EyeIcon,
	CalendarIcon,
	TagIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { CertificateTemplate } from "./CertificateTemplate";
import { toast } from "sonner";

interface Certificate {
	id: string;
	awardedAt: string;
	certificateUrl?: string;
	certificateGenerated: boolean;
	score?: number;
	reason?: string;
	project: {
		id: string;
		title: string;
		description: string;
	};
	award: {
		id: string;
		name: string;
		level:
			| "FIRST"
			| "SECOND"
			| "THIRD"
			| "EXCELLENCE"
			| "PARTICIPATION"
			| "SPECIAL";
		category:
			| "GENERAL"
			| "TECHNICAL"
			| "CREATIVE"
			| "COMMERCIAL"
			| "SOCIAL"
			| "SPECIAL";
		organization?: {
			id: string;
			name: string;
			logo?: string;
		};
	};
	event?: {
		id: string;
		title: string;
	};
}

interface CertificateGalleryProps {
	userId?: string;
	eventId?: string;
	showActions?: boolean;
	compact?: boolean;
}

const awardLevelConfig = {
	FIRST: {
		label: "一等奖",
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
		borderColor: "border-yellow-300",
		icon: "🥇",
	},
	SECOND: {
		label: "二等奖",
		color: "text-gray-600",
		bgColor: "bg-gray-50",
		borderColor: "border-gray-300",
		icon: "🥈",
	},
	THIRD: {
		label: "三等奖",
		color: "text-orange-600",
		bgColor: "bg-orange-50",
		borderColor: "border-orange-300",
		icon: "🥉",
	},
	EXCELLENCE: {
		label: "优秀奖",
		color: "text-blue-600",
		bgColor: "bg-blue-50",
		borderColor: "border-blue-300",
		icon: "⭐",
	},
	PARTICIPATION: {
		label: "参与奖",
		color: "text-green-600",
		bgColor: "bg-green-50",
		borderColor: "border-green-300",
		icon: "🎖️",
	},
	SPECIAL: {
		label: "特殊奖",
		color: "text-purple-600",
		bgColor: "bg-purple-50",
		borderColor: "border-purple-300",
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

function CertificateCard({
	certificate,
	onView,
}: {
	certificate: Certificate;
	onView: () => void;
}) {
	const config = awardLevelConfig[certificate.award.level];

	return (
		<Card
			className={`overflow-hidden transition-all hover:shadow-lg ${config.bgColor} ${config.borderColor} border-2`}
		>
			<CardContent className="p-0">
				{/* 证书预览区域 */}
				<div
					className={`h-48 ${config.bgColor} relative overflow-hidden`}
				>
					<div className="absolute inset-0 flex items-center justify-center opacity-10">
						<div className="text-8xl">{config.icon}</div>
					</div>
					<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
						<div className="text-2xl font-bold text-gray-800 mb-2">
							电子证书
						</div>
						<div className={`text-3xl ${config.color} mb-2`}>
							{config.icon}
						</div>
						<div
							className={`text-lg font-semibold ${config.color}`}
						>
							{config.label}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							{certificate.award.name}
						</div>
					</div>
				</div>

				{/* 证书信息 */}
				<div className="p-4 bg-white">
					<div className="space-y-3">
						<div>
							<h3 className="font-semibold text-gray-900 truncate">
								{certificate.project.title}
							</h3>
							<p className="text-sm text-gray-600 line-clamp-2">
								{certificate.project.description}
							</p>
						</div>

						<div className="flex items-center gap-2 flex-wrap">
							<Badge variant="outline" className="text-xs">
								<TagIcon className="w-3 h-3 mr-1" />
								{categoryConfig[certificate.award.category]}
							</Badge>
							{certificate.event && (
								<Badge variant="secondary" className="text-xs">
									{certificate.event.title}
								</Badge>
							)}
						</div>

						{certificate.score && (
							<div className="flex items-center gap-1">
								<StarSolidIcon className="w-4 h-4 text-yellow-400" />
								<span className="text-sm font-medium">
									{certificate.score.toFixed(1)} 分
								</span>
							</div>
						)}

						<div className="flex items-center justify-between pt-2">
							<div className="flex items-center gap-1 text-xs text-gray-500">
								<CalendarIcon className="w-3 h-3" />
								{new Date(
									certificate.awardedAt,
								).toLocaleDateString("zh-CN")}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={onView}
							>
								<EyeIcon className="w-4 h-4 mr-1" />
								查看
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function CertificateGallery({
	userId,
	eventId,
	showActions = true,
	compact = false,
}: CertificateGalleryProps) {
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [levelFilter, setLevelFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [selectedCertificate, setSelectedCertificate] =
		useState<Certificate | null>(null);

	useEffect(() => {
		fetchCertificates();
	}, [userId, eventId]);

	const fetchCertificates = async () => {
		try {
			setLoading(true);
			let url = "/api/user/certificates";

			if (eventId) {
				url = `/api/events/${eventId}/awards`;
			}

			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json();
				setCertificates(data.data || []);
			} else {
				toast.error("获取证书列表失败");
			}
		} catch (error) {
			console.error("Error fetching certificates:", error);
			toast.error("获取证书列表失败");
		} finally {
			setLoading(false);
		}
	};

	const filteredCertificates = certificates.filter((cert) => {
		const matchesSearch =
			cert.project.title
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			cert.award.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(cert.event?.title
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ??
				false);

		const matchesLevel =
			levelFilter === "all" || cert.award.level === levelFilter;
		const matchesCategory =
			categoryFilter === "all" || cert.award.category === categoryFilter;

		return matchesSearch && matchesLevel && matchesCategory;
	});

	const convertToTemplateFormat = (cert: Certificate) => ({
		id: cert.id,
		recipientName: "获奖者", // 这里需要根据实际用户信息填充
		projectTitle: cert.project.title,
		awardName: cert.award.name,
		eventTitle: cert.event?.title || "HackathonWeekly 社区",
		awardLevel: cert.award.level,
		awardCategory: cert.award.category,
		issuedDate: cert.awardedAt,
		organizationName: cert.award.organization?.name,
		description: cert.reason,
		score: cert.score,
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">加载证书中...</p>
				</div>
			</div>
		);
	}

	if (certificates.length === 0) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<TrophyIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">暂无证书</h3>
					<p className="text-muted-foreground">
						{eventId
							? "该活动还没有颁发任何奖项"
							: "您还没有获得任何证书"}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* 搜索和筛选 */}
			{!compact && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrophyIcon className="w-5 h-5" />
							证书管理
						</CardTitle>
						<CardDescription>
							管理和查看您的电子证书
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col md:flex-row gap-4">
							<div className="flex-1">
								<div className="relative">
									<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										placeholder="搜索项目名称、奖项名称或活动..."
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="pl-10"
									/>
								</div>
							</div>
							<Select
								value={levelFilter}
								onValueChange={setLevelFilter}
							>
								<SelectTrigger className="w-full md:w-[150px]">
									<SelectValue placeholder="奖项等级" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										所有等级
									</SelectItem>
									<SelectItem value="FIRST">
										一等奖
									</SelectItem>
									<SelectItem value="SECOND">
										二等奖
									</SelectItem>
									<SelectItem value="THIRD">
										三等奖
									</SelectItem>
									<SelectItem value="EXCELLENCE">
										优秀奖
									</SelectItem>
									<SelectItem value="PARTICIPATION">
										参与奖
									</SelectItem>
									<SelectItem value="SPECIAL">
										特殊奖
									</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={categoryFilter}
								onValueChange={setCategoryFilter}
							>
								<SelectTrigger className="w-full md:w-[150px]">
									<SelectValue placeholder="奖项类别" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										所有类别
									</SelectItem>
									<SelectItem value="GENERAL">
										综合奖项
									</SelectItem>
									<SelectItem value="TECHNICAL">
										技术奖项
									</SelectItem>
									<SelectItem value="CREATIVE">
										创意奖项
									</SelectItem>
									<SelectItem value="COMMERCIAL">
										商业奖项
									</SelectItem>
									<SelectItem value="SOCIAL">
										社会影响
									</SelectItem>
									<SelectItem value="SPECIAL">
										特殊奖项
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 证书统计 */}
			{!compact && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4 text-center">
							<div className="text-2xl font-bold text-yellow-600">
								{
									certificates.filter(
										(c) => c.award.level === "FIRST",
									).length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								一等奖
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<div className="text-2xl font-bold text-gray-600">
								{
									certificates.filter(
										(c) => c.award.level === "SECOND",
									).length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								二等奖
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<div className="text-2xl font-bold text-orange-600">
								{
									certificates.filter(
										(c) => c.award.level === "THIRD",
									).length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								三等奖
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<div className="text-2xl font-bold text-blue-600">
								{
									certificates.filter((c) =>
										[
											"EXCELLENCE",
											"PARTICIPATION",
											"SPECIAL",
										].includes(c.award.level),
									).length
								}
							</div>
							<div className="text-sm text-muted-foreground">
								其他奖项
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* 证书列表 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredCertificates.map((certificate) => (
					<CertificateCard
						key={certificate.id}
						certificate={certificate}
						onView={() => setSelectedCertificate(certificate)}
					/>
				))}
			</div>

			{filteredCertificates.length === 0 && certificates.length > 0 && (
				<Card>
					<CardContent className="text-center py-12">
						<MagnifyingGlassIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">
							未找到匹配的证书
						</h3>
						<p className="text-muted-foreground">
							请尝试调整搜索条件或筛选器
						</p>
					</CardContent>
				</Card>
			)}

			{/* 证书详情对话框 */}
			<Dialog
				open={!!selectedCertificate}
				onOpenChange={(open) => !open && setSelectedCertificate(null)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>证书详情</DialogTitle>
					</DialogHeader>
					{selectedCertificate && (
						<div className="mt-4">
							<CertificateTemplate
								certificate={convertToTemplateFormat(
									selectedCertificate,
								)}
								variant="default"
								showActions={showActions}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
