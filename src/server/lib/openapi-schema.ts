import { type MergeInput, isErrorResult, merge } from "openapi-merge";

/**
 * OpenAPI schema composition for HackathonWeekly API
 *
 * Combines multiple OpenAPI specs into a unified documentation:
 * - Main application API routes
 * - Authentication endpoints (Better Auth)
 *
 * This enables a single Swagger/OpenAPI docs page for all API endpoints
 */

type OpenApiDocument = MergeInput[number]["oas"];

interface ApiSchemas {
	appSchema: OpenApiDocument;
	authSchema: OpenApiDocument;
}

/**
 * Merges application and authentication OpenAPI specifications
 *
 * Process:
 * 1. Prefixes auth routes with /api/auth
 * 2. Tags all auth endpoints with "Auth" for grouping
 * 3. Combines into single OpenAPI document
 *
 * @param appSchema - Main application API schema
 * @param authSchema - Authentication API schema (Better Auth)
 * @returns Merged OpenAPI specification, or empty object if merge fails
 */
export function mergeOpenApiSchemas({
	appSchema,
	authSchema,
}: ApiSchemas): OpenApiDocument {
	const schemasToMerge: MergeInput = [
		{
			oas: appSchema,
		},
		{
			oas: authSchema,
			pathModification: {
				prepend: "/api/auth",
			},
		},
	];

	const mergeResult = merge(schemasToMerge);

	if (isErrorResult(mergeResult)) {
		console.error("Failed to merge OpenAPI schemas:", mergeResult);
		return {
			openapi: "3.0.0",
			info: {
				title: "HackathonWeekly API",
				version: "1.0.0",
			},
			paths: {},
		};
	}

	const combined = mergeResult.output;

	// Tag auth routes for better API documentation organization
	const httpVerbs = ["get", "post", "put", "patch", "delete"] as const;

	for (const [path, pathItem] of Object.entries(combined.paths)) {
		if (!path.startsWith("/api/auth")) continue;

		for (const verb of httpVerbs) {
			const operation = pathItem[verb];

			if (
				operation &&
				typeof operation === "object" &&
				!Array.isArray(operation)
			) {
				operation.tags = ["Auth"];
			}
		}
	}

	return combined;
}
