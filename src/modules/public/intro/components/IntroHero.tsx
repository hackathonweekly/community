import { Button } from "@/components/ui/button";
import { ArrowRight, Handshake } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactModal } from "./ContactModal";

export function IntroHero() {
	return (
		<div className="relative max-w-full overflow-x-hidden bg-linear-to-b from-0% from-card to-[100vh] to-background min-h-[100vh] flex items-center">
			{/* 背景模糊效果 - 采用现有风格 */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[300px] w-[600px] sm:h-[400px] sm:w-[800px] lg:h-[500px] lg:w-[1000px] rounded-full bg-gradient-to-r from-primary/20 to-background/20 opacity-60 blur-[150px]" />

			<div className="container relative z-20 text-center px-4 md:px-6 py-8 md:py-0">
				{/* 合作伙伴标签 - 采用现有风格 */}
				<div className="mb-6 md:mb-8 flex justify-center">
					<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
						<Handshake className="w-4 h-4 text-purple-600 mr-2" />
						<span className="text-purple-700 font-medium text-xs md:text-sm">
							合作伙伴
						</span>
						<span className="ml-2 text-gray-800 text-xs md:text-sm">
							共建AI创新生态
						</span>
					</div>
				</div>

				{/* 主标题 - 分色设计 */}
				<h1 className="mx-auto max-w-4xl text-center mb-4 font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-tight">
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
						携手共建{" "}
					</span>
					<span className="text-gray-900 dark:text-white">
						AI时代创新生态
					</span>
				</h1>

				{/* 副标题 */}
				<div className="mx-auto max-w-2xl text-center mt-5 md:mt-8 mb-8 md:mb-12">
					<p className="text-base md:text-xl text-gray-600 dark:text-gray-400 px-2">
						周周黑客松诚邀政府机构、投资孵化器、企业单位等合作伙伴
						<br className="hidden sm:block" />
						<span className="sm:hidden"> </span>
						共同打造温暖而充满活力的AI产品创造者社区
					</p>
				</div>

				{/* CTA 按钮 */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full sm:w-auto px-3 sm:px-0">
					<ContactModal>
						<Button
							size="lg"
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:w-auto sm:min-w-40 shadow-md"
						>
							开始合作洽谈
							<ArrowRight className="ml-2 size-4" />
						</Button>
					</ContactModal>
					<Button
						variant="outline"
						size="lg"
						className="w-full sm:w-auto sm:min-w-40 border-gray-300"
						asChild
					>
						<Link href="#community-showcase">
							<code className="mr-2">&lt;/&gt;</code>
							了解社区
						</Link>
					</Button>
				</div>

				{/* 社区成员展示 - 仿照home页面 */}
				<div className="mt-12 md:mt-16 text-center">
					<div className="flex justify-center -space-x-1.5 sm:-space-x-2 mb-3 md:mb-4">
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat1.jpg"
								alt="社区成员"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat2.jpg"
								alt="社区成员"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat3.jpg"
								alt="社区成员"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat4.jpg"
								alt="社区成员"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat5.jpg"
								alt="社区成员"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
					</div>
					<p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
						已有 6000+ 优秀创作者和 5+ 城市分部等待您的加入
					</p>
				</div>

				{/* 合作伙伴类型展示 - 简化版 */}
				{/* <div className="mt-12 md:mt-16">
					<p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
						期待与您一同建立合作关系
					</p>
					<div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
						<div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
							<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							<span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
								政府机构
							</span>
						</div>
						<div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
							<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
							<span className="text-sm text-green-700 dark:text-green-300 font-medium">
								投资孵化器
							</span>
						</div>
						<div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full">
							<Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
							<span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
								企业单位
							</span>
						</div>
						<div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-full">
							<GraduationCap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
							<span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
								教育机构
							</span>
						</div>
					</div>
				</div> */}
			</div>
		</div>
	);
}
