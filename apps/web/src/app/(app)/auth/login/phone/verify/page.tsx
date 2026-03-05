import { PhoneVerifyForm } from "@account/auth/components/PhoneVerifyForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.login.enterVerificationCode"),
	};
}

export default function PhoneVerifyPage() {
	return <PhoneVerifyForm />;
}
