# CastChain Narratives - Farcaster Mini App

## 🎉 Mini App 升级完成！

CastChain Narratives 已成功从传统 Farcaster Frame 升级为完整的 **Farcaster Mini App**，提供原生应用体验。

## 🚀 功能特性

### ✨ Mini App 特性
- **完整应用体验**：原生 React 应用，无需页面跳转
- **Farcaster 集成**：直接访问用户信息和社交功能
- **钱包连接**：支持 Frame 钱包和外部钱包
- **实时交互**：即时响应，流畅的用户体验

### 📱 核心功能
- **浏览故事**：发现和探索协作式叙事
- **创建叙事**：直接在应用内创建新故事
- **用户成就**：查看创作成就和贡献历史
- **社交互动**：点赞、评论、分享故事

## 🛠️ 技术实现

### Mini App 配置
- **Manifest**: `/.well-known/farcaster.json`
- **Meta 标签**: 支持 `launch_frame` 动作
- **SDK 集成**: `@farcaster/frame-sdk`

### 关键组件
- `FrameProvider`: Farcaster SDK 集成
- `MiniAppHome`: 主应用界面
- `CreateNarrative`: 创作表单
- `NarrativeExplorer`: 故事浏览器

## 🔧 开发和部署

### 构建命令
```bash
# 快速构建和部署
./scripts/build-and-deploy.sh

# 手动构建
NEXT_PUBLIC_URL=https://castchain-narratives.netlify.app npm run build
cp .next/server/app/index.html public/
netlify deploy --prod
```

### 环境变量
- `NEXT_PUBLIC_URL`: 应用的公开 URL
- `FAUNA_SECRET_KEY`: 数据库密钥
- `NEXT_PUBLIC_MONAD_RPC_URL`: 区块链 RPC 端点

## 📋 使用指南

### 在 Warpcast 中使用
1. 分享应用链接到 Warpcast
2. 点击"启动应用"按钮
3. 享受完整的 Mini App 体验

### 功能说明
- **发现叙事**: 浏览所有公开的协作故事
- **创建叙事**: 点击"创建叙事"开始新的故事
- **我的成就**: 查看创作统计和成就徽章

## 🎯 用户体验

### Mini App 优势
- ✅ 无需离开 Warpcast
- ✅ 原生应用体验
- ✅ 实时数据更新
- ✅ 完整功能访问
- ✅ 流畅的交互体验

### 与传统 Frame 对比
| 特性 | 传统 Frame | Mini App |
|------|------------|----------|
| 交互方式 | 按钮点击 | 完整应用 |
| 用户体验 | 有限 | 原生 |
| 功能完整性 | 基础 | 完整 |
| 响应速度 | 较慢 | 即时 |

## 🔗 相关链接

- **应用地址**: https://castchain-narratives.netlify.app/
- **Manifest**: https://castchain-narratives.netlify.app/.well-known/farcaster.json
- **GitHub**: [项目仓库]
- **文档**: [开发文档]

## 📞 支持

如有问题或建议，请联系开发团队或在 GitHub 上提交 Issue。

---

**CastChain Narratives** - 链上叙事，共创未来 🌟
