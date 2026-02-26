"use client";

import { useSession } from "@community/lib-client/auth/client";
import { Alert, AlertDescription, AlertTitle } from "@community/ui/ui/alert";
import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { Progress } from "@community/ui/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { Textarea } from "@community/ui/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	AlertCircle,
	Award,
	CheckCircle,
	Clock,
	Coins,
	FileText,
	History,
	Info,
	Plus,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
				requestedCp: typeInfo.defaultCp, // 自动设置默认积分
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
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 dark:bg-card dark:border-border">
				<div className="p-3">
					<div className="flex items-start justify-between mb-2">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
								<span
									className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight ${statusInfo?.color || "bg-gray-100 text-gray-800 dark:bg-[#1F1F1F] dark:text-muted-foreground"}`}
								>
									<StatusIcon className="w-3 h-3" />
									{statusInfo?.label || contribution.status}
								</span>
								{contribution.isAutomatic && (
									<span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-tight border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
										{t("autoRecord")}
									</span>
								)}
								<span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-tight border border-gray-200 dark:bg-[#1F1F1F] dark:text-muted-foreground dark:border-border">
									{contribution.category}
								</span>
							</div>
							<h3 className="font-brand text-sm font-bold leading-tight text-foreground line-clamp-1 mb-1">
								{typeInfo?.name || contribution.type}
							</h3>
							<p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed line-clamp-2">
								{contribution.description}
							</p>
						</div>
						<div className="flex flex-col items-end gap-1 ml-3 shrink-0">
							<div className="flex items-center gap-1 text-foreground font-bold text-sm">
								<Coins className="w-3.5 h-3.5" />
								<span>+{contribution.cpValue}</span>
							</div>
						</div>
					</div>

					{/* Meta info */}
					<div className="text-[11px] text-muted-foreground font-mono mt-2 pt-2 border-t border-gray-50 dark:border-border">
						{format(
							new Date(contribution.createdAt),
							"yyyy-MM-dd HH:mm",
						)}
						{contribution.reviewedAt && contribution.reviewer && (
							<span className="ml-2">
								· 审核于{" "}
								{formatDistanceToNow(
									new Date(contribution.reviewedAt),
									{ addSuffix: true, locale: zhCN },
								)}
							</span>
						)}
					</div>

					{/* 证据链接 */}
					{contribution.evidence && (
						<div className="mt-2 pt-2 border-t border-gray-50 dark:border-border">
							<div className="text-[10px] text-gray-400 dark:text-muted-foreground mb-1">
								证据链接
							</div>
							<a
								href={contribution.evidence}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
							>
								{contribution.evidence}
							</a>
						</div>
					)}

					{/* 审核反馈 */}
					{contribution.reviewNote && (
						<div className="mt-2 pt-2 border-t border-gray-50 dark:border-border">
							<div className="text-[10px] text-gray-400 dark:text-muted-foreground mb-1">
								审核反馈
							</div>
							<div className="text-xs bg-gray-50 dark:bg-[#1F1F1F] p-2 rounded border border-gray-100 dark:border-border text-gray-700 dark:text-muted-foreground">
								{contribution.reviewNote}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	if (!session?.user) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-foreground mb-2">
						请先登录
					</h1>
					<p className="text-muted-foreground mb-4">
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
		<div className="space-y-5">
			{/* 页头 */}
			<div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end">
				<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
					{t("title")}
				</h1>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button className="w-full md:w-auto bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200">
							<Plus className="w-3.5 h-3.5 mr-1.5" />
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
													<div className="text-xs text-muted-foreground">
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
								<Label htmlFor="requestedCp">申请积分</Label>
								<div className="text-xs text-muted-foreground mb-2">
									系统已根据贡献类型设置默认值，您可以根据实际贡献价值调整
								</div>
								<Input
									id="requestedCp"
									type="number"
									min="1"
									max="500"
									placeholder="根据贡献价值申请积分"
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
			<Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
				<Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
				<AlertTitle className="text-orange-800 dark:text-orange-400">
					内测阶段
				</AlertTitle>
				<AlertDescription className="text-orange-700 dark:text-orange-300">
					贡献积分系统目前处于内测阶段，功能仍在完善中。内测期间的积分数据将不会保留，正式上线后将重置所有积分记录。感谢您的参与和反馈！
				</AlertDescription>
			</Alert>

			{/* 统计卡片 */}
			<div className="grid grid-cols-3 gap-2 sm:gap-4">
				<div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 dark:bg-card dark:border-border">
					<div className="flex items-center justify-between mb-1 sm:mb-2">
						<span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
							{t("totalPoints")}
						</span>
						<Coins className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-muted-foreground" />
					</div>
					<div className="font-brand text-xl sm:text-2xl font-bold text-foreground">
						{totalCp}
					</div>
					{levelInfo && (
						<p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
							{t("currentLevel", {
								level: levelInfo.levelName,
							})}
						</p>
					)}
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 dark:bg-card dark:border-border">
					<div className="flex items-center justify-between mb-1 sm:mb-2">
						<span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
							{t("contributionRecords")}
						</span>
						<History className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-muted-foreground" />
					</div>
					<div className="font-brand text-xl sm:text-2xl font-bold text-foreground">
						{contributions.length}
					</div>
					<p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
						{t("totalContributions")}
					</p>
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 dark:bg-card dark:border-border">
					<div className="flex items-center justify-between mb-1 sm:mb-2">
						<span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
							{t("levelProgress")}
						</span>
						<Award className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-muted-foreground" />
					</div>
					{levelInfo ? (
						<div>
							<div className="font-brand text-s sm:text-2xl font-bold text-foreground">
								L{levelInfo.currentLevel}
							</div>
							<Progress
								value={levelInfo.progressPercent}
								className="h-1 sm:h-1.5 mt-1.5 sm:mt-2"
							/>
							<p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
								<span className="hidden sm:inline">
									距离{levelInfo.nextLevelName}还需{" "}
								</span>
								<span className="sm:hidden">还需 </span>
								{levelInfo.nextLevelCp -
									(levelInfo.currentLevelCp + totalCp)}{" "}
								积分
							</p>
						</div>
					) : (
						<div className="font-brand text-xl sm:text-2xl font-bold text-foreground">
							--
						</div>
					)}
				</div>
			</div>

			{/* {t("contributionRecords")}列表 */}
			<Tabs defaultValue="all" className="space-y-4">
				<div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 text-sm bg-gray-100/50 dark:bg-[#1F1F1F] p-1 rounded-lg w-full sm:w-fit touch-manipulation">
					<TabsList className="bg-transparent p-0 h-auto w-full sm:w-auto flex">
						<TabsTrigger
							value="all"
							className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-[#141414] text-muted-foreground data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md font-bold text-xs data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[#262626]"
						>
							{t("tabs.all")}
						</TabsTrigger>
						<TabsTrigger
							value="PENDING"
							className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-[#141414] text-muted-foreground data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md font-bold text-xs data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[#262626]"
						>
							{t("tabs.pending")}
						</TabsTrigger>
						<TabsTrigger
							value="APPROVED"
							className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-[#141414] text-muted-foreground data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md font-bold text-xs data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[#262626]"
						>
							{t("tabs.approved")}
						</TabsTrigger>
						<TabsTrigger
							value="REJECTED"
							className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-[#141414] text-muted-foreground data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md font-bold text-xs data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[#262626]"
						>
							{t("tabs.rejected")}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="all" className="space-y-3 mt-0">
					{loading ? (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="bg-card rounded-lg border border-border p-3"
								>
									<div className="animate-pulse">
										<div className="flex justify-between items-start mb-2">
											<div className="space-y-2 flex-1">
												<div className="h-4 bg-accent rounded w-24" />
												<div className="h-3 bg-accent rounded w-48" />
											</div>
											<div className="h-5 bg-accent rounded w-12" />
										</div>
									</div>
								</div>
							))}
						</div>
					) : contributions.length > 0 ? (
						<div className="space-y-3">
							{contributions.map((contribution) => (
								<ContributionListItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-8 bg-card rounded-lg border border-border">
							<History className="w-12 h-12 text-gray-400 dark:text-muted-foreground mx-auto mb-3" />
							<h3 className="text-sm font-bold text-foreground mb-1">
								还没有{t("contributionRecords")}
							</h3>
							<p className="text-xs text-muted-foreground mb-3">
								开始为社区贡献，获取您的第一个贡献点吧
							</p>
							<Button
								onClick={() => setIsDialogOpen(true)}
								className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
							>
								<Plus className="w-3.5 h-3.5 mr-1.5" />
								{t("declareContribution")}
							</Button>
						</div>
					)}
				</TabsContent>

				{["PENDING", "APPROVED", "REJECTED"].map((status) => (
					<TabsContent
						key={status}
						value={status}
						className="space-y-3 mt-0"
					>
						{contributions.filter((c) => c.status === status)
							.length > 0 ? (
							<div className="space-y-3">
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
							<div className="text-center py-8 bg-card rounded-lg border border-border">
								<FileText className="w-12 h-12 text-gray-400 dark:text-muted-foreground mx-auto mb-3" />
								<h3 className="text-sm font-bold text-foreground mb-1">
									{t("noRecordsInStatus")}
								</h3>
								<p className="text-xs text-muted-foreground">
									此状态下还没有贡献记录
								</p>
							</div>
						)}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
