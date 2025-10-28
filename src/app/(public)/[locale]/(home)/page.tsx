import { CommunityChapters } from "@/modules/public/home/components/CommunityChapters";
import { FAQ } from "@/modules/public/home/components/FAQ";
import { FeaturedProjects } from "@/modules/public/home/components/FeaturedProjects";
import { Hero } from "@/modules/public/home/components/Hero";
import { WarmCommunity } from "@/modules/public/home/components/WarmCommunity";
import { CallToAction } from "@/modules/public/home/components/CallToAction";
import { Features } from "@/modules/public/home/components/Features";
import { JoinCommunity } from "@/modules/public/home/components/JoinCommunity";
import { Partners } from "@/modules/public/home/components/Partners";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "page.home" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<Hero />
			<WarmCommunity />
			<Features />
			<FeaturedProjects />
			<CommunityChapters />
			<CallToAction />
			<Partners />
			<FAQ />
			<JoinCommunity />
		</>
	);
}
