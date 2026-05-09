import { LoginMethodSelector } from "@account/auth/components/LoginMethodSelector";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.login.title"),
	};
}

export default function LoginPage() {
	return <LoginMethodSelector />;
}
