#!/bin/bash
# 快速多模态审查脚本 - Headless 模式
# 使用方法: ./scripts/quick-visual-review.sh

set -e

# 配置
APP_URL="${APP_URL:-http://127.0.0.1:4378}"
SESSION="quick-review-$(date +%s)"
OUTPUT_DIR="screenshots/tests/quick-$(date +%Y%m%d-%H%M%S)"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "🚀 开始快速多模态审查..."
echo "   会话: $SESSION"
echo "   输出: $OUTPUT_DIR"
echo ""

# 1. 登录页
echo "📸 审查登录页..."
agent-browser --session "$SESSION" open "$APP_URL" && \
agent-browser --session "$SESSION" wait --load networkidle && \
agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/01-login.png" && \
agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/01-login-dom.txt"
echo "✅ 登录页审查完成"

# 2. 进入演示工作区
echo "📸 进入演示工作区..."
# 查找演示按钮 ref
DEMO_REF=$(agent-browser --session "$SESSION" snapshot -i | grep "演示工作区" | grep -oP 'ref=e\d+' | head -1 | cut -d= -f2)

if [ -z "$DEMO_REF" ]; then
  echo "⚠️ 未找到演示工作区按钮，跳过"
else
  agent-browser --session "$SESSION" click "@$DEMO_REF" && \
  agent-browser --session "$SESSION" wait --load networkidle && \
  agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/02-overview.png" && \
  agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/02-overview-dom.txt"
  echo "✅ 概览页审查完成"
fi

# 3. 导航到其他页面（使用菜单）
echo "📸 审查其他页面..."

# 查找所有菜单项
MENUS=$(agent-browser --session "$SESSION" snapshot -i | grep "menuitem" | grep -oP 'ref=e\d+')

for MENU_REF in $MENUS; do
  # 获取菜单名称
  MENU_NAME=$(agent-browser --session "$SESSION" snapshot -i | grep "menuitem.*ref=$MENU_REF" | grep -oP 'menuitem "\K[^"]+')

  echo "   审查 $MENU_NAME 页..."

  agent-browser --session "$SESSION" click "@$MENU_REF" && \
  agent-browser --session "$SESSION" wait --load networkidle && \
  agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/03-$MENU_NAME.png" && \
  agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/03-$MENU_NAME-dom.txt"
done

# 4. 关闭会话
echo ""
echo "🧹 清理..."
agent-browser --session "$SESSION" close

# 5. 生成报告
echo ""
echo "📊 审查报告"
echo "================================"
echo "输出目录: $OUTPUT_DIR"
echo ""
echo "截图文件:"
ls -lh "$OUTPUT_DIR"/*.png
echo ""
echo "DOM快照:"
ls -lh "$OUTPUT_DIR"/*-dom.txt
echo ""
echo "✅ 审查完成！"

# 6. 可选：打开输出目录
# open "$OUTPUT_DIR"  # macOS
# xdg-open "$OUTPUT_DIR"  # Linux
# start "$OUTPUT_DIR"  # Windows