import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, HandshakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

const partners = [
	{
		name: "Trae",
		logo: "/images/partners/trae.png",
	},
	{
		name: "HackQuest",
		logo: "/images/partners/hackquest.png",
	},
	{
		name: "OpenBuild",
		logo: "/images/partners/OpenBuild.png",
	},
	{
		name: "706青年空间",
		logo: "/images/partners/706.jpg",
	},
	{
		name: "Bays Future",
		logo: "/images/partners/bays-future.png",
	},
	{
		name: "X-Accelerator",
		logo: "/images/partners/entropyfield.png",
	},
	{
		name: "ZPilot",
		logo: "/images/partners/zpilot.png",
	},
	{
		name: "WayToAGI",
		logo: "/images/partners/waytoagi.png",
	},
	{
		name: "AI Workshop",
		logo: "/images/partners/aiworkshop.png",
	},
	{
		name: "WTeam",
		logo: "/images/partners/wteam.png",
	},
];

export function Partners() {
	const t = useTranslations("partners");

	return (
		<section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12 md:mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 md:px-5 md:py-2 border border-blue-300">
							<HandshakeIcon className="w-4 h-4 mr-2 text-blue-700" />
							<span className="text-blue-700 font-medium text-xs md:text-sm">
								{t("ecosystem")}
							</span>
						</div>
					</div>
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						{t("collaboration")}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 block">
							{t("together")}
						</span>
					</h2>
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("supportCommunity")}
					</p>
				</div>

				{/* Partners showcase */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 mb-12">
					{partners.map((partner) => (
						<Card
							key={partner.name}
							className="group text-center border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-gray-800"
						>
							<CardContent className="p-4 md:p-6">
								<div className="relative h-16 md:h-20 flex items-center justify-center">
									<Image
										src={partner.logo}
										alt={partner.name}
										width={120}
										height={80}
										className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* CTA */}
				<div className="text-center">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							{t("becomePartnerCta")}
						</h3>
						<p className="text-muted-foreground mb-8">
							{t("partnershipInfo")}
						</p>
						<Button
							size="lg"
							className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
							asChild
						>
							<Link href="/zh/intro">
								{t("viewPartnership")}
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
