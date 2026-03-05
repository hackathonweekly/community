"use client";

import { MDXContent } from "@content-collections/mdx/react";
import { mdxComponents } from "../utils/mdx-components";

export function PostContent({ content }: { content: string }) {
	return (
		<div className="prose prose-headings:font-brand prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-code:text-foreground mx-auto mt-4 max-w-3xl">
			<MDXContent
				code={content}
				components={{
					a: mdxComponents.a,
				}}
			/>
		</div>
	);
}
