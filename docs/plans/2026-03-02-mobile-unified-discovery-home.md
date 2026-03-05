# Unified Mobile Discovery Home Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让移动端在已登录和未登录状态下都默认进入同一套“发现（活动优先）”模式，并在未登录时通过轻量引导完成登录转化。

**Architecture:** 采用单入口策略：`/` 仅作为入口重定向到 `/events`，移动端底部导航使用统一 Tab 结构，不再为未登录用户单独暴露“组织”主入口。保留现有动作级登录拦截（报名、创建、关注等），并在发现页增加非打断式登录引导。

**Tech Stack:** Next.js App Router、React Client/Server Components、next-intl、TanStack Query、node:test (`tsx --test`)

---

### Task 1: 提取“移动端统一入口策略”并先补回归测试

**Files:**
- Create: `apps/web/src/modules/public/shared/lib/mobile-entry-policy.ts`
- Create: `apps/web/src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
	CATEGORY_PREFIXES,
	getMobileHomeHref,
	getGuestTabKeys,
	getUserTabKeys,
	isDiscoveryRoute,
} from "../mobile-entry-policy";

test("mobile home href is always /events", () => {
	assert.equal(getMobileHomeHref(false), "/events");
	assert.equal(getMobileHomeHref(true), "/events");
});

test("guest tabs remove organizations and keep login", () => {
	assert.deepEqual(getGuestTabKeys(), [
		"home",
		"docs",
		"create",
		"notifications",
		"login",
	]);
});

test("authenticated tabs keep me entry", () => {
	assert.deepEqual(getUserTabKeys(), [
		"home",
		"docs",
		"create",
		"notifications",
		"me",
	]);
});

test("discovery route covers all category list pages", () => {
	for (const prefix of CATEGORY_PREFIXES) {
		assert.equal(isDiscoveryRoute(prefix), true);
	}
	assert.equal(isDiscoveryRoute("/"), false);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
Expected: FAIL with module-not-found for `mobile-entry-policy`.

**Step 3: Write minimal implementation**

```ts
export const CATEGORY_PREFIXES = [
	"/events",
	"/projects",
	"/orgs",
	"/tasks",
	"/posts",
	"/members",
] as const;

export function getMobileHomeHref(_isAuthenticated: boolean) {
	return "/events" as const;
}

export function getGuestTabKeys() {
	return ["home", "docs", "create", "notifications", "login"] as const;
}

export function getUserTabKeys() {
	return ["home", "docs", "create", "notifications", "me"] as const;
}

export function isDiscoveryRoute(pathname: string) {
	return CATEGORY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
Expected: PASS (all tests green).

**Step 5: Commit**

```bash
git add apps/web/src/modules/public/shared/lib/mobile-entry-policy.ts apps/web/src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts
git commit -m "test(nav): add mobile unified entry policy coverage"
```

### Task 2: 将根路由 `/` 统一改为进入发现流

**Files:**
- Modify: `apps/web/src/app/(main)/(public)/(home)/page.tsx`
- Modify: `packages/config/src/index.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getMobileHomeHref } from "../mobile-entry-policy";

test("public entry should resolve to /events", () => {
	assert.equal(getMobileHomeHref(false), "/events");
});
```

(该测试在旧实现下会失败；若 Task 1 已通过，则把这里当作守护测试复用，不重复新增文件。)

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
Expected: 在改代码前，若 helper 未接入页面，将看到“测试通过但行为未落地”的差距（人工校验 `/` 仍是 Landing）。

**Step 3: Write minimal implementation**

```ts
// apps/web/src/app/(main)/(public)/(home)/page.tsx
import { redirect } from "next/navigation";

export default async function Home() {
	redirect("/events");
}
```

```ts
// packages/config/src/index.ts
redirectAfterSignIn: "/events",
```

**Step 4: Run test to verify it passes**

Run:
- `pnpm --filter web lint src/app/'(main)'/'(public)'/'(home)'/page.tsx`
- `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`

Expected: lint + tests pass; 打开 `/` 会直接进入 `/events`。

**Step 5: Commit**

```bash
git add apps/web/src/app/'(main)'/'(public)'/'(home)'/page.tsx packages/config/src/index.ts
git commit -m "feat(nav): route root and post-login entry to events"
```

### Task 3: 统一移动端 TabBar（登录态同模式，未登录改为登录引导）

**Files:**
- Modify: `apps/web/src/modules/public/shared/components/TabBar.tsx`
- Modify: `packages/lib-shared/src/i18n/translations/zh.json`
- Modify: `packages/lib-shared/src/i18n/translations/en.json`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getGuestTabKeys, getUserTabKeys } from "../mobile-entry-policy";

test("guest no longer has organizations as primary tab", () => {
	assert.equal(getGuestTabKeys().includes("organizations" as never), false);
});

test("both auth states keep discovery-first tab ordering", () => {
	assert.equal(getGuestTabKeys()[0], "home");
	assert.equal(getUserTabKeys()[0], "home");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
Expected: FAIL until helper + TabBar mapping一致。

**Step 3: Write minimal implementation**

```ts
// TabBar behavior target
// - user: home(/events), docs, create(action), notifications, me
// - guest: home(/events), docs, create(action->login), notifications, login
// - remove guest organizations primary tab
// - keep /events active for category prefixes
```

同时新增一个文案键：

```json
"tab_nav": {
	"discover": "发现"
}
```

并让 TabBar 首项显示 `tab_nav.discover`（或继续复用 `tab_nav.home`，但文案更新为“发现”）。

**Step 4: Run test to verify it passes**

Run:
- `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
- `pnpm --filter web lint src/modules/public/shared/components/TabBar.tsx`
- `pnpm --filter web type-check`

Expected: tests/lint/type-check all pass; 未登录时底栏不再出现“组织”主 Tab。

**Step 5: Commit**

```bash
git add apps/web/src/modules/public/shared/components/TabBar.tsx packages/lib-shared/src/i18n/translations/zh.json packages/lib-shared/src/i18n/translations/en.json
git commit -m "feat(mobile-nav): unify tab mode for guests and members"
```

### Task 4: 在发现页加“轻登录引导”而非强拦截

**Files:**
- Create: `apps/web/src/modules/public/shared/components/VisitorLoginBanner.tsx`
- Modify: `apps/web/src/modules/public/events/components/EventsTabs.tsx`
- Modify: `packages/lib-shared/src/i18n/translations/zh.json`
- Modify: `packages/lib-shared/src/i18n/translations/en.json`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowVisitorLoginBanner } from "../mobile-entry-policy";

test("visitor sees login banner on discovery surface", () => {
	assert.equal(shouldShowVisitorLoginBanner(false), true);
	assert.equal(shouldShowVisitorLoginBanner(true), false);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
Expected: FAIL until `shouldShowVisitorLoginBanner` is implemented.

**Step 3: Write minimal implementation**

```ts
// mobile-entry-policy.ts
export function shouldShowVisitorLoginBanner(isAuthenticated: boolean) {
	return !isAuthenticated;
}
```

```tsx
// EventsTabs unauthenticated branch
<VisitorLoginBanner
	href={`/auth/login?redirectTo=${encodeURIComponent("/events")}`}
/>
<EventListWithFilters />
```

Banner 文案建议（中英各一套）：
- 标题：登录后解锁完整社区体验
- 说明：报名活动、关注组织、发布内容都需要登录
- CTA：立即登录

**Step 4: Run test to verify it passes**

Run:
- `pnpm --filter web exec tsx --test src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts`
- `pnpm --filter web lint src/modules/public/shared/components/VisitorLoginBanner.tsx src/modules/public/events/components/EventsTabs.tsx`
- `pnpm --filter web type-check`

Expected: tests/lint/type-check pass; 未登录访问 `/events` 可浏览内容且看到轻提示。

**Step 5: Commit**

```bash
git add apps/web/src/modules/public/shared/components/VisitorLoginBanner.tsx apps/web/src/modules/public/events/components/EventsTabs.tsx packages/lib-shared/src/i18n/translations/zh.json packages/lib-shared/src/i18n/translations/en.json apps/web/src/modules/public/shared/lib/mobile-entry-policy.ts apps/web/src/modules/public/shared/lib/__tests__/mobile-entry-policy.test.ts
git commit -m "feat(auth): add lightweight visitor login prompt on discovery"
```

### Task 5: 回归验证与发布检查

**Files:**
- (No code changes unless fixes are needed)

**Step 1: Write the failing test**

准备一份手工回归清单（先按旧行为执行会失败）：
1. 未登录打开 `/`，应进入 `/events`（旧行为是 Landing）
2. 未登录移动端底栏不出现“组织”主 Tab
3. 未登录在发现页看到登录引导，但不被强制拦截
4. 登录后同样默认进入 `/events`
5. 关键动作（创建/报名/通知/我的）仍正确走登录或权限逻辑

**Step 2: Run test to verify it fails**

Run (manual): 使用浏览器开发者工具手机视口逐项验证。
Expected: 改造前至少第 1、2 项失败。

**Step 3: Write minimal implementation**

修复回归缺陷（仅最小改动），禁止顺手重构无关模块。

**Step 4: Run test to verify it passes**

Run:
- `pnpm lint`
- `pnpm type-check`
- 手工回归清单 5/5 通过

Expected: 全部通过后才能进入 PR。

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(qa): verify unified mobile discovery flow"
```

## Rollout Notes

- 优先移动端灰度（内部账号先体验 1 天）
- 观察指标：`/events` 未登录停留时长、登录点击率、登录后次日回访率
- 若转化下降超过预期，回滚点：`(home)/page.tsx` 与 `TabBar.tsx` 两处即可快速恢复
