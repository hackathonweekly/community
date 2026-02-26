import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { UserXIcon } from "lucide-react";
import Link from "next/link";

export default function ProfileNotFound() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="container max-w-md mx-auto px-4">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
							<UserXIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<CardTitle>Profile Not Found</CardTitle>
						<CardDescription>
							The profile you're looking for doesn't exist or has
							been set to private.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-sm text-muted-foreground">
							This could happen if:
						</p>
						<ul className="text-sm text-muted-foreground text-left space-y-1">
							<li>• The username doesn't exist</li>
							<li>• The profile has been set to private</li>
							<li>• The user has deactivated their account</li>
						</ul>
						<div className="pt-4">
							<Button asChild>
								<Link href="/">Back to Home</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
