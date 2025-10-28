import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProjectDescriptionProps {
	description: string;
}

export function ProjectDescription({ description }: ProjectDescriptionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>作品介绍</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:break-words prose-p:break-words">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{description}
					</ReactMarkdown>
				</div>
			</CardContent>
		</Card>
	);
}
