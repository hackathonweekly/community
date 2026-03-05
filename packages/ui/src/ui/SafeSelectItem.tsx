// Safe SelectItem wrapper component with compile-time checks
import { SelectItem as OriginalSelectItem } from "@community/ui/ui/select";
import type { ComponentProps } from "react";

// Type that excludes empty strings at compile time
type NonEmptyString = string & { __brand: "NonEmptyString" };

// Type guard to create NonEmptyString
export function createNonEmptyString(value: string): NonEmptyString | null {
	if (value && value.trim() !== "") {
		return value as NonEmptyString;
	}
	return null;
}

// Safe SelectItem props that only accepts non-empty strings
interface SafeSelectItemProps
	extends Omit<ComponentProps<typeof OriginalSelectItem>, "value"> {
	value: NonEmptyString;
}

// Safe SelectItem component
export function SafeSelectItem({ value, ...props }: SafeSelectItemProps) {
	// Runtime check as additional safety
	if (!value || value.trim() === "") {
		console.warn("SafeSelectItem: Empty value detected, skipping render");
		return null;
	}

	return <OriginalSelectItem value={value} {...props} />;
}

// Helper function for mapping arrays safely
export function mapToSafeSelectItems<T>(
	items: T[],
	getValue: (item: T) => string,
	getKey: (item: T) => string | number,
	renderContent: (item: T) => React.ReactNode,
	fallbackValue?: (item: T) => string,
) {
	return items
		.map((item) => {
			const value = getValue(item);
			const safeValue =
				createNonEmptyString(value) ||
				(fallbackValue
					? createNonEmptyString(fallbackValue(item))
					: null);

			if (!safeValue) {
				return null;
			}

			return (
				<SafeSelectItem key={getKey(item)} value={safeValue}>
					{renderContent(item)}
				</SafeSelectItem>
			);
		})
		.filter(Boolean);
}

// Example usage:
/*
// Instead of:
{organizations.map((org) => (
  <SelectItem key={org.id} value={org.slug}>
    {org.name}
  </SelectItem>
))}

// Use:
{mapToSafeSelectItems(
  organizations,
  (org) => org.slug,
  (org) => org.id,
  (org) => org.name,
  (org) => org.id // fallback to ID if slug is empty
)}

// Or manually:
{organizations.map((org) => {
  const safeSlug = createNonEmptyString(org.slug);
  return safeSlug ? (
    <SafeSelectItem key={org.id} value={safeSlug}>
      {org.name}
    </SafeSelectItem>
  ) : null;
}).filter(Boolean)}
*/
