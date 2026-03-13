import type { Metadata } from "next";
import { LandingPageSections } from "@/modules/public/home/components/LandingPageSections";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("page.home");

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function AboutPage() {
	return <LandingPageSections />;
}
