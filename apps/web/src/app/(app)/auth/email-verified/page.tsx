import { CheckCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmailVerifiedClient } from "./email-verified-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.emailVerified.title"),
	};
}

export default async function EmailVerifiedPage() {
	const t = await getTranslations();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="w-full max-w-md text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
					<CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
				</div>

				<h1 className="mb-2 text-2xl font-bold">
					{t("auth.emailVerified.title")}
				</h1>

				<p className="mb-6 text-muted-foreground">
					{t("auth.emailVerified.message")}
				</p>

				<Suspense fallback={<div>Loading...</div>}>
					<EmailVerifiedClient />
				</Suspense>
			</div>
		</div>
	);
}
