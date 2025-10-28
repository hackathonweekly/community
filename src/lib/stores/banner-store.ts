"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BannerStore {
	isBetaBannerVisible: boolean;
	isHydrated: boolean;
	hideBetaBanner: () => void;
	showBetaBanner: () => void;
	setHydrated: () => void;
	contentHash: string | null;
	setContentHash: (hash: string | null) => void;
}

export const useBannerStore = create<BannerStore>()(
	persist(
		(set) => ({
			isBetaBannerVisible: true,
			isHydrated: false,
			contentHash: null,
			hideBetaBanner: () => set({ isBetaBannerVisible: false }),
			showBetaBanner: () => set({ isBetaBannerVisible: true }),
			setHydrated: () => set({ isHydrated: true }),
			setContentHash: (hash) => set({ contentHash: hash }),
		}),
		{
			name: "banner-storage",
			onRehydrateStorage: () => (state) => {
				// hydration 完成后设置标识并恢复默认显示状态（如果用户没有手动关闭过）
				if (state) {
					state.setHydrated();
					// 如果是首次访问且没有存储记录，显示 banner
					if (
						state.isBetaBannerVisible === false &&
						typeof window !== "undefined"
					) {
						const stored = localStorage.getItem("banner-storage");
						if (!stored) {
							state.showBetaBanner();
						}
					}
				}
			},
		},
	),
);
