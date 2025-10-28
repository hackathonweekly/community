import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

	// FAQ数据从翻译中获取
	const faqs: FAQItem[] = [
		{
			question: t("questions.what.question"),
			answer: (
				<span>
					{t("questions.what.answer")}
					<Link
						href="/docs/hackathon-guide"
						className="text-purple-600 hover:text-purple-700 font-medium ml-2 transition-colors"
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
		<section className="py-20 md:py-28">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<HelpCircleIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								{t("badge")}
							</span>
						</div>
					</div>
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						{t("title.part1")}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							{t("title.part2")}
						</span>
					</h2>
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("description")}
					</p>
				</div>

				{/* FAQ Content */}
				<div className="max-w-4xl mx-auto">
					<Accordion type="single" collapsible className="space-y-4">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={`faq-${index}`}
								value={`faq-${index}`}
								className="border-0 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow"
							>
								<AccordionTrigger
									className="text-left px-6 py-4 hover:no-underline"
									aria-label={t("expandQuestion", {
										question: faq.question,
									})}
								>
									<div className="flex items-start gap-3 text-left">
										<Badge className="text-xs mt-0.5 shrink-0 bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors">
											{faq.category}
										</Badge>
										<span className="text-lg font-medium text-foreground">
											{faq.question}
										</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-6 pb-6 text-muted-foreground leading-relaxed text-base">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>

				{/* Additional resources */}
				<div className="mt-16 text-center">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							{t("moreQuestions.title")}
						</h3>
						<p className="text-muted-foreground mb-8">
							{t("moreQuestions.description")}
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
							<Button
								size="lg"
								className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
								asChild
							>
								<Link href="/events">
									{t("moreQuestions.joinEvent")}
									<ArrowRightIcon className="ml-2 w-5 h-5" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-2 hover:bg-muted"
								asChild
							>
								<Link href="mailto:contact@hackathonweekly.com">
									{t("moreQuestions.emailConsult")}
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
