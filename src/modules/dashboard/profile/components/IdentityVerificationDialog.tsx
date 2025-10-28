"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Lock, Shield, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

const identityVerificationSchema = z.object({
	realName: z
		.string()
		.max(50, "Real name must be less than 50 characters")
		.optional(),
	idCard: z
		.string()
		.regex(/^[0-9X]{18}$|^$/, "Invalid ID card format")
		.optional(),
	shippingAddress: z
		.string()
		.max(200, "Shipping address must be less than 200 characters")
		.optional(),
	shippingName: z
		.string()
		.max(50, "Shipping name must be less than 50 characters")
		.optional(),
	shippingPhone: z
		.string()
		.regex(
			/^(\+?[1-9]\d{1,14}|1[3-9]\d{9})$|^$/,
			"Invalid phone number format",
		)
		.optional(),
});

type IdentityVerificationFormValues = z.infer<
	typeof identityVerificationSchema
>;

interface IdentityVerificationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData: IdentityVerificationFormValues;
	onSave: (data: IdentityVerificationFormValues) => Promise<boolean>;
	isLoading?: boolean;
	isVerified?: boolean;
}

export function IdentityVerificationDialog({
	open,
	onOpenChange,
	initialData,
	onSave,
	isLoading = false,
	isVerified = false,
}: IdentityVerificationDialogProps) {
	const form = useForm<IdentityVerificationFormValues>({
		resolver: zodResolver(identityVerificationSchema),
		defaultValues: initialData,
	});

	// 当弹窗打开时，重置表单数据
	useEffect(() => {
		if (open) {
			form.reset(initialData);
		}
	}, [open, initialData, form]);

	const handleSave = async (data: IdentityVerificationFormValues) => {
		const success = await onSave(data);
		if (success) {
			onOpenChange(false);
		}
	};

	const handleCancel = () => {
		form.reset(initialData);
		onOpenChange(false);
	};

	const hasData = Object.values(form.getValues()).some(
		(value) => value && value.trim() !== "",
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						身份验证信息
						{isVerified && (
							<div className="flex items-center gap-1 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
								<CheckCircle className="h-3 w-3" />
								已验证
							</div>
						)}
					</DialogTitle>
					<DialogDescription className="flex items-start gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
						<div className="space-y-1">
							<p>
								此信息仅在参与实名制活动时需要填写，严格保密，不会对外公开。
							</p>
							<p className="text-xs text-muted-foreground">
								身份证信息仅用于活动验证，遵循数据保护法规，绝不用于其他用途。
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSave)}
						className="space-y-6"
					>
						{/* 身份信息部分 */}
						<div className="space-y-4">
							<div className="flex items-center gap-2 pb-2 border-b">
								<Lock className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">实名身份信息</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* 真实姓名 */}
								<FormField
									control={form.control}
									name="realName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												真实姓名
												<span className="text-xs text-muted-foreground">
													(选填)
												</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="请输入您的真实姓名"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormDescription>
												用于实名制活动的身份验证
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* 身份证号 */}
								<FormField
									control={form.control}
									name="idCard"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												身份证号
												<span className="text-xs text-muted-foreground">
													(选填)
												</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="请输入18位身份证号"
													{...field}
													value={field.value || ""}
													maxLength={18}
												/>
											</FormControl>
											<FormDescription>
												信息加密存储，绝对保密
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* 收件信息部分 */}
						<div className="space-y-4">
							<div className="flex items-center gap-2 pb-2 border-b">
								<Lock className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium">快递收件信息</h3>
								<span className="text-xs text-muted-foreground">
									(选填)
								</span>
							</div>
							<p className="text-xs text-muted-foreground">
								用于活动奖品或纪念品邮寄，仅在必要时使用
							</p>

							{/* 收件人姓名和电话 */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="shippingName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>收件人姓名</FormLabel>
											<FormControl>
												<Input
													placeholder="收件人姓名"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="shippingPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>收件人电话</FormLabel>
											<FormControl>
												<Input
													placeholder="手机号码"
													{...field}
													value={field.value || ""}
													maxLength={20}
												/>
											</FormControl>
											<FormDescription>
												支持中国手机号或国际号码格式
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 快递地址 */}
							<FormField
								control={form.control}
								name="shippingAddress"
								render={({ field }) => (
									<FormItem>
										<FormLabel>快递地址</FormLabel>
										<FormControl>
											<Textarea
												placeholder="请输入详细的收件地址（省市区县+街道门牌号）"
												{...field}
												value={field.value || ""}
												rows={3}
											/>
										</FormControl>
										<FormDescription>
											请提供详细地址，确保快递能准确送达
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								取消
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "保存中..." : "保存身份信息"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
