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
		<div>
			{/* Section Divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					<span className="inline-flex items-center gap-1.5">
						<UsersIcon className="h-3.5 w-3.5" />
						招募队友
					</span>
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>

			<div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
				<div>
					<div className="text-xs font-bold text-black mb-1.5">
						我们在寻找
					</div>
					<p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
						{teamDescription}
					</p>
				</div>

				{teamSkills.length > 0 && (
					<div>
						<div className="text-xs font-bold text-black mb-1.5">
							技能要求
						</div>
						<div className="flex flex-wrap gap-1.5">
							{teamSkills.map((skill, index) => (
								<span
									key={index}
									className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold border border-gray-200"
								>
									{skill}
								</span>
							))}
						</div>
					</div>
				)}

				{teamSize && (
					<div>
						<div className="text-xs font-bold text-black mb-1.5">
							团队规模
						</div>
						<p className="text-sm text-gray-600">
							希望招募 {teamSize} 名成员
						</p>
					</div>
				)}

				{contactInfo && (
					<div>
						<div className="text-xs font-bold text-black mb-1.5">
							联系方式
						</div>
						<p className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded-md border border-gray-200 break-all">
							{contactInfo}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
