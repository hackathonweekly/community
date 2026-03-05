import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@community/ui/ui/accordion";
import { ArrowRightIcon, HelpCircleIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function FAQ() {
	const t = useTranslations("faq");

	interface FAQItem {
		question: string;
		answer: ReactNode;
		category: string;
	}

	const faqs: FAQItem[] = [
		{
			question: t("questions.what.question"),
			answer: (
				<span>
					{t("questions.what.answer")}
					<Link
						href="/docs/hackathon-guide"
						className="text-foreground hover:text-gray-600 dark:hover:text-[#A3A3A3] font-bold ml-2 transition-colors"
					>
						{t("viewGuideLink")}
					</Link>
				</span>
			),
			category: t("categories.basic"),
		},
		{
			question: t("questions.nonTech.question"),
			answer: t("questions.nonTech.answer"),
			category: t("categories.friendly"),
		},
		{
			question: t("questions.mvp.question"),
			answer: t("questions.mvp.answer"),
			category: t("categories.concept"),
		},
		{
			question: t("questions.activities.question"),
			answer: t("questions.activities.answer"),
			category: t("categories.activities"),
		},
		{
			question: t("questions.collaborate.question"),
			answer: t("questions.collaborate.answer"),
			category: t("categories.collaboration"),
		},
		{
			question: t("questions.fee.question"),
			answer: t("questions.fee.answer"),
			category: t("categories.cost"),
		},
	];

	return (
		<section className="py-16 md:py-24 bg-white dark:bg-[#0A0A0A]">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="mb-5 flex justify-center">
						<div className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 border border-border">
							<HelpCircleIcon className="w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-muted-foreground" />
							<span className="text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
								{t("badge")}
							</span>
						</div>
					</div>
					<h2 className="font-brand text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground">
						{t("title.part1")}
						<span className="block text-gray-400 dark:text-muted-foreground">
							{t("title.part2")}
						</span>
					</h2>
					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("description")}
					</p>
				</div>

				{/* FAQ Content */}
				<div className="max-w-4xl mx-auto">
					<Accordion type="single" collapsible className="space-y-3">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={`faq-${index}`}
								value={`faq-${index}`}
								className="border-0 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
							>
								<AccordionTrigger
									className="text-left px-4 py-3 hover:no-underline"
									aria-label={t("expandQuestion", {
										question: faq.question,
									})}
								>
									<div className="flex items-start gap-3 text-left">
										<span className="px-1.5 py-0.5 bg-accent text-gray-600 dark:text-muted-foreground rounded text-[10px] font-bold uppercase tracking-tight border border-border mt-0.5 shrink-0">
											{faq.category}
										</span>
										<span className="text-base font-bold text-foreground">
											{faq.question}
										</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-4 pb-4 text-muted-foreground leading-relaxed text-sm">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>

				{/* Additional resources */}
				<div className="mt-12 text-center">
					<div className="max-w-2xl mx-auto">
						<h3 className="font-brand text-xl font-bold text-foreground mb-3">
							{t("moreQuestions.title")}
						</h3>
						<p className="text-muted-foreground text-sm mb-6">
							{t("moreQuestions.description")}
						</p>

						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<Link
								href="/events"
								className="inline-flex items-center justify-center bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
							>
								{t("moreQuestions.joinEvent")}
								<ArrowRightIcon className="ml-2 w-4 h-4" />
							</Link>
							<Link
								href="mailto:contact@hackathonweekly.com"
								className="inline-flex items-center justify-center bg-card border border-border text-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-muted transition-colors"
							>
								{t("moreQuestions.emailConsult")}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
