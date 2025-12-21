import { redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ locale: string; eventId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EventRegistrationRedirect({
	params,
	searchParams,
}: PageProps) {
	const { locale, eventId } = await params;
	const incomingSearchParams = await searchParams;

	const mergedSearchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(incomingSearchParams)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			for (const item of value) mergedSearchParams.append(key, item);
		} else {
			mergedSearchParams.set(key, value);
		}
	}

	if (!mergedSearchParams.has("openRegistration")) {
		mergedSearchParams.set("openRegistration", "true");
	}

	const queryString = mergedSearchParams.toString();
	redirect(
		`/${locale}/eventsnew/${eventId}${queryString ? `?${queryString}` : ""}`,
	);
}
