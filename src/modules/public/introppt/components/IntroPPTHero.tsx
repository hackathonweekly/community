"use client";

import Image from "next/image";

export function IntroPPTHero() {
	return (
		<div className="relative max-w-full overflow-x-hidden bg-background min-h-[calc(100vh-6rem)] flex items-center">
			{/* Background gradient */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[300px] w-[600px] sm:h-[400px] sm:w-[800px] lg:h-[500px] lg:w-[1000px] rounded-full bg-gradient-to-r from-purple-400/20 to-purple-300/10 opacity-60 blur-[150px]" />

			<div className="container relative z-20 px-4 md:px-6 py-4 md:py-0">
				<div className="mx-auto max-w-4xl text-center">
					{/* Tag line */}
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100/70 px-4 py-1.5 md:px-6 md:py-2 border border-purple-200">
							<span className="text-purple-700 font-semibold text-xs md:text-sm tracking-wide">
								AI 产品创造者社区
							</span>
						</div>
					</div>

					{/* Brand Name */}
					<h1 className="font-black tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-foreground">
						周周黑客松
					</h1>

					{/* Promise */}
					<p className="mt-4 md:mt-6 text-xl sm:text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
						让每个城市都有「创造者的家」
					</p>

					{/* Subtitle */}
					<p className="mx-auto mt-6 md:mt-8 text-base md:text-xl text-muted-foreground px-2 max-w-2xl leading-relaxed">
						让每个好想法，都能在几周内找到伙伴、完成
						MVP、快速验证、落地生根
					</p>
				</div>

				{/* Social proof - avatars */}
				<div className="mt-12 md:mt-16 text-center">
					<div className="flex justify-center -space-x-1.5 sm:-space-x-2 mb-3 md:mb-4">
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat1.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat2.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat3.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat4.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat5.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
					</div>
					<p className="text-sm md:text-base text-muted-foreground">
						已有 <span className="font-bold">6000+</span>{" "}
						位创造者在这里找到伙伴
					</p>
				</div>
			</div>
		</div>
	);
}
