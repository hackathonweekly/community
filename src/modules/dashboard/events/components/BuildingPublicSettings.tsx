import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "@heroicons/react/24/outline";
import type { Control, UseFormWatch } from "react-hook-form";
import type { EventFormData } from "./types";

interface BuildingPublicSettingsProps {
	control: Control<EventFormData>;
	watch: UseFormWatch<EventFormData>;
}

export function BuildingPublicSettings({
	control,
	watch,
}: BuildingPublicSettingsProps) {
	const depositAmount = watch("depositAmount");
	const paymentType = watch("paymentType");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarIcon className="w-5 h-5" />📅 打卡挑战设置
				</CardTitle>
				<CardDescription>
					配置 Building Public 21 天打卡挑战的参数
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={control}
						name="minCheckIns"
						render={({ field }) => (
							<FormItem>
								<FormLabel>最少打卡次数</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="1"
										placeholder="7"
										{...field}
										onChange={(e) =>
											field.onChange(
												e.target.value
													? Number.parseInt(
															e.target.value,
														)
													: 7,
											)
										}
									/>
								</FormControl>
								<FormDescription>
									完成挑战需要的最少打卡次数
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={control}
					name="depositAmount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>押金金额（可选）</FormLabel>
							<FormControl>
								<Input
									type="number"
									min="0"
									step="0.01"
									placeholder="0"
									{...field}
									onChange={(e) =>
										field.onChange(
											e.target.value
												? Number.parseFloat(
														e.target.value,
													)
												: undefined,
										)
									}
								/>
							</FormControl>
							<FormDescription>
								设置押金可以提高参与者的完成动机。完成挑战后可退还部分押金。不设置则为免费挑战。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="refundRate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>退款率</FormLabel>
							<FormControl>
								<Input
									type="number"
									min="0"
									max="1"
									step="0.1"
									placeholder="1.0"
									{...field}
									onChange={(e) =>
										field.onChange(
											e.target.value
												? Number.parseFloat(
														e.target.value,
													)
												: 1.0,
										)
									}
								/>
							</FormControl>
							<FormDescription>
								完成挑战后退还的押金比例（0-1之间，如1.0表示退还100%，0.8表示退还80%）。
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Payment Settings */}
				{depositAmount && depositAmount > 0 && (
					<div className="space-y-4 pt-4 border-t">
						<div>
							<Label className="text-base font-medium">
								押金支付设置
							</Label>
							<p className="text-sm text-muted-foreground mt-1">
								配置参与者支付押金的方式
							</p>
						</div>

						<FormField
							control={control}
							name="paymentType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>支付方式</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="选择支付方式" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="NONE">
												暂不开放支付
											</SelectItem>
											<SelectItem value="CUSTOM">
												自定义支付方式
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										选择参与者支付押金的方式
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{paymentType === "CUSTOM" && (
							<div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<FormField
									control={control}
									name="paymentNote"
									render={({ field }) => (
										<FormItem>
											<FormLabel>支付说明</FormLabel>
											<FormControl>
												<Textarea
													placeholder="请说明如何支付押金，例如：请通过微信转账到指定账户..."
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												向参与者说明如何支付押金
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="paymentUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												支付链接（可选）
											</FormLabel>
											<FormControl>
												<Input
													placeholder="https://..."
													{...field}
												/>
											</FormControl>
											<FormDescription>
												提供支付页面链接，如支付宝、微信支付等
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="paymentQRCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												支付二维码（可选）
											</FormLabel>
											<FormControl>
												<Input
													placeholder="https://..."
													{...field}
												/>
											</FormControl>
											<FormDescription>
												提供支付二维码图片链接
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
