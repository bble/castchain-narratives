# CastChain Narratives

CastChain Narratives是一个基于Farcaster的MiniApp，使用户能够创建、分叉和贡献协作式故事，所有内容安全地存储在链上。

## 主要特点

- **去中心化故事创作**：故事内容以Cast形式存储在Farcaster上
- **可分支的叙事**：支持从任何节点创建故事分支，探索不同的叙事路径
- **树状可视化**：直观地展示故事的演变和分叉
- **链上成就**：完成创作里程碑后获取特殊SBT和NFT
- **协作创作**：多人共同创作一个叙事世界

## 技术栈

- Next.js 14
- TypeScript
- TailwindCSS
- Farcaster Frame SDK
- Monad & Farcaster集成

## 安装指南

1. 克隆仓库

```bash
git clone https://github.com/your-username/castchain-narratives.git
cd castchain-narratives
```

2. 安装依赖

```bash
npm install
# 或者
yarn install
```

3. 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

4. 构建生产版本

```bash
npm run build
# 或者
yarn build
```

## 使用方法

### 创建新叙事

1. 登录Farcaster账号
2. 点击"创建叙事"按钮
3. 填写标题、描述、标签等信息
4. 提交后，系统会创建第一个叙事节点

### 贡献故事

1. 浏览现有叙事
2. 点击一个叙事进入详情页
3. 选择一个故事节点
4. 点击"延续此分支"或"创建新分支"
5. 编写你的贡献内容并提交

### 获取成就

1. 在成就页面查看可获取的成就
2. 根据成就要求参与相应活动
3. 达到要求后点击"铸造成就"获取链上凭证

## MiniApp集成

本应用是Farcaster MiniApp，可以直接通过Warpcast等客户端打开，也可以作为独立网页应用访问。

如需在Warpcast中集成，请使用以下URL：

```
https://castchain-narratives.vercel.app
```

## 开发文档

更多技术细节和API文档请参考我们的[开发者文档](docs/developer.md)。

## 贡献指南

我们欢迎社区贡献！请查看[贡献指南](CONTRIBUTING.md)了解如何参与项目开发。

## 许可证

MIT
