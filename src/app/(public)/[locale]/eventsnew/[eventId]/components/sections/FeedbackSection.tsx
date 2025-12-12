import { Button } from "@/components/ui/button";

import { SectionCard } from "../common/SectionCard";

export function FeedbackSection({
	onContact,
	onFeedback,
	onShare,
}: {
	onContact: () => void;
	onFeedback: () => void;
	onShare: () => void;
}) {
	return (
		<SectionCard id="feedback" title="反馈与联系">
			<p className="text-sm text-muted-foreground">
				如果有疑问或建议，欢迎联系组织者或直接提交反馈。
			</p>
			<div className="flex flex-wrap gap-2">
				<Button variant="outline" onClick={onContact}>
					联系组织者
				</Button>
				<Button onClick={onFeedback}>提交反馈</Button>
				<Button variant="ghost" onClick={onShare}>
					分享活动
				</Button>
			</div>
		</SectionCard>
	);
}
