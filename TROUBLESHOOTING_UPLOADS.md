# 图片上传问题排查指南

## 关键问题：Next.js 会 Hook Console 导致日志丢失

### 问题现象
✅ **浏览器**: 显示 `POST /api/uploads/moderate-image 400 (Bad Request)`
✅ **错误信息**: `发布内容含违规信息，请修改后重试`
❌ **Docker 日志**: 没有任何相关日志输出（这就是问题所在！）
❌ **版本号**: 显示为 `development` 而不是真实版本

### 根本原因

**Next.js 在生产模式（App Router）中会 Hook 掉所有 console.* 调用，将其重定向到内部缓冲区**，用于：

1. **检测 render 阶段副作用** - 追踪不应在 server 组件中出现的 console
2. **在浏览器 overlay 显示** - 将错误显示到前端开发者工具
3. **控制 RSC（React Server Components）流** - 管理服务端组件输出

**这导致的结果**：
- `console.log/error/warn` 不输出到 Docker stdout/stderr
- `process.stderr.write` 也不可靠
- 无法在 `docker logs` 中查看应用日志
- 无法排查图片审核的详细原因

### 正确解决方案 ✅

**使用项目内置的日志系统：`src/lib/logs`** （基于 consola）

```typescript
// ❌ 错误：不要使用 console
console.log("这条日志不会出现在 Docker");
console.error("这条错误也不会出现在 Docker");

// ✅ 正确：使用 createModuleLogger
import { createModuleLogger } from "@/lib/logs";

const logger = createModuleLogger("your-module-name");

logger.info("信息日志");  // 会输出到 Docker stdout
logger.warn("警告日志");  // 会输出到 Docker stderr
logger.error("错误日志"); // 会输出到 Docker stderr

// 支持对象参数
logger.info("审核请求", {
  imageUrl: "...",
  requestId: "..."
});
```

**技术实现**:
- 基于 `consola` 日志库
- 生产环境自动添加时间戳
- 直接写入标准输出/错误流
- **不受 Next.js 重定向影响**

**已修复的文件**:
- `src/server/routes/version.ts` - 版本检测日志
- `src/server/routes/uploads.ts` - 图片审核日志

## 版本检测问题

### Docker 版本显示为 development

**原因**:
1. Docker 构建时 `.git` 目录不可用（被 .dockerignore 忽略）
2. 没有正确传入 BUILD_VERSION 构建参数
3. Git tag 无法读取

**修复方案**:

**方案 1: Docker Build 命令**
```bash
# 获取当前 git tag
VERSION=$(git describe --tags --abbrev=0)

# 使用 --build-arg 传入版本号
docker build \
  --build-arg BUILD_VERSION=$VERSION \
  -t hackathonweekly:$VERSION \
  -t hackathonweekly:latest \
  .