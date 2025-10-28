"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
			image: "/images/events/meet00002.jpg",
			description: t("cities.shenzhen.description"),
		},
		{
			city: t("cities.hangzhou.name"),
			members: t("cities.hangzhou.members"),
			status: t("cities.hangzhou.status"),
			image: "/images/events/meet00001.jpg",
			description: t("cities.hangzhou.description"),
		},
		{
			city: t("cities.beijing.name"),
			members: t("cities.beijing.members"),
			status: t("cities.beijing.status"),
			image: "/images/events/meet00007.jpg",
			description: t("cities.beijing.description"),
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case t("cities.shenzhen.status"):
				return "bg-green-500 text-white";
			default:
				return "bg-gray-500 text-white";
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

	return (
		<section className="py-20 md:py-28">
			<div className="container px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<MapPinIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								{t("tagline")}
							</span>
						</div>
					</div>
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						{t("title1")}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							{t("title2")}
						</span>
					</h2>
					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* City grid */}
				<div>
					{/* Desktop grid view */}
					<div className="hidden md:grid grid-cols-3 gap-6 mb-12">
						{cityStats.map((city) => (
							<Card
								key={city.city}
								className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
							>
								<div className="relative h-40 overflow-hidden">
									<Image
										src={city.image}
										alt={`${city.city}${t("chapterSuffix")}`}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
									<div className="absolute top-3 right-3">
										<Badge
											className={getStatusColor(
												city.status,
											)}
										>
											{city.status}
										</Badge>
									</div>
									<div className="absolute bottom-3 left-3">
										<div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1">
											<span className="text-white text-sm font-medium">
												{city.members}{" "}
												{t("membersSuffix")}
											</span>
										</div>
									</div>
								</div>
								<CardContent className="p-6">
									<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
										{city.city}
										{t("chapterSuffix")}
									</h3>
									<p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
										{city.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Mobile sliding view */}
					<div className="md:hidden mb-12 flex justify-center items-end">
						<div
							ref={scrollRef}
							className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 px-4"
						>
							{cityStats.map((city) => (
								<Card
									key={city.city}
									className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm snap-center group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
								>
									<div className="relative h-40 overflow-hidden">
										<Image
											src={city.image}
											alt={`${city.city}${t("chapterSuffix")}`}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
										/>
										<div className="absolute top-3 right-3">
											<Badge
												className={getStatusColor(
													city.status,
												)}
											>
												{city.status}
											</Badge>
										</div>
										<div className="absolute bottom-3 left-3">
											<div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1">
												<span className="text-white text-sm font-medium">
													{city.members}{" "}
													{t("membersSuffix")}
												</span>
											</div>
										</div>
									</div>
									<CardContent className="p-6">
										<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
											{city.city}
											{t("chapterSuffix")}
										</h3>
										<p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
											{city.description}
										</p>
									</CardContent>
								</Card>
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
											? "bg-primary"
											: "bg-muted-foreground/30"
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							{t("ctaTitle")}
						</h3>
						<p className="text-muted-foreground mb-8">
							{t("ctaDescription")}
						</p>
						<Button
							size="lg"
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
							asChild
						>
							<Link href="/orgs">
								{t("ctaButton")}
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
