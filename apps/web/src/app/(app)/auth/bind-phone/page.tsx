import { BindPhoneForm } from "@account/auth/components/BindPhoneForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.bindPhone.title"),
	};
}

export default function BindPhonePage() {
	return <BindPhoneForm />;
}
