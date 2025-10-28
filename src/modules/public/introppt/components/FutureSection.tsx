"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	MailIcon,
	MapIcon,
	RocketIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function FutureSection() {
	const roadmap2025 = [
		{
			icon: MapIcon,
			title: "社区规范化",
			items: [
				"启用专属社区网站（活动报名、项目展示、成员档案）",
				"完善社区制度（活动 SOP、组织架构、会员等级制度）",
			],
		},
		{
			icon: RocketIcon,
			title: "打造标杆分部",
			items: [
				"聚焦深圳、杭州等重点城市",
				"双周活动常态化（每月至少 1 场黑客松 + 1 场 Demo Show）",
				"沉淀完整的活动 SOP 和运营手册",
			],
		},
		{
			icon: UsersIcon,
			title: "培养核心团队",
			items: [
				"建立分部负责人培训体系和导师机制",
				"培养活跃的志愿者团队",
				"为 2026 年扩展做好人才储备",
			],
		},
		{
			icon: TrendingUpIcon,
			title: "线上内容建设",
			items: [
				"建设社区自媒体矩阵（MVP 案例、黑客松周刊、共学活动等）",
				"深度挖掘成员的创造故事",
			],
		},
	];

	const roadmap2026 = [
		"向全国扩展，开放城市分部和学校分部申请",
		"复制标杆分部经验和 SOP，借助企业与政府资源降低启动门槛",
		"持续孵化优秀产品与项目，完善商业项目反哺机制",
		"建立跨城协作网络，让每座城市都有「创造者的家」",
	];

	const publicContacts = [
		{
			title: "社区公众号",
			image: "/images/wechat_official_qr.jpg",
		},
		{
			title: "社区小程序",
			image: "/images/wechat_mini.jpg",
		},
	];

	const coreTeam = [
		{
			name: "Jackie",
			role: "社区创始人",
			image: "/images/jackie.jpg",
			wechat: "makerjackie",
		},
		{
			name: "Summer",
			role: "联合创始人/生态合作负责人",
			image: "/images/summer.jpg",
			wechat: "Vivian7days",
		},
	];

	const chapterLeaders = [
		{
			name: "曾博文",
			role: "深圳分部负责人",
			image: "/images/bowen.jpg",
		},
	];

	const communityGroups = [
		{
			title: "深圳开放群",
			description: "体验社区氛围，参与活动",
			image: "/images/shenzhen-opengroup.jpg",
		},
		{
			title: "全国筹备共建群",
			description: "加入共建者，推动社区发展",
			image: "/images/preparegroup.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-background to-purple-50/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-5 py-2 border border-purple-300">
							<RocketIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-sm">
								2025-2026 路线图
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						未来展望
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							让每座城市都有创造者的家
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						从「自发生长、为爱发电」向「规范化、标准化」过渡
					</p>
				</div>

				{/* Community Mission */}
				<div className="mb-16">
					<Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 max-w-4xl mx-auto shadow-lg">
						<CardContent className="p-8 md:p-10">
							<div className="text-center mb-6">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500 text-white mb-4">
									<RocketIcon className="w-8 h-8" />
								</div>
								<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
									我们的目标
								</h3>
							</div>
							<div className="text-center space-y-4">
								<p className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
									我们想要打造一个
									<span className="text-purple-600">
										可持续的AI创造者生态
									</span>
									——
								</p>
								<p className="text-base md:text-lg text-foreground/90 leading-relaxed">
									让每个城市都有
									<span className="font-semibold text-purple-600">
										「创造者的家」
									</span>
									，
								</p>
								<p className="text-base md:text-lg text-foreground/90 leading-relaxed">
									让每个好想法，都能在几周内找到伙伴、完成
									MVP、快速验证、落地生根。
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* 2025 Roadmap */}
				<div className="mb-16">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
						2025 Q4： 夯实标杆分部，沉淀运营体系
					</h3>
					<div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
						{roadmap2025.map((item) => (
							<Card
								key={item.title}
								className="border-2 hover:shadow-lg transition-all duration-300"
							>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<div className="p-3 rounded-xl bg-purple-100 border border-purple-200">
											<item.icon className="w-6 h-6 text-purple-600" />
										</div>
										<h4 className="text-lg font-bold text-foreground">
											{item.title}
										</h4>
									</div>
									<ul className="space-y-2">
										{item.items.map((subItem, index) => (
											<li
												key={index}
												className="flex items-start gap-2 text-sm text-muted-foreground"
											>
												<span className="text-purple-600 mt-1">
													•
												</span>
												<span>{subItem}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* 2026 Roadmap */}
				<div className="mb-20">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
						2026 年：扩展与深化
					</h3>
					<Card className="border-2 border-purple-200 bg-purple-50/50 max-w-4xl mx-auto">
						<CardContent className="p-8">
							<ul className="space-y-3">
								{roadmap2026.map((item, index) => (
									<li
										key={index}
										className="flex items-start gap-3 text-base text-foreground"
									>
										<div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold mt-0.5">
											{index + 1}
										</div>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>

				{/* CTA Section */}
				<div className="relative">
					{/* Background with gradient */}
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl" />
					<div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10 rounded-3xl" />

					<div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 md:p-16 text-center text-white">
						<h2 className="text-3xl md:text-5xl font-bold mb-6">
							一起创造，一起成长
						</h2>
						<p className="text-lg md:text-xl mb-8 opacity-90 max-w-3xl mx-auto">
							如果你认同「爱·自由·创造」这份信念
							<br />
							欢迎加入我们，一起把创造者的生态带到更多城市
						</p>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
							<Button
								size="lg"
								className="bg-white text-purple-600 hover:bg-gray-100 w-full sm:w-auto min-w-48 text-lg h-14"
								asChild
							>
								<Link href="/auth/login">
									加入社区
									<ArrowRightIcon className="ml-2 w-5 h-5" />
								</Link>
							</Button>
							<Button
								size="lg"
								className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto min-w-48 text-lg h-14"
								asChild
							>
								<a href="#contact">
									联系我们
									<MailIcon className="ml-2 w-5 h-5" />
								</a>
							</Button>
						</div>

						{/* Social proof - avatars */}
						<div className="flex justify-center -space-x-2 mb-4">
							<div className="w-12 h-12 relative rounded-full border-2 border-white overflow-hidden">
								<Image
									src="/images/avatars/wechat1.jpg"
									alt="Community member"
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
							<div className="w-12 h-12 relative rounded-full border-2 border-white overflow-hidden">
								<Image
									src="/images/avatars/wechat2.jpg"
									alt="Community member"
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
							<div className="w-12 h-12 relative rounded-full border-2 border-white overflow-hidden">
								<Image
									src="/images/avatars/wechat3.jpg"
									alt="Community member"
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
							<div className="w-12 h-12 relative rounded-full border-2 border-white overflow-hidden">
								<Image
									src="/images/avatars/wechat4.jpg"
									alt="Community member"
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
							<div className="w-12 h-12 relative rounded-full border-2 border-white overflow-hidden">
								<Image
									src="/images/avatars/wechat5.jpg"
									alt="Community member"
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
						</div>
						<p className="text-white/90 text-sm">
							已有 <span className="font-bold">6000+</span>{" "}
							位创造者在这里找到伙伴
						</p>
					</div>
				</div>

				{/* Contact Information */}
				<div
					id="contact"
					className="mt-20 max-w-6xl mx-auto scroll-mt-20"
				>
					<h3 className="text-3xl font-bold text-center mb-12">
						联系方式
					</h3>

					{/* Public Contacts & Email */}
					<div className="mb-12">
						<h4 className="text-xl font-bold text-center mb-6">
							公共联系方式
						</h4>
						<div className="grid md:grid-cols-3 gap-6">
							{publicContacts.map((contact) => (
								<Card
									key={contact.title}
									className="border-2 hover:shadow-lg transition-all duration-300"
								>
									<CardContent className="p-6">
										<h5 className="text-center font-semibold text-foreground mb-4">
											{contact.title}
										</h5>
										<div className="relative w-48 h-48 mx-auto">
											<Image
												src={contact.image}
												alt={contact.title}
												fill
												className="object-contain"
												sizes="192px"
											/>
										</div>
									</CardContent>
								</Card>
							))}
							<Card className="border-2 hover:shadow-lg transition-all duration-300">
								<CardContent className="p-6 flex flex-col items-center justify-center h-full">
									<MailIcon className="w-12 h-12 text-purple-600 mb-4" />
									<h5 className="font-semibold text-foreground mb-2">
										邮箱
									</h5>
									<a
										href="mailto:contact@hackathonweekly.com"
										className="text-sm text-purple-600 hover:text-purple-700 hover:underline text-center"
									>
										contact@hackathonweekly.com
									</a>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Core Team */}
					<div className="mb-12">
						<h4 className="text-xl font-bold text-center mb-6">
							核心团队联系方式
						</h4>
						<div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
							{coreTeam.map((member) => (
								<Card
									key={member.name}
									className="border-2 hover:shadow-lg transition-all duration-300"
								>
									<CardContent className="p-6">
										<div className="flex flex-col items-center">
											<h5 className="text-lg font-bold text-foreground mb-1">
												{member.name}
											</h5>
											<p className="text-sm text-muted-foreground mb-4">
												{member.role}
											</p>
											<div className="relative w-48 h-48 mb-3">
												<Image
													src={member.image}
													alt={`${member.name} WeChat QR`}
													fill
													className="object-contain"
													sizes="192px"
												/>
											</div>
											<p className="text-sm text-purple-600 font-medium">
												微信: {member.wechat}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>

					{/* Chapter Leaders */}
					{/* <div className="mb-12">
						<h4 className="text-xl font-bold text-center mb-6">
							社区分部负责人
						</h4>
						<div className="grid md:grid-cols-3 gap-6 max-w-xl mx-auto">
							{chapterLeaders.map((leader) => (
								<Card
									key={leader.name}
									className="border-2 hover:shadow-lg transition-all duration-300"
								>
									<CardContent className="p-6">
										<div className="flex flex-col items-center">
											<h5 className="text-base font-bold text-foreground mb-1">
												{leader.name}
											</h5>
											<p className="text-sm text-muted-foreground mb-3">
												{leader.role}
											</p>
											<div className="relative w-40 h-40">
												<Image
													src={leader.image}
													alt={`${leader.name} WeChat QR`}
													fill
													className="object-contain"
													sizes="160px"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div> */}

					{/* Community Groups */}
					<div>
						<h4 className="text-xl font-bold text-center mb-6">
							加入社群群聊
						</h4>
						<div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
							{communityGroups.map((group) => (
								<Card
									key={group.title}
									className="border-2 hover:shadow-lg transition-all duration-300"
								>
									<CardContent className="p-6">
										<h5 className="text-center font-semibold text-foreground mb-2">
											{group.title}
										</h5>
										<p className="text-center text-sm text-muted-foreground mb-4">
											{group.description}
										</p>
										<div className="relative w-48 h-48 mx-auto">
											<Image
												src={group.image}
												alt={group.title}
												fill
												className="object-contain"
												sizes="192px"
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
						<div className="text-center">
							<Button
								variant="outline"
								className="border-purple-300 hover:bg-purple-50"
								asChild
							>
								<a
									href="https://join.hackathonweekly.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									查看更多社群二维码
									<ArrowRightIcon className="ml-2 w-4 h-4" />
								</a>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
