import { QrCode } from "lucide-react";
import Image from "next/image";

interface QRCodeCardProps {
	title: string;
	qrCodeUrl: string;
	description: string;
}

export function QRCodeCard({ title, qrCodeUrl, description }: QRCodeCardProps) {
	return (
		<div className="bg-card border border-border rounded-lg p-5 shadow-sm">
			<h3 className="flex items-center gap-2 font-brand text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground mb-3">
				<QrCode className="h-3.5 w-3.5" />
				{title}
			</h3>
			<div className="text-center">
				<div className="relative w-full max-w-40 mx-auto aspect-square">
					<Image
						src={qrCodeUrl}
						alt={title}
						fill
						className="object-contain border border-border rounded-lg"
						sizes="160px"
					/>
				</div>
				<p className="text-[11px] font-mono text-muted-foreground mt-3">
					{description}
				</p>
			</div>
		</div>
	);
}
