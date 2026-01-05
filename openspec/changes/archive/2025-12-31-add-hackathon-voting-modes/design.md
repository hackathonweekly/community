# Design: 黑客松投票模式

## Scope（范围）
本变更聚焦于黑客松「作品提交/展示」投票流程（即 `/events/[eventId]/submissions/*` 使用、由 `ProjectVote` 支撑的投票接口）。本次仅为**公开/观众投票**增加可配置规则；评委打分（judge scoring）流程保持不变。

## Data model choice（数据模型选择）
数据库已存在 `ProjectVote`，并对 `(projectId, userId, eventId)` 做了唯一约束。这天然支持两种模式下「同一用户对同一作品最多 1 票」的规则。

为避免新增迁移，本次将投票模式配置放入现有的 `Event.hackathonConfig.voting`（JSON）中，与现有公开投票配置并列存储。

## Configuration shape（概念结构）
- `publicVotingMode`: `FIXED_QUOTA | PER_PROJECT_LIKE`
- `publicVoteQuota`: 整数（当 `publicVotingMode = FIXED_QUOTA` 时必填）

默认值保持当前行为不变：
- `publicVotingMode = FIXED_QUOTA`
- `publicVoteQuota = 3`

## Server-side enforcement（后端强制规则）
通用校验（现有行为 + 加固）：
- 当 `Event.votingOpen` 为 false 时，投票/取消投票请求必须被拒绝。
- 当投票窗口已关闭时（当前代码以 `endTime` 作为截止），投票/取消投票请求必须被拒绝。
- 投票者不得给自己的作品或自己所在队伍的作品投票。
- 投票者必须符合参与资格（沿用现有「报名且审核通过」逻辑）。

模式差异校验：
- `FIXED_QUOTA`：后端统计用户在该活动内已投票数，超过 `publicVoteQuota` 时拒绝新增投票。
- `PER_PROJECT_LIKE`：不做活动级配额限制，仅受「每作品唯一投票」约束。

## Client contract（客户端契约）
作品列表接口当前返回：
- `userVotes`：用户已投的作品列表
- `remainingVotes`：剩余票数（配额）

为同时支持两种模式且避免客户端自行猜测：
- 当模式为 `PER_PROJECT_LIKE` 时，`remainingVotes` 应返回 `null`。
- （可选实现）在列表响应中返回 `publicVotingMode` 与 `publicVoteQuota` 以便 UI 展示更精准文案；若不返回，则客户端可将 `remainingVotes === null` 视为「无限票」。
