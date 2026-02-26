import { EventDescription } from "@/modules/public/events/components";
import type { EventData } from "../types";
import { SectionCard } from "../common/SectionCard";

export function IntroSection({ event }: { event: EventData }) {
	const content =
		event.richContent || event.description || event.shortDescription || "";

	return (
		<SectionCard id="intro" title="活动介绍">
			<div className="prose prose-sm prose-gray max-w-none font-sans leading-7 dark:prose-invert prose-img:rounded-xl">
				<EventDescription variant="plain" richContent={content} />
			</div>
		</SectionCard>
	);
}
