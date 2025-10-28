import { getSession } from "@dashboard/auth/lib/server";
import { NfcBindClient } from "./NfcBindClient";

interface NfcBindPageProps {
	params: Promise<{
		id: string;
		locale: string;
	}>;
}

export default async function NfcBindPage({ params }: NfcBindPageProps) {
	const { id } = await params;
	const session = await getSession();

	return <NfcBindClient nfcId={id} session={session} />;
}
