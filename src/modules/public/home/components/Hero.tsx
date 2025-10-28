import { Button } from "@/components/ui/button";
import { LocaleLink } from "@i18n/routing";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
	const t = useTranslations("hero");

	return (
		<div className="relative max-w-full overflow-x-hidden bg-background min-h-[calc(100vh-6rem)] flex items-center">
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[300px] w-[600px] sm:h-[400px] sm:w-[800px] lg:h-[500px] lg:w-[1000px] rounded-full bg-gradient-to-r from-purple-400/20 to-purple-300/10 opacity-60 blur-[150px]" />
			<div className="container relative z-20 text-center px-4 md:px-6 py-4 md:py-0">
				{/* Tag line */}
				<div className="mb-6 md:mb-8 flex justify-center">
					<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
						<span className="text-purple-700 font-medium text-xs md:text-sm">
							{t("v2.year")}
						</span>
						<span className="ml-2 text-muted-foreground text-xs md:text-sm">
							{t("v2.communityTag")}
						</span>
					</div>
				</div>

				{/* Main title - split color headline */}
				<h1 className="mx-auto max-w-4xl text-center mb-4 font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-tight">
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
						{t("v2.titlePart1")}{" "}
					</span>
					<span className="text-foreground">
						{t("v2.titlePart2")}
					</span>
				</h1>

				{/* Subtitle - two lines */}
				<div className="mx-auto max-w-2xl text-center mt-5 md:mt-8 mb-8 md:mb-12">
					<p className="text-base md:text-xl text-muted-foreground px-2">
						{t("v2.subtitle1")}
						<br className="hidden sm:block" />
						<span className="sm:hidden"> </span>
						{t("v2.subtitle2")}
					</p>
				</div>

				{/* Call to Action Buttons */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full sm:w-auto px-3 sm:px-0">
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:w-auto sm:min-w-40 shadow-md"
						asChild
					>
						<Link href="/auth/login">
							{t("v2.primaryCta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="w-full sm:w-auto sm:min-w-40 border-gray-300"
						asChild
					>
						<LocaleLink href="/docs">
							<code className="mr-2">&lt;/&gt;</code>
							{t("v2.secondaryCta")}
						</LocaleLink>
					</Button>
				</div>

				{/* Social proof */}
				<div className="mt-12 md:mt-16 text-center">
					<div className="flex justify-center -space-x-1.5 sm:-space-x-2 mb-3 md:mb-4">
						{/* Real avatars from photos */}
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat1.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat2.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat3.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat4.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
						<div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full border-2 border-white overflow-hidden">
							<Image
								src="/images/avatars/wechat5.jpg"
								alt="Community member"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 32px, 40px"
							/>
						</div>
					</div>
					<p className="text-sm md:text-base text-muted-foreground">
						{t("v2.socialProof")}
					</p>
				</div>
			</div>
		</div>
	);
}
