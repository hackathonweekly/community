# Modules 目录重构需求文档

## 已完成阶段

| 阶段 | 描述 | 状态 | 提交 |
|------|------|------|------|
| Phase 1 | 删除 dashboard/shared 中 7 个转发文件 | ✅ 完成 | `6eff9b6c` |
| Phase 2 | 删除 organizations/events 中 4 个转发文件 | ✅ 完成 | `1c33be30` |
| Phase 3 | 合并两个 Footer 组件为一个 (带 `variant` prop) | ✅ 完成 | `bdb5aaf2` |
| Phase 4 | 重命名 `component/` → `components/` | ✅ 完成 | `ce1732fa` |

---

## Phase 5：重命名 dashboard → account（推荐）

### 问题发现

路由结构与 modules 目录命名不一致：

| 路由层级 | modules 目录 | 状态 |
|----------|-------------|------|
| `app/(main)/(account)/` | `modules/dashboard/` | ❌ 不一致 |
| `app/(main)/(public)/` | `modules/public/` | ✅ 一致 |
| `app/(app)/auth/` | `modules/shared/auth/` | ✅ 合理 |

### 目标

将 `modules/dashboard/` 重命名为 `modules/account/`，与路由结构保持一致。

### 当前结构

```
app/(main)/
├── (account)/              # 需要登录的页面
│   ├── settings/
│   ├── admin/
│   ├── events/
│   ├── orgs/
│   ├── projects/
│   └── notifications/
└── (public)/               # 公开页面
    ├── events/
    ├── orgs/
    ├── projects/
    └── ...

modules/
├── dashboard/              # ← 应该叫 account
│   ├── organizations/
│   ├── events/
│   ├── settings/
│   ├── admin/
│   └── ...
├── public/                 # ✅ 与路由一致
│   ├── organizations/
│   ├── events/
│   └── ...
└── shared/                 # 共享逻辑
    ├── organizations/
    ├── events/
    └── auth/
```

### 重构步骤

#### 步骤 1：更新路径别名

修改 `apps/web/tsconfig.json`：

```json
{
  "paths": {
    "@account/*": ["./src/modules/account/*"],  // 新增
    "@dashboard/*": ["./src/modules/account/*"], // 保持向后兼容，后续删除
  }
}
```

#### 步骤 2：重命名目录

```bash
mv apps/web/src/modules/dashboard apps/web/src/modules/account
```

#### 步骤 3：批量替换导入路径

```bash
# 替换所有 @dashboard/ 为 @account/
find apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/@dashboard\//@account\//g' {} +
```

#### 步骤 4：验证

```bash
pnpm type-check
pnpm lint
pnpm build
```

### 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 导入路径更新遗漏 | 中 | TypeScript 会报错，CI 验证 |
| 与其他分支冲突 | 中 | 选择低活跃期执行 |

### 影响范围

需要更新的文件数估算：
- `modules/dashboard/` 内部互相引用：~50 个文件
- `app/` 中导入 dashboard：~80 个文件
- 总计：~130 个文件

### 时间估算

约 1-2 小时（主要是批量替换 + 验证）

---

## 其他可选优化（低优先级）

### 优化 A：完善 shared 模块的领域覆盖

**现状**：部分领域的共享逻辑还没有提取到 `shared/`

**建议**：
```
shared/
├── organizations/   ✅ 已有
├── events/          ✅ 已有
├── auth/            ✅ 已有
├── profile/         ✅ 已有
├── level/           ✅ 已有
├── projects/        ⬜ 可添加 - 从 public/projects 提取共享组件
├── tasks/           ⬜ 可添加 - 如果有跨场景复用需求
└── components/      ✅ 通用 UI
```

**执行方式**：按需提取，不需要一次性完成

### 优化 B：清理 dashboard/shared

**现状**：Phase 1 后 `dashboard/shared/components/` 还剩 2 个文件
- `NotificationCenter.tsx`
- `SidebarContentLayout.tsx`

**建议**：评估这两个是否应移至 `shared/` 或保留在 dashboard

### 优化 C：统一 lib 命名规范

**现状**：`lib/` 目录结构不一致

**建议统一为**：
```
lib/
├── api.ts        # API 调用函数和 query keys
├── types.ts      # 类型定义（如果需要单独文件）
└── utils.ts      # 工具函数（可选）
```

---

## 总结

| 方案 | 风险 | 收益 | 建议 |
|------|------|------|------|
| **Phase 5: dashboard → account 重命名** | 中 | 高 | ✅ **推荐执行** |
| 优化 A: 完善 shared | 低 | 中 | ✅ 按需执行 |
| 优化 B: 清理 account/shared | 低 | 低 | ✅ 可选 |
| 优化 C: 统一 lib 规范 | 低 | 低 | ✅ 可选 |

**Phase 5 推荐理由**：
- 解决路由 `(account)` 与模块 `dashboard` 命名不一致问题
- 提升代码可读性，新人更容易理解结构
- 执行成本可控（1-2 小时），风险可通过 TypeScript 检查缓解

**后续原则**：保持 `shared/` 按领域组织，`account/` 和 `public/` 按访问权限分层。
