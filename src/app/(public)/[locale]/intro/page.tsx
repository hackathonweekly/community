import { CommunityShowcase } from "@/modules/public/intro/components/CommunityShowcase";
import { ContactPartnership } from "@/modules/public/intro/components/ContactPartnership";
import { ExistingPartners } from "@/modules/public/intro/components/ExistingPartners";
import { IntroHero } from "@/modules/public/intro/components/IntroHero";
import { PartnershipModes } from "@/modules/public/intro/components/PartnershipModes";
import { PartnershipValue } from "@/modules/public/intro/components/PartnershipValue";
import { setRequestLocale } from "next-intl/server";

export default async function IntroPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<IntroHero />
			<CommunityShowcase />
			<PartnershipModes />
			{/* <ResourceNeeds /> */}
			<PartnershipValue />
			<ExistingPartners />
			{/* <PartnershipFAQ /> */}
			<ContactPartnership />
		</>
	);
}
