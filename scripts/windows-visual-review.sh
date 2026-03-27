#!/bin/bash
# Windows 多模态审查脚本 - Edge CDP 连接模式
# 使用方法: bash scripts/windows-visual-review.sh

set -e

# 配置
APP_URL="${APP_URL:-http://127.0.0.1:4378}"
PORT="${PORT:-9999}"
SESSION="review-$(date +%s)"
OUTPUT_DIR="screenshots/tests/review-$(date +%Y%m%d-%H%M%S)"
AGENT_BROWSER_DIR="/c/Users/Ding/.claude/skills/agent-browser"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "🚀 开始多模态审查（Windows Edge CDP 模式）..."
echo "   会话: $SESSION"
echo "   端口: $PORT"
echo "   输出: $OUTPUT_DIR"
echo ""

# 1. 启动 Edge 浏览器（最小化）
echo "🌐 启动 Edge 浏览器..."
cd "$AGENT_BROWSER_DIR"
node scripts/start-and-connect-temp-edge.cjs --port="$PORT" --session="$SESSION" --no-minimize=true
sleep 4

# 2. 登录页
echo "📸 审查登录页..."
agent-browser --session "$SESSION" open "$APP_URL" && \
agent-browser --session "$SESSION" wait --load networkidle && \
agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/01-login.png" && \
agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/01-login-dom.txt"
echo "✅ 登录页审查完成"

# 3. 进入演示工作区
echo "📸 进入演示工作区..."
DEMO_REF=$(agent-browser --session "$SESSION" snapshot -i | grep "演示工作区" | grep -oP 'ref=e\d+' | head -1 | sed 's/ref=//')

if [ -z "$DEMO_REF" ]; then
  echo "⚠️ 未找到演示工作区按钮，跳过"
else
  agent-browser --session "$SESSION" click "@$DEMO_REF" && \
  agent-browser --session "$SESSION" wait --load networkidle && \
  agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/02-overview.png" && \
  agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/02-overview-dom.txt"
  echo "✅ 概览页审查完成"
fi

# 4. 导航到其他页面
echo "📸 审查其他页面..."
for page in "账号" "待处理" "设置"; do
  echo "   审查 $page 页..."

  # 查找菜单 ref
  MENU_REF=$(agent-browser --session "$SESSION" snapshot -i | grep "menuitem.*$page" | grep -oP 'ref=e\d+' | sed 's/ref=//')

  if [ -n "$MENU_REF" ]; then
    agent-browser --session "$SESSION" click "@$MENU_REF" && \
    agent-browser --session "$SESSION" wait --load networkidle && \
    agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/03-$page.png" && \
    agent-browser --session "$SESSION" snapshot -i > "$OUTPUT_DIR/03-$page-dom.txt"
    echo "   ✅ $page 页审查完成"
  else
    echo "   ⚠️ 未找到 $page 菜单项"
  fi
done

# 5. 测试交互功能
echo ""
echo "📸 测试交互功能..."

# 测试主题切换
THEME_BUTTON=$(agent-browser --session "$SESSION" snapshot -i | grep "主题" | grep "button" | head -1 | grep -oP 'ref=e\d+' | sed 's/ref=//')
if [ -n "$THEME_BUTTON" ]; then
  echo "   测试主题切换..."
  agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/04-before-theme-change.png" && \
  agent-browser --session "$SESSION" click "@$THEME_BUTTON" && \
  agent-browser --session "$SESSION" wait --load networkidle && \
  agent-browser --session "$SESSION" screenshot "$OUTPUT_DIR/04-after-theme-change.png"
  echo "   ✅ 主题切换测试完成"
fi

# 6. 关闭会话
echo ""
echo "🧹 清理..."
agent-browser --session "$SESSION" close

# 7. 生成报告
echo ""
echo "📊 审查报告"
echo "================================"
echo "输出目录: $OUTPUT_DIR"
echo ""
echo "截图文件:"
ls -lh "$OUTPUT_DIR"/*.png 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "DOM快照:"
ls -lh "$OUTPUT_DIR"/*-dom.txt 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "✅ 审查完成！"