import { EmailLoginForm } from "@account/auth/components/EmailLoginForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.login.emailLogin"),
	};
}

export default function EmailLoginPage() {
	return <EmailLoginForm />;
}
