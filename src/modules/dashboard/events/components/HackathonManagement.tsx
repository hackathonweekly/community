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
	Flag,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@dashboard/auth/hooks/use-session";
import {
	withHackathonConfigDefaults,
	HACKATHON_STAGE_VALUES,
	type HackathonStage,
	type NormalizedHackathonConfig,
	type HackathonVoting,
} from "@/features/hackathon/config";
import { cn } from "@/lib/utils";

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
	const [stageSaving, setStageSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("settings");
	const toastsT = useTranslations(
		"dashboard.events.hackathonManagement.toasts",
	);
	const stageT = useTranslations(
		"dashboard.events.hackathonManagement.stage",
	);
	const eventsT = useTranslations("events");

	const stageOrder = HACKATHON_STAGE_VALUES;

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

	// Load existing config
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

		loadConfig();
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

	const formatStageLabel = (stage: HackathonStage) =>
		eventsT(`hackathon.phases.${stage.toLowerCase()}`);

	const updateStage = async (nextStage: HackathonStage) => {
		if (config.stage.current === nextStage || stageSaving) {
			return;
		}

		setStageSaving(true);
		const previousConfig = config;
		const now = new Date().toISOString();
		const history = Array.isArray(config.stage.history)
			? [...config.stage.history]
			: [];
		const lastEntry = history[history.length - 1];
		const nextHistoryEntry = {
			stage: nextStage,
			changedAt: now,
			changedBy: user?.id,
		};

		const updatedHistory =
			lastEntry && lastEntry.stage === nextStage
				? [
						...history.slice(0, -1),
						{ ...lastEntry, ...nextHistoryEntry },
					]
				: [...history, nextHistoryEntry];

		const updatedConfig: NormalizedHackathonConfig = {
			...config,
			stage: {
				current: nextStage,
				lastUpdatedAt: now,
				lastUpdatedBy: user?.id,
				history: updatedHistory,
			},
		};

		setConfig(updatedConfig);

		try {
			await sendConfigUpdate(updatedConfig);
			toast.success(
				stageT("updateSuccess", {
					stage: formatStageLabel(nextStage),
				}),
			);
		} catch (error) {
			console.error("Failed to update hackathon stage:", error);
			setConfig(previousConfig);
			const msg =
				error instanceof Error && error.message
					? error.message
					: stageT("updateFailed");
			toast.error(msg);
		} finally {
			setStageSaving(false);
		}
	};

	const currentStageIndex = stageOrder.findIndex(
		(stage) => stage === config.stage.current,
	);
	const previousStage =
		currentStageIndex > 0 ? stageOrder[currentStageIndex - 1] : undefined;
	const nextStage =
		currentStageIndex < stageOrder.length - 1
			? stageOrder[currentStageIndex + 1]
			: undefined;
	const stageHistory = [...(config.stage.history ?? [])].slice(-10).reverse();
	const lastUpdatedAt =
		config.stage.lastUpdatedAt || stageHistory[0]?.changedAt || null;

	const handleStageSelect = (value: string) =>
		updateStage(value as HackathonStage);

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
					<div className="mt-2 flex items-center gap-2">
						<Badge variant="outline" className="text-xs">
							{stageT("currentStageLabel", {
								stage: formatStageLabel(config.stage.current),
							})}
						</Badge>
					</div>
				</div>
				<Button onClick={() => void saveConfig()} disabled={saving}>
					{saving ? "保存中..." : "保存配置"}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Flag className="w-5 h-5" />
						{stageT("title")}
					</CardTitle>
					<CardDescription>{stageT("description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Top controls simplified: keep last updated info only */}
					<div className="flex items-center justify-end">
						{lastUpdatedAt ? (
							<span className="text-xs text-muted-foreground">
								{stageT("lastUpdated", {
									time: new Date(
										lastUpdatedAt,
									).toLocaleString(),
								})}
							</span>
						) : null}
					</div>
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{stageOrder.map((stage) => {
							const isCurrent = stage === config.stage.current;
							return (
								<div
									key={stage}
									className={cn(
										"group rounded-lg border p-3 transition-colors",
										isCurrent
											? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
											: "bg-muted/30 hover:bg-muted/50",
									)}
								>
									<div className="flex items-center justify-between gap-2">
										<div>
											<p
												className={cn(
													"text-sm font-medium",
													isCurrent && "text-primary",
												)}
											>
												{formatStageLabel(stage)}
											</p>
											<p
												className={cn(
													"mt-1 text-xs text-muted-foreground",
													isCurrent && "text-primary",
												)}
											>
												{stageT(
													`descriptions.${stage.toLowerCase()}`,
												)}
											</p>
										</div>
										{/* Controls on the right: Next on current; Set current on others */}
										{isCurrent ? (
											nextStage ? (
												<Button
													size="sm"
													onClick={() =>
														nextStage &&
														updateStage(nextStage)
													}
													disabled={
														!nextStage ||
														stageSaving
													}
													className="shrink-0"
												>
													{stageSaving ? (
														<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
													) : null}
													{stageT("next")}
												</Button>
											) : null
										) : (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													updateStage(stage)
												}
												disabled={stageSaving}
												className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity shrink-0"
											>
												{stageT("setCurrent")}
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
					{stageHistory.length ? (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								{stageT("historyTitle")}
							</p>
							<div className="space-y-1 text-xs text-muted-foreground">
								{stageHistory.map((entry, index) => {
									const changedAtLabel = entry.changedAt
										? new Date(
												entry.changedAt,
											).toLocaleString()
										: stageT("historyUnknownTime");
									return (
										<div
											key={`${entry.stage}-${entry.changedAt ?? index}`}
											className="flex items-center justify-between gap-2 border-b pb-1 last:border-b-0 last:pb-0"
										>
											<span>
												{formatStageLabel(entry.stage)}
											</span>
											<span className="text-right">
												{changedAtLabel}
												{entry.changedBy ? (
													<span className="ml-2 block text-[0.65rem] text-muted-foreground">
														{stageT("historyBy", {
															user: entry.changedBy,
														})}
													</span>
												) : null}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					) : null}
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
									<div className="flex items-center justify-between">
										<Label htmlFor="requireProject">
											强制要求提交作品
										</Label>
										<Switch
											id="requireProject"
											checked={
												config.settings.requireProject
											}
											onCheckedChange={(checked) =>
												setConfig((prev) => ({
													...prev,
													settings: {
														...prev.settings,
														requireProject: checked,
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
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-4">
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
														allowPublicVoting:
															checked,
													},
												}))
											}
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label htmlFor="enableJudgeVoting">
											开启专家评审
										</Label>
										<Switch
											id="enableJudgeVoting"
											checked={
												config.voting.enableJudgeVoting
											}
											onCheckedChange={(checked) =>
												setConfig((prev) => ({
													...prev,
													voting: {
														...prev.voting,
														enableJudgeVoting:
															checked,
													},
												}))
											}
										/>
									</div>
								</div>
								<div className="space-y-4">
									<div>
										<Label htmlFor="judgeWeight">
											专家投票权重
										</Label>
										<Input
											id="judgeWeight"
											type="number"
											min="0"
											max="1"
											step="0.1"
											value={config.voting.judgeWeight}
											onChange={(e) =>
												setConfig((prev) => ({
													...prev,
													voting: {
														...prev.voting,
														judgeWeight:
															Number.parseFloat(
																e.target.value,
															) || 0.7,
														publicWeight:
															1 -
															(Number.parseFloat(
																e.target.value,
															) || 0.7),
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
											value={
												config.voting.publicVotingScope
											}
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
