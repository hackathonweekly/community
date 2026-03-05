"use client";

import { useEffect, useState } from "react";
import { config as appConfig } from "@community/config";
import type { ContactFormConfig } from "@community/config/types";

interface ConfigState<T> {
	data: T;
	loading: boolean;
	error: Error | null;
}

async function fetchConfig<T>(endpoint: string): Promise<T> {
	const response = await fetch(endpoint, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Failed to load config from ${endpoint}`);
	}
	const payload = await response.json();
	return (payload?.config ?? payload) as T;
}

export function useContactFormConfig(
	initial: ContactFormConfig = appConfig.contactForm,
): ConfigState<ContactFormConfig> {
	const [state, setState] = useState<ConfigState<ContactFormConfig>>({
		data: initial,
		loading: true,
		error: null,
	});

	useEffect(() => {
		let isMounted = true;
		fetchConfig<ContactFormConfig>("/api/site-config/contact-form")
			.then((remoteConfig) => {
				if (!isMounted) {
					return;
				}
				setState({ data: remoteConfig, loading: false, error: null });
			})
			.catch((error) => {
				if (!isMounted) {
					return;
				}
				setState((prev) => ({ ...prev, loading: false, error }));
			});

		return () => {
			isMounted = false;
		};
	}, []);

	return state;
}
