
#!/bin/bash

# 通用PostgreSQL数据库完整覆盖脚本
# 完全重置目标数据库并迁移源数据库的schema和数据

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示使用说明
show_usage() {
    echo "PostgreSQL 数据库完整覆盖脚本"
    echo ""
    echo "用法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -s, --source URL        源数据库连接URL"
    echo "  -t, --target URL        目标数据库连接URL"
    echo "  -v, --verify            验证迁移后数据完整性"
    echo "  -k, --keep-backup       保留备份文件"
    echo "  -h, --help              显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  SOURCE_DATABASE_URL     源数据库连接URL"
    echo "  TARGET_DATABASE_URL     目标数据库连接URL"
    echo ""
    echo "示例:"
    echo "  # 完整覆盖目标数据库"
    echo "  $0 -s postgresql://user:pass@localhost:5432/db -t postgresql://user:pass@remote:5432/db -v"
    echo ""
    echo "  # 使用环境变量"
    echo "  SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... $0 -v"
    echo ""
    echo "⚠️  警告：此脚本会完全删除目标数据库的所有表、类型、函数等对象并重新创建！"
}

# 验证数据库连接
verify_connection() {
    local db_url=$1
    local name=$2
    
    print_message $BLUE "验证${name}数据库连接..."
    
    if ! psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
        print_message $RED "错误: 无法连接到${name}数据库"
        print_message $RED "连接URL: $db_url"
        exit 1
    fi
    
    print_message $GREEN "${name}数据库连接成功"
}

# 获取数据库统计信息
get_db_stats() {
    local db_url=$1
    local stats=$(psql "$db_url" -t -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins + n_tup_upd + n_tup_del as total_operations
        FROM pg_stat_user_tables 
        ORDER BY total_operations DESC;
    " 2>/dev/null | head -5)
    echo "$stats"
}

# 验证数据迁移完整性
verify_migration() {
    local source_url=$1
    local target_url=$2
    
    print_message $BLUE "验证数据迁移完整性..."
    
    # 获取表数量
    source_tables=$(psql "$source_url" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    target_tables=$(psql "$target_url" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    print_message $BLUE "源数据库表数量: $source_tables"
    print_message $BLUE "目标数据库表数量: $target_tables"
    
    if [ "$source_tables" != "$target_tables" ]; then
        print_message $YELLOW "警告: 表数量不匹配"
    fi
    
    # 验证主要表的记录数
    tables=$(psql "$source_url" -t -c "
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
    " 2>/dev/null | head -10)
    
    for table in $tables; do
        if [ -n "$table" ]; then
            source_count=$(psql "$source_url" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
            target_count=$(psql "$target_url" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
            
            if [ "$source_count" = "$target_count" ]; then
                print_message $GREEN "  表 $table: $source_count 条记录 ✓"
            else
                print_message $YELLOW "  表 $table: 源($source_count) vs 目标($target_count) ✗"
            fi
        fi
    done
}

# 初始化变量
SOURCE_URL=""
TARGET_URL=""
VERIFY_DATA=false
KEEP_BACKUP=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--source)
            SOURCE_URL="$2"
            shift 2
            ;;
        -t|--target)
            TARGET_URL="$2"
            shift 2
            ;;
        -v|--verify)
            VERIFY_DATA=true
            shift
            ;;
        -k|--keep-backup)
            KEEP_BACKUP=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_message $RED "未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 从环境变量获取数据库URL（如果命令行没有提供）
if [ -z "$SOURCE_URL" ]; then
    SOURCE_URL="$SOURCE_DATABASE_URL"
fi

if [ -z "$TARGET_URL" ]; then
    TARGET_URL="$TARGET_DATABASE_URL"
fi

# 验证必要参数
if [ -z "$SOURCE_URL" ] || [ -z "$TARGET_URL" ]; then
    print_message $RED "错误: 必须提供源数据库和目标数据库URL"
    show_usage
    exit 1
fi

# 检查必要工具
for tool in pg_dump psql; do
    if ! command -v $tool > /dev/null; then
        print_message $RED "错误: 未找到 $tool 命令"
        print_message $RED "请确保已安装 PostgreSQL 客户端工具"
        exit 1
    fi
done

# 生成备份文件名
BACKUP_FILE="database_backup_$(date +%Y%m%d_%H%M%S).sql"

print_message $GREEN "开始数据库完整覆盖..."
print_message $BLUE "源数据库: ${SOURCE_URL%@*}@***"
print_message $BLUE "目标数据库: ${TARGET_URL%@*}@***"
print_message $BLUE "备份文件: $BACKUP_FILE"

# 验证数据库连接
verify_connection "$SOURCE_URL" "源"
verify_connection "$TARGET_URL" "目标"

# 显示源数据库统计信息
print_message $BLUE "源数据库统计信息:"
get_db_stats "$SOURCE_URL"

# 导出完整数据库（包括schema和数据）
print_message $BLUE "1. 从源数据库导出完整数据库（包括schema）..."
if pg_dump --no-owner --no-privileges --clean --if-exists --verbose "$SOURCE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    print_message $GREEN "完整数据库导出完成: $BACKUP_FILE ($backup_size)"
else
    print_message $RED "错误: 数据导出失败"
    exit 1
fi

# 导入数据到目标数据库
print_message $BLUE "2. 将完整数据库导入到目标数据库..."
if psql "$TARGET_URL" < "$BACKUP_FILE" 2>&1; then
    print_message $GREEN "数据导入完成!"
else
    print_message $RED "错误: 数据导入失败"
    exit 1
fi

# 验证数据（如果需要）
if [ "$VERIFY_DATA" = true ]; then
    verify_migration "$SOURCE_URL" "$TARGET_URL"
fi

# 清理备份文件（如果不需要保留）
if [ "$KEEP_BACKUP" = false ]; then
    rm -f "$BACKUP_FILE"
    print_message $BLUE "备份文件已清理"
else
    print_message $BLUE "备份文件保存在: $BACKUP_FILE"
fi

print_message $GREEN "数据库完整覆盖完成! ✅"

