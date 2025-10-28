"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommentFormProps {
	projectId: string;
}

export function CommentForm({ projectId }: CommentFormProps) {
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(
				`/api/projects/${projectId}/comments`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ content: content.trim() }),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to post comment");
			}

			setContent("");
			toast({
				title: "Comment posted!",
				description: "Your comment has been added successfully.",
			});

			// Refresh the page to show the new comment
			router.refresh();
		} catch (error) {
			console.error("Error posting comment:", error);
			toast({
				title: "Error",
				description: "Failed to post comment. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="Add a comment..."
				className="min-h-[80px]"
				required
			/>
			<Button type="submit" disabled={isSubmitting || !content.trim()}>
				{isSubmitting ? "Posting..." : "Post Comment"}
			</Button>
		</form>
	);
}
