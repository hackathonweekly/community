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
import { TeamSection } from "./TeamSection";

interface EventSubmissionFormProps {
	eventId: string;
	eventTitle: string;
	initialData?: EventSubmission;
	mode?: "create" | "edit";
}

interface SubmissionDraftPayload {
	formValues: SubmissionFormValues;
	leader: UserSearchResult | null;
	members: UserSearchResult[];
	attachments: AttachmentDraft[];
}

const STEP_FIELDS: Array<Array<keyof SubmissionFormValues>> = [
	["name", "tagline", "description", "demoUrl"],
	["teamLeaderId", "teamMemberIds"],
	["attachments"],
	["communityUseAuthorization"],
];

const steps = [
	{ title: "作品信息", description: "填写基础信息" },
	{ title: "团队信息", description: "管理队长与队员" },
	{ title: "附件上传", description: "展示图片或演示文件" },
	{ title: "授权说明", description: "确认宣传授权" },
];

export function EventSubmissionForm({
	eventId,
	eventTitle,
	initialData,
	mode = "create",
}: EventSubmissionFormProps) {
	const router = useRouter();
	const { user } = useSession();
	const [currentStep, setCurrentStep] = useState(0);
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

	const form = useForm<SubmissionFormValues>({
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
			...watchedValues,
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
		const saved = loadDraft();
		if (saved) {
			form.reset(saved.formValues);
			saved.leader && setLeader(saved.leader);
			saved.members && setMembers(saved.members);
			saved.attachments && setAttachments(saved.attachments);
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

	const handleNextStep = async () => {
		const fields = STEP_FIELDS[currentStep];
		// Validate only current step fields. Focus first invalid field when possible.
		const valid = await form.trigger(fields, { shouldFocus: true });
		if (!valid) {
			// Log detailed validation info to help diagnose
			try {
				const allErrors = form.formState.errors as any;
				const fieldErrors = fields
					.map((name) => {
						const state = form.getFieldState(name as any);
						return state.invalid && state.error
							? { name, message: state.error?.message }
							: null;
					})
					.filter(Boolean);

				console.groupCollapsed(
					`[submission] validation failed (step ${currentStep + 1})`,
				);
				console.log("step fields:", fields);
				console.log("field errors:", fieldErrors);
				// Attachments nested errors (if any)
				if (currentStep === 2 && allErrors?.attachments) {
					const nested: any[] = allErrors.attachments || [];
					const nestedMsgs: Array<{
						index: number;
						key: string;
						message: string;
					}> = [];
					nested.forEach((err, idx) => {
						if (!err) return;
						for (const key of [
							"fileUrl",
							"fileName",
							"fileType",
							"mimeType",
							"fileSize",
						]) {
							const msg = err?.[key]?.message;
							if (msg)
								nestedMsgs.push({
									index: idx,
									key,
									message: String(msg),
								});
						}
					});
					if (nestedMsgs.length > 0) {
						console.warn("attachments nested errors:", nestedMsgs);
					}
					// Also print obviously invalid URLs (relative)
					const invalidUrls = attachments
						.filter(
							(a) =>
								a.fileUrl && !/^https?:\/\//i.test(a.fileUrl),
						)
						.map((a) => ({
							fileName: a.fileName,
							fileUrl: a.fileUrl,
						}));
					if (invalidUrls.length > 0) {
						console.error(
							"attachments have non-absolute URLs:",
							invalidUrls,
						);
					}
				}
				console.log("current values:", form.getValues());
				console.groupEnd();
			} catch {}

			// Surface a friendly error. Special-case attachments step so users get feedback.
			if (currentStep === 2) {
				toast.error("附件校验失败：请确认已上传完成，且附件链接有效");
			} else {
				toast.error("请完善本步骤的必填内容");
			}
			return;
		}

		setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
	};

	const handlePrevStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

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

	const hasUploadingAttachment = attachments.some(
		(attachment) => attachment.uploading && !attachment.fileUrl,
	);

	const onSubmit = async () => {
		const valid = await form.trigger();
		if (!valid) {
			try {
				console.groupCollapsed("[submission] submit validation failed");
				console.log("errors:", form.formState.errors);
				console.log("values:", form.getValues());
				console.groupEnd();
			} catch {}
			toast.error("请完善表单信息");
			return;
		}

		if (!leader) {
			toast.error("请选择队长");
			return;
		}

		if (hasUploadingAttachment) {
			try {
				const uploading = attachments.filter(
					(a) => a.uploading && !a.fileUrl,
				);
				console.warn(
					"[submission] uploading in progress, block submit:",
					uploading,
				);
			} catch {}
			toast.error("请等待附件上传完成");
			return;
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
			toast.error(
				error instanceof Error ? error.message : "提交失败，请稍后重试",
			);
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case 0:
				return (
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										作品名称{" "}
										<span className="text-red-500">*</span>
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
										一句话介绍（至少 10 个字）{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="> 10 个字，请直接说明作品核心价值"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
										<TiptapRichEditor
											value={field.value}
											onChange={(html) =>
												field.onChange(html)
											}
											placeholder="详细介绍你的作品、灵感和实现方式"
											height={280}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				);
			case 1:
				return (
					<TeamSection
						eventId={eventId}
						leader={leader}
						onLeaderChange={handleLeaderChange}
						members={members}
						onMembersChange={setMembers}
						currentUserId={user?.id}
					/>
				);
			case 2:
				return (
					<div className="space-y-2">
						<AttachmentUploader
							eventId={eventId}
							value={attachments}
							onChange={handleAttachmentsChange}
						/>
						{/* Show validation message for attachments (zod errors) */}
						<FormField
							control={form.control}
							name="attachments"
							render={() => (
								<FormItem>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				);
			case 3:
				return (
					<FormField
						control={form.control}
						name="communityUseAuthorization"
						render={({ field }) => (
							<FormItem className="space-y-4">
								<FormLabel>
									是否授权社区用于宣传{" "}
									<span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<RadioGroup
										onValueChange={(value) =>
											field.onChange(value === "yes")
										}
										value={field.value ? "yes" : "no"}
										className="flex flex-col space-y-2"
									>
										<label
											className={cn(
												"flex items-center space-x-2 rounded-lg border p-4",
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
												"flex items-center space-x-2 rounded-lg border p-4",
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
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<p className="text-muted-foreground">
					请按照步骤完成作品信息，系统将自动保存草稿。
				</p>
				{mode === "create" && lastSavedAt && (
					<p className="text-xs text-muted-foreground mt-1">
						<CheckCircle2 className="inline h-4 w-4 mr-1" />{" "}
						已自动保存于 {lastSavedAt.toLocaleTimeString()}
					</p>
				)}
			</div>

			{/* Mobile Step Indicator */}
			<div className="md:hidden mb-6">
				<div className="flex items-center justify-between mb-2">
					<span className="font-medium">
						步骤 {currentStep + 1}: {steps[currentStep].title}
					</span>
					<span className="text-sm text-muted-foreground">
						{currentStep + 1} / {steps.length}
					</span>
				</div>
				<div className="h-2 bg-secondary rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-300 ease-in-out"
						style={{
							width: `${((currentStep + 1) / steps.length) * 100}%`,
						}}
					/>
				</div>
			</div>

			{/* Desktop Step Indicator */}
			<div className="hidden md:grid gap-4 grid-cols-4">
				{steps.map((step, index) => (
					<div
						key={step.title}
						className={cn(
							"rounded-lg border p-3",
							index === currentStep &&
								"border-primary bg-primary/5",
						)}
					>
						<p className="text-xs text-muted-foreground">
							步骤 {index + 1}
						</p>
						<p className="font-medium">{step.title}</p>
						<p className="text-xs text-muted-foreground">
							{step.description}
						</p>
					</div>
				))}
			</div>

			<Form {...form}>
				<form
					className="space-y-6"
					onSubmit={(e) => e.preventDefault()}
				>
					<Card>
						<CardHeader>
							<CardTitle>{steps[currentStep].title}</CardTitle>
							<CardDescription>
								{steps[currentStep].description}
							</CardDescription>
						</CardHeader>
						<CardContent>{renderStep()}</CardContent>
					</Card>

					{hasUploadingAttachment && (
						<div className="flex items-center gap-2 text-amber-600 text-sm">
							<AlertTriangle className="h-4 w-4" />
							<span>附件正在上传中，提交前请等待完成。</span>
						</div>
					)}

					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={handlePrevStep}
							disabled={currentStep === 0 || isSubmitting}
						>
							上一步
						</Button>
						<div className="flex items-center gap-3">
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
							{currentStep < steps.length - 1 ? (
								<Button
									type="button"
									onClick={handleNextStep}
									disabled={isSubmitting}
								>
									下一步
								</Button>
							) : (
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
							)}
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}
