# Change: Make event submission one-sentence intro optional

## Why
作品提交/编辑表单目前要求填写一句话介绍，且需要至少 10 个字符，这会提高提交门槛并导致不必要的校验失败。

## What Changes
- 将作品提交与编辑页面的「一句话介绍」（`tagline`）从必填改为选填
- 取消「至少 10 字」限制（允许少于 10 字或为空）
- 仍保留合理的上限校验（保持现有 `max(100)` 不变）
- 服务端与客户端对 `tagline` 的校验与归一化保持一致：空字符串/纯空白视为未填写

## Impact
- Affected capability: `event-submissions`
- Affected code:
  - `src/features/event-submissions/schema.ts`
  - `src/modules/dashboard/events/components/submissions/EventSubmissionForm.tsx`
  - `src/features/event-submissions/types.ts`
  - `src/server/routes/event-projects.ts`
- Compatibility: 现有已提交的作品不受影响；仅放宽校验与必填约束

## Non-Goals
- 不修改账号作品库（`/app/projects/*`）的「一句话介绍」必填规则（除非另行确认）

