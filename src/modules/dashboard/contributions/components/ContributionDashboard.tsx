"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Coins,
	Plus,
	History,
	Award,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	FileText,
	Info,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useSession } from "@/lib/auth/client";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface Contribution {
	id: string;
	type: string;
	category: string;
	description: string;
	cpValue: number;
	status: string;
	isAutomatic: boolean;
	sourceType?: string;
	sourceId?: string;
	evidence?: string;
	reviewNote?: string;
	reviewedBy?: string;
	reviewedAt?: string;
	createdAt: string;
	updatedAt: string;
	reviewer?: {
		id: string;
		name: string;
		image?: string;
	};
}

interface ContributionType {
	type: string;
	name: string;
	description: string;
	cpRange: string;
	defaultCp: number;
	category: string;
}

interface LevelInfo {
	currentLevel: number;
	nextLevel: number;
	currentLevelCp: number;
	nextLevelCp: number;
	progressPercent: number;
	levelName: string;
	nextLevelName: string;
}

const getStatusInfo = (t: any) => ({
	PENDING: {
		label: t("status.pending"),
		color: "bg-yellow-100 text-yellow-800",
		icon: Clock,
	},
	APPROVED: {
		label: t("status.approved"),
		color: "bg-green-100 text-green-800",
		icon: CheckCircle,
	},
	REJECTED: {
		label: t("status.rejected"),
		color: "bg-red-100 text-red-800",
		icon: XCircle,
	},
});

export function ContributionDashboard() {
	const { data: session } = useSession();
	const t = useTranslations("app.contributions");
	const [contributions, setContributions] = useState<Contribution[]>([]);
	const [contributionTypes, setContributionTypes] = useState<
		ContributionType[]
	>([]);
	const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
	const [totalCp, setTotalCp] = useState(0);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		type: "",
		category: "",
		description: "",
		requestedCp: 0,
		evidence: "",
	});

	// 获取贡献类型
	const fetchContributionTypes = async () => {
		try {
			const response = await fetch("/api/contributions/types");
			if (response.ok) {
				const data = await response.json();
				setContributionTypes(data.contributionTypes);
			}
		} catch (error) {
			console.error("获取贡献类型失败:", error);
		}
	};

	// 获取{t("contributionRecords")}
	const fetchContributions = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/contributions");
			if (response.ok) {
				const data = await response.json();
				setContributions(data.contributions || []);
				setLevelInfo(data.levelInfo);
				setTotalCp(data.totalCp || 0);
			}
		} catch (error) {
			console.error("获取贡献记录失败:", error);
		} finally {
			setLoading(false);
		}
	};

	// 提交贡献申报
	const handleSubmit = async () => {
		if (
			!formData.type ||
			!formData.category ||
			!formData.description ||
			formData.requestedCp <= 0
		) {
			toast.error(t("fillCompleteInfo"));
			return;
		}

		try {
			const response = await fetch("/api/contributions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success(t("submitSuccess"));
				setIsDialogOpen(false);
				setFormData({
					type: "",
					category: "",
					description: "",
					requestedCp: 0,
					evidence: "",
				});
				fetchContributions();
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || t("submitFailed"));
			}
		} catch (error) {
			console.error("提交贡献申报失败:", error);
			toast.error(t("networkError"));
		}
	};

	useEffect(() => {
		if (session?.user) {
			fetchContributionTypes();
			fetchContributions();
		}
	}, [session]);

	// 处理类型选择
	const handleTypeChange = (selectedType: string) => {
		const typeInfo = contributionTypes.find((t) => t.type === selectedType);
		if (typeInfo) {
			setFormData({
				...formData,
				type: selectedType,
				category: typeInfo.category,
				requestedCp: typeInfo.defaultCp, // 自动设置默认CP值
			});
		}
	};

	// {t("contributionRecords")}列表项
	const ContributionListItem = ({
		contribution,
	}: { contribution: Contribution }) => {
		const statusInfo =
			getStatusInfo(t)[
				contribution.status as keyof ReturnType<typeof getStatusInfo>
			];
		const StatusIcon = statusInfo?.icon || AlertCircle;
		const typeInfo = contributionTypes.find(
			(t) => t.type === contribution.type,
		);

		return (
			<div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
				<div className="flex items-start justify-between mb-3">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="outline" className="text-xs">
								{contribution.category}
							</Badge>
							<Badge
								variant="secondary"
								className={`text-xs ${statusInfo?.color || "bg-gray-100 text-gray-800"}`}
							>
								<StatusIcon className="w-3 h-3 mr-1" />
								{statusInfo?.label || contribution.status}
							</Badge>
							{contribution.isAutomatic && (
								<Badge
									variant="secondary"
									className="bg-blue-100 text-blue-800 text-xs"
								>
									{t("autoRecord")}
								</Badge>
							)}
						</div>
						<h3 className="font-semibold text-gray-900 mb-1">
							{typeInfo?.name || contribution.type}
						</h3>
						<p className="text-sm text-gray-600 mb-2">
							{contribution.description}
						</p>
					</div>
					<div className="flex flex-col items-end gap-2">
						<div className="flex items-center gap-1">
							<span className="text-sm text-gray-500">
								{t("contributionPoints")}
							</span>
							<div className="flex items-center gap-1 text-primary font-semibold">
								<Coins className="w-4 h-4" />
								<span>+{contribution.cpValue}</span>
							</div>
						</div>
						<div className="text-xs text-gray-500 text-right">
							{format(
								new Date(contribution.createdAt),
								"yyyy-MM-dd HH:mm",
							)}
						</div>
					</div>
				</div>

				{/* 详细信息 */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
					<div className="space-y-1">
						<div className="text-xs text-gray-500">创建时间</div>
						<div className="text-sm">
							{formatDistanceToNow(
								new Date(contribution.createdAt),
								{ addSuffix: true, locale: zhCN },
							)}
						</div>
					</div>

					{contribution.reviewedAt && (
						<div className="space-y-1">
							<div className="text-xs text-gray-500">
								审核时间
							</div>
							<div className="text-sm">
								{formatDistanceToNow(
									new Date(contribution.reviewedAt),
									{ addSuffix: true, locale: zhCN },
								)}
								{contribution.reviewer && (
									<span className="ml-2 text-gray-500">
										by {contribution.reviewer.name}
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* 证据链接 */}
				{contribution.evidence && (
					<div className="mt-3 pt-3 border-t border-gray-100">
						<div className="text-xs text-gray-500 mb-1">
							证据链接
						</div>
						<a
							href={contribution.evidence}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-blue-600 hover:underline break-all"
						>
							{contribution.evidence}
						</a>
					</div>
				)}

				{/* 审核反馈 */}
				{contribution.reviewNote && (
					<div className="mt-3 pt-3 border-t border-gray-100">
						<div className="text-xs text-gray-500 mb-1">
							审核反馈
						</div>
						<div className="text-sm bg-gray-50 p-3 rounded border">
							{contribution.reviewNote}
						</div>
					</div>
				)}
			</div>
		);
	};

	if (!session?.user) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						请先登录
					</h1>
					<p className="text-gray-600 mb-4">
						您需要登录后才能查看{t("contributionRecords")}
					</p>
					<Button asChild>
						<a href="/auth/signin">立即登录</a>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* 页头 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						{t("title")}
					</h1>
					<p className="text-muted-foreground mt-2">
						{t("subtitle")}
					</p>
				</div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							{t("declareContribution")}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>
								{t("declareContribution")}
							</DialogTitle>
							<DialogDescription>
								{t("dialogDescription")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="type">
									{t("contributionType")}
								</Label>
								<Select
									value={formData.type}
									onValueChange={handleTypeChange}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t("selectType")}
										/>
									</SelectTrigger>
									<SelectContent>
										{contributionTypes.map((type) => (
											<SelectItem
												key={type.type}
												value={type.type}
											>
												<div>
													<div className="font-medium">
														{type.name}
													</div>
													<div className="text-xs text-gray-500">
														{type.description}{" "}
														(参考CP: {type.cpRange},
														默认: {type.defaultCp})
													</div>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="description">详细描述</Label>
								<Textarea
									id="description"
									placeholder="详细描述您的贡献内容（至少10个字符）"
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									rows={4}
								/>
							</div>
							<div>
								<Label htmlFor="requestedCp">申请CP值</Label>
								<div className="text-xs text-muted-foreground mb-2">
									系统已根据贡献类型设置默认值，您可以根据实际贡献价值调整
								</div>
								<Input
									id="requestedCp"
									type="number"
									min="1"
									max="500"
									placeholder="根据贡献价值申请CP值"
									value={formData.requestedCp || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											requestedCp:
												Number.parseInt(
													e.target.value,
												) || 0,
										})
									}
								/>
							</div>
							<div>
								<Label htmlFor="evidence">
									证据链接（可选）
								</Label>
								<Input
									id="evidence"
									placeholder="提供相关证据链接，如文章、作品、活动页面等"
									value={formData.evidence}
									onChange={(e) =>
										setFormData({
											...formData,
											evidence: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
							>
								取消
							</Button>
							<Button onClick={handleSubmit}>提交申报</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* 内测提示 */}
			<Alert className="border-orange-200 bg-orange-50">
				<Info className="h-4 w-4 text-orange-600" />
				<AlertTitle className="text-orange-800">内测阶段</AlertTitle>
				<AlertDescription className="text-orange-700">
					贡献积分系统目前处于内测阶段，功能仍在完善中。内测期间的积分数据将不会保留，正式上线后将重置所有积分记录。感谢您的参与和反馈！
				</AlertDescription>
			</Alert>

			{/* 统计卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("totalPoints")}
						</CardTitle>
						<Coins className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalCp}</div>
						{levelInfo && (
							<p className="text-xs text-muted-foreground">
								{t("currentLevel", {
									level: levelInfo.levelName,
								})}
							</p>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("contributionRecords")}
						</CardTitle>
						<History className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{contributions.length}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("totalContributions")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("levelProgress")}
						</CardTitle>
						<Award className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{levelInfo ? (
							<div>
								<div className="text-2xl font-bold">
									L{levelInfo.currentLevel}
								</div>
								<Progress
									value={levelInfo.progressPercent}
									className="h-2 mt-2"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									距离{levelInfo.nextLevelName}还需{" "}
									{levelInfo.nextLevelCp -
										(levelInfo.currentLevelCp +
											totalCp)}{" "}
									CP
								</p>
							</div>
						) : (
							<div className="text-2xl font-bold">--</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* {t("contributionRecords")}列表 */}
			<Tabs defaultValue="all" className="space-y-6">
				<TabsList className="grid w-fit grid-cols-4">
					<TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
					<TabsTrigger value="PENDING">
						{t("tabs.pending")}
					</TabsTrigger>
					<TabsTrigger value="APPROVED">
						{t("tabs.approved")}
					</TabsTrigger>
					<TabsTrigger value="REJECTED">
						{t("tabs.rejected")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					{loading ? (
						<div className="space-y-4">
							{[1, 2, 3, 4, 5].map((i) => (
								<div
									key={i}
									className="border rounded-lg p-4 bg-white"
								>
									<div className="animate-pulse">
										<div className="flex justify-between items-start mb-3">
											<div className="space-y-2">
												<div className="h-4 bg-gray-200 rounded w-32" />
												<div className="h-3 bg-gray-200 rounded w-48" />
											</div>
											<div className="h-6 bg-gray-200 rounded w-16" />
										</div>
										<div className="h-3 bg-gray-200 rounded w-3/4" />
									</div>
								</div>
							))}
						</div>
					) : contributions.length > 0 ? (
						<div className="space-y-4">
							{contributions.map((contribution) => (
								<ContributionListItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								还没有{t("contributionRecords")}
							</h3>
							<p className="text-gray-600 mb-4">
								开始为社区贡献，获取您的第一个贡献点吧
							</p>
							<Button onClick={() => setIsDialogOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								{t("declareContribution")}
							</Button>
						</div>
					)}
				</TabsContent>

				{["PENDING", "APPROVED", "REJECTED"].map((status) => (
					<TabsContent
						key={status}
						value={status}
						className="space-y-4"
					>
						{contributions.filter((c) => c.status === status)
							.length > 0 ? (
							<div className="space-y-4">
								{contributions
									.filter((c) => c.status === status)
									.map((contribution) => (
										<ContributionListItem
											key={contribution.id}
											contribution={contribution}
										/>
									))}
							</div>
						) : (
							<div className="text-center py-12">
								<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									{t("noRecordsInStatus")}
								</h3>
								<p className="text-gray-600">
									{t("noRecordsInStatus")}
								</p>
							</div>
						)}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
