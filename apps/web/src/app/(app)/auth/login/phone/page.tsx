import { PhoneLoginForm } from "@account/auth/components/PhoneLoginForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.login.phoneLogin"),
	};
}

export default function PhoneLoginPage() {
	return <PhoneLoginForm />;
}
