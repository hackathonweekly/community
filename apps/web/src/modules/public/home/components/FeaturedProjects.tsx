"use client";

import { ArrowRightIcon } from "lucide-react";
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
		<section className="py-16 md:py-24 bg-background">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12 md:mb-16">
					<div className="mb-5 flex justify-center">
						<span className="px-2 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider border border-border">
							{t("tagline")}
						</span>
					</div>

					<h2 className="font-brand text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground">
						{t("title")}
					</h2>

					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Main content */}
				<div>
					{/* Desktop grid view */}
					<div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{projects.map((project) => (
							<div
								key={project.name}
								className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
							>
								{/* Project image */}
								<div className="h-40 overflow-hidden border-b border-gray-50 dark:border-border">
									<Image
										src={project.image}
										alt={project.name}
										width={1000}
										height={562}
										sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>

								{/* Project info */}
								<div className="p-3">
									<div className="flex justify-between items-start mb-1">
										<h3 className="font-brand text-base font-bold text-foreground leading-tight group-hover:text-gray-600 dark:group-hover:text-[#A3A3A3] transition-colors">
											{project.name}
										</h3>
									</div>
									<p className="text-[11px] text-muted-foreground font-mono mb-2">
										{project.description}
									</p>

									<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
										{project.details}
									</p>

									{/* Founder info */}
									<div className="pt-2 border-t border-gray-50 dark:border-border">
										<div className="flex items-center gap-2 mb-1">
											<ArrowRightIcon className="w-3 h-3 text-foreground" />
											<div>
												<span className="text-xs font-bold text-foreground">
													{t("founderPrefix")}{" "}
													{project.founder.name}
												</span>
												<span className="text-[10px] text-gray-400 dark:text-muted-foreground ml-2 font-mono">
													{project.founder.title}
												</span>
											</div>
										</div>
										<p className="text-[10px] text-gray-400 dark:text-muted-foreground pl-5 line-clamp-2">
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
							{projects.map((project) => (
								<div
									key={project.name}
									className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm snap-center bg-card rounded-lg border border-border overflow-hidden"
								>
									{/* Project image */}
									<div className="h-40 overflow-hidden border-b border-gray-50 dark:border-border">
										<Image
											src={project.image}
											alt={project.name}
											width={1000}
											height={562}
											sizes="(max-width: 768px) 100vw"
											className="w-full h-full object-cover"
										/>
									</div>

									{/* Project info */}
									<div className="p-3">
										<h3 className="font-brand text-base font-bold text-foreground mb-1">
											{project.name}
										</h3>
										<p className="text-[11px] text-muted-foreground font-mono mb-2">
											{project.description}
										</p>

										<p className="text-sm text-muted-foreground line-clamp-3 mb-3">
											{project.details}
										</p>

										{/* Founder info */}
										<div className="pt-2 border-t border-gray-50 dark:border-border">
											<div className="flex items-start gap-2 mb-1">
												<ArrowRightIcon className="w-3 h-3 text-foreground mt-0.5 flex-shrink-0" />
												<div>
													<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
														<span className="text-xs font-bold text-foreground">
															{t("founderPrefix")}{" "}
															{
																project.founder
																	.name
															}
														</span>
														<span className="text-[10px] text-gray-400 dark:text-muted-foreground font-mono">
															{
																project.founder
																	.title
															}
														</span>
													</div>
												</div>
											</div>
											<p className="text-[10px] text-gray-400 dark:text-muted-foreground pl-5 line-clamp-3">
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
											? "bg-black dark:bg-white"
											: "bg-gray-300 dark:bg-[#262626]"
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Bottom call to action */}
				<div className="text-center mt-12">
					<Link
						href="/projects"
						className="inline-flex items-center bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
					>
						{t("cta")}
						<ArrowRightIcon className="ml-2 size-4" />
					</Link>
				</div>
			</div>
		</section>
	);
}
