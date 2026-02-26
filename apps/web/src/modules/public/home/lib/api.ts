import { apiClient } from "@community/lib-client/api/api-client";
import { useMutation } from "@tanstack/react-query";

export const newsletterSignupMutationKey = ["newsletter-signup"] as const;
export const useNewsletterSignupMutation = () => {
	return useMutation({
		mutationKey: newsletterSignupMutationKey,
		mutationFn: async (form: any) => {
			const response = await apiClient.newsletter.signup.$post({
				form,
			});

			if (!response.ok) {
				throw new Error("Failed to sign up to newsletter");
			}
		},
	});
};

export const contactFormMutationKey = ["contact-form"] as const;
export const useContactFormMutation = () => {
	return useMutation({
		mutationKey: contactFormMutationKey,
		mutationFn: async (form: any) => {
			const response = await apiClient.contact.$post({
				form,
			});

			if (!response.ok) {
				throw new Error("Failed to send contact form");
			}
		},
	});
};
