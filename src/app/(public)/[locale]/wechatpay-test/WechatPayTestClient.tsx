"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, CreditCard, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QRCode from "react-qr-code";

interface PaymentResult {
	success: boolean;
	message: string;
	data?: {
		checkoutLink?: string;
		prepayId?: string;
		outTradeNo?: string;
	};
}

export function WechatPayTestClient() {
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<PaymentResult | null>(null);
	const [formData, setFormData] = useState({
		productId: "wechat_pro_monthly",
		type: "subscription" as "subscription" | "one-time",
		seats: 1,
		email: "test@example.com",
		name: "测试用户",
	});

	const products = [
		{
			id: "wechat_pro_monthly",
			name: "专业版月付",
			price: "¥199",
			type: "subscription",
		},
		{
			id: "wechat_pro_yearly",
			name: "专业版年付",
			price: "¥1,990",
			type: "subscription",
		},
		{
			id: "wechat_lifetime",
			name: "终身会员",
			price: "¥5,299",
			type: "one-time",
		},
	];

	const handleCreatePayment = async () => {
		setIsLoading(true);
		setResult(null);

		try {
			const response = await fetch("/api/payments/create-checkout-link", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					redirectUrl: window.location.href,
					// 模拟切换到微信支付提供商
					provider: "wechatpay",
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setResult({
					success: true,
					message: "微信支付订单创建成功！",
					data: {
						checkoutLink: data.checkoutLink,
						prepayId: data.prepayId,
						outTradeNo: data.outTradeNo,
					},
				});
			} else {
				setResult({
					success: false,
					message: data.message || "创建支付订单失败",
				});
			}
		} catch (error) {
			setResult({
				success: false,
				message: "网络错误，请重试",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const selectedProduct = products.find((p) => p.id === formData.productId);

	return (
		<div className="space-y-6">
			{/* 功能说明 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5" />
						功能说明
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<h4 className="font-semibold text-sm mb-2">
								已实现功能
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									微信支付订单创建
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									支持一次性支付和订阅
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Webhook 事件处理
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									多支付提供商切换
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-sm mb-2">
								环境变量配置
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										WECHAT_PAY_MCH_ID
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										WECHAT_PAY_CERT_SERIAL_NO
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										WECHAT_PAY_PRIVATE_KEY
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										WECHAT_PAY_API_V3_KEY
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										WECHAT_PAY_APP_ID
									</code>
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 支付测试表单 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						创建微信支付订单
					</CardTitle>
					<CardDescription>
						选择产品和用户信息，测试微信支付订单创建流程
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="product">选择产品</Label>
							<Select
								value={formData.productId}
								onValueChange={(value) => {
									const product = products.find(
										(p) => p.id === value,
									);
									setFormData((prev) => ({
										...prev,
										productId: value,
										type:
											(product?.type as
												| "subscription"
												| "one-time") || "subscription",
									}));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择产品" />
								</SelectTrigger>
								<SelectContent>
									{products.map((product) => (
										<SelectItem
											key={product.id}
											value={product.id}
										>
											<div className="flex items-center justify-between w-full">
												<span>{product.name}</span>
												<Badge
													variant="secondary"
													className="ml-2"
												>
													{product.price}
												</Badge>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="type">支付类型</Label>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										type: value as
											| "subscription"
											| "one-time",
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="支付类型" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="subscription">
										订阅支付
									</SelectItem>
									<SelectItem value="one-time">
										一次性支付
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{formData.type === "subscription" &&
							selectedProduct?.type === "subscription" && (
								<div className="space-y-2">
									<Label htmlFor="seats">座位数量</Label>
									<Input
										id="seats"
										type="number"
										min="1"
										max="100"
										value={formData.seats}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												seats:
													Number.parseInt(
														e.target.value,
													) || 1,
											}))
										}
									/>
								</div>
							)}

						<div className="space-y-2">
							<Label htmlFor="email">邮箱</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										email: e.target.value,
									}))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">姓名</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
							/>
						</div>
					</div>

					<Button
						onClick={handleCreatePayment}
						disabled={isLoading}
						className="w-full"
					>
						{isLoading ? "创建中..." : "创建微信支付订单"}
					</Button>
				</CardContent>
			</Card>

			{/* 结果显示 */}
			{result && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{result.success ? (
								<CheckCircle className="h-5 w-5 text-green-500" />
							) : (
								<AlertCircle className="h-5 w-5 text-red-500" />
							)}
							测试结果
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert
							variant={result.success ? "default" : "destructive"}
						>
							<AlertDescription>
								{result.message}
							</AlertDescription>
						</Alert>

						{result.success && result.data?.checkoutLink && (
							<div className="space-y-4">
								<div className="p-4 bg-gray-50 rounded-lg">
									<h4 className="font-semibold mb-2">
										支付链接
									</h4>
									<p className="text-sm text-gray-600 mb-2">
										{result.data.checkoutLink}
									</p>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											window.open(
												result.data?.checkoutLink,
												"_blank",
											)
										}
									>
										打开支付页面
									</Button>
								</div>

								{/* 二维码展示 */}
								<div className="flex justify-center">
									<div className="p-4 bg-white border rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<QrCode className="h-4 w-4" />
											<span className="text-sm font-medium">
												扫码支付
											</span>
										</div>
										<QRCode
											value={result.data.checkoutLink}
											size={200}
											style={{
												height: "auto",
												maxWidth: "100%",
												width: "100%",
											}}
										/>
									</div>
								</div>

								{result.data.outTradeNo && (
									<div className="p-4 bg-blue-50 rounded-lg">
										<h4 className="font-semibold mb-2">
											订单信息
										</h4>
										<p className="text-sm">
											<span className="font-medium">
												订单号:
											</span>{" "}
											{result.data.outTradeNo}
										</p>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* API 文档链接 */}
			<Card>
				<CardHeader>
					<CardTitle>相关链接</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<h4 className="font-semibold text-sm mb-2">
								API 端点
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										POST /api/payments/create-checkout-link
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										POST /api/webhooks/wechatpay
									</code>
								</li>
								<li>
									<code className="bg-gray-100 px-1 rounded text-xs">
										GET /api/payments/purchases
									</code>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-sm mb-2">
								开发文档
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									<a
										href="/zh/docs/dev-guide/wechatpay-integration"
										className="text-blue-600 hover:underline"
									>
										微信支付集成指南
									</a>
								</li>
								<li>
									<a
										href="https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml"
										className="text-blue-600 hover:underline"
										target="_blank"
										rel="noopener noreferrer"
									>
										微信支付官方文档
									</a>
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
