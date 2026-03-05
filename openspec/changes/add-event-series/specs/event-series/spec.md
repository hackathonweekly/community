# event-series Specification

## Purpose
为长期举办但时间不固定的活动提供系列化管理、聚合展示与订阅通知能力。

## ADDED Requirements

### Requirement: 系列活动实体与管理
系统 SHALL 允许具备权限的用户创建、编辑、归档系列活动，并配置标题、slug、描述、封面与标签。

#### Scenario: 创建系列成功
- **GIVEN** 登录用户具备个人或组织系列管理权限
- **WHEN** 提交合法系列数据
- **THEN** 返回创建成功的系列记录与唯一 slug

#### Scenario: 无权限组织归属创建被拒绝
- **GIVEN** 用户不是目标组织 owner/admin
- **WHEN** 尝试创建组织归属系列
- **THEN** 返回 `403`

### Requirement: 活动可选关联系列（非破坏式）
活动 SHALL 可选关联一个系列；未关联系列时现有行为 MUST 保持不变。

#### Scenario: 历史活动不受影响
- **GIVEN** 历史活动 `seriesId = null`
- **WHEN** 访问活动详情、列表、报名流程
- **THEN** 行为与改造前一致

#### Scenario: 归属不一致关联被拒绝
- **GIVEN** 活动与系列归属不一致
- **WHEN** 创建或编辑活动时提交 `seriesId`
- **THEN** 返回 `400` 并提示归属不匹配

### Requirement: 系列订阅与发布通知
系统 SHALL 支持登录用户订阅/取消订阅系列，并在系列新活动发布时触发站内与邮件通知。

#### Scenario: 用户订阅系列
- **GIVEN** 用户已登录
- **WHEN** 调用 `POST /api/event-series/{id}/subscription`
- **THEN** 订阅状态变为 subscribed

#### Scenario: 系列发布通知触发
- **GIVEN** 活动关联 `seriesId` 且从非 `PUBLISHED` 变为 `PUBLISHED`
- **WHEN** 发布成功
- **THEN** 向订阅者发送站内通知，并按邮件偏好发送邮件

### Requirement: 系列公共页面与历史聚合
系统 SHALL 提供系列列表页与系列详情页，系列详情页 MUST 按时间分组展示即将开始与历史活动。

#### Scenario: 系列详情分组展示
- **GIVEN** 系列下存在多个活动
- **WHEN** 访问 `/events/series/{slug}`
- **THEN** 页面展示系列信息，且活动按“即将开始/历史活动”分组并正确排序

### Requirement: 事件查询支持系列过滤
系统 SHALL 在 `/api/events` 支持 `seriesId` 与 `seriesSlug` 过滤，并在事件响应中返回系列摘要。

#### Scenario: 按 seriesSlug 筛选
- **WHEN** 调用 `/api/events?seriesSlug={slug}`
- **THEN** 仅返回该系列活动
