"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectInteractionsProps {
	projectId: string;
	initialLiked: boolean;
	initialLikeCount: number;
	isLoggedIn: boolean;
}

export function ProjectInteractions({
	projectId,
	initialLiked,
	initialLikeCount,
	isLoggedIn,
}: ProjectInteractionsProps) {
	const [liked, setLiked] = useState(initialLiked);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	const handleLike = async () => {
		if (!isLoggedIn) {
			toast({
				title: "Sign in required",
				description: "You need to sign in to like projects",
				variant: "destructive",
			});
			router.push("/auth/login");
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(`/api/projects/${projectId}/like`, {
				method: liked ? "DELETE" : "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to update like");
			}

			setLiked(!liked);
			setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
		} catch (error) {
			console.error("Error updating like:", error);
			toast({
				title: "Error",
				description: "Failed to update like. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant={liked ? "default" : "outline"}
			size="sm"
			onClick={handleLike}
			disabled={isLoading}
			className="flex items-center justify-center gap-2"
		>
			<HeartIcon className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
			{likeCount}
		</Button>
	);
}
