import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncatedText } from "@/components/ui/truncated-text";
import { HandHeart } from "lucide-react";
import type { UserProfile } from "../types";

interface ResourceMatchingSectionProps {
	user: UserProfile;
	userProfileT: (key: string) => string;
}

export function ResourceMatchingSection({
	user,
	userProfileT,
}: ResourceMatchingSectionProps) {
	const { whatICanOffer, whatIAmLookingFor } = user;

	if (!whatICanOffer && !whatIAmLookingFor) {
		return null;
	}

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HandHeart className="h-5 w-5" />
					{userProfileT("collaborationInfo")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{whatICanOffer && (
					<div className="bg-green-50/30 p-4 border-l-4 border-green-300">
						<div className="flex items-center gap-2 mb-3">
							<div className="w-6 h-6 bg-green-100 flex items-center justify-center">
								<span className="text-green-600 text-sm">
									💡
								</span>
							</div>
							<h4 className="font-medium text-green-700">
								{userProfileT("whatICanOffer")}
							</h4>
						</div>
						<TruncatedText
							text={whatICanOffer}
							maxLines={6}
							maxLength={300}
							className="text-sm leading-relaxed text-gray-700 pl-8"
						/>
					</div>
				)}
				{whatIAmLookingFor && (
					<div className="bg-blue-50/30 p-4 border-l-4 border-blue-300">
						<div className="flex items-center gap-2 mb-3">
							<div className="w-6 h-6 bg-blue-100 flex items-center justify-center">
								<span className="text-blue-600 text-sm">
									🔍
								</span>
							</div>
							<h4 className="font-medium text-blue-700">
								{userProfileT("whatIAmLookingFor")}
							</h4>
						</div>
						<TruncatedText
							text={whatIAmLookingFor}
							maxLines={6}
							maxLength={300}
							className="text-sm leading-relaxed text-gray-700 pl-8"
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
