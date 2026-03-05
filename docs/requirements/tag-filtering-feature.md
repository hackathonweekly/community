# Tag Filtering Feature - Requirements Document

## 1. Overview

### 1.1 Background
Currently, the platform stores tags on projects (`projectTags` field in Prisma schema) but doesn't provide a way for users to filter content by tags. The URL pattern `https://dev.hackathonweekly.com/?tag=hello` is not yet implemented. This feature is inspired by Circle.so's tag-based content filtering system.

### 1.2 Current State
- **Data Model**: Tags are stored as `String[]` arrays on multiple entities (Project, Event, Organization, etc.)
- **Tag Input**: ProjectTagSelector component provides 97+ predefined tag suggestions across 5 categories
- **Existing Filters**: Projects can be filtered by stage (featured, recruiting, early, mature), search, organization, and sort order
- **No Tag Filtering**: Tags are collected but not used for filtering in public feeds

### 1.3 Goals
- Enable users to discover content by clicking on tags
- Add `?tag=` URL parameter support for filtering
- Improve content discoverability and navigation
- Leverage existing tag data already stored in the database

---

## 2. Functional Requirements

### 2.1 Tag Display & Interaction

#### 2.1.1 Clickable Tags on Cards
- **Location**: Project cards, event cards, organization cards
- **Behavior**: Tags should be clickable and navigate to filtered view
- **Visual Design**:
  - Small pill-shaped badges
  - Hover state to indicate clickability
  - Consistent styling across all card types
  - Maximum 3-5 tags displayed per card (with "+" indicator if more exist)

#### 2.1.2 Tag Navigation
- **URL Pattern**: `/?tag={tagName}` or `/projects?tag={tagName}`
- **Behavior**: Clicking a tag filters the current view to show only items with that tag
- **Multi-tag Support** (Phase 2): `/?tag=React&tag=AI` for AND filtering

### 2.2 Tag Filtering UI

#### 2.2.1 Active Tag Indicator
- **Location**: Above the content grid, below existing filters
- **Display**: "Filtering by: #React ×" with close button
- **Behavior**: Click × to remove tag filter and return to all items

#### 2.2.2 Tag Filter Integration
- **Combine with Existing Filters**: Tag filtering should work alongside stage, search, and organization filters
- **Filter Priority**:
  1. Search query (if present)
  2. Tag filter (if present)
  3. Stage filter (if present)
  4. Organization filter (if present)

#### 2.2.3 Tag Suggestions Panel (Optional - Phase 2)
- **Location**: Sidebar or collapsible panel
- **Content**: Popular tags with counts
- **Behavior**: Click to apply tag filter
- **Categories**: Group by tag categories (Technology, Product Type, etc.)

### 2.3 Backend API Requirements

#### 2.3.1 Query Parameter Support
```typescript
interface ProjectSearchParams {
	stage?: string;
	search?: string;
	organization?: string;
	sort?: string;
	sortOrder?: "asc" | "desc";
	tag?: string | string[]; // NEW
}
```

#### 2.3.2 Database Query Logic
- **Single Tag**: Use Prisma's `hasSome` or `has` for array filtering
- **Multiple Tags**: Use `hasEvery` for AND logic, or `hasSome` for OR logic
- **Performance**: Consider indexing if tag queries become slow

```typescript
// Example Prisma query
where: {
	projectTags: {
		hasSome: [tagParam] // Single tag
		// OR
		hasEvery: tagParams // Multiple tags (AND)
	}
}
```

#### 2.3.3 Tag Statistics API
- **Endpoint**: `/api/tags/popular` or `/api/projects/tags/stats`
- **Response**: List of tags with usage counts
- **Caching**: Cache for 1 hour to reduce database load

```typescript
interface TagStats {
	tag: string;
	count: number;
	category?: string;
}
```

### 2.4 URL & Routing

#### 2.4.1 URL Structure
- **Home Feed**: `/?tag=React`
- **Projects Page**: `/projects?tag=React`
- **Events Page**: `/events?tag=Hackathon`
- **Combined Filters**: `/projects?stage=early&tag=AI&search=chatbot`

#### 2.4.2 URL Encoding
- Handle special characters in tags (spaces, #, etc.)
- Use `encodeURIComponent()` for tag values
- Strip leading # if present (normalize "#React" to "React")

---

## 3. Technical Implementation

### 3.1 Component Changes

#### 3.1.1 ProjectCard Component
```typescript
// Add clickable tags display
<div className="flex flex-wrap gap-1 mt-2">
	{project.projectTags.slice(0, 5).map(tag => (
		<Link
			href={`/projects?tag=${encodeURIComponent(tag)}`}
			className="text-xs px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200"
		>
			#{tag}
		</Link>
	))}
</div>
```

#### 3.1.2 ProjectListWithFilters Component
- Add tag parameter to `currentParams` state
- Display active tag filter indicator
- Update filter logic to include tag filtering

#### 3.1.3 Server-Side Page Component
- Parse `tag` query parameter in `searchParams`
- Pass to `getInitialData()` function
- Update Prisma query to filter by tags

### 3.2 Database Schema (No Changes Required)
- Current `projectTags String[]` field is sufficient
- No migration needed

### 3.3 API Routes

#### 3.3.1 Update Existing Endpoints
- `/api/projects` - Add tag filtering support
- `/api/events` - Add tag filtering support

#### 3.3.2 New Endpoints (Optional)
- `GET /api/tags/popular?type=project&limit=20` - Get popular tags
- `GET /api/tags/search?q=react` - Search tags (autocomplete)

---

## 4. User Experience Flow

### 4.1 Discovery Flow
1. User browses projects on home page or `/projects`
2. User sees tags displayed on project cards
3. User clicks on a tag (e.g., "#React")
4. Page navigates to `/projects?tag=React`
5. Content filters to show only React projects
6. Active filter indicator shows "Filtering by: #React ×"
7. User can click × to clear filter or click another tag to change filter

### 4.2 Combined Filtering Flow
1. User applies stage filter (e.g., "Early Projects")
2. User clicks a tag (e.g., "#AI")
3. URL becomes `/projects?stage=early&tag=AI`
4. Content shows early-stage AI projects
5. User can remove either filter independently

---

## 5. Design Specifications

### 5.1 Tag Badge Styling
```css
/* Tag badge on cards */
.tag-badge {
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 9999px;
	background: rgba(0, 0, 0, 0.05);
	color: rgba(0, 0, 0, 0.7);
	transition: all 0.2s;
}

.tag-badge:hover {
	background: rgba(0, 0, 0, 0.1);
	color: rgba(0, 0, 0, 0.9);
}

/* Dark mode */
.dark .tag-badge {
	background: rgba(255, 255, 255, 0.1);
	color: rgba(255, 255, 255, 0.7);
}

.dark .tag-badge:hover {
	background: rgba(255, 255, 255, 0.15);
	color: rgba(255, 255, 255, 0.9);
}
```

### 5.2 Active Filter Indicator
```tsx
<div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
	<span className="text-sm text-blue-700 dark:text-blue-300">
		Filtering by: <strong>#{tag}</strong>
	</span>
	<button
		onClick={clearTagFilter}
		className="text-blue-700 dark:text-blue-300 hover:text-blue-900"
	>
		×
	</button>
</div>
```

---

## 6. Implementation Phases

### Phase 1: Basic Tag Filtering (MVP)
**Scope**: Single tag filtering on projects page
- [ ] Add tag display to ProjectCard component
- [ ] Make tags clickable with proper URL navigation
- [ ] Update `/projects` page to accept `?tag=` parameter
- [ ] Update backend query to filter by tag
- [ ] Add active tag filter indicator
- [ ] Add clear filter button

**Estimated Effort**: 2-3 days

### Phase 2: Enhanced Features
**Scope**: Multi-tag support and tag discovery
- [ ] Support multiple tags (AND/OR logic)
- [ ] Add popular tags panel/sidebar
- [ ] Tag autocomplete in search
- [ ] Tag statistics API endpoint
- [ ] Tag filtering on events and organizations

**Estimated Effort**: 3-4 days

### Phase 3: Advanced Features (Future)
**Scope**: Tag management and analytics
- [ ] Tag synonyms/aliases (e.g., "JS" → "JavaScript")
- [ ] Tag trending analytics
- [ ] User-specific tag following
- [ ] Tag-based recommendations
- [ ] Admin tag management interface

**Estimated Effort**: 5-7 days

---

## 7. Testing Requirements

### 7.1 Unit Tests
- Tag URL parameter parsing
- Tag filtering logic in queries
- Tag display component rendering

### 7.2 Integration Tests
- Tag filtering with other filters (stage, search, org)
- Tag navigation flow
- URL state management

### 7.3 E2E Tests (Playwright)
```typescript
test('should filter projects by tag', async ({ page }) => {
	await page.goto('/projects');
	await page.click('text=#React');
	await expect(page).toHaveURL(/tag=React/);
	await expect(page.locator('.project-card')).toContainText('React');
});
```

### 7.4 Manual Testing Checklist
- [ ] Click tag on project card navigates correctly
- [ ] Tag filter works with stage filter
- [ ] Tag filter works with search
- [ ] Clear tag filter button works
- [ ] URL sharing preserves tag filter
- [ ] Back/forward browser navigation works
- [ ] Mobile responsive design
- [ ] Dark mode styling

---

## 8. Performance Considerations

### 8.1 Database Performance
- **Current**: Tags stored as `String[]` - Prisma supports array queries
- **Indexing**: Consider GIN index on `projectTags` if queries are slow
- **Query Optimization**: Use `select` to limit returned fields

### 8.2 Caching Strategy
- Cache popular tags list for 1 hour
- Use React Query for client-side caching
- Server-side cache tag statistics

### 8.3 Pagination
- Maintain existing pagination logic
- Tag filtering should work with infinite scroll (if implemented)

---

## 9. Accessibility Requirements

### 9.1 Keyboard Navigation
- Tags should be keyboard accessible (Tab navigation)
- Enter/Space to activate tag filter
- Escape to clear active filter

### 9.2 Screen Readers
- Add `aria-label` to tag links: "Filter by React tag"
- Announce filter changes: "Showing projects tagged with React"
- Clear button should announce: "Remove React tag filter"

### 9.3 Visual Indicators
- Sufficient color contrast for tag badges
- Focus indicators on interactive elements
- Active filter state clearly visible

---

## 10. Internationalization (i18n)

### 10.1 Translation Keys
```json
{
	"projects.filters.tagFilter": "Filtering by: {tag}",
	"projects.filters.clearTag": "Clear tag filter",
	"projects.tags.viewAll": "View all {tag} projects",
	"projects.tags.popular": "Popular Tags"
}
```

### 10.2 Tag Localization
- Tags themselves remain in original language (mostly English)
- UI labels and messages should be translated
- Consider tag translation mapping in future (e.g., "人工智能" → "AI")

---

## 11. Analytics & Metrics

### 11.1 Events to Track
- `tag_clicked` - User clicks a tag
- `tag_filter_applied` - Tag filter is applied
- `tag_filter_cleared` - Tag filter is removed
- `tag_combined_filter` - Tag used with other filters

### 11.2 Metrics to Monitor
- Most clicked tags
- Tag filter conversion rate (click → view project)
- Average time on tag-filtered pages
- Tag filter abandonment rate

---

## 12. Open Questions & Decisions

### 12.1 Tag Normalization
**Question**: Should we normalize tags (case-insensitive, strip #)?
**Recommendation**: Yes, normalize to lowercase and strip # for consistency

### 12.2 Tag Limit per Item
**Question**: Maximum tags to display on cards?
**Recommendation**: Show 3-5 tags, with "+N more" indicator

### 12.3 Multi-tag Logic
**Question**: Should multiple tags use AND or OR logic?
**Recommendation**: Start with AND (more specific), add OR option later

### 12.4 Tag Hierarchy
**Question**: Should tags have categories/hierarchy?
**Recommendation**: Phase 2 - use existing tag categories from ProjectTagSelector

---

## 13. Success Criteria

### 13.1 Functional Success
- ✅ Users can click tags to filter content
- ✅ Tag filtering works with existing filters
- ✅ URL state is preserved and shareable
- ✅ Clear filter functionality works

### 13.2 Performance Success
- ✅ Tag queries return results in < 500ms
- ✅ No N+1 query issues
- ✅ Client-side navigation is instant (cached)

### 13.3 User Experience Success
- ✅ Tag filtering feels intuitive and responsive
- ✅ Mobile experience is smooth
- ✅ Accessibility requirements met
- ✅ No broken states or edge cases

---

## 14. References

### 14.1 Existing Code
- `apps/web/src/app/(main)/(public)/projects/page.tsx` - Projects page
- `apps/web/src/modules/public/projects/components/ProjectListWithFilters.tsx` - Filter component
- `apps/web/src/modules/project/components/ProjectTagSelector.tsx` - Tag input component
- `packages/lib-server/src/database/prisma/schema.prisma` - Data model (line 496)

### 14.2 Similar Features
- Circle.so tag filtering (inspiration)
- GitHub topic filtering
- Product Hunt tag system
- Dev.to tag navigation

---

## 15. Appendix

### 15.1 Example Tag Categories (from ProjectTagSelector)
1. **Technology Stack**: React, Vue, Node.js, Python, TypeScript, etc.
2. **Product Forms**: Website, Mobile App, Desktop Software, Browser Extension, etc.
3. **Product Types**: Efficiency Tools, Social Platform, E-commerce, Education, etc.
4. **Target Users**: Developers, Designers, Students, Entrepreneurs, etc.
5. **Project Attributes**: Open Source, AI Application, Remote Collaboration, etc.

### 15.2 Sample URL Patterns
```
# Single tag
/projects?tag=React

# Tag + stage filter
/projects?stage=early&tag=AI

# Tag + search
/projects?search=chatbot&tag=OpenAI

# Tag + organization
/projects?organization=acme&tag=SaaS

# Multiple tags (Phase 2)
/projects?tag=React&tag=TypeScript
```
