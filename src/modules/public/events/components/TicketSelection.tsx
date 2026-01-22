"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { TicketType } from "./types";

interface TicketSelectionProps {
	availableTicketTypes: TicketType[];
	selectedTicketType: string;
	onTicketTypeChange: (ticketTypeId: string) => void;
	selectedQuantity: number;
	onQuantityChange: (quantity: number) => void;
}

export function TicketSelection({
	availableTicketTypes,
	selectedTicketType,
	onTicketTypeChange,
	selectedQuantity,
	onQuantityChange,
}: TicketSelectionProps) {
	const t = useTranslations("events.registration");

	const selectedTicket = availableTicketTypes.find(
		(ticket) => ticket.id === selectedTicketType,
	);

	const formatPrice = (price?: number) => {
		if (!price) {
			return t("free");
		}
		return `¥${price.toFixed(2)}`;
	};

	useEffect(() => {
		if (availableTicketTypes.length === 0) {
			if (selectedTicketType) {
				onTicketTypeChange("");
			}
			return;
		}

		if (availableTicketTypes.length === 1) {
			const [singleTicket] = availableTicketTypes;
			if (singleTicket && selectedTicketType !== singleTicket.id) {
				onTicketTypeChange(singleTicket.id);
			}
			return;
		}

		const hasSelectedTicket = availableTicketTypes.some(
			(ticket) => ticket && ticket.id === selectedTicketType,
		);

		if (!hasSelectedTicket && selectedTicketType) {
			onTicketTypeChange("");
		}
	}, [availableTicketTypes, onTicketTypeChange, selectedTicketType]);

	if (availableTicketTypes.length === 0) {
		return null;
	}

	const hasMultipleOptions = availableTicketTypes.length > 1;
	const tiers = selectedTicket?.priceTiers ?? [];

	return (
		<div className="space-y-3">
			<Label className="text-base font-medium">
				{t("selectTicketType")}
			</Label>
			{hasMultipleOptions ? (
				<RadioGroup
					value={selectedTicketType}
					onValueChange={onTicketTypeChange}
					className="space-y-3"
				>
					{availableTicketTypes
						.filter((ticket) => ticket)
						.map((ticket) => (
							<div
								key={ticket.id}
								className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
							>
								<RadioGroupItem
									value={ticket.id}
									id={`ticket-${ticket.id}`}
									className="mt-1"
								/>
								<div className="flex-1">
									<Label
										htmlFor={`ticket-${ticket.id}`}
										className="cursor-pointer"
									>
										<div className="font-medium">
											{ticket.name} -{" "}
											{formatPrice(ticket.price)}
										</div>
										{ticket.description && (
											<div className="text-sm text-muted-foreground mt-1">
												{ticket.description}
											</div>
										)}
										{ticket.maxQuantity && (
											<div className="text-xs text-muted-foreground mt-1">
												{t("remaining", {
													count:
														ticket.maxQuantity -
														ticket.currentQuantity,
												})}
											</div>
										)}
									</Label>
								</div>
							</div>
						))}
				</RadioGroup>
			) : (
				<div className="space-y-1 rounded-lg border bg-muted/30 p-4">
					{availableTicketTypes
						.filter((ticket) => ticket)
						.map((ticket) => (
							<div key={ticket.id}>
								<div className="text-sm text-muted-foreground">
									{t("ticketType")}
								</div>
								<div className="text-base font-semibold">
									{ticket.name} - {formatPrice(ticket.price)}
								</div>
								{ticket.description && (
									<div className="text-sm text-muted-foreground">
										{ticket.description}
									</div>
								)}
								{ticket.maxQuantity && (
									<div className="text-xs text-muted-foreground">
										{t("remaining", {
											count:
												ticket.maxQuantity -
												ticket.currentQuantity,
										})}
									</div>
								)}
							</div>
						))}
				</div>
			)}
			{tiers.length > 0 && (
				<div className="mt-4 space-y-2">
					<Label className="text-sm font-medium">选择票档数量</Label>
					<RadioGroup
						value={String(selectedQuantity)}
						onValueChange={(value) =>
							onQuantityChange(Number(value))
						}
						className="space-y-2"
					>
						{tiers.map((tier) => (
							<div
								key={tier.quantity}
								className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50"
							>
								<RadioGroupItem
									value={String(tier.quantity)}
									id={`ticket-qty-${tier.quantity}`}
									className="mt-1"
								/>
								<Label
									htmlFor={`ticket-qty-${tier.quantity}`}
									className="cursor-pointer"
								>
									{tier.quantity} 人票 -{" "}
									{formatPrice(tier.price)}
								</Label>
							</div>
						))}
					</RadioGroup>
				</div>
			)}
		</div>
	);
}
