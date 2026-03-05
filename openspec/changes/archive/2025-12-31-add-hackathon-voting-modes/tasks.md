## 1. Implementation（实现）
- [x] 1.1 在黑客松投票配置中新增「公开投票模式」与「配额 N」字段（默认保持当前每人 3 票行为）
- [x] 1.2 更新作品列表接口（`GET /api/events/:eventId/submissions`）按模式计算 `remainingVotes`（无限票模式返回 `null`）
- [x] 1.3 更新投票/取消投票接口（`POST|DELETE /api/submissions/:submissionId/vote`）在服务端强制执行不同模式的规则
- [x] 1.4 更新公开投票 UI（扫码投票页 + 作品墙）适配模式：`FIXED_QUOTA` 展示剩余票数，`remainingVotes = null` 视为无限票
- [x] 1.5 增加/调整管理员活动设置 UI：支持配置模式与配额 `N`

## 2. Validation（验证）
- [x] 2.1 增加单元/集成测试覆盖模式强制逻辑（超额、无限票、取消投票恢复配额）
- [x] 2.2 手工冒烟测试：创建黑客松活动、提交作品、分别验证两种模式端到端（投票/取消、剩余票数、错误提示）
