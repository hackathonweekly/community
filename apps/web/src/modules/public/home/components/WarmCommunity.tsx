import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function WarmCommunity() {
	const t = useTranslations("warmCommunity");

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

				{/* Main content grid */}
				<div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
					{/* Left: Community image */}
					<div className="order-2 lg:order-1">
						<div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
							<div className="aspect-[4/3]">
								<Image
									src="/images/events/gdc00007.webp"
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
						<div className="grid sm:grid-cols-2 gap-4">
							{features.map((feature, index) => (
								<div
									key={index}
									className="bg-card rounded-lg border border-border p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
								>
									<div className="text-center">
										<div className="text-3xl mb-3">
											{feature.icon}
										</div>
										<h3 className="font-brand text-base font-bold text-foreground mb-2">
											{feature.title}
										</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Transition to activities */}
				<div className="text-center">
					<div className="mb-6">
						<p className="text-base text-muted-foreground max-w-2xl mx-auto">
							{t("activitiesTransition")}
						</p>
					</div>
					<Link
						href="/events"
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
