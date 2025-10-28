#!/bin/bash

# 内网穿透脚本 - 通过SSH反向隧道映射本地端口到远程服务器
# 使用方法: ./tunnel.sh [本地端口] [远程端口]
# 例如: ./tunnel.sh 3000 8080
#
# ===== 使用指南 =====
# 1. 基本使用（默认端口）：
#    ./tunnel.sh
#    映射本地3000端口到远程8002端口
#
# 2. 指定本地端口：
#    ./tunnel.sh 3000
#    映射本地3000端口到远程8002端口
#
# 3. 指定本地和远程端口：
#    ./tunnel.sh 3000 8002
#    映射本地3000端口到远程8002端口
#
# 4. CaddyFile 配置示例（修改之后记得 Caddy reload， 写成 127.0.0.1:8002 也可以 ）：
#    tunnel.hackathonweekly.com {
#        reverse_proxy localhost:8002
#    }
#
# 5. 注意事项：
#    - 确保SSH密钥已配置，可以免密登录服务器
#    - 确保服务器允许端口转发（GatewayPorts配置）
#    - 确保本地应用已在指定端口运行
#    - 使用 Ctrl+C 可以优雅地停止隧道
# ==================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查.env.deploy文件是否存在
if [ ! -f ".env.deploy" ]; then
    echo -e "${RED}错误: .env.deploy 文件不存在${NC}"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

# 读取.env.deploy文件
echo -e "${BLUE}正在读取 .env.deploy 配置文件...${NC}"
source .env.deploy

# 检查必要的环境变量
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ]; then
    echo -e "${RED}错误: SERVER_USER 或 SERVER_HOST 未在 .env.deploy 中设置${NC}"
    exit 1
fi

# 设置默认值
SSH_PORT=${SSH_PORT:-22}

# 获取参数
LOCAL_PORT=${1:-3000}  # 默认本地端口3000
REMOTE_PORT=${2:-8002} # 默认远程端口8002

# 验证端口号
if ! [[ "$LOCAL_PORT" =~ ^[0-9]+$ ]] || [ "$LOCAL_PORT" -lt 1 ] || [ "$LOCAL_PORT" -gt 65535 ]; then
    echo -e "${RED}错误: 无效的本地端口号: $LOCAL_PORT${NC}"
    exit 1
fi

if ! [[ "$REMOTE_PORT" =~ ^[0-9]+$ ]] || [ "$REMOTE_PORT" -lt 1 ] || [ "$REMOTE_PORT" -gt 65535 ]; then
    echo -e "${RED}错误: 无效的远程端口号: $REMOTE_PORT${NC}"
    exit 1
fi

# 检查本地端口是否可用
if ! nc -z localhost $LOCAL_PORT 2>/dev/null; then
    echo -e "${YELLOW}警告: 本地端口 $LOCAL_PORT 似乎没有服务在运行${NC}"
    echo -e "${YELLOW}请确保你的应用已经在 localhost:$LOCAL_PORT 上启动${NC}"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查SSH连接
echo -e "${BLUE}测试SSH连接到 $SERVER_USER@$SERVER_HOST:$SSH_PORT...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SSH_PORT $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    echo "请检查:"
    echo "1. 服务器地址和端口是否正确"
    echo "2. SSH密钥是否已配置"
    echo "3. 网络连接是否正常"
    exit 1
fi

echo -e "${GREEN}SSH连接测试成功!${NC}"

# 显示配置信息
echo -e "${BLUE}=== 内网穿透配置 ===${NC}"
echo -e "服务器: ${GREEN}$SERVER_USER@$SERVER_HOST:$SSH_PORT${NC}"
echo -e "本地端口: ${GREEN}localhost:$LOCAL_PORT${NC}"
echo -e "远程端口: ${GREEN}$SERVER_HOST:$REMOTE_PORT${NC}"
echo -e "映射关系: ${GREEN}localhost:$LOCAL_PORT -> $SERVER_HOST:$REMOTE_PORT${NC}"
echo

# 生成Caddyfile配置提示
echo -e "${YELLOW}=== Caddy配置建议 ===${NC}"
echo "请在你的Caddyfile中添加以下配置:"
echo
echo -e "${GREEN}tunnel.hackathonweekly.com {${NC}"
echo -e "${GREEN}    reverse_proxy localhost:$REMOTE_PORT${NC}"
echo -e "${GREEN}}${NC}"
echo

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在关闭隧道...${NC}"
    # 杀死SSH隧道进程
    if [ ! -z "$SSH_PID" ]; then
        kill $SSH_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}隧道已关闭${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}正在建立SSH反向隧道...${NC}"
echo -e "${BLUE}按 Ctrl+C 停止隧道${NC}"
echo

# 建立SSH反向隧道
# -R: 反向隧道，将远程端口转发到本地
# -N: 不执行远程命令
# -T: 禁用伪终端分配
# -o ServerAliveInterval=60: 每60秒发送心跳
# -o ServerAliveCountMax=3: 最多3次心跳失败后断开
ssh -R $REMOTE_PORT:localhost:$LOCAL_PORT \
    -N -T \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -p $SSH_PORT \
    $SERVER_USER@$SERVER_HOST &

SSH_PID=$!

# 等待隧道建立
sleep 2

# 检查SSH进程是否还在运行
if ! kill -0 $SSH_PID 2>/dev/null; then
    echo -e "${RED}错误: SSH隧道建立失败${NC}"
    echo "可能的原因:"
    echo "1. 远程端口 $REMOTE_PORT 已被占用"
    echo "2. 服务器不允许端口转发"
    echo "3. 网络连接问题"
    exit 1
fi

echo -e "${GREEN}✅ SSH隧道已成功建立!${NC}"
echo -e "${GREEN}✅ 现在可以通过 http://$SERVER_HOST:$REMOTE_PORT 访问你的本地应用${NC}"
echo -e "${GREEN}✅ 如果配置了Caddy，可以通过 https://tunnel.hackathonweekly.com 访问${NC}"
echo
echo -e "${BLUE}隧道状态: 运行中 (PID: $SSH_PID)${NC}"
echo -e "${BLUE}按 Ctrl+C 停止隧道${NC}"

# 保持脚本运行
wait $SSH_PID