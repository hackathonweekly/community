import { NewHero } from "@/modules/public/newlanding/components/NewHero";
import { PainPoints } from "@/modules/public/newlanding/components/PainPoints";
import { Solutions } from "@/modules/public/newlanding/components/Solutions";
import { ActivitySystem } from "@/modules/public/newlanding/components/ActivitySystem";
import { RealResults } from "@/modules/public/newlanding/components/RealResults";
import { Differentiation } from "@/modules/public/newlanding/components/Differentiation";
import { CityChapters } from "@/modules/public/newlanding/components/CityChapters";
import { ParticipationPaths } from "@/modules/public/newlanding/components/ParticipationPaths";
import { NewFAQ } from "@/modules/public/newlanding/components/NewFAQ";
import { FinalCTA } from "@/modules/public/newlanding/components/FinalCTA";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "周周黑客松 - 创造，从不孤单",
	description:
		"你的第一个伙伴，和第一个 MVP，都在这里。AI 创造者社区，从想法到产品的完整陪伴。",
};

export default async function NewLandingPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<NewHero />
			<PainPoints />
			<Solutions />
			<ActivitySystem />
			<RealResults />
			<Differentiation />
			<CityChapters />
			<ParticipationPaths />
			<NewFAQ />
			<FinalCTA />
		</>
	);
}
