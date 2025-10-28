"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";

interface QRGeneratorProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
	userId: string;
	eventTitle: string;
	userName: string;
}

export function QRGenerator({
	isOpen,
	onClose,
	eventId,
	userId,
	eventTitle,
	userName,
}: QRGeneratorProps) {
	const t = useTranslations("events.manage.qrGenerator");

	// Generate QR code data
	const qrData = JSON.stringify({
		eventId,
		userId,
		type: "checkin",
		timestamp: Date.now(),
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{t("description")} "{eventTitle}".
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center space-y-4">
					<div className="bg-white p-4 rounded-lg border">
						<QRCode
							id="qr-code-svg"
							value={qrData}
							size={200}
							style={{
								height: "auto",
								maxWidth: "100%",
								width: "100%",
							}}
						/>
					</div>

					<div className="text-center text-sm text-gray-600">
						<p className="font-medium">{userName}</p>
						<p>{eventTitle}</p>
					</div>

					<div className="text-xs text-gray-500 text-center">
						<p>{t("qrCodeInfo")}</p>
						<p>{t("keepPrivate")}</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
