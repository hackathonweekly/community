"use client";
import { authClient } from "@/lib/auth/client";
import type { ActiveOrganization } from "@/lib/auth";
import { isOrganizationAdmin } from "@/lib/auth/lib/helper";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { sessionQueryKey } from "@dashboard/auth/lib/api";
import {
	activeOrganizationQueryKey,
	useActiveOrganizationQuery,
} from "@dashboard/organizations/lib/api";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import nProgress from "nprogress";
import { type ReactNode, useEffect, useState } from "react";
import { ActiveOrganizationContext } from "../lib/active-organization-context";

// Helper function to transform null to undefined for optional fields
function transformOrganization<T extends Record<string, any>>(org: T): T {
	const transformed: any = { ...org };
	// Transform specific nullable fields to undefined
	const nullableFields = [
		"logo",
		"coverImage",
		"audienceQrCode",
		"memberQrCode",
		"summary",
		"description",
		"location",
		"contactInfo",
		"membershipRequirements",
	] as const;
	for (const field of nullableFields) {
		if (field in transformed && transformed[field] === null) {
			transformed[field] = undefined;
		}
	}
	return transformed;
}

export function ActiveOrganizationProvider({
	children,
}: {
	children: ReactNode;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { session, user } = useSession();
	const params = useParams();

	const activeOrganizationSlug = params.organizationSlug as string;

	const { data: activeOrganization } = useActiveOrganizationQuery(
		activeOrganizationSlug,
		{
			enabled: !!activeOrganizationSlug,
		},
	);

	const refetchActiveOrganization = async () => {
		await queryClient.refetchQueries({
			queryKey: activeOrganizationQueryKey(activeOrganizationSlug),
		});
	};

	const setActiveOrganization = async (organizationSlug: string | null) => {
		nProgress.start();

		const response = await authClient.organization.setActive(
			organizationSlug
				? {
						organizationSlug: organizationSlug,
					}
				: {
						organizationId: null,
					},
		);

		const { data: newActiveOrganization } = response;

		if (!newActiveOrganization) {
			nProgress.done();
			return;
		}

		// Transform the organization data
		const transformedOrganization = transformOrganization(
			newActiveOrganization,
		) as ActiveOrganization;

		await queryClient.setQueryData(
			activeOrganizationQueryKey(newActiveOrganization.slug),
			transformedOrganization,
		);

		await queryClient.setQueryData(sessionQueryKey, (data: any) => {
			return {
				...data,
				session: {
					...data?.session,
					activeOrganizationId: newActiveOrganization.id,
				},
			};
		});

		router.push(`/app/${newActiveOrganization.slug}`);
	};

	const [loaded, setLoaded] = useState(activeOrganization !== undefined);

	useEffect(() => {
		if (!loaded && activeOrganization !== undefined) {
			setLoaded(true);
		}
	}, [activeOrganization]);

	const activeOrganizationUserRole = activeOrganization?.members?.find(
		(member: any) => member.userId === session?.userId,
	)?.role;

	return (
		<ActiveOrganizationContext.Provider
			value={{
				loaded,
				activeOrganization: activeOrganization ?? null,
				activeOrganizationUserRole: activeOrganizationUserRole ?? null,
				isOrganizationAdmin:
					!!activeOrganization &&
					!!user &&
					isOrganizationAdmin(activeOrganization, user),
				setActiveOrganization,
				refetchActiveOrganization,
			}}
		>
			{children}
		</ActiveOrganizationContext.Provider>
	);
}
