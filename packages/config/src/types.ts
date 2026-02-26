export type Config = {
	appName: string;
	i18n: {
		enabled: boolean;
		locales: { [locale: string]: { currency: string; label: string } };
		defaultLocale: string;
		defaultCurrency: string;
		localeCookieName: string;
	};
	organizations: {
		enable: boolean;
		enableUsersToCreateOrganizations: boolean;
		requireOrganization: boolean;
		hideOrganization: boolean;
		forbiddenOrganizationSlugs: string[];
	};
	users: {
		enableOnboarding: boolean;
	};
	auth: {
		enableSignup: boolean;
		enableMagicLink: boolean;
		enableSocialLogin: boolean;
		enablePasskeys: boolean;
		enablePasswordLogin: boolean;
		enablePhoneLogin?: boolean;
		enableTwoFactor: boolean;
		requirePhoneVerification: boolean;
		allowSkipPhoneVerification: boolean;
		enablePhoneBinding: boolean;
		redirectAfterSignIn: string;
		redirectAfterLogout: string;
		sessionCookieMaxAge: number;
	};
	mails: {
		from: string;
	};
	storage: {
		bucketNames: {
			public: string;
		};
		endpoints: {
			public: string;
		};
	};
	ui: {
		enabledThemes: Array<"light" | "dark">;
		defaultTheme: Config["ui"]["enabledThemes"][number];
		saas: {
			enabled: boolean;
			useSidebarLayout: boolean;
		};
		public: {
			enabled: boolean;
		};
	};
	contactForm: {
		enabled: boolean;
		to: string;
		subject: string;
	};
	permissions: {
		visitor: {
			allowComments: boolean;
			allowEventCreation: boolean;
			allowOrganizationCreation: boolean;
		};
	};
	payments: {
		providers: {
			stripe: {
				enabled: boolean;
			};
			wechatpay: {
				enabled: boolean;
				orderExpireMinutes?: number;
			};
		};
	};
};

export interface ContactFormConfig {
	enabled: boolean;
	to: string;
	subject: string;
}
