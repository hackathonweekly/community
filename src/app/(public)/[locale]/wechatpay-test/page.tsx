import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { WechatPayTestClient } from "./WechatPayTestClient";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale });

	return {
		title: "微信支付测试 - WeChat Pay Test",
		description: "测试微信支付功能的页面",
	};
}

export default async function WechatPayTestPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						微信支付测试页面
					</h1>
					<p className="text-lg text-gray-600">
						测试微信支付集成功能，包括订单创建、支付流程和webhook处理
					</p>
				</div>

				<WechatPayTestClient />
			</div>
		</div>
	);
}
