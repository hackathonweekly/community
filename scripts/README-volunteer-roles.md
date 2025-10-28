# 志愿者角色初始化脚本

这个脚本用于在数据库中初始化默认的志愿者角色数据。

## 默认角色

脚本会创建以下6个默认志愿者角色：

1. **主持人** (50 CP) - 活动流程主持
2. **签到接待组** (30 CP) - 负责签到和引导
3. **技术支持组** (40 CP) - 技术设备维护
4. **记录摄影组** (35 CP) - 活动记录和摄影
5. **计时员** (25 CP) - 时间管理和提醒
6. **物料管理员** (30 CP) - 物料准备和管理

## 使用方法

### 方法1: 使用 pnpm 脚本 (推荐)

```bash
pnpm db:seed-volunteer-roles
```

### 方法2: 直接运行 JavaScript 脚本

```bash
# 确保环境变量已配置
node scripts/seed-volunteer-roles.js
```

### 方法3: 运行 TypeScript 脚本

```bash
# 需要 tsx 环境
npx tsx scripts/seed-volunteer-roles.ts
```

## 前置条件

1. 确保数据库已连接并且 Prisma 客户端已生成：
   ```bash
   pnpm db:generate
   ```

2. 确保 `.env.local` 文件中的 `DATABASE_URL` 已正确配置

3. 确保数据库中的表结构是最新的：
   ```bash
   pnpm db:push
   # 或
   pnpm db:migrate
   ```

## 注意事项

- 如果数据库中已存在志愿者角色，脚本会显示现有角色并跳过创建
- 脚本使用数据库事务确保所有角色都成功创建或全部回滚
- 创建成功后，您就可以在活动创建页面看到志愿者设置选项了

## 验证

运行脚本后，您可以：

1. 访问 `http://localhost:3000/app/events/create` 查看活动创建页面的志愿者设置
2. 访问 `http://localhost:3000/app/admin/volunteer-roles` 查看志愿者角色管理页面
3. 使用 Prisma Studio 查看数据库：
   ```bash
   pnpm db:studio
   ```

## 故障排除

如果遇到错误：

1. **数据库连接错误**: 检查 `DATABASE_URL` 环境变量
2. **表不存在错误**: 运行 `pnpm db:push` 或 `pnpm db:migrate`
3. **权限错误**: 确保数据库用户有创建权限

## 自定义

如果您想修改默认角色：

1. 编辑 `scripts/seed-volunteer-roles.js` 文件中的 `DEFAULT_VOLUNTEER_ROLES` 数组
2. 修改角色名称、描述、积分值等
3. 重新运行脚本