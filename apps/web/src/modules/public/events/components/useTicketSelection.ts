import { useEffect, useMemo } from "react";
import type { TicketType } from "./types";

interface UseTicketSelectionParams {
	ticketTypes: TicketType[];
	selectedTicketType: string;
	selectedQuantity: number;
	onQuantityChange: (quantity: number) => void;
	disableSelection?: boolean;
}

export const useTicketSelection = ({
	ticketTypes,
	selectedTicketType,
	selectedQuantity,
	onQuantityChange,
	disableSelection = false,
}: UseTicketSelectionParams) => {
	const availableTicketTypes = useMemo(
		() =>
			ticketTypes.filter(
				(ticket) =>
					ticket?.isActive &&
					(!ticket.maxQuantity ||
						ticket.currentQuantity < ticket.maxQuantity),
			),
		[ticketTypes],
	);

	const selectedTicket = useMemo(() => {
		if (disableSelection) {
			return undefined;
		}
		if (availableTicketTypes.length === 1) {
			return availableTicketTypes[0];
		}
		return availableTicketTypes.find(
			(ticket) => ticket.id === selectedTicketType,
		);
	}, [availableTicketTypes, selectedTicketType, disableSelection]);

	const selectedTier = useMemo(() => {
		return selectedTicket?.priceTiers?.find(
			(tier) => tier.quantity === selectedQuantity,
		);
	}, [selectedTicket, selectedQuantity]);

	useEffect(() => {
		if (!selectedTicket) {
			if (selectedQuantity !== 1) {
				onQuantityChange(1);
			}
			return;
		}
		const tiers = selectedTicket.priceTiers ?? [];
		if (tiers.length > 0) {
			if (!tiers.some((tier) => tier.quantity === selectedQuantity)) {
				onQuantityChange(tiers[0]?.quantity ?? 1);
			}
			return;
		}
		if (selectedQuantity !== 1) {
			onQuantityChange(1);
		}
	}, [selectedTicket, selectedQuantity, onQuantityChange]);

	const resolvedPrice = selectedTier?.price ?? selectedTicket?.price ?? 0;
	const isPaidTicket = resolvedPrice > 0;

	return {
		availableTicketTypes,
		selectedTicket,
		selectedTier,
		resolvedPrice,
		isPaidTicket,
	};
};
