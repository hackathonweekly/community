# 周周黑客松社区游戏化优化方案

## 背景

参考 Circle.so 等成熟社区平台的游戏化设计，结合当前周周黑客松社区的现状，提出以下优化建议。

**当前已有功能**：
- ✅ 积分（贡献点）系统
- ✅ 徽章系统（Badge）
- ✅ 贡献记录系统（Contribution）
- ✅ 社区任务系统（CommunityTask）
- ✅ 基础会员等级（VISITOR/MEMBER）

**核心问题**：
- ❌ 缺少排行榜，用户无法看到自己在社区中的相对位置
- ❌ 等级系统过于简单，缺乏成长感
- ❌ 积分和徽章缺少统一的展示入口
- ❌ 游戏化元素分散，缺少整体的激励体系

---

## 优先级 P0：核心游戏化功能（建议立即实施）

### 1. 排行榜系统（Leaderboard）

**功能描述**：
展示社区成员的贡献排名，增强竞争感和参与动力。

**实现要点**：
- **多维度排行榜**：
  - 总积分排行（All Time）
  - 月度积分排行（Monthly）
  - 周度积分排行（Weekly）
  - 特定类型贡献排行（活动组织者、项目创作者、志愿者等）

- **展示信息**：
  - 排名、用户头像、用户名、等级标识
  - 积分、徽章数量
  - 本周/本月增长趋势（↑ +50积分）

- **个人视角**：
  - 高亮显示当前用户位置
  - 显示"距离上一名还差 X积分"
  - 显示"超越了 X% 的成员"

**技术实现**：
```typescript
// 新增 API 路由
GET /api/leaderboard
  ?period=all|monthly|weekly
  &type=total|event|project|volunteer
  &limit=50
  &offset=0

// 数据库查询优化
- 添加 cpValue 索引
- 考虑使用 Redis 缓存排行榜数据（每小时更新）
- 月度/周度数据可以通过 Contribution 表的 createdAt 聚合计算
```

**页面位置**：
- 新增 `/leaderboard` 公开页面
- 在导航栏添加"排行榜"入口
- 在个人主页显示"我的排名"卡片

---

### 2. 细化等级系统

**功能描述**：
将现有的简单二级会员系统（VISITOR/MEMBER）扩展为多级成长体系。

**等级设计建议**：

| 等级 | 名称 | CP要求 | 权益 |
|------|------|--------|------|
| 0 | 游客 (Visitor) | 0 | 浏览内容 |
| 1 | 新人 (Newcomer) | 0 | 首次注册，可参与活动 |
| 2 | 成员 (Member) | 100 | 参加1次活动后自动升级 |
| 3 | 活跃成员 (Active) | 500 | 发布项目、评论权限 |
| 4 | 核心成员 (Core) | 1500 | 发起任务、组织活动 |
| 5 | 资深成员 (Senior) | 3000 | 专属徽章、优先报名 |
| 6 | 导师 (Mentor) | 5000 | 审核权限、导师标识 |
| 7 | 传奇 (Legend) | 10000 | 社区荣誉墙、特殊权益 |

**实现要点**：
- 修改 `MembershipLevel` 枚举，增加更多等级
- 添加自动升级逻辑（基于 积分）
- 在用户头像旁显示等级标识（图标+颜色）
- 等级升级时发送通知和徽章奖励

**技术实现**：
```typescript
// schema.prisma 修改
enum MembershipLevel {
  VISITOR
  NEWCOMER
  MEMBER
  ACTIVE
  CORE
  SENIOR
  MENTOR
  LEGEND
}

// 自动升级逻辑（可以在 Contribution 创建后触发）
async function checkAndUpgradeLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpValue: true, membershipLevel: true }
  })

  const newLevel = calculateLevel(user.cpValue)
  if (newLevel !== user.membershipLevel) {
    await prisma.user.update({
      where: { id: userId },
      data: { membershipLevel: newLevel }
    })
    // 发送升级通知
    await sendLevelUpNotification(userId, newLevel)
  }
}
```

---

### 3. 个人成就中心（Profile Enhancement）

**功能描述**：
在个人主页集中展示用户的游戏化数据，增强成就感。

**展示内容**：
- **顶部卡片**：
  - 等级进度条（当前等级 → 下一等级）
  - 积分总数 + 本月增长
  - 排���榜位置（全站排名 #123）

- **徽章墙**：
  - 已获得徽章展示（按稀有度排序）
  - 未获得徽章灰显（激励用户获取）
  - 点击徽章查看获得条件和时间

- **贡献时间线**：
  - 最近的贡献记录（活动签到、项目发布、任务完成等）
  - 每条记录显示获得的积分

- **统计数据**：
  - 参与活动次数
  - 发布项目数量
  - 完成任务数量
  - 获��点赞数

**页面位置**：
- 优化现有 `/me` 页面
- 在 `/u/[username]` 公开主页也展示（可设置隐私）

---

## 优先级 P1：增强功能（建议近期实施）

### 4. 积分获取规则透明化

**问题**：
用户不清楚如何获得积分，缺少明确的激励指引。

**解决方案**：
- 创建 `/docs/cp-system` 文档页面，详细说明：
  - 各类行为的积分奖励（活动签到+10、发布项目+50等）
  - 特殊奖励机制（首次参与、连续签到等）
  - 积分的用途和价值

- 在关键操作完成后显示 Toast 提示：
  ```
  🎉 恭喜！活动签到成功，获得 10积分
  ```

---

### 5. 徽章自动颁发系统

**当前问题**：
徽章系统已存在，但缺少自动颁发逻辑。

**实现要点**：
- 定义常见徽章的自动颁发条件：
  - "首次参与"：参加第一次活动
  - "活动达人"：参加10次活动
  - "项目创作者"：发布第一个项目
  - "任务完成者"：完成5个社区任务
  - "连续签到"：连续签到7天

- 在相关操作后触发徽章检查逻辑
- 颁发徽章时发送通知

**技术实现**：
```typescript
// 徽章条件配置（存储在 Badge.conditions JSON字段）
{
  "type": "event_count",
  "threshold": 10,
  "action": "auto_award"
}

// 自动检查逻辑
async function checkBadgeEligibility(userId: string, eventType: string) {
  const autoBadges = await prisma.badge.findMany({
    where: { isAutoAwarded: true }
  })

  for (const badge of autoBadges) {
    const eligible = await evaluateCondition(userId, badge.conditions)
    if (eligible) {
      await awardBadge(userId, badge.id)
    }
  }
}
```

---

### 6. 社区动态流（Activity Feed）

**功能描述**：
展示社区最新动态，增强社区活跃度感知。

**展示内容**：
- 用户升级通知："@张三 升级到了核心成员"
- 徽章获得："@李四 获得了'活动达人'徽章"
- 项目发布："@王五 发布了新项目《AI助手》"
- 任务完成："@赵六 完成了任务《撰写活动总结》"

**页面位置**：
- 首页右侧边栏
- 或独立的 `/activity` 页面

---

## 优先级 P2：长期优化（可选）

### 7. 积分商城/奖励兑换

- 使用积分兑换实体奖励（T恤、贴纸等）
- 兑换虚拟权益（活动优先报名、专属徽章等）

### 8. 团队/小组系统

- 用户可以创建或加入小组
- 小组排行榜（团队积分总和）
- 小组内部任务和挑战

### 9. 成就系统（Achievements）

- 类似游戏成就，设置隐藏成就
- 完成特定组合条件解锁（如"全能选手"：同时获得活动、项目、任务三类徽章）

---

## 实施建议

### 第一阶段（2周）：
1. ✅ 实现排行榜基础功能（总榜 + 月榜）
2. ✅ 细化等级系统（修改枚举 + 自动升级逻辑）
3. ✅ 优化个人主页展示（等级进度条 + 徽章墙）

### 第二阶段（2周）：
4. ✅ 积分规则文档页面
5. ✅ 徽章自动颁发系统
6. ✅ 社区动态流

### 第三阶段（按需）：
7. 积分商城
8. 团队系统
9. 成就系统

---

## 技术考虑

### 性能优化：
- 排行榜数据使用 Redis 缓存，每小时更新
- 积分变更时异步更新排行榜
- 徽章检查使用后台任务队列（避免阻塞主流程）

### 数据库优化：
```sql
-- 添加索引
CREATE INDEX idx_user_cpvalue ON "user"(cpValue DESC);
CREATE INDEX idx_contribution_created ON "contribution"(createdAt DESC);
CREATE INDEX idx_user_membership_level ON "user"(membershipLevel);
```

### 通知系统：
- 等级升级、徽章获得、排名变化等关键事件发送站内通知
- 可选邮件通知（用户可在设置中关闭）

---

## 预期效果

1. **用户留存提升**：通过等级和排行榜增强用户粘性
2. **活跃度提升**：明确的激励机制促进用户参与
3. **社区氛围**：游戏化元素增强趣味性和竞争感
4. **数据可视化**：用户贡献更加透明和可量化

---

## 参考资料

- Circle.so 社区平台游戏化设计
- Discourse 论坛的徽章系统
- Stack Overflow 的声望和徽章系统
- GitHub 的贡献图和成就系统
