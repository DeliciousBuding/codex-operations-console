# 多模态审查脚本使用指南

本目录包含自动化视觉审查脚本，用于快速完成多模态测试。

## 脚本说明

### `windows-visual-review.sh`
**适用环境**: Windows（使用 Edge CDP 连接）

**特点**:
- ✅ 使用 Edge 浏览器（最小化窗口）
- ✅ 稳定性高
- ✅ 自动审查所有页面
- ✅ 自动测试交互功能

**使用方法**:
```bash
# 基础用法
bash scripts/windows-visual-review.sh

# 自定义配置
APP_URL=http://localhost:3000 PORT=9998 bash scripts/windows-visual-review.sh
```

**输出**:
- 截图: `screenshots/tests/review-YYYYMMDD-HHMMSS/*.png`
- DOM快照: `screenshots/tests/review-YYYYMMDD-HHMMSS/*-dom.txt`

---

### `quick-visual-review.sh`
**适用环境**: Linux/macOS（Headless 模式）

**特点**:
- ✅ 纯 Headless 模式
- ✅ 无窗口弹出
- ✅ 资源占用低

**使用方法**:
```bash
bash scripts/quick-visual-review.sh
```

---

## 审查内容

脚本会自动完成以下审查：

1. **登录页** - 截图 + DOM快照
2. **概览页** - 截图 + DOM快照
3. **账号页** - 截图 + DOM快照
4. **待处理页** - 截图 + DOM快照
5. **设置页** - 截图 + DOM快照
6. **主题切换** - 前后对比截图

---

## 环境要求

### Windows 环境
- ✅ Edge 浏览器
- ✅ agent-browser 已安装
- ✅ Node.js 环境

### Linux/macOS 环境
- ✅ Chrome/Chromium
- ✅ agent-browser 已安装

---

## 自定义配置

### 修改应用 URL
```bash
APP_URL=http://localhost:8080 bash scripts/windows-visual-review.sh
```

### 修改端口
```bash
PORT=8888 bash scripts/windows-visual-review.sh
```

### 修改输出目录
修改脚本中的 `OUTPUT_DIR` 变量

---

## 集成到开发流程

### npm scripts
在 `package.json` 中添加：
```json
{
  "scripts": {
    "review:visual": "bash scripts/windows-visual-review.sh",
    "review:quick": "bash scripts/quick-visual-review.sh"
  }
}
```

### Git Hooks
在 `.git/hooks/pre-push` 中添加：
```bash
#!/bin/bash
npm run review:visual
```

---

## 故障排查

### 问题：浏览器启动失败
**解决**: 确保 Edge 浏览器已安装，或修改脚本使用 Chrome

### 问题：端口被占用
**解决**: 修改 PORT 变量或关闭占用端口的进程

### 问题：截图保存失败
**解决**: 确保 `screenshots/tests/` 目录存在且有写入权限

---

## 最佳实践

1. **定期审查** - 每次视觉修改后运行审查脚本
2. **保存结果** - 保留重要审查结果作为基线
3. **对比分析** - 使用截图对比工具检测视觉变化
4. **自动化验证** - 使用 DOM 快照进行自动化验证

---

## 相关文档

- [多模态审查工作流最佳实践](../docs/multimodal-review-workflow.md)
- [AGENTS.md - 开发工作流规范](../AGENTS.md)

---

**维护者**: Claude Code
**更新日期**: 2026-03-26