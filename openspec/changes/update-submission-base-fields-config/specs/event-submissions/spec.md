## MODIFIED Requirements
### Requirement: 作品一句话介绍为选填
作品提交与编辑表单 SHALL 将「一句话介绍」（`tagline`）视为选填字段，除非活动配置将其设为必填。

#### Scenario: 未配置必填时，用户提交作品不填写一句话介绍
- **GIVEN** 活动允许作品提交且用户具备提交资格
- **AND** 活动未将 `tagline` 配置为必填
- **WHEN** 用户在提交作品时将 `tagline` 留空（或仅输入空白字符）
- **THEN** 提交成功
- **AND** 服务端将 `tagline` 视为未填写（不设置或存储为 `null`）

#### Scenario: 配置为必填时，用户提交作品未填写一句话介绍
- **GIVEN** 活动将 `tagline` 配置为必填
- **WHEN** 用户提交作品且 `tagline` 为空（或仅输入空白字符）
- **THEN** 请求被拒绝
- **AND** 错误信息明确提示 `tagline` 为必填

#### Scenario: 用户输入少于 10 个字符的一句话介绍
- **GIVEN** 活动允许作品提交且用户具备提交资格
- **WHEN** 用户提交作品并提供 `tagline`，且长度少于 10 个字符
- **THEN** 提交成功

#### Scenario: 未配置必填时，用户在编辑作品时清空一句话介绍
- **GIVEN** 作品已存在且此前包含 `tagline`
- **AND** 活动未将 `tagline` 配置为必填
- **WHEN** 用户在编辑页面将 `tagline` 清空并保存
- **THEN** 保存成功
- **AND** 服务端将该作品的 `tagline` 清空（不设置或存储为 `null`）

## ADDED Requirements
### Requirement: 基础字段支持后台配置文案与必填规则
活动组织者/管理员 SHALL 能为作品提交表单的基础字段配置展示与校验规则，包括：
- `label`（字段名）
- `description`（字段说明）
- `placeholder`（如适用）
- `required`（必填/选填）
- `enabled`（是否展示）

#### Scenario: 组织者为活动配置基础字段
- **GIVEN** 组织者在活动后台编辑作品提交表单配置
- **WHEN** 其为 `tagline` / `demoUrl` / `attachments` 设置 `label`、`description`、`required`、`enabled`
- **THEN** 配置被持久化到该活动的 `submissionFormConfig`
- **AND** 参赛者打开提交/编辑作品页面时会应用该配置

#### Scenario: 未配置时使用默认文案与默认规则
- **GIVEN** 活动没有为某个基础字段提供配置（或配置无效）
- **WHEN** 参赛者打开提交/编辑作品页面
- **THEN** 该字段使用系统默认的 label/description/placeholder
- **AND** 默认必填/选填规则与当前线上行为一致

### Requirement: 项目链接字段可配置必填与校验
当活动将 `demoUrl` 配置为启用时，系统 SHALL 按配置渲染字段文案，并按配置执行必填与 URL 合法性校验。

#### Scenario: 项目链接为选填时允许留空
- **GIVEN** 活动启用 `demoUrl` 且未配置为必填
- **WHEN** 用户提交作品且 `demoUrl` 为空
- **THEN** 提交成功

#### Scenario: 项目链接为必填时拒绝留空
- **GIVEN** 活动启用 `demoUrl` 且配置为必填
- **WHEN** 用户提交作品且 `demoUrl` 为空
- **THEN** 请求被拒绝
- **AND** 错误信息明确提示 `demoUrl` 为必填

#### Scenario: 用户填写了不合法的项目链接
- **GIVEN** 活动启用 `demoUrl`
- **WHEN** 用户提交作品且 `demoUrl` 不是合法 URL
- **THEN** 请求被拒绝
- **AND** 错误信息明确提示 URL 不合法

### Requirement: 附件上传可配置展示与必填
当活动将附件上传配置为启用时，系统 SHALL 展示附件上传区域；当配置为必填时，系统 SHALL 要求至少上传 1 个附件后才允许提交。

#### Scenario: 附件上传被禁用
- **GIVEN** 活动将 `attachments` 配置为禁用（或等价配置）
- **WHEN** 用户打开提交/编辑作品页面
- **THEN** 页面不展示附件上传区域
- **AND** 用户提交作品时不应被要求提供附件

#### Scenario: 附件为选填时允许不上传
- **GIVEN** 活动启用附件上传且未配置为必填
- **WHEN** 用户提交作品且附件数量为 0
- **THEN** 提交成功

#### Scenario: 附件为必填时拒绝不上传
- **GIVEN** 活动启用附件上传且配置为必填
- **WHEN** 用户提交作品且附件数量为 0
- **THEN** 请求被拒绝
- **AND** 错误信息明确提示至少上传 1 个附件

