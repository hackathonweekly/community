## ADDED Requirements

### Requirement: 作品一句话介绍为选填
作品提交与编辑表单 SHALL 将「一句话介绍」（`tagline`）视为选填字段。

#### Scenario: 用户提交作品时不填写一句话介绍
- **GIVEN** 活动允许作品提交且用户具备提交资格
- **WHEN** 用户在提交作品时将 `tagline` 留空（或仅输入空白字符）
- **THEN** 提交成功
- **AND** 服务端将 `tagline` 视为未填写（不设置或存储为 `null`）

#### Scenario: 用户输入少于 10 个字符的一句话介绍
- **GIVEN** 活动允许作品提交且用户具备提交资格
- **WHEN** 用户提交作品并提供 `tagline`，且长度少于 10 个字符
- **THEN** 提交成功

#### Scenario: 用户在编辑作品时清空一句话介绍
- **GIVEN** 作品已存在且此前包含 `tagline`
- **WHEN** 用户在编辑页面将 `tagline` 清空并保存
- **THEN** 保存成功
- **AND** 服务端将该作品的 `tagline` 清空（不设置或存储为 `null`）

### Requirement: 一句话介绍长度上限
当用户提供 `tagline` 时，系统 SHALL 拒绝超过 100 个字符的输入，并向用户返回明确错误。

#### Scenario: 用户输入过长的一句话介绍
- **WHEN** 用户提交或保存作品且 `tagline` 超过 100 个字符
- **THEN** 请求被拒绝
- **AND** 错误信息提示 `tagline` 过长

