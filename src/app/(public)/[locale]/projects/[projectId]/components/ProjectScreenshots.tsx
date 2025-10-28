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
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{screenshots.map((screenshot, index) => (
					<img
						key={index}
						src={screenshot}
						alt={`${projectTitle} 截图 ${index + 1}`}
						className="w-full max-w-full aspect-video object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
					/>
				))}
			</div>
		</div>
	);
}
