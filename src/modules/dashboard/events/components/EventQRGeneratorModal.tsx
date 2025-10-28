"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";

interface EventQRGeneratorModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
}

export function EventQRGeneratorModal({
	isOpen,
	onClose,
	eventId,
}: EventQRGeneratorModalProps) {
	const t = useTranslations("events.manage");

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[min(512px,95vw)] mx-auto">
				<DialogHeader>
					<DialogTitle>{t("eventQR.title")}</DialogTitle>
					<DialogDescription className="text-center">
						{t("eventQR.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 flex justify-center px-4">
					<div className="flex flex-col items-center w-full">
						<QRCode
							value={`${window.location.origin}/zh/events/${eventId}/checkin`}
							size={Math.min(256, window.innerWidth - 120)}
							className="max-w-full h-auto"
						/>
					</div>
				</div>
				<div className="text-sm text-muted-foreground text-center space-y-2 px-4">
					<p>{t("eventQR.shareDesc")}</p>
					<div className="bg-muted p-2 rounded text-xs font-mono break-all">
						{`${window.location.origin}/zh/events/${eventId}/checkin`}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
