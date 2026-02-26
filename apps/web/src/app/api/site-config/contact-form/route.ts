import { NextResponse } from "next/server";
import { getContactFormConfig } from "@community/lib-server/system-config/contact-form";

export async function GET() {
	const config = await getContactFormConfig();
	return NextResponse.json({ config });
}
