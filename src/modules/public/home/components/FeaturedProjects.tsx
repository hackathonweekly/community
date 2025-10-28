"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Project = {
	name: string;
	description: string;
	details: string;
	image: string;
	founder: {
		name: string;
		title: string;
		contribution: string;
	};
};

export function FeaturedProjects() {
	const t = useTranslations("featuredProjects");
	const [currentIndex, setCurrentIndex] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	const projects: Project[] = [
		{
			name: "ShipAny",
			description: "一小时快速上线AI SaaS项目",
			details:
				"功能完善的 AI SaaS 开发框架，首发 4 小时收入破万刀，300+客户购买",
			image: "/images/projects/shipany.jpg",
			founder: {
				name: "Idoubi",
				title: "2024 年第二期活动成员",
				contribution:
					"社区活动 DemoDay 常驻嘉宾，其项目 ShipAny 在社区活动中展示并获得反馈支持",
			},
		},
		{
			name: "映壳",
			description: "灵动副屏手机壳",
			details:
				"获得百万级融资，基于墨水屏及NFC取电科技，用户可以在APP中随心更换壳体内容。自研软硬件，AI加持，玩法多样，现已在多个国家和地区上市",
			image: "/images/projects/yingke.jpg",
			founder: {
				name: "文龙",
				title: "2024 年第五期活动成员",
				contribution:
					"社区早期共创者，其项目映壳从技术到商业模式的孵化过程中，社区提供了深度参与与支持",
			},
		},
		{
			name: "Mighty AI",
			description: "Agent驱动型IoT生态",
			details:
				"被Cursor团队点赞，获得奇绩创坛投资的Agent应用，为智能硬件提供记忆共享、思考统一、协同行动和自主进化能力，已连接十余家新兴硬件厂商。",
			image: "/images/projects/mighty.jpg",
			founder: {
				name: "Jojo",
				title: "2024 年第八期活动成员",
				contribution:
					"社区早期共创者，MightyAI硬件生态与社区，通过工坊在深圳发掘和孵化新型智能硬件",
			},
		},
	];

	const scrollToIndex = (index: number) => {
		if (scrollRef.current) {
			const cardWidth = scrollRef.current.offsetWidth;
			scrollRef.current.scrollTo({
				left: index * cardWidth,
				behavior: "smooth",
			});
		}
		setCurrentIndex(index);
	};

	const handleScroll = () => {
		if (scrollRef.current) {
			const cardWidth = scrollRef.current.offsetWidth;
			const scrollLeft = scrollRef.current.scrollLeft;
			const index = Math.round(scrollLeft / cardWidth);
			setCurrentIndex(index);
		}
	};

	useEffect(() => {
		const ref = scrollRef.current;
		if (ref) {
			ref.addEventListener("scroll", handleScroll);
			return () => ref.removeEventListener("scroll", handleScroll);
		}
	}, []);

	return (
		<section className="py-20 md:py-28 bg-background relative">
			{/* Background decoration - following design system */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header section - following design system */}
				<div className="text-center mb-16 md:mb-20">
					{/* Badge - following design system */}
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								{t("tagline")}
							</span>
						</div>
					</div>

					{/* H2 title - following design system */}
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							{t("title")}
						</span>
					</h2>

					{/* Description - following design system */}
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Main content */}
				<div>
					{/* Desktop grid view */}
					<div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{projects.map((project) => (
							<div key={project.name} className="space-y-4">
								{/* Project image */}
								<div className="aspect-[16/9] rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-sm text-muted-foreground overflow-hidden">
									<Image
										src={project.image}
										alt={project.name}
										width={1000}
										height={562}
										className="w-full h-full object-cover"
									/>
								</div>

								{/* Project info */}
								<div className="space-y-3">
									<div>
										<h3 className="text-xl font-semibold text-foreground mb-1">
											{project.name}
										</h3>
										<p className="text-base text-primary font-medium">
											{project.description}
										</p>
									</div>

									<p className="text-sm text-muted-foreground line-clamp-2">
										{project.details}
									</p>

									{/* Founder info */}
									<div className="pt-3 border-t border-border/50">
										<div className="flex items-center gap-2 mb-1.5">
											<ArrowRight className="w-3 h-3 text-primary" />
											<div>
												<span className="text-sm font-medium text-foreground">
													{t("founderPrefix")}{" "}
													{project.founder.name}
												</span>
												<span className="text-xs text-muted-foreground ml-2">
													{project.founder.title}
												</span>
											</div>
										</div>
										<p className="text-xs text-muted-foreground pl-5 line-clamp-2">
											{project.founder.contribution}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Mobile sliding view */}
					<div className="md:hidden">
						<div
							ref={scrollRef}
							className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 px-4"
						>
							{projects.map((project, index) => (
								<div
									key={project.name}
									className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm snap-center space-y-4"
								>
									{/* Project image */}
									<div className="aspect-[16/9] rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-sm text-muted-foreground overflow-hidden">
										<Image
											src={project.image}
											alt={project.name}
											width={1000}
											height={562}
											className="w-full h-full object-cover"
										/>
									</div>

									{/* Project info */}
									<div className="space-y-3">
										<div>
											<h3 className="text-xl font-semibold text-foreground mb-1">
												{project.name}
											</h3>
											<p className="text-base text-primary font-medium">
												{project.description}
											</p>
										</div>

										<p className="text-sm text-muted-foreground line-clamp-3">
											{project.details}
										</p>

										{/* Founder info */}
										<div className="pt-3 border-t border-border/50">
											<div className="flex items-start gap-2 mb-1.5">
												<ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
												<div>
													<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
														<span className="text-sm font-medium text-foreground">
															{t("founderPrefix")}{" "}
															{
																project.founder
																	.name
															}
														</span>
														<span className="text-xs text-muted-foreground">
															{
																project.founder
																	.title
															}
														</span>
													</div>
												</div>
											</div>
											<p className="text-xs text-muted-foreground pl-5 line-clamp-3">
												{project.founder.contribution}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Mobile dots indicator */}
						<div className="flex justify-center mt-6 space-x-2">
							{projects.map((_, index) => (
								<button
									key={index}
									onClick={() => scrollToIndex(index)}
									className={`w-2 h-2 rounded-full transition-colors ${
										index === currentIndex
											? "bg-primary"
											: "bg-muted-foreground/30"
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Bottom call to action */}
				<div className="text-center mt-16">
					<Button
						asChild
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
					>
						<Link href="/projects">
							{t("cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
