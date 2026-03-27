# 多模态审查工作流最佳实践

## 核心原则

1. **自动化优先** - 使用脚本和命令链减少人工操作
2. **单会话完成** - 一个 session 完成所有审查，减少进程启动开销
3. **并行截图** - 批量截图时使用 && 链式命令
4. **自动化验证** - 使用 DOM 快照自动检测元素状态

---

## 环境适配

### Windows 环境（推荐方法）
在 Windows 环境下，推荐使用 Edge CDP 连接方式，更稳定可靠：

```bash
# 使用 Edge 浏览器最小化模式
cd /c/Users/Ding/.claude/skills/agent-browser
node scripts/start-and-connect-temp-edge.cjs --port=9997 --session=dev-review --no-minimize=true
```

**优点**：
- ✅ 稳定性高（使用系统自带的 Edge）
- ✅ 最小化窗口（--no-minimize=true，窗口不干扰）
- ✅ 支持所有 agent-browser 功能

### Linux/macOS 环境
在 Linux 或 macOS 环境下，可以使用纯 headless 模式：

```bash
# 直接使用 headless 模式（默认）
agent-browser --session dev-review open http://localhost:3000
```

**优点**：
- ✅ 无需额外浏览器进程
- ✅ 启动更快
- ✅ 资源占用更低

---

## 快速开始

### Windows 快速审查
```bash
# 一条命令完成单页审查
session="quick-$(date +%s)"
cd /c/Users/Ding/.claude/skills/agent-browser && \
node scripts/start-and-connect-temp-edge.cjs --port=9998 --session=$session --no-minimize=true && \
sleep 4 && \
agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session screenshot screenshots/tests/page.png && \
agent-browser --session $session snapshot -i > screenshots/tests/dom.txt && \
agent-browser --session $session close
```

### Linux/macOS 快速审查
```bash
# 一条命令完成单页审查
agent-browser --session quick open http://localhost:3000 && \
agent-browser --session quick wait --load networkidle && \
agent-browser --session quick screenshot screenshots/tests/page.png && \
agent-browser --session quick close
```

---

## 审查场景模板

### 场景1：视觉修复验证

```bash
# 目的：验证视觉问题是否修复
session="visual-fix-$(date +%s)"

# 1. 打开页面
agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle

# 2. 截图修复后状态
agent-browser --session $session screenshot screenshots/tests/fix-card-radius.png

# 3. 验证具体元素
agent-browser --session $session snapshot -i | grep "card\|button"

# 4. 关闭
agent-browser --session $session close

# 5. 对比修复前后（可选）
# 使用图片对比工具对比 fix-card-radius.png 和修复前的截图
```

### 场景2：交互流程测试

```bash
# 目的：测试完整的交互流程
session="interaction-test-$(date +%s)"

# 1. 进入设置页
agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session click @演示按钮REF && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session click @设置菜单REF && \
agent-browser --session $session wait --load networkidle

# 2. 测试主题切换
agent-browser --session $session screenshot screenshots/tests/before-theme-change.png && \
agent-browser --session $session click @深色主题按钮REF && \
agent-browser --session $session wait 1000 && \
agent-browser --session $session screenshot screenshots/tests/after-theme-change.png

# 3. 测试对话框
agent-browser --session $session click @退出会话按钮REF && \
agent-browser --session $session wait 1000 && \
agent-browser --session $session screenshot screenshots/tests/logout-dialog.png && \
agent-browser --session $session snapshot -i | grep "确认退出"

# 4. 关闭
agent-browser --session $session close
```

### 场景3：全页面审查

```bash
# 目的：审查所有页面
session="full-review-$(date +%Y%m%d)"

# 定义审查函数（bash）
review_page() {
  local page_name=$1
  agent-browser --session $session screenshot screenshots/tests/${page_name}.png
  agent-browser --session $session snapshot -i > screenshots/tests/${page_name}-dom.txt
}

# 开始审查
agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle

# 登录页
review_page "login"

# 概览页
agent-browser --session $session click @e8 && \
agent-browser --session $session wait --load networkidle && \
review_page "overview"

# 账号页
agent-browser --session $session click @账号菜单REF && \
agent-browser --session $session wait --load networkidle && \
review_page "accounts"

# 待处理页
agent-browser --session $session click @待处理菜单REF && \
agent-browser --session $session wait --load networkidle && \
review_page "cleanup"

# 设置页
agent-browser --session $session click @设置菜单REF && \
agent-browser --session $session wait --load networkidle && \
review_page "settings"

# 关闭
agent-browser --session $session close
```

### 场景4：性能对比测试

```bash
# 目的：对比修改前后的视觉效果
session="compare-$(date +%s)"

# 修改前（假设在某个分支）
git checkout before-change
npm run build
# 启动预览服务器后台进程...

agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session screenshot screenshots/tests/before.png && \
agent-browser --session $session close

# 修改后
git checkout after-change
npm run build
# 重启预览服务器...

agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session screenshot screenshots/tests/after.png && \
agent-browser --session $session close

# 对比（使用 diff 或其他工具）
```

---

## 自动化检查脚本

### 检查卡片圆角统一性
```bash
#!/bin/bash
# check-card-radius.sh

session="check-radius-$(date +%s)"

agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session snapshot -i | grep "card"

# 检查所有卡片的 border-radius 样式
# （需要更复杂的 CSS 检查，这里只是示例）

agent-browser --session $session close
```

### 检查按钮层级
```bash
#!/bin/bash
# check-button-hierarchy.sh

session="check-buttons-$(date +%s)"

agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session snapshot -i > /tmp/buttons-dom.txt

# 统计按钮数量
button_count=$(grep -c "button" /tmp/buttons-dom.txt)
echo "总按钮数: $button_count"

# 检查是否有过多的主要按钮
primary_count=$(grep -c "primary-button\|topbar-button-primary" /tmp/buttons-dom.txt)
echo "主要按钮数: $primary_count"

# 如果主要按钮 > 1，警告
if [ $primary_count -gt 1 ]; then
  echo "⚠️ 警告：页面有多个主要按钮，建议优化层级"
fi

agent-browser --session $session close
```

### 检查交互元素可访问性
```bash
#!/bin/bash
# check-accessibility.sh

session="check-a11y-$(date +%s)"

agent-browser --session $session open http://127.0.0.1:4378 && \
agent-browser --session $session wait --load networkidle && \
agent-browser --session $session snapshot -i > /tmp/a11y-dom.txt

# 检查所有交互元素
echo "交互元素统计："
echo "按钮: $(grep -c 'button' /tmp/a11y-dom.txt)"
echo "链接: $(grep -c 'link' /tmp/a11y-dom.txt)"
echo "输入框: $(grep -c 'textbox' /tmp/a11y-dom.txt)"

# 检查是否有无文本的按钮
empty_buttons=$(grep 'button \[ref=' /tmp/a11y-dom.txt | grep -v '>' | wc -l)
if [ $empty_buttons -gt 0 ]; then
  echo "⚠️ 警告：发现 $empty_buttons 个无文本的按钮"
fi

agent-browser --session $session close
```

---

## 最佳实践

### 1. 使用 Headless 模式
✅ **推荐**：
```bash
agent-browser --session review open http://localhost:3000
```

❌ **不推荐**（仅调试时使用）：
```bash
agent-browser --headed --session debug open http://localhost:3000
```

### 2. 复用 Session
✅ **推荐**（一个 session 完成所有审查）：
```bash
session="review"
agent-browser --session $session open URL1
agent-browser --session $session screenshot page1.png
agent-browser --session $session open URL2
agent-browser --session $session screenshot page2.png
agent-browser --session $session close
```

❌ **不推荐**（每次都创建新 session）：
```bash
agent-browser open URL1
agent-browser screenshot page1.png
agent-browser close
agent-browser open URL2
agent-browser screenshot page2.png
agent-browser close
```

### 3. 使用链式命令
✅ **推荐**（减少进程启动开销）：
```bash
agent-browser --session r open URL && \
agent-browser --session r wait --load networkidle && \
agent-browser --session r screenshot page.png && \
agent-browser --session r close
```

❌ **不推荐**（多次进程启动）：
```bash
agent-browser --session r open URL
agent-browser --session r wait --load networkidle
agent-browser --session r screenshot page.png
agent-browser --session r close
```

### 4. 保存 DOM 快照
✅ **推荐**（用于自动化分析和回归测试）：
```bash
agent-browser --session r snapshot -i > dom-snapshot.txt
```

❌ **不推荐**（只截图不保存 DOM）：
```bash
agent-browser --session r screenshot page.png
# 缺少 DOM 快照，无法进行自动化验证
```

### 5. 使用有意义的命名
✅ **推荐**：
```bash
session="settings-page-dialog-test-$(date +%s)"
screenshot="settings-logout-confirmation-dialog.png"
```

❌ **不推荐**：
```bash
session="test"
screenshot="1.png"
```

---

## 常见问题

### Q: 如何判断页面是否加载完成？
A: 使用 `wait --load networkidle`：
```bash
agent-browser --session r open URL && \
agent-browser --session r wait --load networkidle
```

### Q: 如何处理动态内容？
A: 等待特定元素出现：
```bash
agent-browser --session r wait "@element-ref"
# 或等待固定时间
agent-browser --session r wait 2000
```

### Q: 如何处理对话框？
A: 使用 snapshot 检查对话框状态：
```bash
agent-browser --session r click @按钮REF && \
agent-browser --session r wait 1000 && \
agent-browser --session r snapshot -i | grep "dialog\|modal"
```

### Q: 如何处理多标签页？
A: 使用 `tab` 命令切换：
```bash
agent-browser --session r click @链接REF --new-tab && \
agent-browser --session r tab && \
agent-browser --session r tab 2
```

### Q: 截图保存路径？
A: 相对路径相对于当前工作目录：
```bash
# 推荐：使用项目内的 screenshots 目录
agent-browser --session r screenshot screenshots/tests/page.png

# 不推荐：使用临时目录
agent-browser --session r screenshot /tmp/page.png
```

---

## 集成到开发流程

### Git Hooks 集成
```bash
# .git/hooks/pre-push
#!/bin/bash

# 运行视觉审查
npm run test:visual

# 如果审查失败，阻止推送
if [ $? -ne 0 ]; then
  echo "❌ 视觉审查失败，请修复后再推送"
  exit 1
fi
```

### CI/CD 集成
```yaml
# .github/workflows/visual-review.yml
name: Visual Review

on: [pull_request]

jobs:
  visual-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install Dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Start Preview
        run: npm run preview &
      - name: Visual Review
        run: npm run test:visual
```

### npm Scripts
```json
{
  "scripts": {
    "preview": "vite preview --host 127.0.0.1 --port 4378",
    "test:visual": "bash scripts/visual-review.sh",
    "test:visual:quick": "bash scripts/quick-review.sh"
  }
}
```

---

## 效率对比

### Headless vs Headed

| 指标 | Headless | Headed |
|------|----------|--------|
| 启动速度 | ⚡ 快（1-2s） | 🐌 慢（3-5s） |
| 内存占用 | 🪶 低（~50MB） | 🦔 高（~150MB） |
| 窗口干扰 | ✅ 无 | ❌ 有窗口弹出 |
| 截图质量 | ✅ 一致 | ⚠️ 可能受窗口大小影响 |
| 调试便利 | ⚠️ 需要截图 | ✅ 可实时查看 |
| 适用场景 | 日常审查、CI/CD | 调试复杂交互 |

**推荐**：95% 场景使用 Headless，5% 复杂调试使用 Headed

---

## 总结

1. **默认使用 Headless 模式** - 更快、更安静、无干扰
2. **单 Session 完成审查** - 减少进程启动开销
3. **链式命令提效** - 使用 && 连接多个操作
4. **保存 DOM 快照** - 支持自动化验证和回归测试
5. **集成到流程** - Git Hooks、CI/CD、npm scripts

**目标**：让多模态审查成为开发流程的自然组成部分，而不是额外负担。

---

**文档版本**: 2.0
**更新日期**: 2026-03-26
**维护者**: Claude Code