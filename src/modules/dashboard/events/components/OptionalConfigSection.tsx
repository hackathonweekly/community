import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackConfig } from "@/lib/database/prisma/types/feedback";
import { DEFAULT_PARTICIPATION_AGREEMENT_MARKDOWN } from "@/lib/events/event-work-agreements";
import {
	getPresetRegistrationFieldConfig,
	registrationFieldKeys,
} from "@/lib/events/registration-fields";
import {
	ChatBubbleBottomCenterTextIcon,
	CheckCircleIcon,
	ClockIcon,
	CodeBracketSquareIcon,
	GlobeAltIcon as GlobeIcon,
	QuestionMarkCircleIcon,
	UserGroupIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
	AdvancedSettingsModal,
	AdvancedSettingsSummary,
} from "./AdvancedSettingsModal";
import {
	FeedbackConfigModal,
	FeedbackConfigSummary,
} from "./FeedbackConfigModal";
import { HackathonSettings } from "./HackathonSettings";
import { QuestionsModal } from "./QuestionsModal";
import {
	RegistrationPendingModal,
	RegistrationPendingSummary,
} from "./RegistrationPendingModal";
import {
	RegistrationSuccessModal,
	RegistrationSuccessSummary,
} from "./RegistrationSuccessModal";
import { TicketTypesModal, TicketTypesSummary } from "./TicketTypesModal";
import { SubmissionFormConfigSection } from "./SubmissionFormConfigSection";
import { VolunteerModal, VolunteerSummary } from "./VolunteerModal";
import type { SubmissionFormConfig } from "@/features/event-submissions/types";
import type {
	EventFormData,
	Question,
	TicketType,
	VolunteerRole,
} from "./types";
import type { RegistrationFieldConfig } from "./types";
import { normalizeSubmissionFormConfig } from "../utils/submission-form";

interface OptionalConfigSectionProps {
	control: Control<EventFormData>;
	watch: UseFormWatch<EventFormData>;
	setValue: UseFormSetValue<EventFormData>;
	volunteerRoles: VolunteerRole[];
}

export function OptionalConfigSection({
	control,
	watch,
	setValue,
	volunteerRoles,
}: OptionalConfigSectionProps) {
	const requireApproval = watch("requireApproval");
	const questions = (watch("questions") || []) as Question[];
	const eventType = watch("type");
	const requireProjectSubmission = watch("requireProjectSubmission");
	const submissionsEnabled = watch("submissionsEnabled");
	const askDigitalCardConsent = watch("askDigitalCardConsent");
	const registrationFieldConfig =
		(watch("registrationFieldConfig") as RegistrationFieldConfig) ||
		getPresetRegistrationFieldConfig("FULL");
	const participationAgreementMarkdown =
		typeof registrationFieldConfig.participationAgreementMarkdown ===
		"string"
			? registrationFieldConfig.participationAgreementMarkdown
			: "";
	const resolvedParticipationAgreementMarkdown =
		participationAgreementMarkdown.trim() ||
		DEFAULT_PARTICIPATION_AGREEMENT_MARKDOWN;

	const fieldLabels: Record<string, string> = {
		name: "姓名",
		userRoleString: "个人角色",
		currentWorkOn: "当前在做",
		lifeStatus: "当前状态",
		bio: "个人简介",
		phoneNumber: "手机号",
		email: "邮箱",
		wechatId: "微信号",
		shippingAddress: "邮寄地址",
	};

	const applyTemplate = (template: "FULL" | "MINIMAL") => {
		setValue(
			"registrationFieldConfig",
			{
				...getPresetRegistrationFieldConfig(template),
				...(participationAgreementMarkdown.trim()
					? { participationAgreementMarkdown }
					: {}),
			},
			{ shouldDirty: true, shouldTouch: true },
		);
	};

	const toggleField = (
		key: keyof RegistrationFieldConfig["fields"],
		type: "enabled" | "required",
	) => {
		const current = registrationFieldConfig.fields[key];
		const nextEnabled =
			type === "enabled" ? !current.enabled : current.enabled || true;
		const nextRequired =
			type === "required" ? !current.required : current.required;

		const normalized = {
			enabled: nextRequired ? true : nextEnabled,
			required: nextRequired,
		};

		setValue(`registrationFieldConfig.fields.${key}` as any, normalized, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const enabledFieldsCount = registrationFieldKeys.filter(
		(key) => registrationFieldConfig.fields[key].enabled,
	).length;
	const requiredFieldsCount = registrationFieldKeys.filter(
		(key) => registrationFieldConfig.fields[key].required,
	).length;
	const questionCount = questions.length;
	const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
	const rowClassName = "flex items-start justify-between gap-3 px-4 py-3 ";

	return (
		<div className="border rounded-lg shadow-sm">
			<div className="flex items-start justify-between p-4 border-b">
				<div>
					<h3 className="text-base font-semibold">可选配置</h3>
					<p className="text-sm text-muted-foreground">
						根据需要配置票种、报名问题、志愿者招募和其他高级设置
					</p>
				</div>
			</div>

			<div className="divide-y">
				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<QuestionMarkCircleIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">报名信息与问题</p>
							<p className="text-sm text-muted-foreground">
								字段 {enabledFieldsCount} 展示 /{" "}
								{requiredFieldsCount} 必填 · 问题{" "}
								{questionCount} 个
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Dialog
							open={registrationDialogOpen}
							onOpenChange={setRegistrationDialogOpen}
						>
							<DialogTrigger asChild>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="shrink-0"
								>
									编辑字段
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<QuestionMarkCircleIcon className="w-5 h-5" />
										报名字段设置
									</DialogTitle>
									<DialogDescription>
										选择需要收集的报名信息字段，并设置是否必填
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-3">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border px-3 py-2">
										<p className="text-sm text-muted-foreground">
											一键切换字段模板
										</p>
										<div className="flex gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													applyTemplate("FULL")
												}
											>
												默认（全填）
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													applyTemplate("MINIMAL")
												}
											>
												极简（姓名+手机号）
											</Button>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{registrationFieldKeys.map((key) => {
											const field =
												registrationFieldConfig.fields[
													key
												];
											return (
												<div
													key={key}
													className="flex items-center justify-between rounded-md border px-3 py-2"
												>
													<div className="space-y-1">
														<div className="text-sm font-medium">
															{fieldLabels[key] ||
																key}
														</div>
														<div className="text-xs text-muted-foreground">
															{field.required
																? "必填"
																: field.enabled
																	? "选填"
																	: "不展示"}
														</div>
													</div>
													<div className="flex items-center gap-3">
														<div className="flex items-center gap-1">
															<span className="text-xs text-muted-foreground">
																展示
															</span>
															<Switch
																checked={
																	field.enabled
																}
																onCheckedChange={() =>
																	toggleField(
																		key,
																		"enabled",
																	)
																}
																aria-label={`切换${fieldLabels[key]}展示`}
															/>
														</div>
														<div className="flex items-center gap-1">
															<span className="text-xs text-muted-foreground">
																必填
															</span>
															<Switch
																checked={
																	field.required
																}
																onCheckedChange={() =>
																	toggleField(
																		key,
																		"required",
																	)
																}
																aria-label={`切换${fieldLabels[key]}必填`}
															/>
														</div>
													</div>
												</div>
											);
										})}
									</div>

									{eventType === "HACKATHON" && (
										<div className="rounded-lg border p-3 space-y-3">
											<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div className="space-y-1">
													<p className="font-medium">
														参赛协议（Markdown）
													</p>
													<p className="text-sm text-muted-foreground">
														留空使用默认模板；将用于报名页的协议查看与同意勾选。
													</p>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setValue(
															"registrationFieldConfig.participationAgreementMarkdown" as any,
															"",
															{
																shouldDirty: true,
																shouldTouch: true,
															},
														)
													}
												>
													恢复默认
												</Button>
											</div>

											<Textarea
												value={
													participationAgreementMarkdown
												}
												onChange={(event) =>
													setValue(
														"registrationFieldConfig.participationAgreementMarkdown" as any,
														event.target.value,
														{
															shouldDirty: true,
															shouldTouch: true,
														},
													)
												}
												placeholder="在这里填写《参赛协议》Markdown（可选）"
												rows={8}
											/>

											<div className="rounded-lg border bg-muted/30 p-3">
												<p className="text-sm font-medium mb-2">
													预览
												</p>
												<div className="max-h-64 overflow-y-auto">
													<div className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words prose-p:break-words">
														<ReactMarkdown
															remarkPlugins={[
																remarkGfm,
															]}
														>
															{
																resolvedParticipationAgreementMarkdown
															}
														</ReactMarkdown>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							</DialogContent>
						</Dialog>
						<QuestionsModal control={control} questions={questions}>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="shrink-0"
							>
								编辑问题
							</Button>
						</QuestionsModal>
					</div>
				</div>

				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<UsersIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">票种设置</p>
							<TicketTypesSummary
								ticketTypes={
									(watch("ticketTypes") || []) as TicketType[]
								}
							/>
						</div>
					</div>
					<TicketTypesModal
						control={control}
						ticketTypes={
							(watch("ticketTypes") || []) as TicketType[]
						}
					>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="shrink-0"
						>
							编辑
						</Button>
					</TicketTypesModal>
				</div>

				{requireApproval && (
					<div className={rowClassName}>
						<div className="flex items-start gap-3 min-w-0">
							<ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
							<div>
								<p className="font-medium">审核中提示</p>
								<RegistrationPendingSummary
									pendingInfo={watch(
										"registrationPendingInfo",
									)}
									pendingImage={watch(
										"registrationPendingImage",
									)}
								/>
							</div>
						</div>
						<RegistrationPendingModal
							control={control}
							pendingInfo={watch("registrationPendingInfo")}
							pendingImage={watch("registrationPendingImage")}
						>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="shrink-0"
							>
								编辑
							</Button>
						</RegistrationPendingModal>
					</div>
				)}

				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<CheckCircleIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">报名成功提示</p>
							<RegistrationSuccessSummary
								successInfo={watch("registrationSuccessInfo")}
								successImage={watch("registrationSuccessImage")}
							/>
						</div>
					</div>
					<RegistrationSuccessModal
						control={control}
						successInfo={watch("registrationSuccessInfo")}
						successImage={watch("registrationSuccessImage")}
					>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="shrink-0"
						>
							编辑
						</Button>
					</RegistrationSuccessModal>
				</div>

				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<UserGroupIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">招募志愿者</p>
							<VolunteerSummary
								volunteerRoleData={
									watch("volunteerRoles") || []
								}
								volunteerRoles={volunteerRoles}
							/>
						</div>
					</div>
					<VolunteerModal
						control={control}
						volunteerRoles={volunteerRoles}
						volunteerRoleData={watch("volunteerRoles") || []}
						globalContactInfo={watch("volunteerContactInfo")}
						globalWechatQrCode={watch("volunteerWechatQrCode")}
					>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="shrink-0"
						>
							编辑
						</Button>
					</VolunteerModal>
				</div>

				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">活动反馈</p>
							<FeedbackConfigSummary
								feedbackConfig={
									watch("feedbackConfig") as
										| FeedbackConfig
										| null
										| undefined
								}
							/>
						</div>
					</div>
					<FeedbackConfigModal
						control={control}
						setValue={setValue}
						feedbackConfig={
							watch("feedbackConfig") as
								| FeedbackConfig
								| null
								| undefined
						}
					>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="shrink-0"
						>
							编辑
						</Button>
					</FeedbackConfigModal>
				</div>

				<div className={rowClassName}>
					<div className="flex items-start gap-3 min-w-0">
						<GlobeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<div>
							<p className="font-medium">更多设置</p>
							<AdvancedSettingsSummary
								tags={watch("tags") || []}
								requireProjectSubmission={
									requireProjectSubmission
								}
								submissionsEnabled={submissionsEnabled}
								askDigitalCardConsent={askDigitalCardConsent}
							/>
						</div>
					</div>
					<AdvancedSettingsModal
						control={control}
						form={{
							watch,
							setValue,
							getValues: (name: any) => watch(name as any),
						}}
						tags={watch("tags") || []}
					>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="shrink-0"
						>
							编辑
						</Button>
					</AdvancedSettingsModal>
				</div>

				<SubmissionFormConfigSection
					submissionFormConfig={
						(watch(
							"submissionFormConfig",
						) as SubmissionFormConfig | null) ?? null
					}
					onChange={(config) =>
						setValue(
							"submissionFormConfig",
							normalizeSubmissionFormConfig(config),
							{
								shouldDirty: true,
								shouldTouch: true,
							},
						)
					}
					submissionsEnabled={submissionsEnabled}
				/>

				{eventType === "HACKATHON" && (
					<div className={rowClassName}>
						<div className="flex items-start gap-3 min-w-0">
							<CodeBracketSquareIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
							<div>
								<div className="flex items-center gap-2">
									<p className="font-medium">黑客松设置</p>
									<Badge
										variant="secondary"
										className="bg-purple-100 text-purple-800 text-xs"
									>
										Beta功能
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground">
									团队规模与评审配置
								</p>
							</div>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="shrink-0"
								>
									编辑
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<CodeBracketSquareIcon className="w-5 h-5" />
										黑客松设置
									</DialogTitle>
									<DialogDescription>
										配置团队与投票规则
									</DialogDescription>
								</DialogHeader>
								<HackathonSettings
									control={control}
									watch={watch}
								/>
							</DialogContent>
						</Dialog>
					</div>
				)}
			</div>
		</div>
	);
}
