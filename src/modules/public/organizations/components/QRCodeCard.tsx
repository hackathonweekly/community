import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";
import Image from "next/image";

interface QRCodeCardProps {
	title: string;
	qrCodeUrl: string;
	description: string;
}

export function QRCodeCard({ title, qrCodeUrl, description }: QRCodeCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<QrCode className="h-4 w-4" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-center">
					<div className="relative w-full max-w-40 mx-auto aspect-square">
						<Image
							src={qrCodeUrl}
							alt={title}
							fill
							className="object-contain border rounded-lg"
							sizes="160px"
						/>
					</div>
					<p className="text-sm text-muted-foreground mt-3">
						{description}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
