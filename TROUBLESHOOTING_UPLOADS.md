# 图片上传问题排查指南

## 最近修复的问题

### 1. OpenAPI 路由错误 (修复 ✅)
**问题**: `.openapi is not a function` 错误，导致后端 API 无法访问

**原因**: 错误地使用了 `@hono/zod-openapi` 的 `.openapi()` 方法

**修复**:
- 改用 `describeRoute` 函数（与其他路由保持一致）
- 文件: `src/server/routes/version.ts`

### 2. 版本号检测失败 (修复 ✅)
**问题**: 无法正确显示 git tag 版本号

**原因**: 使用了 `npm_package_version` 环境变量，而不是 git tag

**修复**:
```typescript
// 优先使用 git tag
function getVersionFromGit(): string | null {
  try {
    const result = Bun.spawnSync({
      cmd: ["git", "describe", "--tags", "--abbrev=0"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (result.success) {
      return new TextDecoder().decode(result.stdout).trim();
    }
  } catch (error) {}
  return null;
}
```

### 3. 生产环境日志缺失 (修复 ✅)
**问题**: 图片审核拒绝时生产日志没有输出

**原因**: 使用了 `console.warn` 且只在特定分支有日志

**修复**:
- 将 `console.warn` 改为 `console.error`（更可能被生产环境输出）
- 在所有分支添加详细日志（请求、完成、通过、拒绝、异常）
- 添加请求 ID 便于追踪
- 文件: `src/server/routes/uploads.ts`

## 日志输出示例

当服务器启动时会看到：
```
🚀 应用启动中... 版本: v0.3.3 环境: production 时间: 2024-11-20T02:30:00.000Z
```

当图片审核时：

**请求**:
```
🔍 [v1.1-fix] 图片审核请求 [uuid]: {
  imageUrl: "...",
  mode: "content",
  userId: "user_xxx",
  timestamp: "...",
  env: "production"
}
```

**完成**:
```
🔍 [v1.1-fix] 图片审核完成 [uuid]: {
  imageUrl: "...",
  mode: "content",
  isApproved: false,
  reason: "...",
  suggestion: "Block",
  label: "..."
}
```

**通过**:
```
✅ [v1.1-fix] 图片审核通过 [uuid]: {
  imageUrl: "...",
  suggestion: "Pass"
}
```

**拒绝**:
```
❌ [v1.1-fix] 图片审核未通过 [uuid]: {
  imageUrl: "...",
  reason: "发布内容含违规信息，请修改后重试",
  suggestion: "Block",
  label: "...",
  subLabel: "...",
  score: 99.5
}
```

**异常**:
```
✅ [v1.1-fix] 图片审核服务异常，允许图片通过 [uuid]: {
  error: "...",
  imageUrl: "...",
  mode: "content",
  stack: "..."
}
```

## API 端点

### 版本信息
- **开发环境**: `http://localhost:3000/api/version`
- **生产环境**: `https://hackathonweekly.com/api/version`

### 健康检查
- **开发环境**: `http://localhost:3000/api/health`
- **生产环境**: `https://hackathonweekly.com/api/health`

### 图片审核
- **端点**: `POST /api/uploads/moderate-image`
- **请求 Body**:
```json
{
  "imageUrl": "https://...",
  "mode": "content"  // or "avatar"
}
```

## Docker 部署

### 构建 Docker 镜像

使用 BUILD_VERSION 参数传入版本号：

```bash
docker build --build-arg BUILD_VERSION=v0.3.3 -t hackathonweekly:latest .
```

### Docker Compose 示例

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      args:
        - BUILD_VERSION=v0.3.3
        - NEXT_PUBLIC_SITE_URL=https://hackathonweekly.com
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 环境变量

- `BUILD_VERSION`: 构建时传入的版本号（优先级最高）
- `NODE_ENV`: 运行环境（development/production）
- `GIT_COMMIT`: Git 提交哈希（自动检测）

版本检测优先级：
1. `BUILD_VERSION` 环境变量
2. Git tag（通过 `git describe --tags --abbrev=0`）
3. `npm_package_version` 环境变量
4. `development`（默认值）

## 如何排查图片上传问题

1. **检查控制台日志**
   - 查找包含 `[v1.1-fix]` 的日志
   - 使用 requestId 追踪完整流程

2. **查看审核结果**
   - 检查 `suggestion` 字段（Pass/Block）
   - 查看 `label` 和 `subLabel` 了解违规类型
   - 查看 `score` 了解置信度

3. **常见问题**
   - 如果看到"审核服务异常" - 说明腾讯云服务有问题，但会自动通过
   - 如果看到"发布内容含违规信息" - 图片被腾讯云识别为违规
   - 如果没有日志 - 检查代码是否已部署并包含最新修复

## 版本历史

- **v0.3.3**: 修复所有日志和版本检测问题
- **v0.3.2**: 前一版本
- **v0.3.1**: 前一版本

## 相关文件

- `src/server/routes/version.ts` - 版本检测和路由
- `src/server/routes/uploads.ts` - 图片上传和审核
- `src/lib/content-moderation/index.ts` - 内容审核核心逻辑
