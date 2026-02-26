"use client";

import { TruncatedText } from "@community/ui/ui/truncated-text";
import { ChevronDown, Lightbulb, Search } from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "../types";

interface ProfileCollaborationProps {
	user: UserProfile;
	translations: {
		collaborationInfo: string;
		whatICanOffer: string;
		whatIAmLookingFor: string;
	};
}

export function ProfileCollaboration({
	user,
	translations,
}: ProfileCollaborationProps) {
	const { whatICanOffer, whatIAmLookingFor } = user;
	const [isOpen, setIsOpen] = useState(false);

	if (!whatICanOffer && !whatIAmLookingFor) {
		return null;
	}

	return (
		<div className="mt-4">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
			>
				<span className="font-brand text-xs font-bold uppercase tracking-wide text-gray-400">
					{translations.collaborationInfo}
				</span>
				<div className="h-px bg-gray-100 flex-1" />
				<ChevronDown
					className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			<div
				className={`overflow-hidden transition-all duration-300 ${
					isOpen
						? "max-h-[600px] opacity-100 mt-3"
						: "max-h-0 opacity-0"
				}`}
			>
				<div className="space-y-3">
					{whatICanOffer && (
						<div className="bg-white rounded-lg border border-gray-200 p-3">
							<div className="flex items-center gap-2 mb-2">
								<div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
									<Lightbulb className="w-3 h-3 text-muted-foreground" />
								</div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
									{translations.whatICanOffer}
								</h4>
							</div>
							<TruncatedText
								text={whatICanOffer}
								maxLines={6}
								maxLength={300}
								className="text-sm leading-relaxed text-muted-foreground pl-8"
							/>
						</div>
					)}
					{whatIAmLookingFor && (
						<div className="bg-white rounded-lg border border-gray-200 p-3">
							<div className="flex items-center gap-2 mb-2">
								<div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
									<Search className="w-3 h-3 text-muted-foreground" />
								</div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
									{translations.whatIAmLookingFor}
								</h4>
							</div>
							<TruncatedText
								text={whatIAmLookingFor}
								maxLines={6}
								maxLength={300}
								className="text-sm leading-relaxed text-muted-foreground pl-8"
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
