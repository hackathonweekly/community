import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Checkbox } from "@community/ui/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { ImageSelectorModal } from "@community/ui/ui/image-selector-modal";
import { Input } from "@community/ui/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Separator } from "@community/ui/ui/separator";
import { TiptapRichEditor } from "@community/ui/ui/tiptap-rich-editor";
import {
	ArrowPathIcon,
	ArrowsPointingOutIcon,
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { calculateEndTime } from "../utils/date-utils";
import type { EventFormData } from "./types";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

interface BasicInfoFormProps {
	control: Control<EventFormData>;
	setValue: UseFormSetValue<EventFormData>;
	watch: UseFormWatch<EventFormData>;
	organizations: Organization[];
	watchedType: string;
	onImageChange: () => void;
	user?: { email?: string | null };
	onRefreshOrganizations?: () => void;
	isEdit?: boolean; // 新增：是否为编辑模式
}

export function BasicInfoForm({
	control,
	setValue,
	watch,
	organizations,
	watchedType,
	onImageChange,
	user,
	onRefreshOrganizations,
	isEdit = false, // 新增：默认为非编辑模式
}: BasicInfoFormProps) {
	const isExternalEvent = watch("isExternalEvent");
	const startTime = watch("startTime");
	const endTime = watch("endTime");
	const [isRichContentDialogOpen, setIsRichContentDialogOpen] =
		useState(false);

	// 跟踪用户是否手动修改过结束时间
	const userModifiedEndTime = useRef(false);
	const lastAutoSetEndTime = useRef<string | null>(null);

	// 监听结束时间变化，判断是否为用户手动修改
	useEffect(() => {
		if (endTime && lastAutoSetEndTime.current !== endTime) {
			// 如果结束时间发生变化且不是我们自动设置的，说明用户手动修改了
			if (lastAutoSetEndTime.current !== null) {
				userModifiedEndTime.current = true;
			}
		}
	}, [endTime]);

	// 自动设置结束时间：只在创建模式下且用户未手动修改时生效
	useEffect(() => {
		if (!isEdit && startTime && !userModifiedEndTime.current) {
			try {
				const formattedEndTime = calculateEndTime(startTime, 2);
				lastAutoSetEndTime.current = formattedEndTime;
				setValue("endTime", formattedEndTime);
			} catch (error) {
				// 如果日期无效，不做任何操作
				console.warn(
					"Invalid start time for auto-calculation:",
					startTime,
				);
			}
		}
	}, [startTime, setValue, isEdit]);

	return (
		<div className="border rounded-lg shadow-sm">
			<div className="flex items-center gap-2 border-b px-4 py-3 md:px-6">
				<CalendarIcon className="w-5 h-5" />
				<div>
					<h3 className="text-base font-semibold">基本信息</h3>
					<p className="text-sm text-muted-foreground">
						填写活动的基础信息、时间和地点
					</p>
				</div>
			</div>
			<div className="space-y-6 px-4 py-4 md:px-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={control}
						name="title"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>活动标题 *</FormLabel>
								<FormControl>
									<Input
										placeholder="输入活动标题"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="type"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>活动类型 *</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="选择活动类型">
												{field.value === "MEETUP" &&
													"常规活动"}
												{field.value ===
													"HACKATHON" && (
													<span className="flex items-center gap-2">
														黑客马拉松
														<Badge
															variant="secondary"
															className="bg-purple-100 text-purple-800 text-xs"
														>
															Beta功能
														</Badge>
													</span>
												)}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="MEETUP">
											<div className="space-y-1">
												<div className="font-medium">
													常规活动
												</div>
												<div className="text-xs text-muted-foreground">
													适用于聚会、研讨会、社交活动等常规线下聚会
												</div>
											</div>
										</SelectItem>
										<SelectItem value="HACKATHON">
											<div className="space-y-1">
												<div className="font-medium flex items-center gap-2">
													黑客马拉松
													<Badge
														variant="secondary"
														className="bg-purple-100 text-purple-800 text-xs"
													>
														Beta功能
													</Badge>
												</div>
												<div className="text-xs text-muted-foreground">
													创意竞赛活动，通常包含团队组建、作品展示等环节
												</div>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="organizationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>组织</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={isExternalEvent}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={
													isExternalEvent
														? "外部活动不显示主办方"
														: "选择组织 (可选)"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="none">
											个人发起
										</SelectItem>
										{organizations
											.filter(
												(org) =>
													org.id &&
													org.id.trim() !== "",
											)
											.map((org) => (
												<SelectItem
													key={org.id}
													value={org.id}
												>
													{org.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								{isExternalEvent ? (
									<FormDescription>
										外部活动不会显示主办方信息，因为实际主办方可能不是平台用户
									</FormDescription>
								) : organizations.length === 0 ? (
									<FormDescription className="space-y-2">
										<div>
											目前只能以个人身份发起活动。如需代表组织发起活动，请先{" "}
											<a
												href="/orgs"
												className="text-primary underline hover:no-underline"
												target="_blank"
												rel="noopener noreferrer"
											>
												申请加入组织
											</a>
											。
										</div>
										{onRefreshOrganizations && (
											<div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={
														onRefreshOrganizations
													}
													className="text-xs"
												>
													<ArrowPathIcon className="w-3 h-3 mr-1" />
													刷新组织列表
												</Button>
											</div>
										)}
									</FormDescription>
								) : null}
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="organizerContact"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>主办方联系方式</FormLabel>
								<FormControl>
									<Input
										placeholder={
											user?.email
												? `如：${user.email}、微信号、手机号等`
												: "如：邮箱、微信号、手机号等"
										}
										{...field}
									/>
								</FormControl>
								<FormDescription>
									选填。如不填写，系统将默认显示您的邮箱和手机号码作为联系方式
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={control}
					name="shortDescription"
					render={({ field }) => (
						<FormItem>
							<FormLabel>活动简介</FormLabel>
							<FormControl>
								<Input
									placeholder="活动的简短介绍，用于海报和首页展示（建议150-200字内）"
									{...field}
									maxLength={200}
								/>
							</FormControl>
							<FormDescription>
								选填。简短的活动介绍，会显示在活动海报和列表页面中。如不填写，系统将自动截取活动详情的前150字作为简介。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="richContent"
					render={({ field }) => {
						const handleRichContentChange = (
							html: string,
							images: string[],
						) => {
							field.onChange(html);
							// 同时更新图片数组字段
							setValue("contentImages", images);
						};

						return (
							<FormItem>
								<div className="flex items-center justify-between gap-2">
									<FormLabel className="mb-0">
										活动详情 *
									</FormLabel>
									<Dialog
										open={isRichContentDialogOpen}
										onOpenChange={
											setIsRichContentDialogOpen
										}
									>
										<DialogTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="shrink-0 px-2 h-9"
											>
												<ArrowsPointingOutIcon className="w-4 h-4" />
												<span className="hidden sm:inline">
													弹窗编辑
												</span>
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-5xl w-[min(100vw-2rem,1100px)] max-h-[85vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2">
													<ArrowsPointingOutIcon className="w-5 h-5" />
													活动详情
												</DialogTitle>
												<DialogDescription>
													在更大的编辑区域中编写活动详情，保存后同步到表单
												</DialogDescription>
											</DialogHeader>
											<TiptapRichEditor
												value={field.value}
												onChange={
													handleRichContentChange
												}
												placeholder="详细描述你的活动内容、流程、亮点、参与须知等... 支持插入图片、格式化文本"
												height={520}
											/>
										</DialogContent>
									</Dialog>
								</div>

								<FormControl>
									<TiptapRichEditor
										value={field.value}
										onChange={handleRichContentChange}
										placeholder="详细描述你的活动内容、流程、亮点、参与须知等... 支持插入图片、格式化文本"
										height={350}
									/>
								</FormControl>
								<FormDescription>
									支持富文本格式、图片上传。可拖拽图片或点击工具栏上传按钮插入图片。
								</FormDescription>
								<FormMessage />
							</FormItem>
						);
					}}
				/>

				<FormField
					control={control}
					name="coverImage"
					render={({ field }) => (
						<FormItem>
							<ImageSelectorModal
								label="封面图片"
								value={field.value}
								onChange={(value) => {
									field.onChange(value);
									onImageChange();
								}}
								eventType={watchedType?.toLowerCase()}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 时间和地点信息 */}
				<div className="space-y-4">
					<Separator />
					<div className="flex items-center gap-2">
						<ClockIcon className="w-4 h-4 text-muted-foreground" />
						<h3 className="text-sm font-medium">时间安排</h3>
					</div>

					<div className="flex justify-center">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-2xl">
							<FormField
								control={control}
								name="startTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>开始时间 *</FormLabel>
										<FormControl>
											<Input
												type="datetime-local"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="endTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>结束时间 *</FormLabel>
										<FormControl>
											<Input
												type="datetime-local"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<MapPinIcon className="w-4 h-4 text-muted-foreground" />
						<h3 className="text-sm font-medium">活动地点</h3>
					</div>

					<FormField
						control={control}
						name="location"
						render={({ field }) => (
							<FormItem>
								<FormLabel>活动地点 *</FormLabel>
								<FormControl>
									<Input
										placeholder="线下地址或线上链接（如：北京市海淀区... 或 https://zoom.us/...）"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									输入详细地址（线下活动）或会议链接（线上活动），系统会自动识别
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="isExternalEvent"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center space-x-2">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
											className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
										/>
									</FormControl>
									<FormLabel className="text-sm font-normal cursor-pointer">
										外部平台活动（如 lu.ma /
										飞书问卷。点击报名将跳转到外部链接而不是在本系统中报名）
									</FormLabel>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 外部报名链接字段 - 只在勾选外部活动时显示 */}
					{isExternalEvent && (
						<FormField
							control={control}
							name="externalUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>外部报名链接 *</FormLabel>
									<FormControl>
										<Input
											placeholder="如：https://lu.ma/event/xxx 或 https://www.wenjuan.com/s/xxx"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										用户点击报名时将跳转到此链接进行报名
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>

				<div className="space-y-4">
					<Separator />
					<div className="flex items-center gap-2">
						<UsersIcon className="w-4 h-4 text-muted-foreground" />
						<h3 className="text-sm font-medium">报名与人数限制</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={control}
							name="maxAttendees"
							render={({ field }) => (
								<FormItem>
									<FormLabel>最大参与人数</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="1"
											placeholder="不限制请留空"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										设置后将限制总报名人数（包括所有票种）
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="registrationDeadline"
							render={({ field }) => (
								<FormItem>
									<FormLabel>报名截止时间</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										不设置则到活动开始前都可报名
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={control}
						name="requireApproval"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center space-x-3">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
											className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
										/>
									</FormControl>
									<div className="space-y-1">
										<FormLabel className="text-sm font-medium cursor-pointer">
											需要审核报名
										</FormLabel>
										<FormDescription className="text-xs">
											开启后，报名者需要等待组织者审核通过才能参加活动
										</FormDescription>
									</div>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}
