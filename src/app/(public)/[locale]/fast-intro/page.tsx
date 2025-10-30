import { FastIntroHero } from "@/modules/public/fastintro/components/FastIntroHero";
import { WhoWeAreSection } from "@/modules/public/fastintro/components/WhoWeAreSection";
import { WhatWeDoSection } from "@/modules/public/fastintro/components/WhatWeDoSection";
import { SuccessStoriesSection } from "@/modules/public/fastintro/components/SuccessStoriesSection";
import { GetInvolvedSection } from "@/modules/public/fastintro/components/GetInvolvedSection";
import { BecomeMemberSection } from "@/modules/public/fastintro/components/BecomeMemberSection";
import { ContactSection } from "@/modules/public/fastintro/components/ContactSection";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "快速介绍 - 周周黑客松",
	description:
		"3分钟快速了解周周黑客松。每周末，一起创造有意思的作品！组队打黑客松，做MVP。",
};

export default async function FastIntroPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<FastIntroHero />
			<WhoWeAreSection />
			<WhatWeDoSection />
			<SuccessStoriesSection />
			<GetInvolvedSection />
			<BecomeMemberSection />
			<ContactSection />
		</>
	);
}
