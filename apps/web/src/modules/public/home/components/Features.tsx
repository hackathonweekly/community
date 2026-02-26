import { CalendarIcon, PresentationIcon, RocketIcon } from "lucide-react";
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
			image: "/images/events/demo00001.webp",
		},
		{
			icon: RocketIcon,
			title: t("hackathon.title"),
			description: t("hackathon.description"),
			href: "/events?type=hackathon",
			cta: t("hackathon.cta"),
			highlight: "快速学习",
			stats: t("hackathon.stats"),
			image: "/images/events/hack00003.webp",
		},
		{
			icon: CalendarIcon,
			title: t("cowork.title"),
			description: t("cowork.description"),
			href: "/events?type=cowork",
			cta: t("cowork.cta"),
			highlight: "持续创造",
			stats: t("cowork.stats"),
			image: "/images/events/meet00006.webp",
		},
	];
	return (
		<section className="py-16 md:py-24 bg-white dark:bg-[#0A0A0A] overflow-hidden">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="mb-5 flex justify-center">
						<div className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 border border-border">
							<CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-muted-foreground" />
							<span className="text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
								{t("tagline")}
							</span>
						</div>
					</div>

					<h2 className="font-brand text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground">
						{t("title1")}
						<span className="block text-gray-400 dark:text-muted-foreground">
							{t("title2")}
						</span>
					</h2>

					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Feature cards */}
				<div className="grid lg:grid-cols-3 gap-4">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col"
						>
							{/* Feature Image */}
							<div className="h-32 overflow-hidden relative border-b border-gray-50 dark:border-border">
								<Image
									src={feature.image}
									alt={feature.title}
									width={400}
									height={200}
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div className="absolute bottom-2 left-2 bg-white/90 dark:bg-card/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight text-gray-800 dark:text-white border border-border">
									{feature.highlight}
								</div>
							</div>

							{/* Content */}
							<div className="p-3 flex-1 flex flex-col">
								<div className="flex items-center gap-3 mb-2">
									<div className="p-2 rounded-md bg-gray-50 dark:bg-secondary border border-border">
										<feature.icon className="w-4 h-4 text-foreground" />
									</div>
									<div>
										<h3 className="font-brand text-base font-bold text-foreground leading-tight">
											{feature.title}
										</h3>
										<span className="text-[11px] text-muted-foreground font-mono">
											{feature.stats}
										</span>
									</div>
								</div>

								<p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">
									{feature.description}
								</p>

								{/* CTA Button */}
								<Link
									href={feature.href}
									className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-md text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-center block"
								>
									{feature.cta}
								</Link>
							</div>
						</div>
					))}
				</div>

				{/* Bottom call to action */}
				<div className="text-center mt-12">
					<div className="max-w-2xl mx-auto">
						<h3 className="font-brand text-xl font-bold text-foreground mb-3">
							{t("ctaTitle")}
						</h3>
						<p className="text-muted-foreground text-sm mb-6">
							{t("ctaDescription")}
						</p>
						<Link
							href="/events"
							className="inline-flex items-center bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
						>
							{t("ctaButton")}
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
