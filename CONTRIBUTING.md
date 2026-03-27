# 贡献指南

感谢你关注 `codex-operations-console`。🎉

这个项目希望保持几个核心特质：清晰、稳重、可验证、适合真实运营场景。为了让协作顺畅，提交前请先看完这份说明。

## 🧭 开始之前

- 请先阅读 `README.md`
- 视觉相关改动请优先阅读 `docs/visual-design-system.md`
- 涉及行为变更时，请补充或更新测试
- 涉及界面改动时，请描述影响范围，必要时附上截图

## 🛠️ 本地开发

```powershell
npm install
npm run dev
```

## ✅ 提交前检查

```powershell
npm test
npm run type-check
npm run build
```

如果本次改动包含代码风格调整，也请执行：

```powershell
npm run lint
```

## 🌿 分支建议

- 功能：`feat/<short-name>`
- 修复：`fix/<short-name>`
- 文档：`docs/<short-name>`
- 重构：`refactor/<short-name>`

## 📝 Commit 建议

推荐使用清晰、可检索的提交前缀：

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

示例：

```text
feat: add cleanup workspace filters
fix: correct login error handling state
docs: refine public repository guide
```

## 🔐 安全要求

- 不要提交真实 token、cookie、私钥、生产域名密钥或环境密文
- 不要把私有部署步骤写进公开仓库
- 如发现敏感信息泄露风险，请不要直接公开提 Issue，改走 `SECURITY.md`

## 🎨 设计与体验

这个项目不是通用后台模板，提交 UI 改动时请尽量满足：

- 信息层级优先于装饰
- 主操作突出，但不要制造多个“同权主按钮”
- 避免杂乱标签和无意义高对比块
- 深浅色主题都要可读

## 🤝 Pull Request 说明

请在 PR 中尽量写清楚：

- 这次改了什么
- 为什么要改
- 如何验证
- 是否影响视觉、交互或 API 行为

如果是视觉改动，推荐附带至少一张前后对比截图。
