import { NextResponse } from "next/server";
import { getContactFormConfig } from "@/config/contact-form";

export async function GET() {
	const config = await getContactFormConfig();
	return NextResponse.json({ config });
}
