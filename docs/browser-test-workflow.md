# 自动化浏览器测试工作流

## 文档目的
记录经过验证的、稳定的 agent-browser 自动化测试工作流，用于前端视觉审查和功能验证。

## 前置条件

### 1. 开发服务器运行
```bash
cd <repo-root>
npm run dev
# 等待服务器启动，默认地址: http://127.0.0.1:4378
```

### 2. agent-browser 安装
```bash
# 检查是否安装
agent-browser --version

# 如未安装
npm install -g agent-browser
# 或使用 brew (macOS)
brew install agent-browser
```

### 3. Edge 浏览器配置
本项目使用共享的 Edge CDP 会话进行测试。

## 标准测试流程

### 步骤 1: 启动最小化浏览器会话

```bash
# 进入 agent-browser 安装目录
cd <agent-browser-install-dir>

# 启动最小化的临时 Edge 会话（避免干扰）
node scripts/start-and-connect-temp-edge.cjs \
  --port=9997 \
  --session=project-review \
  --no-minimize=false

# 等待浏览器启动（3-4秒）
sleep 4
```

**关键参数说明**:
- `--port=9997`: 使用未被占用的端口
- `--session=project-review`: 会话名称，用于后续命令
- `--no-minimize=false`: 最小化窗口（推荐，避免干扰工作）

### 步骤 2: 导航到测试页面

```bash
# 导航到应用
agent-browser --session project-review open http://127.0.0.1:4378

# 等待页面完全加载
agent-browser --session project-review wait --load networkidle
```

### 步骤 3: 截图和快照

```bash
# 全屏截图（推荐用于视觉审查）
agent-browser --session project-review screenshot --full 01-page-name.png

# DOM 快照（用于元素分析）
agent-browser --session project-review snapshot -i

# 获取页面信息
agent-browser --session project-review get url
agent-browser --session project-review get title
```

### 步骤 4: 交互测试

```bash
# 从快照中找到要点击的元素 ref（如 @e1, @e2）
agent-browser --session project-review snapshot -i | grep "button" | head -5

# 点击元素
agent-browser --session project-review click @e8

# 等待页面响应
sleep 2
agent-browser --session project-review wait --load networkidle

# 截图记录交互结果
agent-browser --session project-review screenshot result.png
```

### 步骤 5: 完整页面审查流程

```bash
#!/bin/bash
# 完整的页面审查脚本

SESSION="full-review"
PORT="9997"

# 1. 启动浏览器
cd /c/Users/Ding/.claude/skills/agent-browser
node scripts/start-and-connect-temp-edge.cjs --port=$PORT --session=$SESSION --no-minimize=false
sleep 4

# 2. 打开应用
agent-browser --session $SESSION open http://127.0.0.1:4378
agent-browser --session $SESSION wait --load networkidle

# 3. 登录页
agent-browser --session $SESSION screenshot --full 01-login.png
agent-browser --session $SESSION snapshot -i > snapshots/01-login.txt

# 4. 进入工作区
agent-browser --session $SESSION snapshot -i | grep "进入演示工作区" | head -1
# 假设找到 ref=@e8
agent-browser --session $SESSION click @e8
sleep 2
agent-browser --session $SESSION wait --load networkidle

# 5. 概览页
agent-browser --session $SESSION screenshot --full 02-overview.png
agent-browser --session $SESSION snapshot -i > snapshots/02-overview.txt

# 6. 账号页
agent-browser --session $SESSION snapshot -i | grep "menuitem" | grep "账号"
# 假设找到 ref=@e18
agent-browser --session $SESSION click @e18
sleep 2
agent-browser --session $SESSION screenshot --full 03-accounts.png
agent-browser --session $SESSION snapshot -i > snapshots/03-accounts.txt

# 7. 测试选中状态
agent-browser --session $SESSION snapshot -i | grep "checkbox" | head -1
# 假设找到 ref=@e102
agent-browser --session $SESSION click @e102
sleep 1
agent-browser --session $SESSION screenshot 04-selected.png

# 8. 关闭浏览器
agent-browser --session $SESSION close

echo "审查完成！截图已保存。"
```

## 常见问题处理

### 问题 1: 端口被占用
```bash
# 检查端口占用
netstat -ano | grep 9997

# 使用不同端口
node scripts/start-and-connect-temp-edge.cjs --port=9998 --session=new-session
```

### 问题 2: 截图失败
```bash
# 原因：连接超时或浏览器已关闭
# 解决：重新启动浏览器会话

# 检查浏览器状态
agent-browser --session project-review get url
# 如果失败，重新启动
```

### 问题 3: 元素找不到
```bash
# 原因：页面未完全加载或 ref 已失效
# 解决：重新获取快照

agent-browser --session project-review snapshot -i
```

### 问题 4: 页面未响应
```bash
# 使用显式等待
agent-browser --session project-review wait --load networkidle

# 或等待特定元素
agent-browser --session project-review wait "@e1"

# 或固定时间等待
sleep 5
```

## 最佳实践

### 1. 命名约定

**会话名称**:
```bash
# 功能测试
--session=login-test
--session=accounts-review
--session=overview-check

# 完整审查
--session=full-review-YYYYMMDD  # 如 full-review-20260326
```

**截图文件**:
```bash
# 日期_页面_状态.png
20260326_login-default.png
20260326_overview-full.png
20260326_accounts-selected.png
```

**快照文件**:
```bash
# 保存 DOM 快照供后续分析
agent-browser --session $SESSION snapshot -i > snapshots/$(date +%Y%m%d_%H%M%S)_page.txt
```

### 2. 并发测试

**避免**: 同时运行多个浏览器控制命令
```bash
# ❌ 错误：可能导致冲突
agent-browser --session s1 open url1 &
agent-browser --session s2 open url2 &
```

**正确**: 串行执行，或使用不同端口
```bash
# ✅ 正确：串行执行
agent-browser --session s1 open url1
agent-browser --session s1 screenshot shot1.png

agent-browser --session s2 open url2
agent-browser --session s2 screenshot shot2.png
```

### 3. 清理资源

```bash
# 测试完成后始终关闭浏览器
agent-browser --session project-review close

# 或使用 trap 自动清理（bash 脚本）
trap "agent-browser --session $SESSION close" EXIT
```

### 4. 错误处理

```bash
#!/bin/bash
# 带错误处理的测试脚本

test_page() {
    local page=$1
    local url=$2

    agent-browser --session test open $url || {
        echo "错误：无法打开 $page"
        return 1
    }

    sleep 2

    agent-browser --session test screenshot ${page}.png || {
        echo "警告：$page 截图失败"
        return 2
    }

    echo "✅ $page 测试完成"
    return 0
}
```

## 项目特定测试场景

### 场景 1: 登录流程测试
```bash
# 1. 打开登录页
agent-browser --session login open http://127.0.0.1:4378
agent-browser --session login wait --load networkidle

# 2. 验证元素存在
agent-browser --session login snapshot -i | grep "进入演示工作区"

# 3. 截图
agent-browser --session login screenshot login-page.png

# 4. 点击进入
agent-browser --session login click @e8
sleep 2

# 5. 验证跳转
agent-browser --session login get url
# 应该显示概览页 URL
```

### 场景 2: 表格交互测试
```bash
# 1. 导航到账号页
agent-browser --session table snapshot -i | grep "账号"
agent-browser --session table click @account_menu_item

# 2. 测试筛选
agent-browser --session table snapshot -i | grep "filter-chip"
agent-browser --session table click @filter_team

# 3. 测试选中
agent-browser --session table snapshot -i | grep "checkbox"
agent-browser --session table click @first_checkbox
agent-browser --session table screenshot selected-state.png

# 4. 验证批量操作栏
agent-browser --session table snapshot -i | grep "已选择"
```

### 场景 3: 主题切换测试
```bash
# 1. 截图当前主题
agent-browser --session theme screenshot dark-theme.png

# 2. 点击主题按钮
agent-browser --session theme snapshot -i | grep "主题"
agent-browser --session theme click @theme_button

# 3. 截图切换后
agent-browser --session theme screenshot light-theme.png

# 4. 对比差异
# 使用 diff 工具或手动对比
```

## 输出文件组织

```
项目根目录/
├── docs/
│   ├── multimodal-review-report.md      # 审查报告
│   ├── browser-test-workflow.md         # 本文档
│   └── visual-review-report.md          # 视觉审查报告
│
└── test-artifacts/                      # 测试输出（.gitignore）
    ├── screenshots/
    │   ├── 20260326_01-login.png
    │   ├── 20260326_02-overview.png
    │   └── 20260326_03-accounts.png
    │
    └── snapshots/
        ├── 20260326_01-login.txt
        ├── 20260326_02-overview.txt
        └── 20260326_03-accounts.txt
```

## 集成到 CI/CD（可选）

### GitHub Actions 示例

```yaml
name: Visual Regression Tests

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install agent-browser
        run: npm install -g agent-browser

      - name: Start dev server
        run: npm run dev &
        env:
          CI: true

      - name: Wait for server
        run: sleep 10

      - name: Run visual tests
        run: |
          chmod +x scripts/visual-test.sh
          ./scripts/visual-test.sh

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: test-artifacts/screenshots/
```

## 维护与更新

### 更新工作流
1. 发现新问题时，更新本文档
2. 添加新的测试场景
3. 记录常见问题解决方案

### 版本控制
- 工作流文档应纳入版本控制
- 测试输出文件应添加到 `.gitignore`

### 团队协作
- 团队成员应遵循统一的工作流
- 定期审查和优化测试流程
- 分享最佳实践和问题解决方案

---

## 快速参考

### 最小化启动命令
```bash
cd <agent-browser-install-dir> && \
node scripts/start-and-connect-temp-edge.cjs --port=9997 --session=review --no-minimize=false && \
sleep 4 && \
agent-browser --session review open http://127.0.0.1:4378 && \
agent-browser --session review wait --load networkidle && \
agent-browser --session review screenshot --full test.png
```

### 清理命令
```bash
agent-browser --session review close
```

### 常用命令组合
```bash
# 打开 + 等待 + 截图
agent-browser --session s open URL && agent-browser --session s wait --load networkidle && agent-browser --session s screenshot --full name.png

# 快照 + 查找 + 点击
REF=$(agent-browser --session s snapshot -i | grep "button" | head -1 | grep -oP '@\w+') && agent-browser --session s click $REF
```

---

**最后更新**: 2026-03-26
**验证状态**: ✅ 已在本地与测试流程中验证
**维护者**: Claude Code
