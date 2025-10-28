import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	BookOpenIcon,
	HeartIcon,
	RocketIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export function CallToAction() {
	const t = useTranslations("callToActionV2");
	const locale = useLocale();

	return (
		<section className="py-20 md:py-28 bg-background relative">
			{/* Subtle background decoration - following design system */}
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
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Three value cards with enhanced visual hierarchy */}
				<div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
					{/* Love Card */}
					<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card group hover:-translate-y-1">
						<CardContent className="p-6 md:p-8 text-center">
							<div className="mb-6 flex justify-center">
								{/* Enhanced icon container - following design system */}
								<div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
									<HeartIcon className="w-8 h-8 text-white" />
								</div>
							</div>
							{/* Enhanced title with larger font for better memorability */}
							<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
								{t("cards.love.title")}
							</h3>
							{/* Description - following design system */}
							<p className="text-muted-foreground mb-6 leading-relaxed">
								{t("cards.love.description")}
							</p>
							{/* Primary action button with gradient */}
							<Button
								className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full shadow-md"
								asChild
							>
								<Link href={`/${locale}/events`}>
									{t("cards.love.cta")}
									<ArrowRightIcon className="ml-2 w-4 h-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Freedom Card - elevated center position for hierarchy */}
					<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card group hover:-translate-y-1 md:-translate-y-1 transform md:scale-105">
						<CardContent className="p-6 md:p-8 text-center">
							<div className="mb-6 flex justify-center">
								{/* Icon container - following design system */}
								<div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
									<BookOpenIcon className="w-8 h-8 text-white" />
								</div>
							</div>
							{/* Enhanced title with larger font for better memorability */}
							<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
								{t("cards.freedom.title")}
							</h3>
							{/* Description - following design system */}
							<p className="text-muted-foreground mb-6 leading-relaxed">
								{t("cards.freedom.description")}
							</p>
							{/* Secondary button - outline style to reduce color overload */}
							<Button
								variant="outline"
								className="border-gray-300 text-muted-foreground w-full"
								asChild
							>
								<Link href="/zh/orgs">
									{t("cards.freedom.cta")}
									<ArrowRightIcon className="ml-2 w-4 h-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Creation Card - primary emphasis */}
					<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card group hover:-translate-y-1">
						<CardContent className="p-6 md:p-8 text-center">
							<div className="mb-6 flex justify-center">
								{/* Icon container - following design system */}
								<div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
									<RocketIcon className="w-8 h-8 text-white" />
								</div>
							</div>
							{/* Enhanced title with larger font for better memorability */}
							<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
								{t("cards.creation.title")}
							</h3>
							{/* Description - following design system */}
							<p className="text-muted-foreground mb-6 leading-relaxed">
								{t("cards.creation.description")}
							</p>
							{/* Primary action button with gradient */}
							<Button
								className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full shadow-md"
								asChild
							>
								<Link href="/zh/projects">
									{t("cards.creation.cta")}
									<ArrowRightIcon className="ml-2 w-4 h-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Bottom message - following design system */}
				<div className="text-center">
					<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
						{t("bottomTitle")}
					</h3>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						{t("bottomSubtitle")}
					</p>
				</div>
			</div>
		</section>
	);
}
