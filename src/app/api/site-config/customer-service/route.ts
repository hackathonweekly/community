import { NextResponse } from "next/server";
import { getCustomerServiceConfig } from "@/config/customer-service";

export async function GET() {
	const config = await getCustomerServiceConfig();
	return NextResponse.json({ config });
}
