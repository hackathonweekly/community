"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function NewHero() {
	return (
		<div className="relative max-w-full overflow-x-hidden bg-background min-h-[calc(100vh-6rem)] flex items-center">
			{/* Background gradient */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[300px] w-[600px] sm:h-[400px] sm:w-[800px] lg:h-[500px] lg:w-[1000px] rounded-full bg-gradient-to-r from-purple-400/20 to-purple-300/10 opacity-60 blur-[150px]" />

			<div className="container relative z-20 text-center px-4 md:px-6 py-4 md:py-0">
				{/* Tag line */}
				<div className="mb-6 md:mb-8 flex justify-center">
					<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
						<span className="text-purple-700 font-medium text-xs md:text-sm">
							🎯 爱·自由·创造
						</span>
					</div>
				</div>

				{/* Pain point question */}
				<h2 className="mx-auto max-w-3xl text-center mb-8 md:mb-12 text-xl md:text-2xl text-muted-foreground px-2">
					想把点子做成产品，却发现...
				</h2>

				{/* Three pain points - compact cards */}
				<div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 max-w-4xl mx-auto">
					<Card className="border-2 border-red-200 bg-red-50/50">
						<CardContent className="p-4 md:p-6">
							<div className="text-3xl md:text-4xl mb-3">😔</div>
							<p className="text-sm md:text-base text-foreground font-medium">
								找不到设计师/推广者
								<br />
								孤军奋战
							</p>
						</CardContent>
					</Card>

					<Card className="border-2 border-red-200 bg-red-50/50">
						<CardContent className="p-4 md:p-6">
							<div className="text-3xl md:text-4xl mb-3">😔</div>
							<p className="text-sm md:text-base text-foreground font-medium">
								活动结束后无人陪伴
								<br />
								想法石沉大海
							</p>
						</CardContent>
					</Card>

					<Card className="border-2 border-red-200 bg-red-50/50">
						<CardContent className="p-4 md:p-6">
							<div className="text-3xl md:text-4xl mb-3">😔</div>
							<p className="text-sm md:text-base text-foreground font-medium">
								不知如何迈出第一步
								<br />
								从想法到 MVP
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Main title - solution */}
				<h1 className="mx-auto max-w-4xl text-center mb-4 font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-tight">
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
						创造，从不孤单
					</span>
				</h1>

				{/* Subtitle */}
				<div className="mx-auto max-w-2xl text-center mt-5 md:mt-8 mb-8 md:mb-12">
					<p className="text-lg md:text-2xl text-foreground font-medium mb-4">
						你的第一个伙伴，和第一个 MVP，都在这里
					</p>
					<p className="text-base md:text-lg text-muted-foreground">
						花1周时间，创造1个最小可行产品，解决1个生活痛点
						<br />
						在这里，讲想法有人听，遇到困难有人扶，想冲刺有人陪
					</p>
				</div>

				{/* Call to Action Buttons */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full sm:w-auto px-3 sm:px-0 mb-12 md:mb-16">
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:w-auto sm:min-w-48 shadow-md text-base md:text-lg h-12 md:h-14"
						asChild
					>
						<Link href="/auth/login">
							加入 6000+ 创造者
							<ArrowRightIcon className="ml-2 size-5" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="w-full sm:w-auto sm:min-w-48 border-gray-300 text-base md:text-lg h-12 md:h-14"
						asChild
					>
						<Link href="#results">看看他们做了什么</Link>
					</Button>
				</div>

				{/* Social proof with real avatars */}
				<div className="mt-12 md:mt-16 text-center">
					<div className="flex justify-center -space-x-1.5 sm:-space-x-2 mb-3 md:mb-4">
						<div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat1.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 40px, 48px"
							/>
						</div>
						<div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat2.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 40px, 48px"
							/>
						</div>
						<div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat3.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 40px, 48px"
							/>
						</div>
						<div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat4.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 40px, 48px"
							/>
						</div>
						<div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat5.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 40px, 48px"
							/>
						</div>
					</div>
					<p className="text-sm md:text-base text-muted-foreground">
						来自 6000+ 位活跃创造者
					</p>
				</div>
			</div>
		</div>
	);
}
