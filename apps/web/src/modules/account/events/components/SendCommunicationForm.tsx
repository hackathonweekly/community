"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { ImageUpload } from "@community/ui/ui/image-upload";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Textarea } from "@community/ui/ui/textarea";
import { Checkbox } from "@community/ui/ui/checkbox";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import { Badge } from "@community/ui/ui/badge";
import { Progress } from "@community/ui/ui/progress";
import { Alert, AlertDescription } from "@community/ui/ui/alert";
import {
	Mail,
	Send,
	Users,
	AlertCircle,
	CheckCircle,
	Search,
} from "lucide-react";

const RECIPIENT_SCOPE = {
	ALL: "ALL",
	APPROVED_ONLY: "APPROVED_ONLY",
	UNCHECKED_IN_ONLY: "UNCHECKED_IN_ONLY",
	SELECTED: "SELECTED",
} as const;

type RecipientScope = (typeof RECIPIENT_SCOPE)[keyof typeof RECIPIENT_SCOPE];

const formSchema = z
	.object({
		type: z.literal("EMAIL"),
		subject: z.string().min(1, "主题不能为空").max(200, "主题最长200字符"),
		content: z
			.string()
			.min(1, "内容不能为空")
			.max(2000, "内容最长2000字符"),
		imageUrl: z
			.string()
			.url("图片地址格式不正确")
			.max(1000, "图片地址过长")
			.optional(),
		recipientScope: z.enum([
			RECIPIENT_SCOPE.ALL,
			RECIPIENT_SCOPE.APPROVED_ONLY,
			RECIPIENT_SCOPE.UNCHECKED_IN_ONLY,
			RECIPIENT_SCOPE.SELECTED,
		]),
		selectedRecipientIds: z.array(z.string()).optional(),
	})
	.superRefine((data, context) => {
		if (
			data.recipientScope === RECIPIENT_SCOPE.SELECTED &&
			(data.selectedRecipientIds?.length ?? 0) === 0
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["selectedRecipientIds"],
				message: "请至少选择 1 位参与者",
			});
		}
	});

type FormData = z.infer<typeof formSchema>;

interface CommunicationLimitInfo {
	canSend: boolean;
	remainingCount: number;
	totalUsed: number;
	maxAllowed: number;
}

interface CommunicationRecipient {
	userId: string;
	name: string;
	email: string | null;
	status: "APPROVED" | "PENDING";
	checkedIn: boolean;
	isSendableEmail: boolean;
}

interface SendCommunicationFormProps {
	eventTitle: string;
	participantCount: number;
	participants: CommunicationRecipient[];
	limitInfo: CommunicationLimitInfo;
	onSend: (data: FormData) => Promise<void>;
	disabled?: boolean;
	className?: string;
}

export function SendCommunicationForm({
	eventTitle,
	participantCount,
	participants,
	limitInfo,
	onSend,
	disabled = false,
	className,
}: SendCommunicationFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [formData, setFormData] = useState<FormData | null>(null);
	const [participantSearch, setParticipantSearch] = useState("");

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: "EMAIL" as const,
			subject: "",
			content: "",
			imageUrl: undefined,
			recipientScope: RECIPIENT_SCOPE.ALL,
			selectedRecipientIds: [],
		},
	});

	const watchedSubject = form.watch("subject");
	const watchedContent = form.watch("content");
	const watchedImageUrl = form.watch("imageUrl");
	const watchedRecipientScope = form.watch("recipientScope");
	const watchedSelectedRecipientIds =
		form.watch("selectedRecipientIds") || [];

	const participantLookup = useMemo(() => {
		const map = new Map<string, CommunicationRecipient>();
		participants.forEach((participant) => {
			map.set(participant.userId, participant);
		});
		return map;
	}, [participants]);

	const approvedParticipants = useMemo(
		() =>
			participants.filter(
				(participant) => participant.status === "APPROVED",
			),
		[participants],
	);

	const uncheckedInParticipants = useMemo(
		() =>
			approvedParticipants.filter(
				(participant) => participant.checkedIn === false,
			),
		[approvedParticipants],
	);

	const sendableParticipants = useMemo(
		() => participants.filter((participant) => participant.isSendableEmail),
		[participants],
	);

	const filteredParticipants = useMemo(() => {
		const keyword = participantSearch.trim().toLowerCase();
		if (!keyword) {
			return participants;
		}

		return participants.filter((participant) => {
			return (
				participant.name.toLowerCase().includes(keyword) ||
				participant.email?.toLowerCase().includes(keyword)
			);
		});
	}, [participants, participantSearch]);

	const selectedCount = watchedSelectedRecipientIds.length;
	const selectedSendableCount = watchedSelectedRecipientIds.filter(
		(userId) => participantLookup.get(userId)?.isSendableEmail,
	).length;

	const resolveExpectedRecipientCount = (data: FormData) => {
		if (data.recipientScope === RECIPIENT_SCOPE.APPROVED_ONLY) {
			return approvedParticipants.filter(
				(participant) => participant.isSendableEmail,
			).length;
		}

		if (data.recipientScope === RECIPIENT_SCOPE.UNCHECKED_IN_ONLY) {
			return uncheckedInParticipants.filter(
				(participant) => participant.isSendableEmail,
			).length;
		}

		if (data.recipientScope === RECIPIENT_SCOPE.SELECTED) {
			return (data.selectedRecipientIds || []).filter(
				(userId) => participantLookup.get(userId)?.isSendableEmail,
			).length;
		}

		return sendableParticipants.length;
	};

	const handleSubmit = (data: FormData) => {
		const payload: FormData = {
			...data,
			selectedRecipientIds:
				data.recipientScope === RECIPIENT_SCOPE.SELECTED
					? data.selectedRecipientIds || []
					: undefined,
		};
		setFormData(payload);
		setShowConfirm(true);
	};

	const handleConfirm = async () => {
		if (!formData) return;

		setIsSubmitting(true);
		try {
			await onSend(formData);
			form.reset({
				type: "EMAIL",
				subject: "",
				content: "",
				imageUrl: undefined,
				recipientScope: RECIPIENT_SCOPE.ALL,
				selectedRecipientIds: [],
			});
			setParticipantSearch("");
			setShowConfirm(false);
			setFormData(null);
		} catch (error) {
			console.error("发送失败:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getTypeLabel = () => "邮件";

	const getTypeIcon = () => <Mail className="h-4 w-4" />;

	const getScopeLabel = (scope: RecipientScope) => {
		switch (scope) {
			case RECIPIENT_SCOPE.APPROVED_ONLY:
				return "仅已通过审核参与者";
			case RECIPIENT_SCOPE.UNCHECKED_IN_ONLY:
				return "仅未签到参与者";
			case RECIPIENT_SCOPE.SELECTED:
				return "指定参与者";
			default:
				return "全部参与者";
		}
	};

	const contentLength = watchedContent?.length || 0;
	const subjectLength = watchedSubject?.length || 0;

	return (
		<Card className={className}>
			<CardHeader className="space-y-3 lg:space-y-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-1.5">
						<CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
							<Send className="h-4 w-4 lg:h-5 lg:w-5" />
							<span>发送通知邮件</span>
						</CardTitle>
						<CardDescription className="space-y-1 text-xs lg:text-sm">
							<div>向 {eventTitle} 的参与者发送邮件通知</div>
							<div className="text-amber-600">
								⚠️
								系统会自动跳过虚拟邮箱（@wechat.app）或无效邮箱
							</div>
							<div className="text-blue-600">
								🖼️ 支持上传一张通知图片，邮件中会展示
							</div>
						</CardDescription>
					</div>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground lg:text-sm">
						<Users className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
						<span>{participantCount} 名参与者</span>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs lg:text-sm">
						<span className="text-muted-foreground">
							发送次数限制
						</span>
						<div className="flex items-center gap-2">
							<span className="font-medium text-xs lg:text-sm">
								{limitInfo.totalUsed} / {limitInfo.maxAllowed}
							</span>
							<Badge
								variant={
									limitInfo.canSend
										? "default"
										: "destructive"
								}
								className="text-[10px] lg:text-xs"
							>
								剩余 {limitInfo.remainingCount} 次
							</Badge>
						</div>
					</div>
					<Progress
						value={
							(limitInfo.totalUsed / limitInfo.maxAllowed) * 100
						}
						className="h-1.5 lg:h-2"
					/>
				</div>

				{!limitInfo.canSend && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription className="text-xs lg:text-sm">
							该活动已达到最大通信次数限制（{limitInfo.maxAllowed}{" "}
							次），无法继续发送消息。
						</AlertDescription>
					</Alert>
				)}
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
						<FormField
							control={form.control}
							name="type"
							render={() => (
								<FormItem>
									<FormLabel className="text-sm lg:text-base">
										通信类型
									</FormLabel>
									<FormControl>
										<div className="rounded-lg border bg-muted p-2.5 lg:p-3">
											<div className="flex items-center gap-2">
												<Mail className="h-3.5 w-3.5 flex-shrink-0 text-primary lg:h-4 lg:w-4" />
												<div className="min-w-0">
													<div className="text-sm font-medium lg:text-base">
														邮件通知
													</div>
													<div className="text-[10px] text-muted-foreground lg:text-xs">
														发送到用户邮箱
													</div>
												</div>
											</div>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="recipientScope"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm lg:text-base">
										发送范围
									</FormLabel>
									<Select
										onValueChange={(value) =>
											field.onChange(
												value as RecipientScope,
											)
										}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger className="text-sm lg:text-base">
												<SelectValue placeholder="选择发送范围" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem
												value={RECIPIENT_SCOPE.ALL}
											>
												全部参与者（有效邮箱{" "}
												{sendableParticipants.length}{" "}
												人）
											</SelectItem>
											<SelectItem
												value={
													RECIPIENT_SCOPE.APPROVED_ONLY
												}
											>
												仅已通过审核（有效邮箱{" "}
												{
													approvedParticipants.filter(
														(item) =>
															item.isSendableEmail,
													).length
												}{" "}
												人）
											</SelectItem>
											<SelectItem
												value={
													RECIPIENT_SCOPE.UNCHECKED_IN_ONLY
												}
											>
												仅未签到参与者（有效邮箱{" "}
												{
													uncheckedInParticipants.filter(
														(item) =>
															item.isSendableEmail,
													).length
												}{" "}
												人）
											</SelectItem>
											<SelectItem
												value={RECIPIENT_SCOPE.SELECTED}
											>
												指定参与者（手动选择）
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription className="text-xs lg:text-sm">
										无效邮箱会自动跳过，不会报错中断。
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{watchedRecipientScope === RECIPIENT_SCOPE.SELECTED && (
							<FormField
								control={form.control}
								name="selectedRecipientIds"
								render={({ field }) => {
									const selectedIds = field.value || [];
									const selectedIdSet = new Set(selectedIds);
									const visibleSendableIds =
										filteredParticipants
											.filter(
												(participant) =>
													participant.isSendableEmail,
											)
											.map(
												(participant) =>
													participant.userId,
											);

									const updateSelected = (ids: string[]) => {
										field.onChange(
											Array.from(new Set(ids)),
										);
									};

									const toggleOne = (
										userId: string,
										checked: boolean,
									) => {
										if (checked) {
											updateSelected([
												...selectedIds,
												userId,
											]);
											return;
										}
										updateSelected(
											selectedIds.filter(
												(id) => id !== userId,
											),
										);
									};

									const selectAllVisibleSendable = () => {
										updateSelected([
											...selectedIds,
											...visibleSendableIds,
										]);
									};

									return (
										<FormItem>
											<FormLabel>选择参与者</FormLabel>
											<div className="space-y-3 rounded-lg border p-3">
												<div className="flex flex-col gap-2 lg:flex-row">
													<div className="relative flex-1">
														<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
														<Input
															value={
																participantSearch
															}
															onChange={(event) =>
																setParticipantSearch(
																	event.target
																		.value,
																)
															}
															placeholder="搜索姓名或邮箱"
															className="pl-9"
														/>
													</div>
													<div className="flex gap-2">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={
																selectAllVisibleSendable
															}
														>
															全选可发送
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() =>
																updateSelected(
																	[],
																)
															}
														>
															清空
														</Button>
													</div>
												</div>
												<div className="max-h-56 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-2">
													{filteredParticipants.length ===
														0 && (
														<p className="text-sm text-muted-foreground">
															没有匹配的参与者
														</p>
													)}
													{filteredParticipants.map(
														(participant) => (
															<div
																key={
																	participant.userId
																}
																className="flex items-center justify-between rounded-md border bg-background p-2"
															>
																<div className="flex min-w-0 flex-1 items-center gap-2">
																	<Checkbox
																		checked={selectedIdSet.has(
																			participant.userId,
																		)}
																		onCheckedChange={(
																			checked,
																		) =>
																			toggleOne(
																				participant.userId,
																				checked ===
																					true,
																			)
																		}
																		disabled={
																			!participant.isSendableEmail
																		}
																	/>
																	<div className="min-w-0">
																		<p className="truncate text-sm font-medium">
																			{
																				participant.name
																			}
																		</p>
																		<p className="truncate text-xs text-muted-foreground">
																			{participant.email ||
																				"无邮箱"}
																		</p>
																	</div>
																</div>
																<div className="ml-2 flex items-center gap-1">
																	<Badge
																		variant="outline"
																		className="text-[10px]"
																	>
																		{participant.status ===
																		"APPROVED"
																			? "已通过"
																			: "待审核"}
																	</Badge>
																	{participant.checkedIn && (
																		<Badge
																			variant="outline"
																			className="text-[10px]"
																		>
																			已签到
																		</Badge>
																	)}
																	{!participant.isSendableEmail && (
																		<Badge
																			variant="destructive"
																			className="text-[10px]"
																		>
																			无效邮箱
																		</Badge>
																	)}
																</div>
															</div>
														),
													)}
												</div>
											</div>
											<FormDescription className="flex justify-between">
												<span>
													已选择 {selectedCount}{" "}
													人（可发送{" "}
													{selectedSendableCount} 人）
												</span>
												<span>无效邮箱会自动跳过</span>
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						)}

						<FormField
							control={form.control}
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm lg:text-base">
										消息主题
									</FormLabel>
									<FormControl>
										<Input
											placeholder="请输入消息主题"
											{...field}
											maxLength={200}
											className="text-sm lg:text-base"
										/>
									</FormControl>
									<FormDescription className="flex justify-between text-xs lg:text-sm">
										<span>
											简洁明了的主题有助于提高消息打开率
										</span>
										<span className="text-[10px] text-muted-foreground lg:text-xs">
											{subjectLength}/200
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm lg:text-base">
										消息内容
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="请输入邮件内容..."
											className="min-h-[100px] resize-none text-sm lg:min-h-[120px] lg:text-base"
											{...field}
											maxLength={2000}
										/>
									</FormControl>
									<FormDescription className="flex justify-between text-xs lg:text-sm">
										<span>支持换行，会保持原有格式</span>
										<span className="text-[10px] text-muted-foreground lg:text-xs">
											{contentLength}/2000
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="imageUrl"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<ImageUpload
											label="通知图片（可选）"
											value={field.value}
											onChange={field.onChange}
											onRemove={() =>
												field.onChange(undefined)
											}
											description="支持 JPG、PNG、WebP，建议宽图，邮件内会自动展示"
											className="p-3 lg:p-4"
										/>
									</FormControl>
									<FormDescription className="flex justify-between text-xs lg:text-sm">
										<span>
											不上传也可正常发送，仅发送文字消息
										</span>
										{watchedImageUrl ? (
											<span className="text-[10px] text-muted-foreground lg:text-xs">
												已上传图片
											</span>
										) : null}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								disabled={
									disabled ||
									!limitInfo.canSend ||
									isSubmitting
								}
								className="w-full min-w-[120px] lg:w-auto"
								size="lg"
							>
								{isSubmitting ? (
									<>
										<div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
										发送中...
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										发送{getTypeLabel()}
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>

				<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex items-center space-x-2">
								{formData && getTypeIcon()}
								<span>
									确认发送{formData && getTypeLabel()}
								</span>
							</AlertDialogTitle>
							<AlertDialogDescription asChild>
								<div className="space-y-3">
									<p>
										您即将向活动参与者发送提醒，请确认以下信息：
									</p>

									{formData && (
										<div className="bg-muted p-3 rounded-md space-y-2 text-sm">
											<div>
												<span className="font-medium">
													类型：
												</span>
												<span>{getTypeLabel()}</span>
											</div>
											<div>
												<span className="font-medium">
													发送范围：
												</span>
												<span>
													{getScopeLabel(
														formData.recipientScope,
													)}
												</span>
											</div>
											<div>
												<span className="font-medium">
													预计可发送：
												</span>
												<span>
													{resolveExpectedRecipientCount(
														formData,
													)}{" "}
													人
												</span>
											</div>
											{formData.recipientScope ===
												RECIPIENT_SCOPE.SELECTED && (
												<div>
													<span className="font-medium">
														已选择参与者：
													</span>
													<span>
														{formData
															.selectedRecipientIds
															?.length || 0}{" "}
														人
													</span>
												</div>
											)}
											<div>
												<span className="font-medium">
													主题：
												</span>
												<span className="text-foreground">
													{formData.subject}
												</span>
											</div>
											<div>
												<span className="font-medium">
													内容预览：
												</span>
												<div className="text-foreground bg-card p-2 rounded border mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap">
													{formData.content.length >
													100
														? `${formData.content.substring(0, 100)}...`
														: formData.content}
												</div>
											</div>
											{formData.imageUrl && (
												<div>
													<span className="font-medium">
														图片预览：
													</span>
													<img
														src={formData.imageUrl}
														alt="提醒图片预览"
														className="mt-1 h-24 w-full rounded-md border object-cover"
													/>
												</div>
											)}
										</div>
									)}

									<div className="flex items-start space-x-2 text-sm text-amber-600">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<div className="space-y-1">
											<p>
												发送后无法撤回，请仔细检查消息内容。此操作将消耗
												1 次发送机会，您还剩余{" "}
												<strong>
													{limitInfo.remainingCount}
												</strong>{" "}
												次机会。
											</p>
											<p className="text-amber-700">
												⚠️
												无效邮箱（包括虚拟邮箱）会自动跳过。
											</p>
										</div>
									</div>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isSubmitting}>
								取消
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirm}
								disabled={isSubmitting}
								className="min-w-[100px]"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										发送中
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4 mr-2" />
										确认发送
									</>
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
