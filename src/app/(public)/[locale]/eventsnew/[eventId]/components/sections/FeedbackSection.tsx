import { Button } from "@/components/ui/button";

import { SectionCard } from "../common/SectionCard";

export function FeedbackSection({
	onContact,
	onFeedback,
	onShare,
	canContact = true,
	canFeedback = true,
}: {
	onContact?: () => void;
	onFeedback?: () => void;
	onShare: () => void;
	canContact?: boolean;
	canFeedback?: boolean;
}) {
	return (
		<SectionCard id="feedback" title="反馈与联系">
			<p className="text-sm text-muted-foreground">
				如果有疑问或建议，欢迎联系组织者或直接提交反馈。
			</p>
			<div className="flex flex-wrap gap-2">
				{canContact ? (
					<Button variant="outline" onClick={onContact}>
						联系组织者
					</Button>
				) : null}
				{canFeedback ? (
					<Button onClick={onFeedback}>提交反馈</Button>
				) : null}
				<Button variant="ghost" onClick={onShare}>
					分享活动
				</Button>
			</div>
		</SectionCard>
	);
}
