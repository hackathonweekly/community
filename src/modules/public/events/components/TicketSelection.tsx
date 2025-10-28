"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "next-intl";
import type { TicketType } from "./types";

interface TicketSelectionProps {
	availableTicketTypes: TicketType[];
	selectedTicketType: string;
	onTicketTypeChange: (ticketTypeId: string) => void;
}

export function TicketSelection({
	availableTicketTypes,
	selectedTicketType,
	onTicketTypeChange,
}: TicketSelectionProps) {
	const t = useTranslations("events.registration");

	const formatPrice = (price?: number) => {
		if (!price) {
			return t("free");
		}
		return `¥${price.toFixed(2)}`;
	};

	if (availableTicketTypes.length <= 1) {
		return null;
	}

	return (
		<div className="space-y-3">
			<Label className="text-base font-medium">
				{t("selectTicketType")}
			</Label>
			<RadioGroup
				value={selectedTicketType}
				onValueChange={onTicketTypeChange}
				className="space-y-3"
			>
				{availableTicketTypes.map((ticket) => (
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
									{ticket.name} - {formatPrice(ticket.price)}
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
		</div>
	);
}
