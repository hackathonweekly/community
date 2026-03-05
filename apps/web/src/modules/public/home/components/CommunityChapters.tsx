"use client";

import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function CommunityChapters() {
	const t = useTranslations("communityChapters");
	const [currentIndex, setCurrentIndex] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	const cityStats = [
		{
			city: t("cities.shenzhen.name"),
			members: t("cities.shenzhen.members"),
			status: t("cities.shenzhen.status"),
			image: "/images/events/meet00002.webp",
			description: t("cities.shenzhen.description"),
		},
		{
			city: t("cities.hangzhou.name"),
			members: t("cities.hangzhou.members"),
			status: t("cities.hangzhou.status"),
			image: "/images/events/meet00001.webp",
			description: t("cities.hangzhou.description"),
		},
		{
			city: t("cities.beijing.name"),
			members: t("cities.beijing.members"),
			status: t("cities.beijing.status"),
			image: "/images/events/meet00007.webp",
			description: t("cities.beijing.description"),
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case t("cities.shenzhen.status"):
				return "bg-green-50 text-green-700 border-green-100";
			default:
				return "bg-gray-100 text-gray-600 border-gray-200";
		}
	};

	const scrollToIndex = (index: number) => {
		if (scrollRef.current) {
			const cardWidth = scrollRef.current.offsetWidth;
			scrollRef.current.scrollTo({
				left: index * cardWidth,
				behavior: "smooth",
			});
		}
		setCurrentIndex(index);
	};

	const handleScroll = () => {
		if (scrollRef.current) {
			const cardWidth = scrollRef.current.offsetWidth;
			const scrollLeft = scrollRef.current.scrollLeft;
			const index = Math.round(scrollLeft / cardWidth);
			setCurrentIndex(index);
		}
	};

	useEffect(() => {
		const ref = scrollRef.current;
		if (ref) {
			ref.addEventListener("scroll", handleScroll);
			return () => ref.removeEventListener("scroll", handleScroll);
		}
	}, []);

	const CityCard = ({ city }: { city: (typeof cityStats)[0] }) => (
		<div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
			<div className="h-32 overflow-hidden relative border-b border-gray-50 dark:border-border">
				<Image
					src={city.image}
					alt={`${city.city}${t("chapterSuffix")}`}
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
					className="object-cover group-hover:scale-105 transition-transform duration-300"
				/>
				<div className="absolute top-2 right-2">
					<span
						className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(city.status)}`}
					>
						{city.status}
					</span>
				</div>
				<div className="absolute bottom-2 left-2">
					<div className="bg-white/90 dark:bg-card/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-800 dark:text-white border border-border">
						{city.members} {t("membersSuffix")}
					</div>
				</div>
			</div>
			<div className="p-3">
				<h3 className="font-brand text-base font-bold text-foreground mb-1">
					{city.city}
					{t("chapterSuffix")}
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{city.description}
				</p>
			</div>
		</div>
	);

	return (
		<section className="py-16 md:py-24 bg-white dark:bg-[#0A0A0A]">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="mb-5 flex justify-center">
						<div className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 border border-border">
							<MapPinIcon className="w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-muted-foreground" />
							<span className="text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
								{t("tagline")}
							</span>
						</div>
					</div>
					<h2 className="font-brand text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground">
						{t("title1")}
						<span className="block text-gray-400 dark:text-muted-foreground">
							{t("title2")}
						</span>
					</h2>
					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* City grid */}
				<div>
					{/* Desktop grid view */}
					<div className="hidden md:grid grid-cols-3 gap-4 mb-8">
						{cityStats.map((city) => (
							<CityCard key={city.city} city={city} />
						))}
					</div>

					{/* Mobile sliding view */}
					<div className="md:hidden mb-8 flex justify-center items-end">
						<div
							ref={scrollRef}
							className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 px-4"
						>
							{cityStats.map((city) => (
								<div
									key={city.city}
									className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm snap-center"
								>
									<CityCard city={city} />
								</div>
							))}
						</div>

						{/* Mobile dots indicator */}
						<div className="absolute space-x-2 mb-2">
							{cityStats.map((_, index) => (
								<button
									key={index}
									onClick={() => scrollToIndex(index)}
									className={`w-2 h-2 rounded-full transition-colors ${
										index === currentIndex
											? "bg-black dark:bg-white"
											: "bg-gray-300 dark:bg-[#262626]"
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center">
					<div className="max-w-2xl mx-auto">
						<h3 className="font-brand text-xl font-bold text-foreground mb-3">
							{t("ctaTitle")}
						</h3>
						<p className="text-muted-foreground text-sm mb-6">
							{t("ctaDescription")}
						</p>
						<Link
							href="/orgs"
							className="inline-flex items-center bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
						>
							{t("ctaButton")}
							<ArrowRightIcon className="ml-2 w-4 h-4" />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
