"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSubmissionDraft<T extends Record<string, unknown>>(
	key: string,
	data: T,
	options?: { enabled?: boolean; intervalMs?: number },
) {
	const { enabled = true, intervalMs = 5000 } = options || {};
	const dataRef = useRef(data);
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

	useEffect(() => {
		dataRef.current = data;
	}, [data]);

	useEffect(() => {
		if (!enabled || typeof window === "undefined") {
			return;
		}

		const timer = setInterval(() => {
			try {
				const payload = JSON.stringify(dataRef.current);
				window.localStorage.setItem(key, payload);
				setLastSavedAt(new Date());
			} catch (error) {
				console.error("Failed to save submission draft", error);
			}
		}, intervalMs);

		return () => clearInterval(timer);
	}, [enabled, intervalMs, key]);

	const loadDraft = useCallback(() => {
		if (typeof window === "undefined") {
			return null;
		}
		const raw = window.localStorage.getItem(key);
		if (!raw) {
			return null;
		}
		try {
			return JSON.parse(raw) as T;
		} catch (error) {
			console.error("Failed to parse submission draft", error);
			return null;
		}
	}, [key]);

	const clearDraft = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}
		window.localStorage.removeItem(key);
	}, [key]);

	return { loadDraft, clearDraft, lastSavedAt };
}
