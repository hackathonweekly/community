import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	CalendarIcon,
	PresentationIcon,
	RocketIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function Features() {
	const t = useTranslations("features");

	const features = [
		{
			icon: PresentationIcon,
			title: t("demoShow.title"),
			description: t("demoShow.description"),
			href: "/events?type=demo-inn",
			cta: t("demoShow.cta"),
			highlight: "获得反馈",
			stats: t("demoShow.stats"),
			image: "/images/events/demo00001.jpg",
		},
		{
			icon: RocketIcon,
			title: t("hackathon.title"),
			description: t("hackathon.description"),
			href: "/events?type=hackathon",
			cta: t("hackathon.cta"),
			highlight: "快速学习",
			stats: t("hackathon.stats"),
			image: "/images/events/hack00003.jpg",
		},
		{
			icon: CalendarIcon,
			title: t("cowork.title"),
			description: t("cowork.description"),
			href: "/events?type=cowork",
			cta: t("cowork.cta"),
			highlight: "持续创造",
			stats: t("cowork.stats"),
			image: "/images/events/meet00006.jpg",
		},
	];
	return (
		<section className="py-20 md:py-28 bg-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Header section */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<CalendarIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								{t("tagline")}
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						{t("title1")}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							{t("title2")}
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Feature cards */}
				<div className="grid lg:grid-cols-3 gap-8 md:gap-10">
					{features.map((feature) => (
						<Card
							key={feature.title}
							className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-full bg-card hover:-translate-y-1"
						>
							<CardContent className="p-6 h-full flex flex-col">
								{/* Feature Image */}
								<div className="mb-4 -mx-6 -mt-6">
									<Image
										src={feature.image}
										alt={feature.title}
										width={400}
										height={200}
										className="w-full h-48 object-cover"
									/>
								</div>

								{/* Icon and title */}
								<div className="flex items-center gap-4 mb-4">
									<div className="p-3 rounded-xl bg-purple-100 border border-purple-200">
										<feature.icon className="w-6 h-6 text-purple-600" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-foreground">
											{feature.title}
										</h3>
										<span className="text-sm text-purple-600 font-medium">
											{feature.stats}
										</span>
									</div>
								</div>

								{/* Description */}
								<p className="text-muted-foreground leading-relaxed mb-6 text-sm flex-1">
									{feature.description}
								</p>

								{/* CTA Button */}
								<Button
									className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
									asChild
									size="sm"
								>
									<Link href={feature.href}>
										{feature.cta}
									</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Bottom call to action */}
				<div className="text-center mt-16">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							{t("ctaTitle")}
						</h3>
						<p className="text-muted-foreground mb-8">
							{t("ctaDescription")}
						</p>
						<Button
							size="lg"
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
							asChild
						>
							<Link href="/events">
								{t("ctaButton")}
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
