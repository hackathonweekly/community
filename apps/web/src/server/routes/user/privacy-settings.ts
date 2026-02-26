import type { Session, User } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database/prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

type AuthEnv = {
	Variables: {
		session: Session["session"];
		user: User;
	};
};

export const privacySettingsSchema = z
	.object({
		profilePublic: z.boolean().optional(),
		showEmail: z.boolean().optional(),
		showWechat: z.boolean().optional(),
	})
	.refine(
		(data) =>
			data.profilePublic !== undefined ||
			data.showEmail !== undefined ||
			data.showWechat !== undefined,
		{
			message: "At least one privacy setting must be provided",
		},
	);

export interface PrivacySettingsResponse {
	profilePublic: boolean;
	showEmail: boolean;
	showWechat: boolean;
}

interface CreatePrivacySettingsRouterOptions {
	auth?: MiddlewareHandler<AuthEnv>;
	updatePrivacySettings?: (
		userId: string,
		payload: z.infer<typeof privacySettingsSchema>,
	) => Promise<PrivacySettingsResponse>;
}

const defaultUpdatePrivacySettings = async (
	userId: string,
	payload: z.infer<typeof privacySettingsSchema>,
): Promise<PrivacySettingsResponse> => {
	return await db.user.update({
		where: {
			id: userId,
		},
		data: payload,
		select: {
			profilePublic: true,
			showEmail: true,
			showWechat: true,
		},
	});
};

export function createPrivacySettingsRouter(
	options: CreatePrivacySettingsRouterOptions = {},
) {
	const router = new Hono<AuthEnv>();
	const auth = options.auth ?? authMiddleware;
	const updatePrivacySettings =
		options.updatePrivacySettings ?? defaultUpdatePrivacySettings;

	router.use(auth);

	router.patch(
		"/privacy-settings",
		zValidator("json", privacySettingsSchema),
		async (c) => {
			try {
				const user = c.get("user");
				const payload = c.req.valid("json");

				const updated = await updatePrivacySettings(user.id, payload);

				return c.json({
					success: true,
					data: updated,
				});
			} catch (error) {
				console.error("Error updating privacy settings:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);

	return router;
}

export const privacySettingsRouter = createPrivacySettingsRouter();
