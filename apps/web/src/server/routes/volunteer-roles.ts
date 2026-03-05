import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const createVolunteerRoleSchema = z.object({
	name: z.string().min(1, "角色名称必填"),
	description: z.string().min(1, "职责描述必填"),
	detailDescription: z.string().optional(),
	iconUrl: z.string().optional(),
	cpPoints: z.number().min(0, "积分不能为负数"),
});

const updateVolunteerRoleSchema = createVolunteerRoleSchema.partial();

const batchCreateVolunteerRolesSchema = z.object({
	roles: z.array(createVolunteerRoleSchema).min(1, "至少需要一个角色"),
});

const app = new Hono()
	.get("/", async (c) => {
		try {
			// 获取所有活跃的志愿者角色
			const volunteerRoles = await db.volunteerRole.findMany({
				where: {
					isActive: true,
				},
				orderBy: {
					sortOrder: "asc",
				},
			});

			return c.json({
				success: true,
				data: volunteerRoles,
			});
		} catch (error) {
			console.error("Error fetching volunteer roles:", error);
			return c.json(
				{
					success: false,
					error: "Failed to fetch volunteer roles",
				},
				500,
			);
		}
	})
	.post("/", zValidator("json", createVolunteerRoleSchema), async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const user = session.user;

		// TODO: 检查用户是否是超级管理员
		// 这里可以添加权限检查逻辑

		try {
			const { name, description, detailDescription, iconUrl, cpPoints } =
				c.req.valid("json");

			const volunteerRole = await db.volunteerRole.create({
				data: {
					name,
					description,
					detailDescription,
					iconUrl,
					cpPoints,
					sortOrder: 0, // 可以根据需要调整排序逻辑
				},
			});

			return c.json({
				success: true,
				data: volunteerRole,
			});
		} catch (error) {
			console.error("Error creating volunteer role:", error);
			return c.json(
				{
					success: false,
					error: "Failed to create volunteer role",
				},
				500,
			);
		}
	})
	.post(
		"/batch",
		zValidator("json", batchCreateVolunteerRolesSchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const user = session.user;

			// TODO: 检查用户是否是超级管理员
			// 这里可以添加权限检查逻辑

			try {
				const { roles } = c.req.valid("json");

				// 批量创建志愿者角色
				const createdRoles = await db.$transaction(
					roles.map((role, index) =>
						db.volunteerRole.create({
							data: {
								name: role.name,
								description: role.description,
								detailDescription: role.detailDescription,
								iconUrl: role.iconUrl,
								cpPoints: role.cpPoints,
								sortOrder: index, // 按照数组顺序设置排序
							},
						}),
					),
				);

				return c.json({
					success: true,
					data: createdRoles,
				});
			} catch (error) {
				console.error("Error batch creating volunteer roles:", error);
				return c.json(
					{
						success: false,
						error: "Failed to batch create volunteer roles",
					},
					500,
				);
			}
		},
	)
	.put("/:id", zValidator("json", updateVolunteerRoleSchema), async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const updateData = c.req.valid("json");
			const roleId = c.req.param("id");

			const volunteerRole = await db.volunteerRole.update({
				where: { id: roleId },
				data: updateData,
			});

			return c.json({
				success: true,
				data: volunteerRole,
			});
		} catch (error) {
			console.error("Error updating volunteer role:", error);
			return c.json(
				{
					success: false,
					error: "Failed to update volunteer role",
				},
				500,
			);
		}
	})
	.delete("/:id", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const roleId = c.req.param("id");

			await db.volunteerRole.delete({
				where: { id: roleId },
			});

			return c.json({
				success: true,
				message: "Volunteer role deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting volunteer role:", error);
			return c.json(
				{
					success: false,
					error: "Failed to delete volunteer role",
				},
				500,
			);
		}
	});

export default app;
