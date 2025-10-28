import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
		<Card>
			<CardHeader>
				<CardTitle>创作经验分享</CardTitle>
				<CardDescription>作者分享的创作心得和经验</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words prose-p:break-words">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{creationExperience}
					</ReactMarkdown>
				</div>
			</CardContent>
		</Card>
	);
}
