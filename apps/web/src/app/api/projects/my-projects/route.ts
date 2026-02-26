import { db } from "@community/lib-server/database";
import { getSession } from "@shared/auth/lib/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const session = await getSession();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const projects = await db.project.findMany({
			where: {
				userId: session.user.id,
			},
			select: {
				id: true,
				title: true,
				description: true,
				subtitle: true,
				stage: true,
				featured: true,
				projectTags: true,
				url: true,
				screenshots: true,
				viewCount: true,
				likeCount: true,
				commentCount: true,
				createdAt: true,
				isRecruiting: true,
				recruitmentTags: true,
				recruitmentStatus: true,
				isComplete: true,
				likes: {
					where: {
						userId: session.user.id,
					},
					select: {
						id: true,
					},
				},
				bookmarks: {
					where: {
						userId: session.user.id,
					},
					select: {
						id: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						userRoleString: true,
						image: true,
						members: {
							include: {
								organization: {
									select: {
										id: true,
										name: true,
										slug: true,
										logo: true,
									},
								},
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json({ projects });
	} catch (error) {
		console.error("Error fetching my projects:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
