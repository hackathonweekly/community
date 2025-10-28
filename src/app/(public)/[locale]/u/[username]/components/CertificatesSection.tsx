import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "../types";

interface CertificatesSectionProps {
	user: UserProfile;
	currentUserId?: string;
	userProfileT: (key: string) => string;
}

export function CertificatesSection({
	user,
	currentUserId,
	userProfileT,
}: CertificatesSectionProps) {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="h-5 w-5" />
					{userProfileT("certificatesSection")} (
					{user.certificates?.length || 0})
				</CardTitle>
			</CardHeader>
			<CardContent>
				{user.certificates && user.certificates.length > 0 ? (
					<>
						<div className="space-y-4">
							{user.certificates
								.slice(0, 4)
								.map((certificate: any) => {
									const awardLevelColors = {
										FIRST: "from-yellow-400 to-yellow-600",
										SECOND: "from-gray-400 to-gray-600",
										THIRD: "from-orange-400 to-orange-600",
										EXCELLENCE: "from-blue-400 to-blue-600",
										PARTICIPATION:
											"from-green-400 to-green-600",
										SPECIAL:
											"from-purple-400 to-purple-600",
									};
									const bgGradient =
										awardLevelColors[
											certificate.award
												.level as keyof typeof awardLevelColors
										] || awardLevelColors.PARTICIPATION;

									return (
										<div
											key={certificate.id}
											className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-background to-muted/30"
										>
											<div
												className={`w-16 h-16 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center mr-4 shadow-lg`}
											>
												<Trophy className="w-8 h-8 text-white" />
											</div>
											<div className="flex-1">
												<h4 className="font-semibold text-lg mb-1">
													{certificate.award.name}
												</h4>
												<p className="text-sm text-muted-foreground mb-2">
													{certificate.project.title}
												</p>
												{certificate.event && (
													<Badge
														variant="outline"
														className="text-xs mr-2"
													>
														{
															certificate.event
																.title
														}
													</Badge>
												)}
												<Badge
													variant="secondary"
													className="text-xs"
												>
													{certificate.award.level ===
														"FIRST" && "一等奖"}
													{certificate.award.level ===
														"SECOND" && "二等奖"}
													{certificate.award.level ===
														"THIRD" && "三等奖"}
													{certificate.award.level ===
														"EXCELLENCE" &&
														"优秀奖"}
													{certificate.award.level ===
														"PARTICIPATION" &&
														"参与奖"}
													{certificate.award.level ===
														"SPECIAL" && "特殊奖"}
												</Badge>
												{certificate.score && (
													<div className="text-sm text-muted-foreground mt-1">
														评分:{" "}
														{certificate.score.toFixed(
															1,
														)}{" "}
														分
													</div>
												)}
											</div>
											<div className="text-right text-sm text-muted-foreground">
												{new Date(
													certificate.awardedAt,
												).toLocaleDateString("zh-CN")}
											</div>
										</div>
									);
								})}
						</div>
						{user.certificates && user.certificates.length > 4 && (
							<div className="mt-4 text-center">
								<Button variant="outline" size="sm" asChild>
									<Link href={"/app/profile"}>
										查看全部 {user.certificates.length}{" "}
										个证书
									</Link>
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<div className="mb-2">🏆</div>
						<p className="text-sm">
							{currentUserId === user.id
								? "你还没有获得任何证书"
								: "该用户还没有获得任何证书"}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
