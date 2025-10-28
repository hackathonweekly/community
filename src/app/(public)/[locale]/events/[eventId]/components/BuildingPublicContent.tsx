"use client";

import { BuildingPublicPage } from "@/modules/dashboard/events/components/BuildingPublicPage";
import type { BuildingConfig } from "../types/event-types";

interface BuildingPublicContentProps {
	event: {
		id: string;
		title: string;
		richContent: string;
		shortDescription?: string;
		startTime: string;
		endTime: string;
		status: string;
		buildingConfig?: BuildingConfig;
	};
	currentUserId?: string;
	eventRegistration?: {
		status: string;
	} | null;
	registrationStatusText?: string;
	onOpenRegistration?: () => void;
	onDataRefresh?: () => void;
}

export function BuildingPublicContent({
	event,
	currentUserId,
	eventRegistration,
	registrationStatusText,
	onOpenRegistration,
	onDataRefresh,
}: BuildingPublicContentProps) {
	return (
		<BuildingPublicPage
			event={{
				...event,
				buildingConfig: event.buildingConfig || {
					duration: 21,
					requiredCheckIns: 7,
					depositAmount: 0,
					refundRate: 0,
					isPublic: true,
					allowAnonymous: false,
					enableVoting: true,
					paymentType: "CUSTOM",
				},
			}}
			currentUserId={currentUserId}
			eventRegistration={eventRegistration ?? null}
			registrationStatusText={registrationStatusText}
			onOpenRegistration={onOpenRegistration}
			onDataRefresh={onDataRefresh}
		/>
	);
}
