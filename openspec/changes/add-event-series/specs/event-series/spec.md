# event-series Specification

## Purpose
为长期举办但时间不固定的活动提供系列化管理与聚合展示能力。

## ADDED Requirements
### Requirement: 系列活动实体与管理
系统 SHALL 允许符合权限的组织者创建、编辑与归档系列活动，并为系列设置名称、slug、描述、封面图与可选标签。

#### Scenario: 组织者创建系列
- **GIVEN** 登录用户拥有创建活动权限
- **WHEN** 其创建系列并填写必要字段
- **THEN** 系列被保存并返回唯一标识与 slug

#### Scenario: 无权限用户尝试创建
- **GIVEN** 用户不具备活动或组织管理权限
- **WHEN** 其请求创建系列
- **THEN** 系统拒绝并返回权限错误

### Requirement: 活动可选关联系列
活动 SHALL 可选关联至一个系列；关联时系统 MUST 验证活动与系列的主办方一致；未关联系列的活动行为保持不变。

#### Scenario: 组织者为活动选择系列
- **GIVEN** 组织者拥有活动与系列的管理权限
- **WHEN** 其在活动编辑中选择系列
- **THEN** 活动保存 `seriesId` 并在后续查询中返回系列摘要

#### Scenario: 历史活动未设置系列
- **GIVEN** 既有活动未关联系列
- **WHEN** 用户访问该活动
- **THEN** 页面与接口输出保持现有行为且 `series` 为空

#### Scenario: 跨主办方关联被阻止
- **GIVEN** 活动与系列的主办方不一致
- **WHEN** 尝试关联
- **THEN** 系统拒绝并返回明确错误

### Requirement: 公网系列落地页与活动详情展示
系统 SHALL 提供系列落地页，展示系列介绍以及按时间排序的即将开始与历史活动列表；活动详情页 SHALL 展示系列摘要并链接到系列落地页。

#### Scenario: 访问系列落地页
- **GIVEN** 系列存在且包含多个活动
- **WHEN** 用户访问 `/events/series/{slug}`
- **THEN** 页面展示系列信息、即将开始活动列表与历史活动列表（按 `startTime` 排序）

#### Scenario: 活动详情显示系列入口
- **GIVEN** 活动已关联系列
- **WHEN** 用户访问活动详情页
- **THEN** 页面展示系列名称与入口链接

### Requirement: 系列查询与筛选 API
系统 SHALL 提供系列列表/详情接口，并支持在 `/api/events` 查询中通过 `seriesId` 或 `seriesSlug` 筛选活动；事件 payload 在关联系列时 SHALL 返回系列摘要。

#### Scenario: 按 seriesId 筛选活动
- **WHEN** 客户端调用 `/api/events?seriesId=SERIES_ID`
- **THEN** 仅返回该系列的活动

#### Scenario: 获取系列详情
- **WHEN** 客户端调用 `/api/event-series/{slug}`
- **THEN** 返回系列元数据与活动列表
