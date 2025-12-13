"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TiptapRichEditor } from "@/components/ui/tiptap-rich-editor";
import {
	useCreateSubmission,
	useUpdateSubmission,
} from "@/features/event-submissions/hooks";
import { submissionFormSchema } from "@/features/event-submissions/schema";
import type {
	EventSubmission,
	SubmissionFormConfig,
	SubmissionFormValues,
	UserSearchResult,
} from "@/features/event-submissions/types";
import { cn } from "@/lib/utils";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { useSubmissionDraft } from "@/modules/dashboard/events/hooks/useSubmissionDraft";
import {
	type AttachmentChange,
	type AttachmentDraft,
	AttachmentUploader,
} from "./AttachmentUploader";
import { DynamicFormField } from "./DynamicFormField";
import { TeamSection } from "./TeamSection";

interface EventSubmissionFormProps {
	eventId: string;
	eventTitle: string;
	initialData?: EventSubmission;
	mode?: "create" | "edit";
	submissionFormConfig?: SubmissionFormConfig | null;
}

interface SubmissionDraftPayload extends Record<string, unknown> {
	formValues: SubmissionFormValues;
	leader: UserSearchResult | null;
	members: UserSearchResult[];
	attachments: AttachmentDraft[];
}

const COMPACT_CARD_HEADER = "gap-1 px-4 py-3";
const COMPACT_CARD_CONTENT = "px-4 pb-4 pt-0 space-y-3";

export function EventSubmissionForm({
	eventId,
	eventTitle,
	initialData,
	mode = "create",
	submissionFormConfig,
}: EventSubmissionFormProps) {
	const router = useRouter();
	const { user } = useSession();
	const attachmentsEnabled =
		submissionFormConfig?.settings?.attachmentsEnabled ?? true;
	const communityAuthorizationEnabled =
		submissionFormConfig?.settings?.communityUseAuthorizationEnabled ??
		true;
	const [attachments, setAttachments] = useState<AttachmentDraft[]>(() =>
		(initialData?.attachments ?? []).map((attachment, index) => ({
			fileName: attachment.fileName,
			fileUrl: attachment.fileUrl,
			fileType: attachment.fileType,
			mimeType: attachment.mimeType ?? undefined,
			fileSize: attachment.fileSize,
			order: attachment.order ?? index,
			tempId: attachment.id ?? `${attachment.fileName}-${index}`,
		})),
	);
	const [leader, setLeader] = useState<UserSearchResult | null>(() => {
		if (initialData?.teamLeader) {
			return {
				id: initialData.teamLeader.id,
				name: initialData.teamLeader.name,
				image: initialData.teamLeader.avatar,
				username: initialData.teamLeader.username,
			};
		}
		if (user) {
			return {
				id: user.id,
				name: user.name ?? "",
				image: user.image ?? undefined,
				username: user.username ?? undefined,
			};
		}
		return null;
	});
	const [members, setMembers] = useState<UserSearchResult[]>(
		() =>
			initialData?.teamMembers?.map((member) => ({
				id: member.id,
				name: member.name,
				image: member.avatar,
				username: member.username,
			})) ?? [],
	);

	// Parse initial custom fields
	const initialCustomFields = initialData?.customFields as
		| Record<string, unknown>
		| undefined;

	// Using type assertion to avoid complex react-hook-form generic issues
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = useForm<any>({
		resolver: zodResolver(submissionFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			tagline: initialData?.tagline ?? "",
			description: initialData?.description ?? "",
			demoUrl: initialData?.demoUrl ?? "",
			teamLeaderId: initialData?.teamLeader?.id ?? user?.id,
			teamMemberIds:
				initialData?.teamMembers?.map((member) => member.id) ?? [],
			attachments:
				initialData?.attachments?.map((attachment) => ({
					fileName: attachment.fileName,
					fileUrl: attachment.fileUrl,
					fileType: attachment.fileType,
					mimeType: attachment.mimeType ?? undefined,
					fileSize: attachment.fileSize,
					order: attachment.order,
				})) ?? [],
			communityUseAuthorization:
				initialData?.communityUseAuthorization ?? true,
			customFields: initialCustomFields ?? {},
		},
	});

	const handleAttachmentsChange = (next: AttachmentChange) => {
		if (typeof next === "function") {
			setAttachments((prev) =>
				(next as (value: AttachmentDraft[]) => AttachmentDraft[])(prev),
			);
		} else {
			setAttachments(next);
		}
	};

	const handleLeaderChange = (user: UserSearchResult) => {
		setLeader(user);
		setMembers((prev) => prev.filter((member) => member.id !== user.id));
	};

	const watchedValues = useWatch({ control: form.control });
	const createMutation = useCreateSubmission(eventId);
	const updateMutation = initialData
		? useUpdateSubmission(initialData.id)
		: null;

	const isSubmitting =
		createMutation.isPending || updateMutation?.isPending || false;

	const draftKey = `submission_draft_${eventId}`;
	const draftPayload: SubmissionDraftPayload = {
		formValues: {
			name: watchedValues.name ?? "",
			tagline: watchedValues.tagline ?? "",
			description: watchedValues.description,
			demoUrl: watchedValues.demoUrl,
			communityUseAuthorization:
				watchedValues.communityUseAuthorization ?? true,
			customFields: watchedValues.customFields,
			teamLeaderId: leader?.id,
			teamMemberIds: members.map((member) => member.id),
			attachments: attachments
				.filter((attachment) => !!attachment.fileUrl)
				.map(
					({
						fileName,
						fileUrl,
						fileType,
						mimeType,
						fileSize,
						order,
					}) => ({
						fileName,
						fileUrl,
						fileType,
						mimeType,
						fileSize,
						order,
					}),
				),
		},
		leader,
		members,
		attachments,
	};

	const { loadDraft, clearDraft, lastSavedAt } = useSubmissionDraft(
		draftKey,
		draftPayload,
		{ enabled: mode === "create" },
	);

	const [draftLoaded, setDraftLoaded] = useState(false);
	useEffect(() => {
		if (mode !== "create" || draftLoaded) return;
		const saved = loadDraft() as SubmissionDraftPayload | null;
		if (saved) {
			if (saved.formValues) {
				form.reset(saved.formValues);
			}
			if (saved.leader) {
				setLeader(saved.leader);
			}
			if (saved.members) {
				setMembers(saved.members);
			}
			if (saved.attachments) {
				setAttachments(saved.attachments);
			}
		}
		setDraftLoaded(true);
	}, [draftLoaded, loadDraft, form, mode]);

	useEffect(() => {
		form.setValue(
			"teamMemberIds",
			members.map((member) => member.id),
			{ shouldValidate: true },
		);
	}, [members, form]);

	useEffect(() => {
		if (leader) {
			form.setValue("teamLeaderId", leader.id, { shouldValidate: true });
		}
	}, [leader, form]);

	useEffect(() => {
		form.setValue(
			"attachments",
			attachments
				.filter((attachment) => !!attachment.fileUrl)
				.map(
					({ tempId: _tempId, uploading, uploadProgress, ...rest }) =>
						rest,
				),
			{ shouldValidate: true },
		);
	}, [attachments, form]);

	const normalizePayload = (): SubmissionFormValues => ({
		...form.getValues(),
		description: form.getValues("description") || undefined,
		demoUrl: form.getValues("demoUrl") || undefined,
		teamLeaderId: leader?.id,
		teamMemberIds: members.map((member) => member.id),
		attachments: attachments
			.filter((attachment) => !attachment.uploading && attachment.fileUrl)
			.map(
				({
					fileName,
					fileUrl,
					fileType,
					mimeType,
					fileSize,
					order,
				}) => ({
					fileName,
					fileUrl,
					fileType,
					mimeType,
					fileSize,
					order,
				}),
			),
	});

	const hasUploadingAttachment =
		attachmentsEnabled &&
		attachments.some(
			(attachment) => attachment.uploading && !attachment.fileUrl,
		);

	const onSubmit = async () => {
		const valid = await form.trigger();
		if (!valid) {
			toast.error("请完善表单信息");
			return;
		}

		if (!leader) {
			toast.error("请选择队长");
			return;
		}

		if (hasUploadingAttachment) {
			toast.error("请等待附件上传完成");
			return;
		}

		// Validate required custom fields
		if (submissionFormConfig?.fields) {
			const customFields = form.getValues("customFields") || {};
			for (const field of submissionFormConfig.fields) {
				if (field.required) {
					const value = customFields[field.key];
					if (
						!value ||
						(Array.isArray(value) && value.length === 0)
					) {
						toast.error(`请填写 ${field.label}`);
						return;
					}
				}
			}
		}

		try {
			const payload = normalizePayload();
			let submission: EventSubmission;
			if (mode === "edit" && initialData && updateMutation) {
				submission = await updateMutation.mutateAsync(payload);
				toast.success("作品已更新");
			} else {
				submission = await createMutation.mutateAsync(payload);
				toast.success("作品提交成功");
				clearDraft();
			}

			router.push(`/events/${eventId}/submissions`);
		} catch (error) {
			console.error(error);
			let errorMessage =
				error instanceof Error ? error.message : "提交失败，请稍后重试";

			if (errorMessage.includes("Request failed")) {
				errorMessage = "提交失败，请检查网络连接或稍后重试";
			}

			toast.error(errorMessage);
		}
	};

	// Sort custom fields by order
	const sortedCustomFields = submissionFormConfig?.fields
		? [...submissionFormConfig.fields].sort((a, b) => a.order - b.order)
		: [];

	return (
		<div className="space-y-4">
			<div>
				<p className="text-muted-foreground">
					请填写作品信息，系统将自动保存草稿。
				</p>
				{mode === "create" && lastSavedAt && (
					<p className="text-xs text-muted-foreground mt-1">
						<CheckCircle2 className="inline h-4 w-4 mr-1" />{" "}
						已自动保存于 {lastSavedAt.toLocaleTimeString()}
					</p>
				)}
			</div>

			<Form {...form}>
				<form
					className="space-y-4"
					onSubmit={(e) => e.preventDefault()}
				>
					{/* 基础信息 */}
					<Card>
						<CardHeader className={COMPACT_CARD_HEADER}>
							<CardTitle>基础信息</CardTitle>
							<CardDescription>
								填写作品的基本信息
							</CardDescription>
						</CardHeader>
						<CardContent className={COMPACT_CARD_CONTENT}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												作品名称{" "}
												<span className="text-red-500">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="输入作品名称"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="tagline"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												一句话介绍{" "}
												<span className="text-red-500">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="> 10 个字，概括核心价值"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="demoUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											项目链接{" "}
											<span className="text-muted-foreground text-xs font-normal">
												(选填)
											</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="https://"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											作品描述{" "}
											<span className="text-muted-foreground text-xs font-normal">
												(选填)
											</span>
										</FormLabel>
										<FormControl>
											<div className="min-h-[150px]">
												<TiptapRichEditor
													value={field.value}
													onChange={(html) =>
														field.onChange(html)
													}
													placeholder="详细介绍你的作品、灵感和实现方式"
													height={150}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* 自定义字段 */}
					{sortedCustomFields.length > 0 && (
						<Card>
							<CardHeader className={COMPACT_CARD_HEADER}>
								<CardTitle>补充信息</CardTitle>
								<CardDescription>
									请填写活动要求的额外信息
								</CardDescription>
							</CardHeader>
							<CardContent className={COMPACT_CARD_CONTENT}>
								{sortedCustomFields.map((customField) => (
									<DynamicFormField
										key={customField.key}
										field={customField}
										control={form.control as any}
										eventId={eventId}
									/>
								))}
							</CardContent>
						</Card>
					)}

					{/* 团队成员 */}
					<Card>
						<CardHeader className={COMPACT_CARD_HEADER}>
							<CardTitle>团队成员</CardTitle>
							<CardDescription>
								管理队长与队员信息
							</CardDescription>
						</CardHeader>
						<CardContent className={COMPACT_CARD_CONTENT}>
							<TeamSection
								eventId={eventId}
								leader={leader}
								onLeaderChange={handleLeaderChange}
								members={members}
								onMembersChange={setMembers}
								currentUserId={user?.id}
							/>
						</CardContent>
					</Card>

					{/* 附件上传 */}
					{attachmentsEnabled && (
						<Card>
							<CardHeader className={COMPACT_CARD_HEADER}>
								<CardTitle>附件上传</CardTitle>
								<CardDescription>
									上传展示图片或演示文件
								</CardDescription>
							</CardHeader>
							<CardContent className={COMPACT_CARD_CONTENT}>
								<AttachmentUploader
									eventId={eventId}
									value={attachments}
									onChange={handleAttachmentsChange}
								/>
								<FormField
									control={form.control}
									name="attachments"
									render={() => (
										<FormItem>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					)}

					{/* 授权说明 */}
					{communityAuthorizationEnabled && (
						<Card>
							<CardHeader className={COMPACT_CARD_HEADER}>
								<CardTitle>授权说明</CardTitle>
								<CardDescription>确认宣传授权</CardDescription>
							</CardHeader>
							<CardContent className={COMPACT_CARD_CONTENT}>
								<FormField
									control={form.control}
									name="communityUseAuthorization"
									render={({ field }) => (
										<FormItem className="space-y-3">
											<FormLabel>
												是否授权社区用于宣传{" "}
												<span className="text-red-500">
													*
												</span>
											</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={(value) =>
														field.onChange(
															value === "yes",
														)
													}
													value={
														field.value
															? "yes"
															: "no"
													}
													className="flex flex-col space-y-2"
												>
													<label
														className={cn(
															"flex items-center space-x-2 rounded-lg border p-3 cursor-pointer",
															field.value &&
																"border-primary bg-primary/5",
														)}
													>
														<RadioGroupItem value="yes" />
														<div>
															<p className="font-medium">
																是的，同意授权
															</p>
															<p className="text-sm text-muted-foreground">
																社区可在宣传渠道展示作品内容
															</p>
														</div>
													</label>
													<label
														className={cn(
															"flex items-center space-x-2 rounded-lg border p-3 cursor-pointer",
															!field.value &&
																"border-primary bg-primary/5",
														)}
													>
														<RadioGroupItem value="no" />
														<div>
															<p className="font-medium">
																暂不同意
															</p>
															<p className="text-sm text-muted-foreground">
																不会影响作品展示与投票
															</p>
														</div>
													</label>
												</RadioGroup>
											</FormControl>
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					)}

					{hasUploadingAttachment && (
						<div className="flex items-center gap-2 text-amber-600 text-sm">
							<AlertTriangle className="h-4 w-4" />
							<span>附件正在上传中，提交前请等待完成。</span>
						</div>
					)}

					<div className="flex items-center justify-between">
						<div>
							{mode === "create" && (
								<Button
									variant="ghost"
									type="button"
									onClick={() => {
										clearDraft();
										toast.success("已清除本地草稿");
									}}
								>
									清除草稿
								</Button>
							)}
						</div>
						<Button
							type="button"
							onClick={onSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{mode === "edit" ? "保存修改" : "提交作品"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
