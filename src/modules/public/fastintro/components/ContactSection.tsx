"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export function ContactSection() {
	const publicContacts = [
		{
			title: "社区公众号",
			image: "/images/wechat_official_qr.jpg",
		},
		{
			title: "社区小程序",
			image: "/images/wechat_mini.jpg",
		},
		{
			title: "社区群聊",
			image: "/images/shenzhen-opengroup.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-background to-purple-50/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-blue-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							联系我们
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						扫码加入社区，开始你的创造之旅
					</p>
				</div>

				{/* Contact Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
					{publicContacts.map((contact) => (
						<Card
							key={contact.title}
							className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
						>
							<CardContent className="p-6">
								<h3 className="text-center font-bold text-lg text-foreground mb-6">
									{contact.title}
								</h3>
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
				</div>

				{/* Bottom Message */}
				<div className="mt-16 text-center">
					<p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
						周周黑客松
					</p>
					<p className="text-lg md:text-xl text-muted-foreground">
						每周末，一起创造有意思的作品！
					</p>
				</div>
			</div>
		</section>
	);
}
