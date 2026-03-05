"use client";

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
import { ImageUpload } from "@community/ui/ui/image-upload";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useFieldArray } from "react-hook-form";

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

interface VolunteerRoleFormData {
	volunteerRoleId: string;
	recruitCount: number;
	description?: string;
	requireApproval?: boolean;
}

interface VolunteerModalProps {
	control: any;
	volunteerRoles: VolunteerRole[];
	volunteerRoleData: VolunteerRoleFormData[];
	globalContactInfo?: string;
	globalWechatQrCode?: string;
	onGlobalContactInfoChange?: (value: string) => void;
	onGlobalWechatQrCodeChange?: (value: string) => void;
	children: React.ReactNode;
}

// 根据角色名称获取对应的emoji图标
const getIconForRole = (roleName: string): string => {
	const iconMap: Record<string, string> = {
		主持人: "🎤",
		签到接待: "👋",
		签到接待组: "👋",
		技术支持: "🔧",
		技术支持组: "🔧",
		记录摄影: "📸",
		记录摄影组: "📸",
		计时员: "⏰",
		物料管理: "📦",
		物料管理员: "📦",
	};
	return iconMap[roleName] || "👤";
};

export function VolunteerModal({
	control,
	volunteerRoles,
	volunteerRoleData,
	globalContactInfo = "",
	globalWechatQrCode = "",
	onGlobalContactInfoChange,
	onGlobalWechatQrCodeChange,
	children,
}: VolunteerModalProps) {
	const [open, setOpen] = useState(false);

	const volunteerFields = useFieldArray({
		control,
		name: "volunteerRoles",
	});

	const addVolunteerRole = (roleId: string) => {
		const selectedRole = volunteerRoles.find((role) => role.id === roleId);
		if (!selectedRole) return;

		// 检查是否已经添加过该角色
		const existingIndex = volunteerFields.fields.findIndex(
			(field: any) => field.volunteerRoleId === roleId,
		);

		if (existingIndex !== -1) {
			alert("该志愿者角色已经添加过了");
			return;
		}

		volunteerFields.append({
			volunteerRoleId: roleId,
			recruitCount: 1,
			description: "",
			requireApproval: true,
		});
	};

	const removeVolunteerRole = (index: number) => {
		volunteerFields.remove(index);
	};

	const getSelectedRoleById = (roleId: string) => {
		return volunteerRoles.find((role) => role.id === roleId);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserGroupIcon className="w-5 h-5" />
						志愿者招募设置
					</DialogTitle>
					<DialogDescription>
						为活动招募不同角色的志愿者，自动积分奖励
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* 志愿者功能说明 */}
					<div className="bg-muted border border-border rounded-lg p-4">
						<h4 className="font-medium text-foreground mb-2">
							💡 关于志愿者招募功能
						</h4>
						<p className="text-sm text-muted-foreground leading-relaxed">
							志愿者完成工作可以获得对应的社区积分奖励，让他们的贡献得到记录和认可，
						</p>
					</div>

					{/* 全局联系方式和微信群二维码 */}
					<div className="space-y-4 p-4 bg-muted rounded-lg">
						<FormField
							control={control}
							name="volunteerContactInfo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										给志愿者的信息/须知（推荐）
									</FormLabel>
									<FormControl>
										<Input
											placeholder="建议填写组织者的联系方式 + 做志愿者的注意事项等等"
											{...field}
										/>
									</FormControl>
									<FormDescription className="text-xs">
										对所有志愿者生效，方便志愿者了解须知和联系组织者
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="volunteerWechatQrCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										志愿者微信群二维码（可选）
									</FormLabel>
									<FormControl>
										<div className="mt-1">
											<ImageUpload
												label=""
												value={field.value || ""}
												onChange={field.onChange}
												onRemove={() =>
													field.onChange("")
												}
												description="统一的志愿者微信群，对所有志愿者生效"
												maxSizeInMB={5}
												className="h-45"
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* 志愿者角色选择 */}
					<div className="space-y-4">
						<div>
							<Label>招募志愿者角色</Label>
							<p className="text-sm text-muted-foreground mt-1">
								选择需要招募的志愿者角色类型
							</p>
						</div>

						{/* 志愿者角色列表 */}
						{volunteerFields.fields.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								<UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<p className="mb-2">暂未添加志愿者角色</p>
								<p className="text-sm">
									点击下方"添加志愿者"按钮来添加需要招募的志愿者角色
								</p>
							</div>
						)}

						{volunteerFields.fields.map((field, index) => {
							const selectedRole = getSelectedRoleById(
								(field as any).volunteerRoleId,
							);

							return (
								<div
									key={field.id}
									className="bg-card border rounded-lg p-3"
								>
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2">
											<span className="text-lg">
												{getIconForRole(
													selectedRole?.name || "",
												)}
											</span>
											<span className="font-medium text-sm">
												{selectedRole?.name}
											</span>
											<Badge
												variant="outline"
												className="text-xs px-1.5 py-0.5"
											>
												{selectedRole?.cpPoints}积分
											</Badge>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												removeVolunteerRole(index)
											}
											className="h-6 w-6 p-0"
										>
											<TrashIcon className="w-3 h-3" />
										</Button>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<FormField
											control={control}
											name={`volunteerRoles.${index}.recruitCount`}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-xs">
														招募人数
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="1"
															placeholder="1"
															className="h-8 text-sm"
															{...field}
															onChange={(e) =>
																field.onChange(
																	Number.parseInt(
																		e.target
																			.value,
																	) || 1,
																)
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={control}
											name={`volunteerRoles.${index}.description`}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-xs">
														特殊说明（可选）
													</FormLabel>
													<FormControl>
														<Input
															placeholder="该角色特殊要求"
															className="h-8 text-sm"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={control}
										name={`volunteerRoles.${index}.requireApproval`}
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-3">
												<div className="space-y-0.5">
													<FormLabel className="text-sm font-medium">
														需要审批
													</FormLabel>
													<FormDescription className="text-xs">
														启用后，志愿者申请需要组织者审核通过
													</FormDescription>
												</div>
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							);
						})}

						{/* 添加志愿者按钮 */}
						{volunteerRoles.length > 0 ? (
							<Select onValueChange={addVolunteerRole}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="点击添加志愿者角色" />
								</SelectTrigger>
								<SelectContent>
									{volunteerRoles.map((role) => (
										<SelectItem
											key={role.id}
											value={role.id}
										>
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 flex items-center justify-center text-sm">
													{getIconForRole(role.name)}
												</div>
												{role.name}
												<Badge
													variant="outline"
													className="ml-auto"
												>
													{role.cpPoints}积分
												</Badge>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<div className="text-sm text-muted-foreground bg-muted border border-border rounded-lg p-3">
								<p className="font-medium text-foreground mb-1">
									🔄 志愿者角色加载中...
								</p>
								<p className="text-muted-foreground">
									如果持续显示此信息，可能是网络问题导致志愿者角色数据无法加载
								</p>
							</div>
						)}
					</div>

					{/* <div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							取消
						</Button>
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function VolunteerSummary({
	volunteerRoleData,
	volunteerRoles,
}: {
	volunteerRoleData: VolunteerRoleFormData[];
	volunteerRoles: VolunteerRole[];
}) {
	if (volunteerRoleData.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">暂未招募志愿者</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="text-sm font-medium">
				招募 {volunteerRoleData.length} 种志愿者角色
			</div>
			<div className="space-y-1">
				{volunteerRoleData.slice(0, 2).map((volunteerRole, index) => {
					const role = volunteerRoles.find(
						(r) => r.id === volunteerRole.volunteerRoleId,
					);
					return (
						<div
							key={index}
							className="flex items-center justify-between text-sm"
						>
							<span>{role?.name}</span>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="text-xs">
									{role?.cpPoints}积分
								</Badge>
								<span className="text-muted-foreground">
									{volunteerRole.recruitCount}人
								</span>
							</div>
						</div>
					);
				})}
				{volunteerRoleData.length > 2 && (
					<div className="text-sm text-muted-foreground">
						... 还有 {volunteerRoleData.length - 2} 个角色
					</div>
				)}
			</div>
		</div>
	);
}
