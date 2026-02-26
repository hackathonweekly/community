import { HandshakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
	{
		name: "tencentcloud",
		logo: "/images/partners/tencentcloud.png",
	},
	{
		name: "yuanqi",
		logo: "/images/partners/yuanqi.png",
	},
	{
		name: "MIP",
		logo: "/images/partners/MIP.png",
	},
];

export function Partners() {
	const t = useTranslations("partners");

	return (
		<section className="py-16 md:py-24 bg-background">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12 md:mb-16">
					<div className="mb-5 flex justify-center">
						<div className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 border border-border">
							<HandshakeIcon className="w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-muted-foreground" />
							<span className="text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
								{t("ecosystem")}
							</span>
						</div>
					</div>
					<h2 className="font-brand text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground">
						{t("collaboration")}
						<span className="block text-gray-400 dark:text-muted-foreground">
							{t("together")}
						</span>
					</h2>
					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("supportCommunity")}
					</p>
				</div>

				{/* Partners showcase */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
					{partners.map((partner) => (
						<div
							key={partner.name}
							className="bg-card rounded-lg border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
						>
							<div className="relative h-12 md:h-16 flex items-center justify-center">
								<Image
									src={partner.logo}
									alt={partner.name}
									width={120}
									height={80}
									className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
