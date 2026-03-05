interface ProjectScreenshotsProps {
	screenshots: string[];
	projectTitle: string;
}

export function ProjectScreenshots({
	screenshots,
	projectTitle,
}: ProjectScreenshotsProps) {
	if (!screenshots || screenshots.length === 0) {
		return null;
	}

	return (
		<div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{screenshots.map((screenshot, index) => (
					<div
						key={index}
						className="rounded-xl overflow-hidden shadow-sm border border-gray-200"
					>
						<img
							src={screenshot}
							alt={`${projectTitle} 截图 ${index + 1}`}
							className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-300"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
