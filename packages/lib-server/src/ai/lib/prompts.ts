/**
 * AI prompt templates for HackathonWeekly
 * Contains reusable prompts for various AI-powered features
 */

/**
 * Generates creative project names based on a given topic
 * Used for hackathon project name suggestions
 *
 * @param topic - The project category or theme
 * @returns Formatted prompt for AI model
 */
export function promptListProductNames(topic: string): string {
	return `Generate 5 creative and catchy project names for a hackathon project in the ${topic} category. The names should be memorable, fun, and related to the theme.`;
}
