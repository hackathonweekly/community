import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@shared/auth/lib/server";
import { Hero } from "@/modules/public/home/components/Hero";
import { WarmCommunity } from "@/modules/public/home/components/WarmCommunity";
import { Features } from "@/modules/public/home/components/Features";
import { FeaturedProjects } from "@/modules/public/home/components/FeaturedProjects";
import { CommunityChapters } from "@/modules/public/home/components/CommunityChapters";
import { CallToAction } from "@/modules/public/home/components/CallToAction";
import { Partners } from "@/modules/public/home/components/Partners";
import { FAQ } from "@/modules/public/home/components/FAQ";
import { JoinCommunity } from "@/modules/public/home/components/JoinCommunity";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("page.home");

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function Home() {
	const session = await getSession();

	if (session?.user) {
		redirect("/events");
	}

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
