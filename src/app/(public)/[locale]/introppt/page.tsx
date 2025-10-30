import { CommunityAtmosphereSection } from "@/modules/public/introppt/components/CommunityAtmosphereSection";
import { DifferentiationSection } from "@/modules/public/introppt/components/DifferentiationSection";
import { FutureSection } from "@/modules/public/introppt/components/FutureSection";
import { IntroPPTHero } from "@/modules/public/introppt/components/IntroPPTHero";
import { OperationModelSection } from "@/modules/public/introppt/components/OperationModelSection";
import { PainPointsSection } from "@/modules/public/introppt/components/PainPointsSection";
import { ParticipationSection } from "@/modules/public/introppt/components/ParticipationSection";
import { ResultsSection } from "@/modules/public/introppt/components/ResultsSection";
import { SolutionsSection } from "@/modules/public/introppt/components/SolutionsSection";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
	title: "社区介绍 - 周周黑客松",
	description:
		"为创造者打造一个可以随时回来的家。爱·自由·创造 - 用 AI 帮助千万创造者打造有价值、有意义、有趣的产品。",
};

export default async function IntroPPTPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<IntroPPTHero />
			<PainPointsSection />
			<SolutionsSection />
			<ResultsSection />
			<DifferentiationSection />
			<CommunityAtmosphereSection />
			<ParticipationSection />
			<OperationModelSection />
			<FutureSection />
		</>
	);
}
