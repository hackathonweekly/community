"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function FinalCTA() {
	return (
		<section className="py-20 md:py-32 bg-gradient-to-b from-purple-50 to-white relative overflow-hidden">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] sm:w-[800px] sm:h-[400px] lg:w-[1000px] lg:h-[500px] rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 opacity-60 blur-[150px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Main CTA Card */}
				<Card className="border-0 shadow-2xl bg-white max-w-5xl mx-auto overflow-hidden">
					<CardContent className="p-0">
						<div className="grid lg:grid-cols-2 gap-0">
							{/* Left: Content */}
							<div className="p-8 md:p-12 flex flex-col justify-center">
								<div className="mb-6">
									<div className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 border border-purple-300 mb-6">
										<span className="text-purple-700 font-medium text-sm">
											🎯 爱·自由·创造
										</span>
									</div>

									<h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
										创造，
										<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
											从不孤单
										</span>
									</h2>

									<p className="text-lg md:text-xl text-muted-foreground mb-6">
										你的第一个伙伴，和第一个 MVP，都在这里
									</p>

									<div className="space-y-3 mb-8">
										<div className="flex items-center gap-3">
											<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
												<span className="text-green-600 text-sm">
													✓
												</span>
											</div>
											<span className="text-foreground">
												6000+ 创造者，每周都有新项目诞生
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
												<span className="text-green-600 text-sm">
													✓
												</span>
											</div>
											<span className="text-foreground">
												从想法到 MVP 到用户的完整陪伴
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
												<span className="text-green-600 text-sm">
													✓
												</span>
											</div>
											<span className="text-foreground">
												零门槛参与，无论技术背景
											</span>
										</div>
									</div>
								</div>

								<div className="flex flex-col sm:flex-row gap-4">
									<Button
										size="lg"
										className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg flex-1 sm:flex-initial"
										asChild
									>
										<Link href="/auth/login">
											立即加入
											<ArrowRightIcon className="ml-2 w-5 h-5" />
										</Link>
									</Button>
									<Button
										size="lg"
										variant="outline"
										className="flex-1 sm:flex-initial"
										asChild
									>
										<Link href="/events">查看活动</Link>
									</Button>
								</div>
							</div>

							{/* Right: QR codes */}
							<div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 md:p-12 flex flex-col justify-center">
								<h3 className="text-xl font-bold text-foreground mb-6 text-center">
									扫码关注，第一时间获取活动信息
								</h3>

								<div className="grid grid-cols-2 gap-6">
									<div className="text-center">
										<div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
											<div className="aspect-square relative">
												<Image
													src="/images/wechat-qr/official-account.jpg"
													alt="公众号二维码"
													fill
													className="object-contain"
												/>
											</div>
										</div>
										<p className="text-sm font-medium text-foreground">
											微信公众号
										</p>
										<p className="text-xs text-muted-foreground">
											活动预告 & 动态
										</p>
									</div>

									<div className="text-center">
										<div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
											<div className="aspect-square relative">
												<Image
													src="/images/wechat-qr/community-group.jpg"
													alt="微信群二维码"
													fill
													className="object-contain"
												/>
											</div>
										</div>
										<p className="text-sm font-medium text-foreground">
											微信群
										</p>
										<p className="text-xs text-muted-foreground">
											加入社区讨论
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Footer info */}
				<div className="mt-12 text-center">
					<div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
						<Link
							href="/contact"
							className="hover:text-purple-600 transition-colors"
						>
							联系我们
						</Link>
						<span className="text-muted-foreground/50">•</span>
						<Link
							href="/docs"
							className="hover:text-purple-600 transition-colors"
						>
							文档
						</Link>
						<span className="text-muted-foreground/50">•</span>
						<Link
							href="/projects"
							className="hover:text-purple-600 transition-colors"
						>
							项目案例
						</Link>
						<span className="text-muted-foreground/50">•</span>
						<Link
							href="/orgs"
							className="hover:text-purple-600 transition-colors"
						>
							全国分部
						</Link>
					</div>

					<div className="mt-6 text-sm text-muted-foreground">
						<p>周周黑客松 - 使命驱动的 AI 创造者社区</p>
						<p className="mt-2">
							© 2024-2025 HackathonWeekly. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
