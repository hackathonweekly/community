import { EventDescription } from "@/modules/public/events/components";

import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

export function IntroSection({ event }: { event: EventData }) {
	const content =
		event.richContent || event.description || event.shortDescription || "";

	return (
		<SectionCard id="intro" title="活动介绍">
			<EventDescription variant="plain" richContent={content} />
		</SectionCard>
	);
}
