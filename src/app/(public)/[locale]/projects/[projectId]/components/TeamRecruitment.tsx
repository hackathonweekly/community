import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

interface TeamRecruitmentProps {
	isRecruiting: boolean;
	teamDescription?: string | null;
	teamSkills: string[];
	teamSize?: number | null;
	contactInfo?: string | null;
}

export function TeamRecruitment({
	isRecruiting,
	teamDescription,
	teamSkills,
	teamSize,
	contactInfo,
}: TeamRecruitmentProps) {
	if (!isRecruiting || !teamDescription) {
		return null;
	}

	return (
		<Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-blue-900">
					<UsersIcon className="h-5 w-5" />
					正在寻找团队成员
				</CardTitle>
				<CardDescription className="text-blue-700">
					加入我们，一起创造更棒的产品
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h4 className="font-medium mb-2 text-blue-900">
						我们在寻找：
					</h4>
					<p className="text-sm text-blue-800 whitespace-pre-line">
						{teamDescription}
					</p>
				</div>

				{teamSkills.length > 0 && (
					<div>
						<h4 className="font-medium mb-2 text-blue-900">
							技能要求：
						</h4>
						<div className="flex flex-wrap gap-2">
							{teamSkills.map((skill, index) => (
								<Badge
									key={index}
									variant="outline"
									className="border-blue-300 text-blue-700 bg-white/50"
								>
									{skill}
								</Badge>
							))}
						</div>
					</div>
				)}

				{teamSize && (
					<div>
						<h4 className="font-medium mb-2 text-blue-900">
							团队规模：
						</h4>
						<p className="text-sm text-blue-800">
							希望招募 {teamSize} 名成员
						</p>
					</div>
				)}

				{contactInfo && (
					<div>
						<h4 className="font-medium mb-2 text-blue-900">
							联系方式：
						</h4>
						<p className="text-sm text-blue-800 font-mono bg-white/50 px-3 py-2 rounded border border-blue-200 break-all overflow-wrap-anywhere">
							{contactInfo}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
