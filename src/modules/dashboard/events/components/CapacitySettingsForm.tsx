import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UsersIcon } from "@heroicons/react/24/outline";
import type { Control } from "react-hook-form";
import type { EventFormData } from "./types";

interface CapacitySettingsFormProps {
	control: Control<EventFormData>;
}

export function CapacitySettingsForm({ control }: CapacitySettingsFormProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UsersIcon className="w-5 h-5" />
					容量和审核设置
				</CardTitle>
				<CardDescription>
					设置活动的参与人数限制和报名审核要求
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
									<Input type="datetime-local" {...field} />
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

				<FormField
					control={control}
					name="requireProjectSubmission"
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
										需要作品关联
									</FormLabel>
									<FormDescription className="text-xs">
										要求报名者创建或关联一个项目，适用于
										Demo Day、Cowork 等活动
									</FormDescription>
								</div>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="askDigitalCardConsent"
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
										询问用户是否愿意在现场屏幕公开自我介绍并展示数字名片信息
									</FormLabel>
									<FormDescription className="text-xs">
										开启后，报名时会询问用户是否愿意在 PPT
										模式中展示其数字名片信息
									</FormDescription>
								</div>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
}
