import {
	ArrowRightIcon,
	BookOpenIcon,
	HeartIcon,
	RocketIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function CallToAction() {
	const t = useTranslations("callToActionV2");

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

				{/* Three value cards */}
				<div className="grid md:grid-cols-3 gap-4 mb-12 md:mb-16">
					{/* Love Card */}
					<div className="bg-card rounded-lg border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-center">
						<div className="mb-4 flex justify-center">
							<div className="p-3 rounded-md bg-black dark:bg-white">
								<HeartIcon className="w-6 h-6 text-white dark:text-black" />
							</div>
						</div>
						<h3 className="font-brand text-xl font-bold text-foreground mb-2">
							{t("cards.love.title")}
						</h3>
						<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
							{t("cards.love.description")}
						</p>
						<Link
							href="/events"
							className="inline-flex items-center w-full justify-center bg-black dark:bg-white text-white dark:text-black py-2 rounded-md text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
						>
							{t("cards.love.cta")}
							<ArrowRightIcon className="ml-2 w-4 h-4" />
						</Link>
					</div>

					{/* Freedom Card */}
					<div className="bg-card rounded-lg border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-center">
						<div className="mb-4 flex justify-center">
							<div className="p-3 rounded-md bg-black dark:bg-white">
								<BookOpenIcon className="w-6 h-6 text-white dark:text-black" />
							</div>
						</div>
						<h3 className="font-brand text-xl font-bold text-foreground mb-2">
							{t("cards.freedom.title")}
						</h3>
						<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
							{t("cards.freedom.description")}
						</p>
						<Link
							href="/orgs"
							className="inline-flex items-center w-full justify-center bg-card border border-border text-foreground py-2 rounded-md text-xs font-bold hover:bg-muted transition-colors"
						>
							{t("cards.freedom.cta")}
							<ArrowRightIcon className="ml-2 w-4 h-4" />
						</Link>
					</div>

					{/* Creation Card */}
					<div className="bg-card rounded-lg border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-center">
						<div className="mb-4 flex justify-center">
							<div className="p-3 rounded-md bg-black dark:bg-white">
								<RocketIcon className="w-6 h-6 text-white dark:text-black" />
							</div>
						</div>
						<h3 className="font-brand text-xl font-bold text-foreground mb-2">
							{t("cards.creation.title")}
						</h3>
						<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
							{t("cards.creation.description")}
						</p>
						<Link
							href="/projects"
							className="inline-flex items-center w-full justify-center bg-black dark:bg-white text-white dark:text-black py-2 rounded-md text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
						>
							{t("cards.creation.cta")}
							<ArrowRightIcon className="ml-2 w-4 h-4" />
						</Link>
					</div>
				</div>

				{/* Bottom message */}
				<div className="text-center">
					<h3 className="font-brand text-xl md:text-2xl font-bold text-foreground mb-3">
						{t("bottomTitle")}
					</h3>
					<p className="text-base text-muted-foreground max-w-2xl mx-auto">
						{t("bottomSubtitle")}
					</p>
				</div>
			</div>
		</section>
	);
}
