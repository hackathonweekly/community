import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CreationExperienceProps {
	creationExperience?: string | null;
}

export function CreationExperience({
	creationExperience,
}: CreationExperienceProps) {
	if (!creationExperience) {
		return null;
	}

	return (
		<div>
			{/* Section Divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					创作经验
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>
			<div className="prose prose-sm prose-gray dark:prose-invert max-w-none font-sans leading-7 prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words prose-p:break-words">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{creationExperience}
				</ReactMarkdown>
			</div>
		</div>
	);
}
