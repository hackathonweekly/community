"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import { Input } from "@community/ui/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Label } from "@community/ui/ui/label";
import { Textarea } from "@community/ui/ui/textarea";
import {
	AwardIcon as CertificateIcon,
	Search,
	Trophy,
	Calendar,
	Eye,
	Trash2,
	Plus,
	ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Certificate {
	id: string;
	awardedAt: string;
	reason: string | null;
	score: number | null;
	certificateUrl: string | null;
	certificateGenerated: boolean;
	project: {
		id: string;
		title: string;
		user: {
			id: string;
			name: string | null;
			username: string | null;
			image: string | null;
		};
	};
	award: {
		id: string;
		name: string;
		description: string;
		level: string;
		category: string;
	};
	event: {
		id: string;
		title: string;
	} | null;
	awarder: {
		id: string;
		name: string | null;
	};
}

interface Award {
	id: string;
	name: string;
	description: string;
	level: string;
	category: string;
}

interface Project {
	id: string;
	title: string;
	user: {
		id: string;
		name: string | null;
		username: string | null;
	};
}

interface Event {
	id: string;
	title: string;
}

const NO_EVENT_VALUE = "__no_event__";

type CertificateCreateForm = {
	projectId: string;
	awardId: string;
	eventId?: string;
	reason: string;
	score: string;
};

export function CertificateManagementCenter() {
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const [awards, setAwards] = useState<Award[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterLevel, setFilterLevel] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [filterGenerated, setFilterGenerated] = useState<string>("all");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// 创建证书表单状态
	const [createForm, setCreateForm] = useState<CertificateCreateForm>({
		projectId: "",
		awardId: "",
		eventId: undefined,
		reason: "",
		score: "",
	});

	useEffect(() => {
		fetchCertificates();
		fetchAwards();
		fetchProjects();
		fetchEvents();
	}, []);

	const fetchCertificates = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/super-admin/certificates");
			if (response.ok) {
				const data = await response.json();
				setCertificates(data.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch certificates:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchAwards = async () => {
		try {
			const response = await fetch("/api/badges");
			if (response.ok) {
				const data = await response.json();
				setAwards(data.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch awards:", error);
		}
	};

	const fetchProjects = async () => {
		try {
			const response = await fetch("/api/super-admin/projects");
			if (response.ok) {
				const data = await response.json();
				setProjects(data.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch projects:", error);
		}
	};

	const fetchEvents = async () => {
		try {
			const response = await fetch("/api/super-admin/events");
			if (response.ok) {
				const data = await response.json();
				setEvents(data.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch events:", error);
		}
	};

	const handleCreateCertificate = async () => {
		try {
			const payload = {
				awardId: createForm.awardId,
				eventId:
					createForm.eventId && createForm.eventId !== NO_EVENT_VALUE
						? createForm.eventId
						: undefined,
				reason: createForm.reason || undefined,
				score: createForm.score
					? Number.parseFloat(createForm.score)
					: undefined,
			};

			const response = await fetch(
				`/api/certificates/projects/${createForm.projectId}/awards`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			);

			if (response.ok) {
				await fetchCertificates();
				setIsCreateDialogOpen(false);
				setCreateForm({
					projectId: "",
					awardId: "",
					eventId: undefined,
					reason: "",
					score: "",
				});
			} else {
				const error = await response.json();
				alert(`创建失败: ${error.error}`);
			}
		} catch (error) {
			console.error("Failed to create certificate:", error);
			alert("创建失败");
		}
	};

	const handleDeleteCertificate = async (certificateId: string) => {
		if (!confirm("确定要删除这个获奖证书吗？")) {
			return;
		}

		try {
			const response = await fetch(`/api/certificates/${certificateId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				await fetchCertificates();
			} else {
				const error = await response.json();
				alert(`删除失败: ${error.error}`);
			}
		} catch (error) {
			console.error("Failed to delete certificate:", error);
			alert("删除失败");
		}
	};

	const filteredCertificates = certificates.filter((certificate) => {
		const matchesSearch =
			certificate.project.title
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			certificate.project.user.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			certificate.award.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesLevel =
			filterLevel === "all" || certificate.award.level === filterLevel;
		const matchesCategory =
			filterCategory === "all" ||
			certificate.award.category === filterCategory;
		const matchesGenerated =
			filterGenerated === "all" ||
			(filterGenerated === "generated" &&
				certificate.certificateGenerated) ||
			(filterGenerated === "not_generated" &&
				!certificate.certificateGenerated);

		return (
			matchesSearch && matchesLevel && matchesCategory && matchesGenerated
		);
	});

	const getLevelBadgeVariant = (level: string) => {
		switch (level) {
			case "GOLD":
				return "default";
			case "SILVER":
				return "secondary";
			case "BRONZE":
				return "outline";
			default:
				return "outline";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "HACKATHON":
				return "text-blue-600";
			case "CONTRIBUTION":
				return "text-green-600";
			case "COMMUNITY":
				return "text-purple-600";
			case "SPECIAL":
				return "text-orange-600";
			default:
				return "text-muted-foreground";
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-64 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">获奖证书管理</h1>
					<p className="text-muted-foreground mt-2">
						管理所有用户的获奖证书
					</p>
				</div>
				<Dialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							颁发证书
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>颁发获奖证书</DialogTitle>
							<DialogDescription>
								为作品颁发奖项和证书
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="project">作品</Label>
								<Select
									value={createForm.projectId}
									onValueChange={(value) =>
										setCreateForm((prev) => ({
											...prev,
											projectId: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择作品" />
									</SelectTrigger>
									<SelectContent>
										{projects.map((project) => (
											<SelectItem
												key={project.id}
												value={project.id}
											>
												{project.title} -{" "}
												{project.user.name ||
													project.user.username}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="award">奖项</Label>
								<Select
									value={createForm.awardId}
									onValueChange={(value) =>
										setCreateForm((prev) => ({
											...prev,
											awardId: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择奖项" />
									</SelectTrigger>
									<SelectContent>
										{awards.map((award) => (
											<SelectItem
												key={award.id}
												value={award.id}
											>
												{award.name} ({award.level})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="event">关联活动（可选）</Label>
								<Select
									value={createForm.eventId ?? undefined}
									onValueChange={(value) =>
										setCreateForm((prev) => ({
											...prev,
											eventId: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择活动" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={NO_EVENT_VALUE}>
											无关联活动
										</SelectItem>
										{events.map((event) => (
											<SelectItem
												key={event.id}
												value={event.id}
											>
												{event.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="reason">获奖理由（可选）</Label>
								<Textarea
									id="reason"
									placeholder="输入获奖理由..."
									value={createForm.reason}
									onChange={(e) =>
										setCreateForm((prev) => ({
											...prev,
											reason: e.target.value,
										}))
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="score">
									评分（可选，0-10分）
								</Label>
								<Input
									id="score"
									type="number"
									min="0"
									max="10"
									step="0.1"
									placeholder="0.0"
									value={createForm.score}
									onChange={(e) =>
										setCreateForm((prev) => ({
											...prev,
											score: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={handleCreateCertificate}
								disabled={
									!createForm.projectId || !createForm.awardId
								}
							>
								颁发证书
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<CertificateIcon className="w-5 h-5" />
						<span>证书列表</span>
					</CardTitle>
					<CardDescription>
						总共 {certificates.length} 个证书，已生成{" "}
						{
							certificates.filter((c) => c.certificateGenerated)
								.length
						}{" "}
						个
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* 搜索和筛选 */}
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<Input
								placeholder="搜索作品、用户或奖项..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<div className="flex gap-2">
							<Select
								value={filterLevel}
								onValueChange={setFilterLevel}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="奖项级别" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										所有级别
									</SelectItem>
									<SelectItem value="GOLD">金奖</SelectItem>
									<SelectItem value="SILVER">银奖</SelectItem>
									<SelectItem value="BRONZE">铜奖</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={filterCategory}
								onValueChange={setFilterCategory}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="奖项类别" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										所有类别
									</SelectItem>
									<SelectItem value="HACKATHON">
										黑客松
									</SelectItem>
									<SelectItem value="CONTRIBUTION">
										贡献
									</SelectItem>
									<SelectItem value="COMMUNITY">
										社区
									</SelectItem>
									<SelectItem value="SPECIAL">
										特殊
									</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={filterGenerated}
								onValueChange={setFilterGenerated}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="生成状态" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全部</SelectItem>
									<SelectItem value="generated">
										已生成
									</SelectItem>
									<SelectItem value="not_generated">
										未生成
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* 证书表格 */}
					<div className="border rounded-lg">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>作品信息</TableHead>
									<TableHead>获奖用户</TableHead>
									<TableHead>奖项</TableHead>
									<TableHead>关联活动</TableHead>
									<TableHead>颁发时间</TableHead>
									<TableHead>证书状态</TableHead>
									<TableHead>操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCertificates.map((certificate) => (
									<TableRow key={certificate.id}>
										<TableCell>
											<div className="space-y-1">
												<div className="font-medium">
													{certificate.project.title}
												</div>
												<div className="text-sm text-muted-foreground">
													{certificate.reason &&
														`获奖理由: ${certificate.reason}`}
													{certificate.score &&
														` | 评分: ${certificate.score}/10`}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div>
													<div className="font-medium">
														{certificate.project
															.user.name ||
															certificate.project
																.user.username}
													</div>
													<div className="text-sm text-muted-foreground">
														@
														{
															certificate.project
																.user.username
														}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												<div className="flex items-center space-x-2">
													<Trophy
														className={`w-4 h-4 ${getCategoryColor(certificate.award.category)}`}
													/>
													<span className="font-medium">
														{certificate.award.name}
													</span>
												</div>
												<Badge
													variant={getLevelBadgeVariant(
														certificate.award.level,
													)}
												>
													{certificate.award.level}
												</Badge>
											</div>
										</TableCell>
										<TableCell>
											{certificate.event ? (
												<div className="flex items-center space-x-2">
													<Calendar className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm">
														{
															certificate.event
																.title
														}
													</span>
												</div>
											) : (
												<span className="text-muted-foreground text-sm">
													无关联活动
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{format(
													new Date(
														certificate.awardedAt,
													),
													"yyyy-MM-dd HH:mm",
													{ locale: zhCN },
												)}
											</div>
											<div className="text-xs text-muted-foreground">
												颁发者:{" "}
												{certificate.awarder.name}
											</div>
										</TableCell>
										<TableCell>
											{certificate.certificateGenerated ? (
												<div className="flex items-center space-x-2">
													<Badge
														variant="default"
														className="bg-green-100 text-green-800"
													>
														已生成
													</Badge>
													{certificate.certificateUrl && (
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																window.open(
																	certificate.certificateUrl!,
																	"_blank",
																)
															}
														>
															<ExternalLink className="w-4 h-4" />
														</Button>
													)}
												</div>
											) : (
												<Badge variant="secondary">
													未生成
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														window.open(
															`/certificates/${certificate.id}`,
															"_blank",
														)
													}
												>
													<Eye className="w-4 h-4" />
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														handleDeleteCertificate(
															certificate.id,
														)
													}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{filteredCertificates.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							<CertificateIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>没有找到符合条件的证书</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
