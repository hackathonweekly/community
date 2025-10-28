import { auth } from "@/lib/auth";
import { getUserOrganizationsWithRoles } from "@/lib/database/prisma/queries/organizations";
import { Hono } from "hono";

const app = new Hono();

// GET /api/user/organizations - Get current user's organizations with role information
app.get("/", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const organizationsData = await getUserOrganizationsWithRoles(
			session.user.id,
		);

		return c.json({
			success: true,
			data: {
				organizations: organizationsData.all.map((org) => ({
					id: org.id,
					name: org.name,
					slug: org.slug,
					logo: org.logo,
					_count: org._count,
					memberRole: org.memberRole,
				})),
				created: organizationsData.created.map((org) => ({
					id: org.id,
					name: org.name,
					slug: org.slug,
					logo: org.logo,
					_count: org._count,
				})),
				managed: organizationsData.managed.map((org) => ({
					id: org.id,
					name: org.name,
					slug: org.slug,
					logo: org.logo,
					_count: org._count,
				})),
			},
		});
	} catch (error) {
		console.error("Error fetching user organizations:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch organizations",
			},
			500,
		);
	}
});

export default app;
