# Change: 增强黑客松投票能力（支持多种投票模式）

## Why
当前黑客松作品投票采用固定且写死的配额（每位参与者 3 票）。不同活动需要不同的互动模式：有的希望严格「每人 N 票」的配额投票；有的希望「逐项点赞（每个作品 1 票，可给多个作品点赞）」以最大化参与热度与现场互动。

## What Changes
- 为黑客松作品「公开/观众投票」增加可配置的投票模式，支持两种选项：
  - `FIXED_QUOTA`：每位符合资格的投票者在该活动内有 `N` 票额度。
  - `PER_PROJECT_LIKE`：每位符合资格的投票者可给任意数量的作品投票，但每个作品最多 1 票。
- 在黑客松组织者/管理员的活动设置中暴露该模式配置（`FIXED_QUOTA` 下需配置 `N`）。
- 后端严格按所选模式执行投票/取消投票，以及对客户端返回的「剩余票数」计算逻辑。

## Impact
- Affected specs: `hackathon-voting-modes`（新增能力）
- Affected code: `src/server/routes/event-projects.ts`、黑客松配置的类型/默认值归一化、公开作品投票 UI（`src/modules/public/events/submissions/*`）、以及客户端类型 `src/features/event-submissions/*`
