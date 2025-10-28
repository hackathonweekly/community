import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function WarmCommunity() {
	const t = useTranslations("warmCommunity");
	const locale = useLocale();

	const features = [
		{
			icon: t("features.home.icon"),
			title: t("features.home.title"),
			description: t("features.home.description"),
		},
		{
			icon: t("features.support.icon"),
			title: t("features.support.title"),
			description: t("features.support.description"),
		},
		{
			icon: t("features.partners.icon"),
			title: t("features.partners.title"),
			description: t("features.partners.description"),
		},
		{
			icon: t("features.joy.icon"),
			title: t("features.joy.title"),
			description: t("features.joy.description"),
		},
	];

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

					{/* Main description - following design system */}
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
						{t("subtitle")}
					</p>

					{/* Secondary description - following design system */}
					{/* <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
						{t("description")}
					</p> */}
				</div>

				{/* Main content grid */}
				<div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center mb-16 md:mb-20">
					{/* Left: Community image */}
					<div className="order-2 lg:order-1">
						<div className="relative rounded-3xl overflow-hidden shadow-xl">
							<div className="aspect-[4/3]">
								<Image
									src="/images/events/gdc00007.jpg"
									alt="温暖的社区聚会场景"
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
								/>
							</div>
						</div>
					</div>

					{/* Right: Features grid */}
					<div className="order-1 lg:order-2">
						<div className="grid sm:grid-cols-2 gap-6">
							{features.map((feature, index) => (
								<Card
									key={index}
									className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card"
								>
									<CardContent className="p-6">
										<div className="text-center">
											{/* Emoji icon display */}
											<div className="text-4xl mb-4">
												{feature.icon}
											</div>
											{/* H3 title - following design system */}
											<h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
												{feature.title}
											</h3>
											{/* Description - following design system */}
											<p className="text-sm text-muted-foreground leading-relaxed">
												{feature.description}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>

				{/* Transition to activities - following design system */}
				<div className="text-center">
					<div className="mb-8">
						<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
							{t("activitiesTransition")}
						</p>
					</div>
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md"
						asChild
					>
						<Link href={`/${locale}/events`}>
							{t("cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
