"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Plus,
	Settings,
	Trophy,
	Users,
	Code,
	Lightbulb,
	Award,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@dashboard/auth/hooks/use-session";
import {
	withHackathonConfigDefaults,
	type NormalizedHackathonConfig,
	type HackathonVoting,
} from "@/features/hackathon/config";

interface HackathonManagementProps {
	eventId: string;
	event: any;
}

export function HackathonManagement({
	eventId,
	event,
}: HackathonManagementProps) {
	const { user } = useSession();
	const [config, setConfig] = useState<NormalizedHackathonConfig>(() =>
		withHackathonConfigDefaults(),
	);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("settings");
	const [controls, setControls] = useState({
		registrationOpen: true,
		submissionsOpen: true,
		votingOpen: true,
		// Whether gallery shows vote counts and live standings
		showVotesOnGallery: true,
	});
	const [controlsSaving, setControlsSaving] = useState(false);
	const toastsT = useTranslations(
		"dashboard.events.hackathonManagement.toasts",
	);

	const sendConfigUpdate = async (payload: NormalizedHackathonConfig) => {
		// NOTE: Server route is mounted at /api/events/:eventId/hackathon-config
		// The previous path mistakenly included an extra /hackathon segment.
		// Sanitize payload: remove incomplete resource items that would fail server-side URL validation
		const sanitizeResources = (
			p: NormalizedHackathonConfig["resources"],
		) => ({
			tutorials: (p?.tutorials ?? []).filter(
				(item) =>
					typeof item?.url === "string" && item.url.trim().length > 0,
			),
			tools: (p?.tools ?? []).filter(
				(item) =>
					typeof item?.url === "string" && item.url.trim().length > 0,
			),
			examples: (p?.examples ?? []).filter(
				(item) =>
					typeof item?.url === "string" && item.url.trim().length > 0,
			),
		});
		const bodyPayload: NormalizedHackathonConfig = {
			...payload,
			resources: sanitizeResources(payload.resources),
		};

		const response = await fetch(
			`/api/events/${eventId}/hackathon-config`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(bodyPayload),
			},
		);

		if (!response.ok) {
			let message = toastsT("saveFailed");
			// Try to extract a meaningful error message from JSON or text
			const ct = response.headers.get("content-type") ?? "";
			const cloned = response.clone();
			try {
				if (ct.includes("application/json")) {
					const errorBody: any = await response.json();
					const maybeMsg =
						errorBody?.message ||
						errorBody?.error?.message ||
						errorBody?.error ||
						errorBody?.errors?.[0]?.message;
					if (typeof maybeMsg === "string" && maybeMsg.trim()) {
						message = maybeMsg;
					}
				} else {
					const text = await response.text();
					const trimmed = text?.trim();
					if (trimmed) {
						// Clip very long responses to keep toasts tidy
						message = trimmed.slice(0, 200);
					}
				}
			} catch (error) {
				console.error("Failed to parse hackathon config error:", error);
				try {
					const text = await cloned.text();
					const trimmed = text?.trim();
					if (trimmed) {
						message = trimmed.slice(0, 200);
					}
				} catch {}
			}
			throw new Error(message);
		}
	};

	// Load existing config and controls
	useEffect(() => {
		const loadConfig = async () => {
			try {
				const response = await fetch(
					`/api/events/${eventId}/hackathon-config`,
				);
				if (response.ok) {
					const data = await response.json();
					setConfig(
						withHackathonConfigDefaults(data.data, {
							changedBy: user?.id,
						}),
					);
				}
			} catch (error) {
				console.error("Error loading hackathon config:", error);
			} finally {
				setLoading(false);
			}
		};

		const loadControls = async () => {
			try {
				const response = await fetch(`/api/events/${eventId}`);
				if (response.ok) {
					const data = await response.json();
					const eventData = data.data || data;
					setControls({
						registrationOpen: eventData.registrationOpen ?? true,
						submissionsOpen: eventData.submissionsOpen ?? true,
						votingOpen: eventData.votingOpen ?? true,
						showVotesOnGallery:
							eventData.showVotesOnGallery ?? true,
					});
				}
			} catch (error) {
				console.error("Error loading hackathon controls:", error);
			}
		};

		loadConfig();
		loadControls();
	}, [eventId, user?.id]);

	const saveConfig = async (payload: NormalizedHackathonConfig = config) => {
		setSaving(true);
		try {
			await sendConfigUpdate(payload);
			toast.success(toastsT("saveSuccess"));
		} catch (error) {
			console.error("Error saving config:", error);
			const msg =
				error instanceof Error && error.message
					? error.message
					: toastsT("saveFailed");
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	const saveControls = async (newControls: typeof controls) => {
		setControlsSaving(true);
		try {
			const response = await fetch(`/api/events/${eventId}/controls`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newControls),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message || "Failed to update controls",
				);
			}

			setControls(newControls);
			toast.success("黑客松控制状态已更新");
		} catch (error) {
			console.error("Error saving hackathon controls:", error);
			const msg =
				error instanceof Error && error.message
					? error.message
					: "更新控制状态失败";
			toast.error(msg);
		} finally {
			setControlsSaving(false);
		}
	};

	const handleControlChange = (
		key: keyof typeof controls,
		value: boolean,
	) => {
		const newControls = { ...controls, [key]: value };
		setControls(newControls);
		void saveControls(newControls);
	};

	const addAward = () => {
		const newAward = {
			id: `award-${Date.now()}`,
			name: "",
			description: "",
			awardType: "JUDGE" as const,
			maxWinners: 1,
		};
		setConfig((prev) => ({
			...prev,
			awards: [...prev.awards, newAward],
		}));
	};

	const updateAward = (index: number, field: string, value: any) => {
		setConfig((prev) => ({
			...prev,
			awards: prev.awards.map((award, i) =>
				i === index ? { ...award, [field]: value } : award,
			),
		}));
	};

	const removeAward = (index: number) => {
		setConfig((prev) => ({
			...prev,
			awards: prev.awards.filter((_, i) => i !== index),
		}));
	};

	const addResource = (type: "tutorials" | "tools" | "examples") => {
		const newResource =
			type === "tools"
				? { name: "", url: "", description: "" }
				: { title: "", url: "", description: "" };

		setConfig((prev) => ({
			...prev,
			resources: {
				...prev.resources,
				[type]: [...(prev.resources?.[type] || []), newResource],
			},
		}));
	};

	const updateResource = (
		type: "tutorials" | "tools" | "examples",
		index: number,
		field: string,
		value: string,
	) => {
		setConfig((prev) => ({
			...prev,
			resources: {
				...prev.resources,
				[type]:
					prev.resources?.[type]?.map((item, i) =>
						i === index ? { ...item, [field]: value } : item,
					) || [],
			},
		}));
	};

	const removeResource = (
		type: "tutorials" | "tools" | "examples",
		index: number,
	) => {
		setConfig((prev) => ({
			...prev,
			resources: {
				...prev.resources,
				[type]:
					prev.resources?.[type]?.filter((_, i) => i !== index) || [],
			},
		}));
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center">加载中...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Code className="w-6 h-6" />
						黑客松管理
					</h2>
					<p className="text-muted-foreground mt-1">
						配置黑客松活动的设置、奖项和投票规则
					</p>
				</div>
				<Button onClick={() => void saveConfig()} disabled={saving}>
					{saving ? "保存中..." : "保存配置"}
				</Button>
			</div>
			{/* 黑客松流程控制 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="w-5 h-5" />
						<span>流程控制</span>
					</CardTitle>
					<CardDescription>
						使用开关直接控制报名、提交、投票，无需阶段切换
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-6 md:grid-cols-3">
						{/* 报名开关 */}
						<div className="space-y-3 p-4 border rounded-lg bg-muted/50">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-sm">
										🎫 报名状态
									</p>
									<p className="text-xs text-muted-foreground">
										控制是否允许参赛者报名
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<Switch
									checked={controls.registrationOpen}
									onCheckedChange={(value) =>
										handleControlChange(
											"registrationOpen",
											value,
										)
									}
									disabled={controlsSaving}
								/>
								<span
									className={`text-sm font-medium ${
										controls.registrationOpen
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{controls.registrationOpen
										? "开启"
										: "关闭"}
								</span>
							</div>
						</div>

						{/* 提交开关 */}
						<div className="space-y-3 p-4 border rounded-lg bg-muted/50">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-sm">
										📤 作品提交
									</p>
									<p className="text-xs text-muted-foreground">
										控制是否允许提交作品
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<Switch
									checked={controls.submissionsOpen}
									onCheckedChange={(value) =>
										handleControlChange(
											"submissionsOpen",
											value,
										)
									}
									disabled={controlsSaving}
								/>
								<span
									className={`text-sm font-medium ${
										controls.submissionsOpen
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{controls.submissionsOpen ? "开启" : "关闭"}
								</span>
							</div>
						</div>

						{/* 投票开关 */}
						<div className="space-y-3 p-4 border rounded-lg bg-muted/50">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-sm">
										🗳️ 投票状态
									</p>
									<p className="text-xs text-muted-foreground">
										控制是否允许投票
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<Switch
									checked={controls.votingOpen}
									onCheckedChange={(value) =>
										handleControlChange("votingOpen", value)
									}
									disabled={controlsSaving}
								/>
								<span
									className={`text-sm font-medium ${
										controls.votingOpen
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{controls.votingOpen ? "开启" : "关闭"}
								</span>
							</div>

							{/* 作品广场显示票数与战况开关 */}
							<div className="flex items-start justify-between gap-3 pt-3 border-t mt-2">
								<div className="space-y-1">
									<p className="font-medium text-sm">
										📊 作品广场显示票数与实时战况
									</p>
									<p className="text-xs text-muted-foreground">
										关闭后，作品广场将隐藏各作品票数与右侧实时榜单；仍可投票
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										checked={controls.showVotesOnGallery}
										onCheckedChange={(value) =>
											handleControlChange(
												"showVotesOnGallery",
												value,
											)
										}
										disabled={controlsSaving}
									/>
									<span
										className={`text-sm font-medium ${controls.showVotesOnGallery ? "text-green-600" : "text-red-600"}`}
									>
										{controls.showVotesOnGallery
											? "显示"
											: "隐藏"}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="pt-4 border-t">
						<p className="text-sm text-muted-foreground">
							💡
							提示：直接使用开关即可控制报名、提交与投票，无需再切换阶段。
						</p>
					</div>
				</CardContent>
			</Card>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger
						value="settings"
						className="flex items-center gap-2"
					>
						<Settings className="w-4 h-4" />
						基本设置
					</TabsTrigger>
					<TabsTrigger
						value="voting"
						className="flex items-center gap-2"
					>
						<Trophy className="w-4 h-4" />
						投票设置
					</TabsTrigger>
					<TabsTrigger
						value="awards"
						className="flex items-center gap-2"
					>
						<Award className="w-4 h-4" />
						奖项设置
					</TabsTrigger>
					<TabsTrigger
						value="resources"
						className="flex items-center gap-2"
					>
						<Lightbulb className="w-4 h-4" />
						资源管理
					</TabsTrigger>
				</TabsList>

				{/* 基本设置 */}
				<TabsContent value="settings" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								团队设置
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="maxTeamSize">
										最大团队规模
									</Label>
									<Input
										id="maxTeamSize"
										type="number"
										min="1"
										max="20"
										value={config.settings.maxTeamSize}
										onChange={(e) =>
											setConfig((prev) => ({
												...prev,
												settings: {
													...prev.settings,
													maxTeamSize:
														Number.parseInt(
															e.target.value,
														) || 5,
												},
											}))
										}
									/>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label htmlFor="allowSolo">
											允许个人参赛
										</Label>
										<Switch
											id="allowSolo"
											checked={config.settings.allowSolo}
											onCheckedChange={(checked) =>
												setConfig((prev) => ({
													...prev,
													settings: {
														...prev.settings,
														allowSolo: checked,
													},
												}))
											}
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 投票设置 */}
				<TabsContent value="voting" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>投票规则</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="flex items-center justify-between">
									<Label htmlFor="allowPublicVoting">
										开启公众投票
									</Label>
									<Switch
										id="allowPublicVoting"
										checked={
											config.voting.allowPublicVoting
										}
										onCheckedChange={(checked) =>
											setConfig((prev) => ({
												...prev,
												voting: {
													...prev.voting,
													allowPublicVoting: checked,
												},
											}))
										}
									/>
								</div>
								<div>
									<Label htmlFor="publicVotingScope">
										公众投票范围
									</Label>
									<Select
										value={config.voting.publicVotingScope}
										onValueChange={(
											value:
												| "ALL"
												| "REGISTERED"
												| "PARTICIPANTS",
										) =>
											setConfig((prev) => ({
												...prev,
												voting: {
													...prev.voting,
													publicVotingScope:
														value as HackathonVoting["publicVotingScope"],
												},
											}))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">
												所有用户
											</SelectItem>
											<SelectItem value="REGISTERED">
												已注册用户
											</SelectItem>
											<SelectItem value="PARTICIPANTS">
												参赛者
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 奖项设置 */}
				<TabsContent value="awards" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>奖项设置</CardTitle>
								<Button onClick={addAward} size="sm">
									<Plus className="w-4 h-4 mr-2" />
									添加奖项
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{config.awards.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									还没有设置奖项，点击"添加奖项"开始配置
								</div>
							) : (
								<div className="space-y-4">
									{config.awards.map((award, index) => (
										<div
											key={award.id}
											className="border rounded-lg p-4 space-y-4"
										>
											<div className="flex justify-between items-start">
												<Badge
													variant={
														award.awardType ===
														"JUDGE"
															? "default"
															: "secondary"
													}
												>
													{award.awardType === "JUDGE"
														? "专家评审奖"
														: "公众投票奖"}
												</Badge>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														removeAward(index)
													}
												>
													删除
												</Button>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label>奖项名称</Label>
													<Input
														value={award.name}
														onChange={(e) =>
															updateAward(
																index,
																"name",
																e.target.value,
															)
														}
														placeholder="如：最佳创意奖"
													/>
												</div>
												<div>
													<Label>获奖数</Label>
													<Input
														type="number"
														min="1"
														value={award.maxWinners}
														onChange={(e) =>
															updateAward(
																index,
																"maxWinners",
																Number.parseInt(
																	e.target
																		.value,
																) || 1,
															)
														}
													/>
												</div>
											</div>
											<div>
												<Label>奖项类型</Label>
												<Select
													value={award.awardType}
													onValueChange={(value) =>
														updateAward(
															index,
															"awardType",
															value,
														)
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="JUDGE">
															专家评审奖
														</SelectItem>
														<SelectItem value="PUBLIC">
															公众投票奖
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label>奖项描述</Label>
												<Textarea
													value={award.description}
													onChange={(e) =>
														updateAward(
															index,
															"description",
															e.target.value,
														)
													}
													placeholder="描述获奖标准和奖品..."
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* 资源管理 */}
				<TabsContent value="resources" className="space-y-6">
					{["tutorials", "tools", "examples"].map((type) => (
						<Card key={type}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>
										{type === "tutorials" && "教程资源"}
										{type === "tools" && "开发工具"}
										{type === "examples" && "示例项目"}
									</CardTitle>
									<Button
										onClick={() => addResource(type as any)}
										size="sm"
									>
										<Plus className="w-4 h-4 mr-2" />
										添加
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								{!config.resources?.[
									type as keyof typeof config.resources
								] ||
								config.resources?.[
									type as keyof typeof config.resources
								]?.length === 0 ? (
									<div className="text-center py-4 text-muted-foreground">
										还没有添加
										{type === "tutorials"
											? "教程"
											: type === "tools"
												? "工具"
												: "示例"}
									</div>
								) : (
									<div className="space-y-4">
										{config.resources[
											type as keyof typeof config.resources
										]?.map((item: any, index: number) => (
											<div
												key={index}
												className="border rounded-lg p-4 space-y-4"
											>
												<div className="flex justify-end">
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															removeResource(
																type as any,
																index,
															)
														}
													>
														删除
													</Button>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<Label>
															{type === "tools"
																? "工具名称"
																: "标题"}
														</Label>
														<Input
															value={
																type === "tools"
																	? item.name
																	: item.title
															}
															onChange={(e) =>
																updateResource(
																	type as any,
																	index,
																	type ===
																		"tools"
																		? "name"
																		: "title",
																	e.target
																		.value,
																)
															}
														/>
													</div>
													<div>
														<Label>链接</Label>
														<Input
															value={item.url}
															onChange={(e) =>
																updateResource(
																	type as any,
																	index,
																	"url",
																	e.target
																		.value,
																)
															}
															placeholder="https://..."
														/>
													</div>
												</div>
												<div>
													<Label>描述</Label>
													<Textarea
														value={
															item.description ||
															""
														}
														onChange={(e) =>
															updateResource(
																type as any,
																index,
																"description",
																e.target.value,
															)
														}
													/>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</TabsContent>
			</Tabs>
		</div>
	);
}
