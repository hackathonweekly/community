import { OtpForm } from "@account/auth/components/OtpForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.verify.title"),
	};
}

export default function VerifyPage() {
	return <OtpForm />;
}
