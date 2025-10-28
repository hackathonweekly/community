"use client";

import { ConsentContext } from "@/components/shared/ConsentProvider";
import { useContext } from "react";

export function useCookieConsent() {
	return useContext(ConsentContext);
}
