import { IntroPPTHero } from "@/modules/public/introppt/components/IntroPPTHero";
import { PainPointsSection } from "@/modules/public/introppt/components/PainPointsSection";
import { SolutionsSection } from "@/modules/public/introppt/components/SolutionsSection";
import { ResultsSection } from "@/modules/public/introppt/components/ResultsSection";
import { DifferentiationSection } from "@/modules/public/introppt/components/DifferentiationSection";
import { CommunityAtmosphereSection } from "@/modules/public/introppt/components/CommunityAtmosphereSection";
import { ParticipationSection } from "@/modules/public/introppt/components/ParticipationSection";
import { OperationModelSection } from "@/modules/public/introppt/components/OperationModelSection";
import { FutureSection } from "@/modules/public/introppt/components/FutureSection";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "社区介绍 - 周周黑客松",
	description:
		"为创造者打造一个可以随时回来的家。爱·自由·创造 - 用 AI 帮助千万创造者打造有价值、有意义、又有趣的产品。",
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
