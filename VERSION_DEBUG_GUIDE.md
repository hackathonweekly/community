# 缓存清理和调试指南

## 🚀 版本检测功能已添加

### 1. 前端版本检测
- 打开浏览器开发者工具 (F12)
- 查看控制台，应该看到 "🚀 应用版本信息" 的折叠组
- 展开后可以看到图片审核版本: `v1.1-fix-error-handling`
- 也可以在控制台输入 `__APP_VERSION__` 查看完整版本信息
- HTML元素会有 `data-app-version` 属性

### 2. 后端版本检测
- 访问: `https://hackathonweekly.com/api/version`
- 应该返回包含 `imageModeration.version: "v1.1-fix-error-handling"` 的JSON

### 3. 图片审核日志标识
上传图片时，后端日志应该显示:
```
🔍 [v1.1-fix] 图片审核请求: {...}
✅ [v1.1-fix] 图片审核服务异常，允许图片通过: {...}
```

## 🧹 缓存清理方法

### Docker 缓存清理
```bash
# 清理所有 Docker 缓存
docker system prune -af

# 重新构建镜像（无缓存）
docker build --no-cache -t your-app .

# 或者使用 docker-compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Next.js 缓存清理
```bash
# 清理 .next 目录
rm -rf .next

# 清理 node_modules
rm -rf node_modules
bun install

# 重新构建
bun run build
```

### 浏览器缓存清理
- 硬刷新: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- 清除站点数据: 开发者工具 → Application → Storage → Clear site data

### 服务器缓存清理
```bash
# 如果使用 PM2
pm2 restart all
pm2 flush  # 清理日志

# 如果使用 Docker
docker restart container-name

# 清理系统缓存
sync && echo 3 > /proc/sys/vm/drop_caches
```

## 🔍 确认修复生效的步骤

1. **检查版本**: 访问 `/api/version` 确认是新版本
2. **查看控制台**: 看到 `[v1.1-fix]` 标识
3. **测试上传**: 上传图片，看是否还报错
4. **检查日志**: 后端日志应该显示"允许图片通过"而不是错误

## 🚨 如果还是报错的话

1. 确认 Docker 镜像是否重新构建
2. 检查是否使用了正确的镜像标签
3. 查看部署脚本是否拉取了最新代码
4. 检查环境变量是否正确加载

## 📝 调试命令

```bash
# 检查当前运行的容器
docker ps

# 查看容器日志
docker logs container-name -f

# 进入容器查看文件
docker exec -it container-name /bin/sh

# 检查 API 是否可访问
curl https://hackathonweekly.com/api/version
```