# 黑客松开关控制系统设计

## 设计理念

**用简单的布尔开关替代阶段系统和时间控制**

- 管理员完全控制：想开就开，想关就关
- 前端显示清晰的开关状态
- 后端只检查开关状态

## 数据结构设计

### Event 表新增字段

```prisma
model Event {
  // ... 现有字段

  // 黑客松控制开关
  registrationOpen      Boolean   @default(true)   // 是否开放报名
  submissionsOpen       Boolean   @default(false)  // 是否开放作品提交
  votingOpen            Boolean   @default(false)  // 是否开放投票

  // 可选：保留时间字段作为参考，但不强制检查
  registrationDeadline        DateTime?
  projectSubmissionDeadline   DateTime?
}
```

### HackathonConfig 废弃

```typescript
// src/features/hackathon/config.ts
// 标记 stage 相关类型为废弃
/**
 * @deprecated 已废弃，使用 Event.submissionsOpen 和 Event.votingOpen 控制
 */
export const HACKATHON_STAGE_VALUES = [...]
```

## 控制逻辑

### 1. 报名控制

**后端检查** (`src/server/routes/events/registrations.ts`):
```typescript
// 只检查开关
if (!event.registrationOpen) {
    throw new HTTPException(400, {
        message: "Registration is closed",
    });
}
```

**管理员操作**:
- "开放报名" 按钮 → `registrationOpen = true`
- "停止报名" 按钮 → `registrationOpen = false`

### 2. 作品提交控制

**后端检查** (`src/server/routes/event-projects.ts`):
```typescript
// 只检查开关
if (!event.submissionsOpen) {
    throw new HTTPException(400, {
        message: "Project submissions are closed",
    });
}
```

**管理员操作**:
- "开放作品提交" 按钮 → `submissionsOpen = true`
- "停止作品提交" 按钮 → `submissionsOpen = false`

### 3. 投票控制

**后端检查** (`src/server/routes/hackathon.ts`):
```typescript
// 只检查开关
if (!event.votingOpen) {
    throw new HTTPException(403, {
        message: "Voting is closed",
    });
}
```

**管理员操作**:
- "开放投票" 按钮 → `votingOpen = true`
- "停止投票" 按钮 → `votingOpen = false`

### 4. 查看结果

**无需控制** - 投票结果可以随时查看

## 前端 UI 设计

### 管理员控制面板

在活动管理页面添加简洁的控制区域：

```tsx
<Card>
  <CardHeader>
    <CardTitle>黑客松控制</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* 报名控制 */}
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">报名</h4>
        <p className="text-sm text-muted-foreground">
          控制参赛者是否可以报名活动
        </p>
      </div>
      <Switch
        checked={event.registrationOpen}
        onCheckedChange={(checked) => updateSwitch('registrationOpen', checked)}
      />
    </div>

    {/* 作品提交控制 */}
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">作品提交</h4>
        <p className="text-sm text-muted-foreground">
          控制是否允许提交和修改作品
        </p>
      </div>
      <Switch
        checked={event.submissionsOpen}
        onCheckedChange={(checked) => updateSwitch('submissionsOpen', checked)}
      />
    </div>

    {/* 投票控制 */}
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">投票</h4>
        <p className="text-sm text-muted-foreground">
          控制是否开放作品投票
        </p>
      </div>
      <Switch
        checked={event.votingOpen}
        onCheckedChange={(checked) => updateSwitch('votingOpen', checked)}
      />
    </div>
  </CardContent>
</Card>
```

### 前端状态显示（用户视角）

```tsx
// 根据开关状态显示当前状态
function getCurrentStatus() {
  if (event.registrationOpen) return "报名进行中";
  if (event.submissionsOpen) return "作品提交开放";
  if (event.votingOpen) return "投票进行中";
  return "活动进行中";
}
```

## API 设计

### 更新控制开关

```typescript
// PUT /api/events/:eventId/controls
app.put(
  "/:eventId/controls",
  zValidator("json", z.object({
    registrationOpen: z.boolean().optional(),
    submissionsOpen: z.boolean().optional(),
    votingOpen: z.boolean().optional(),
  })),
  async (c) => {
    // 权限检查
    // 更新开关
    // 返回更新后的状态
  }
);
```

## 默认值策略

### 新创建的黑客松
- `registrationOpen = true` (默认开放报名)
- `submissionsOpen = false` (默认不开放提交，等活动开始)
- `votingOpen = false` (默认不开放投票)

### 推荐的开关顺序
1. 创建活动 → `registrationOpen = true`
2. 活动开始 → 管理员手动开启 `submissionsOpen = true`
3. 提交截止 → 管理员手动关闭 `submissionsOpen = false`
4. 评审完成 → 管理员手动开启 `votingOpen = true`
5. 投票结束 → 管理员手动关闭 `votingOpen = false`

## 迁移策略

### 数据库迁移

```prisma
// prisma/migrations/xxx_add_hackathon_controls.sql
ALTER TABLE "Event"
ADD COLUMN "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "submissionsOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "votingOpen" BOOLEAN NOT NULL DEFAULT false;

-- 为现有黑客松设置合理的默认值
UPDATE "Event"
SET
  "registrationOpen" = (
    CASE
      WHEN "startTime" > NOW() THEN true
      ELSE false
    END
  ),
  "submissionsOpen" = (
    CASE
      WHEN "startTime" <= NOW() AND "endTime" > NOW() THEN true
      ELSE false
    END
  ),
  "votingOpen" = false
WHERE "type" = 'HACKATHON';
```

### 代码迁移步骤

#### 第一步：数据库 Schema 更新
1. 更新 `prisma/schema.prisma`
2. 运行 `bun db:generate`
3. 创建并运行迁移

#### 第二步：后端 API 修改
1. 移除投票阶段检查 (`src/server/routes/hackathon.ts`)
2. 添加投票开关检查
3. 移除作品提交的阶段相关代码（已完成部分）
4. 添加新的控制开关 API

#### 第三步：前端 UI 修改
1. 移除阶段管理 UI
2. 添加简洁的开关控制面板
3. 更新状态显示逻辑（基于开关而非阶段）
4. 移除前端的阶段 fallback 逻辑

#### 第四步：清理废弃代码
1. 标记 `hackathonConfig.stage` 为 deprecated
2. 移除所有阶段相关的类型导入（逐步）
3. 更新文档和注释

## 优势对比

### vs 阶段系统
- ✅ **更简单**: 3个开关 vs 5个阶段
- ✅ **更灵活**: 不需要按顺序，可以同时开启多个
- ✅ **更直观**: 开关状态一目了然
- ✅ **不会忘记**: 不需要记得切换阶段

### vs 时间控制
- ✅ **更精确**: 管理员说了算，不依赖预设时间
- ✅ **更少字段**: 不需要添加多个时间字段
- ✅ **无需时区处理**: 不需要担心时区问题
- ✅ **即时生效**: 点击开关立即生效，不需要等到某个时间

### 可能的增强

如果未来需要自动化，可以简单添加：

```typescript
// 可选：自动关闭功能
interface AutoCloseConfig {
  registrationAutoCloseAt?: DateTime;  // 到时自动关闭报名
  submissionsAutoCloseAt?: DateTime;   // 到时自动关闭提交
  votingAutoCloseAt?: DateTime;        // 到时自动关闭投票
}
```

但这是可选的，基本的手动控制已经完全够用。

## 用户体验

### 管理员视角
```
黑客松控制面板
┌─────────────────────────────────────┐
│ 报名          [ON]  正在开放        │
│ 作品提交      [OFF] 未开放          │
│ 投票          [OFF] 未开放          │
└─────────────────────────────────────┘
```

点击开关即时生效，无需刷新页面。

### 参赛者视角

**报名阶段**:
```
活动状态: 报名进行中 🟢
[ 立即报名 ]
```

**开发阶段**:
```
活动状态: 作品提交开放 🟢
[ 提交作品 ] [ 编辑作品 ]
```

**投票阶段**:
```
活动状态: 投票进行中 🟢
[ 查看作品并投票 ]
```

## 实施优先级

### P0 (必须)
- [x] 数据库字段添加
- [ ] 后端投票检查修改
- [ ] 管理员控制 API
- [ ] 管理员控制 UI

### P1 (重要)
- [ ] 前端状态显示更新
- [ ] 错误提示优化（告诉用户为什么不能操作）
- [ ] 数据迁移脚本

### P2 (优化)
- [ ] 开关操作日志（记录谁在什么时候开启/关闭）
- [ ] 批量操作（一键开启下一阶段）
- [ ] 开关状态历史记录

## 总结

这个设计：
- 🎯 **极简**: 只用3个布尔开关
- 🚀 **高效**: 管理员完全控制，即时生效
- 💪 **可靠**: 不依赖时间，不会出现时区问题
- 🔧 **灵活**: 可以任意组合开关状态
- 📦 **易维护**: 代码简单，逻辑清晰

完全满足黑客松的实际需求！
