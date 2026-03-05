## ADDED Requirements

### Requirement: 支持多种公开投票模式
开启作品提交能力的黑客松活动 SHALL 支持将公开投票模式配置为 `FIXED_QUOTA` 或 `PER_PROJECT_LIKE`。

#### Scenario: 组织者选择投票模式
- **WHEN** 组织者/管理员编辑黑客松活动设置
- **THEN** 可以为公开投票选择 `FIXED_QUOTA` 或 `PER_PROJECT_LIKE`
- **AND** 所选模式会随活动配置持久化保存

### Requirement: 固定配额投票（FIXED_QUOTA）
当公开投票模式为 `FIXED_QUOTA` 时，系统 SHALL 将每位符合资格的投票者限制为每个活动最多 `N` 票，并 SHALL 向客户端返回剩余票数反馈。

#### Scenario: 投票者在配额内投票
- **GIVEN** 活动配置为 `FIXED_QUOTA` 且每人 `N` 票
- **WHEN** 投票者对不同作品投票，且累计投票数小于 `N`
- **THEN** 每次投票都成功
- **AND** 响应包含投票者最新的剩余票数

#### Scenario: 投票者尝试超过配额
- **GIVEN** 活动配置为 `FIXED_QUOTA` 且每人 `N` 票
- **AND** 投票者已用满 `N` 票
- **WHEN** 其尝试给其他作品投票
- **THEN** 系统拒绝该请求，并返回明确的「票数已用完」错误

#### Scenario: 取消投票后恢复配额
- **GIVEN** 活动配置为 `FIXED_QUOTA` 且每人 `N` 票
- **AND** 投票者至少投过 1 票
- **WHEN** 其取消一条已投记录
- **THEN** 该投票被移除
- **AND** 响应包含投票者最新的剩余票数

### Requirement: 逐项点赞投票（PER_PROJECT_LIKE）
当公开投票模式为 `PER_PROJECT_LIKE` 时，系统 SHALL 允许每位符合资格的投票者对任意数量的作品投票，但在同一活动内对同一作品最多 1 票。

#### Scenario: 投票者对多个作品点赞
- **GIVEN** 活动配置为 `PER_PROJECT_LIKE`
- **WHEN** 投票者对多个不同作品投票
- **THEN** 每次投票都成功
- **AND** 系统不会因活动级配额限制而阻止投票

#### Scenario: 重复给同一作品投票
- **GIVEN** 活动配置为 `PER_PROJECT_LIKE`
- **WHEN** 投票者尝试对同一作品投票两次
- **THEN** 系统拒绝第二次请求，并返回明确的「已投过票」错误

### Requirement: 投票资格与时间窗口
系统 SHALL 在两种投票模式下保持一致地执行投票资格与时间窗口规则。

#### Scenario: 投票已关闭
- **GIVEN** `Event.votingOpen` 为 false（或投票已结束）
- **WHEN** 用户尝试投票或取消投票
- **THEN** 系统拒绝请求，并返回明确的「投票已关闭」错误

#### Scenario: 不符合资格的用户尝试投票
- **GIVEN** 公开投票范围限制为活动参与者
- **WHEN** 未通过报名审核的用户尝试投票
- **THEN** 系统拒绝请求，并返回明确的「仅参与者可投票」错误

### Requirement: 剩余票数返回语义
系统 SHALL 提供一致的客户端契约，支持 UI 展示「剩余票数」或「无限票」。

#### Scenario: 固定配额下的剩余票数
- **GIVEN** 活动配置为 `FIXED_QUOTA`
- **WHEN** 客户端请求作品列表或投票/取消投票
- **THEN** 响应中的 `remainingVotes` 为非负整数

#### Scenario: 逐项点赞模式的无限票
- **GIVEN** 活动配置为 `PER_PROJECT_LIKE`
- **WHEN** 客户端请求作品列表或投票/取消投票
- **THEN** 响应包含 `remainingVotes = null`
