"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CityChapters() {
	const cities = [
		{
			name: "深圳",
			slug: "shenzhen",
			members: "120+",
			schedule: "每周六下午 2-6pm 共创日",
			feature: "硬件创新之城",
			atmosphere:
				"周末来这里已经成习惯了，总能遇到熟悉的面孔，也总有新朋友加入。大家带着各自的项目，时而专注埋头，时而热烈讨论。有人在调试硬件，有人在写代码，有人在画原型。中间休息时一起喝咖啡、聊聊进展，这就是我们的'创造者客厅'",
			projects: "映壳、Mighty AI",
			contact: "Jackie",
			wechat: "makerjackie",
			image: "/images/events/gdc00007.jpg",
		},
		{
			name: "杭州",
			slug: "hangzhou",
			members: "80+",
			schedule: "每周日下午 2-6pm 共创日",
			feature: "互联网之城",
			atmosphere:
				"我们在西湖边的一个创业空间聚会，窗外是湖光山色，室内是敲键盘的声音。这里的伙伴多是互联网背景，做 SaaS 和 AI 应用的特别多。每次活动后大家会一起在附近吃饭，聊到很晚才散",
			projects: "ShipAny 等",
			contact: "Summer",
			wechat: "Vivian7days",
			image: "/images/events/meet00006.jpg",
		},
		{
			name: "北京",
			slug: "beijing",
			members: "50+",
			schedule: "双周周末活动",
			feature: "科技创新中心",
			atmosphere:
				"北京的伙伴们来自五湖四海，既有大厂员工，也有连续创业者。大家周末聚在一起，不为别的，就是想找到靠谱的人一起做点事。氛围很实在，不讲虚的，能落地最重要",
			projects: "多个AI应用项目",
			contact: "待确认",
			wechat: "-",
			image: "/images/events/hack00003.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16 md:mb-20">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<MapPinIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								全国分部网络
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						让创造发生在
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							你的身边
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						我们在全国多个城市都有活跃的分部
						<br />
						与当地创造者面对面交流协作
					</p>
				</div>

				{/* City cards */}
				<div className="grid lg:grid-cols-3 gap-8 mb-12">
					{cities.map((city, index) => (
						<Card
							key={index}
							className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden group"
						>
							{/* City image */}
							<div className="relative h-48 overflow-hidden">
								<Image
									src={city.image}
									alt={`${city.name}分部`}
									fill
									className="object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
								<div className="absolute bottom-4 left-4 right-4">
									<h3 className="text-2xl font-bold text-white mb-1">
										📍 {city.name}分部
									</h3>
									<p className="text-sm text-white/90">
										{city.feature}
									</p>
								</div>
							</div>

							<CardContent className="p-6 space-y-4">
								{/* Stats */}
								<div className="flex items-center gap-4 text-sm">
									<div className="flex items-center gap-1">
										<UsersIcon className="w-4 h-4 text-purple-600" />
										<span className="font-medium">
											{city.members}
										</span>
										<span className="text-muted-foreground">
											共创伙伴
										</span>
									</div>
								</div>

								{/* Schedule */}
								<div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
									<p className="text-sm text-purple-900">
										<span className="font-medium">📅 </span>
										{city.schedule}
									</p>
								</div>

								{/* Atmosphere quote */}
								<div className="border-l-4 border-purple-400 pl-4">
									<p className="text-sm text-muted-foreground italic leading-relaxed">
										{city.atmosphere}
									</p>
								</div>

								{/* Projects */}
								<div>
									<p className="text-xs text-muted-foreground mb-1">
										明星项目：
									</p>
									<p className="text-sm font-medium text-foreground">
										{city.projects}
									</p>
								</div>

								{/* Contact */}
								{city.wechat !== "-" && (
									<div className="pt-4 border-t">
										<p className="text-xs text-muted-foreground mb-2">
											负责人：{city.contact}
										</p>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
										>
											<span className="text-xs">
												添加微信：{city.wechat}
											</span>
										</Button>
									</div>
								)}

								{/* CTAs */}
								<div className="pt-2 space-y-2">
									<Button
										className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										size="sm"
										asChild
									>
										<Link href={`/orgs/${city.slug}`}>
											查看详情
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* No city CTA */}
				<div className="max-w-3xl mx-auto">
					<Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
						<CardContent className="p-8 text-center">
							<div className="text-4xl mb-4">🌍</div>
							<h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
								还没有你的城市？
							</h3>
							<p className="text-muted-foreground mb-6">
								我们欢迎你成为新城市的分部创始成员！
								<br />
								我们提供完整的 SOP、资源支持和品牌背书
							</p>
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<Button
									size="lg"
									className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
									asChild
								>
									<Link href="/contact">
										申请成为分部负责人
										<ArrowRightIcon className="ml-2 w-5 h-5" />
									</Link>
								</Button>
								<Button size="lg" variant="outline" asChild>
									<Link href="/orgs">查看所有分部</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
