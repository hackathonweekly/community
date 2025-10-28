import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CheckCircleIcon,
	ClockIcon,
	GlobeAltIcon as GlobeIcon,
	QuestionMarkCircleIcon,
	UserGroupIcon,
	UsersIcon,
	ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import type { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import {
	AdvancedSettingsModal,
	AdvancedSettingsSummary,
} from "./AdvancedSettingsModal";
import { QuestionsModal, QuestionsSummary } from "./QuestionsModal";
import {
	RegistrationPendingModal,
	RegistrationPendingSummary,
} from "./RegistrationPendingModal";
import {
	RegistrationSuccessModal,
	RegistrationSuccessSummary,
} from "./RegistrationSuccessModal";
import { TicketTypesModal, TicketTypesSummary } from "./TicketTypesModal";
import type {
	EventFormData,
	VolunteerRole,
	TicketType,
	Question,
} from "./types";
import { VolunteerModal, VolunteerSummary } from "./VolunteerModal";
import {
	FeedbackConfigModal,
	FeedbackConfigSummary,
} from "./FeedbackConfigModal";
import type { FeedbackConfig } from "@/lib/database/prisma/types/feedback";

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

	return (
		<Card>
			<CardHeader>
				<CardTitle>可选配置</CardTitle>
				<CardDescription>
					根据需要配置票种、报名问题、志愿者招募和其他高级设置
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-1">
					{/* 票种设置 */}
					<TicketTypesModal
						control={control}
						ticketTypes={
							(watch("ticketTypes") || []) as TicketType[]
						}
					>
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<UsersIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											设置票种
										</h4>
										<TicketTypesSummary
											ticketTypes={
												(watch("ticketTypes") ||
													[]) as TicketType[]
											}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TicketTypesModal>

					{/* 报名问题 */}
					<QuestionsModal
						control={control}
						questions={(watch("questions") || []) as Question[]}
					>
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<QuestionMarkCircleIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											添加报名问题
										</h4>
										<QuestionsSummary
											questions={
												(watch("questions") ||
													[]) as Question[]
											}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</QuestionsModal>

					{/* 审核中提示 - 仅在开启审核时显示 */}
					{requireApproval && (
						<RegistrationPendingModal
							control={control}
							pendingInfo={watch("registrationPendingInfo")}
							pendingImage={watch("registrationPendingImage")}
						>
							<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
								<CardContent className="p-3">
									<div className="flex items-center gap-2">
										<ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-sm leading-tight">
												审核中提示设置
											</h4>
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
								</CardContent>
							</Card>
						</RegistrationPendingModal>
					)}

					{/* 报名成功提示 */}
					<RegistrationSuccessModal
						control={control}
						successInfo={watch("registrationSuccessInfo")}
						successImage={watch("registrationSuccessImage")}
					>
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<CheckCircleIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											报名成功提示
										</h4>
										<RegistrationSuccessSummary
											successInfo={watch(
												"registrationSuccessInfo",
											)}
											successImage={watch(
												"registrationSuccessImage",
											)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</RegistrationSuccessModal>

					{/* 志愿者招募 */}
					<VolunteerModal
						control={control}
						volunteerRoles={volunteerRoles}
						volunteerRoleData={watch("volunteerRoles") || []}
						globalContactInfo={watch("volunteerContactInfo")}
						globalWechatQrCode={watch("volunteerWechatQrCode")}
					>
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<UserGroupIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											招募志愿者
										</h4>
										<VolunteerSummary
											volunteerRoleData={
												watch("volunteerRoles") || []
											}
											volunteerRoles={volunteerRoles}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</VolunteerModal>

					{/* 反馈配置 */}
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
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											配置活动反馈
										</h4>
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
							</CardContent>
						</Card>
					</FeedbackConfigModal>

					{/* 高级设置 */}
					<AdvancedSettingsModal
						control={control}
						form={{
							watch,
							setValue,
							getValues: (name: any) => watch(name as any),
						}}
						tags={watch("tags") || []}
					>
						<Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<GlobeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm leading-tight">
											更多设置
										</h4>
										<AdvancedSettingsSummary
											tags={watch("tags") || []}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</AdvancedSettingsModal>
				</div>
			</CardContent>
		</Card>
	);
}
