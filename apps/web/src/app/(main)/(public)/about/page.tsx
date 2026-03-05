import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CallToAction } from "@/modules/public/home/components/CallToAction";
import { CommunityChapters } from "@/modules/public/home/components/CommunityChapters";
import { FAQ } from "@/modules/public/home/components/FAQ";
import { FeaturedProjects } from "@/modules/public/home/components/FeaturedProjects";
import { Features } from "@/modules/public/home/components/Features";
import { Hero } from "@/modules/public/home/components/Hero";
import { JoinCommunity } from "@/modules/public/home/components/JoinCommunity";
import { Partners } from "@/modules/public/home/components/Partners";
import { WarmCommunity } from "@/modules/public/home/components/WarmCommunity";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("page.home");

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function AboutPage() {
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
