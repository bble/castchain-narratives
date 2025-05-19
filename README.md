# CastChain Narratives

CastChain Narratives是一个基于Farcaster的MiniApp，使用户能够创建、分叉和贡献协作式故事，所有内容安全地存储在链上。

## 主要特点

- **去中心化故事创作**：故事内容以Cast形式存储在Farcaster上
- **可分支的叙事**：支持从任何节点创建故事分支，探索不同的叙事路径
- **树状可视化**：直观地展示故事的演变和分叉
- **链上成就**：完成创作里程碑后获取特殊SBT和NFT
- **协作创作**：多人共同创作一个叙事世界

## 完整功能清单

### 叙事创作与浏览
- ✅ 创建新叙事（设置标题、简介、标签、协作规则）
- ✅ 浏览叙事（按热门度、最新更新、标签筛选）
- ✅ 查看叙事详情（故事树、贡献者信息）
- ✅ 搜索叙事（按标题、创作者）
- ✅ 关注感兴趣的叙事

### 贡献与分支系统
- ✅ 延续现有故事线（线性贡献）
- ✅ 创建新故事分支（平行剧情发展）
- ✅ 查看故事树结构（直观的分支可视化）
- ✅ 贡献内容发布为Farcaster Cast

### 链上成就系统
- ✅ 铸造分支开创者SBT（创建受欢迎分支）
- ✅ 铸造章节完成NFT（参与完成叙事章节）
- ✅ 铸造织梦者徽章（优质创作贡献）
- ✅ 查看个人成就集合
- ✅ 在区块链上验证铸造记录

### 社交互动功能
- ✅ 点赞故事贡献
- ✅ 分享叙事到Farcaster
- ✅ 关注创作者和叙事
- ✅ 通知系统（新贡献、成就资格等）

### 用户体验
- ✅ 新用户引导流程
- ✅ 个人中心（创作、关注、成就统计）
- ✅ 暗色主题界面
- ✅ 移动端优化适配

## 技术栈

- Next.js 14 (前端框架)
- TypeScript (类型安全的JavaScript)
- TailwindCSS (样式)
- Netlify Functions (无服务器后端API)
- FaunaDB (数据库)
- Farcaster Frame SDK (Farcaster集成)
- Monad区块链 (成就SBT/NFT)

## 本地开发指南

1. 克隆仓库

```bash
git clone https://github.com/bble/castchain-narratives.git
cd castchain-narratives
```

2. 安装依赖

```bash
npm install
# 或者
yarn install
```

3. 配置环境变量

创建`.env.local`文件，添加以下内容：

```
NEXT_PUBLIC_URL=http://localhost:3000
FAUNA_SECRET_KEY=你的FaunaDB密钥
```

4. 启动开发服务器

```bash
yarn dev
# 或
npm run dev
```

5. 在浏览器中访问 `http://localhost:3000`

## 部署指南 (Netlify一体化前后端部署)

CastChain Narratives采用Netlify实现前后端一体化部署，Next.js前端与Netlify Functions后端在同一平台部署，无需分开管理。

### 部署准备

1. 创建[Netlify](https://netlify.com)和[FaunaDB](https://fauna.com)账户
2. 在FaunaDB中创建一个新数据库并获取密钥：
   - 登录FaunaDB控制台
   - 创建新数据库
   - 前往"Security"，创建服务器密钥并复制

### 仓库设置

1. Fork或克隆本仓库到你的GitHub账户

2. 确保仓库中包含以下关键配置文件：
   - `netlify.toml` - Netlify配置(已包含Next.js和Functions设置)
   - `types/` - TypeScript类型声明
   - `netlify/functions/` - 后端API函数

### Netlify部署流程

1. 登录Netlify并创建新站点：
   - 点击"New site from Git"
   - 选择你的GitHub仓库
   - 保留默认构建设置(自动检测Next.js项目)

2. 配置环境变量：
   - 站点部署后，前往"Site settings" > "Build & deploy" > "Environment variables"
   - 添加以下变量：
     - `FAUNA_SECRET_KEY`: 你的FaunaDB密钥
     - `NEXT_PUBLIC_URL`: 你的Netlify应用URL(例如：https://castchain-narratives.netlify.app)

3. 重新部署应用：
   - 前往"Deploys"标签
   - 点击"Trigger deploy" > "Deploy site"

### 验证部署

部署完成后，你可以验证：

1. **前端**：访问你的Netlify域名(如`https://your-site.netlify.app`)
2. **后端API**：尝试访问API端点(如`https://your-site.netlify.app/.netlify/functions/narratives`)
3. **数据库**：检查FaunaDB控制台中是否有数据写入

### 常见部署问题

- **类型错误**：确保类型声明文件放在`types/`目录中，不要放在`netlify/functions/`中
- **依赖问题**：检查`package.json`确保包含所有前后端依赖，如`faunadb`
- **环境变量**：验证环境变量是否正确设置，尤其是`FAUNA_SECRET_KEY`

## API端点

项目包含以下API端点，所有端点均通过Netlify Functions提供：

- `/.netlify/functions/narratives` - 获取叙事列表和创建新叙事
- `/.netlify/functions/narrative-by-id` - 获取单个叙事
- `/.netlify/functions/narrative-contributions` - 获取叙事贡献和添加新贡献
- `/.netlify/functions/narrative-branches` - 获取叙事分支
- `/.netlify/functions/contribution-like` - 点赞贡献
- `/.netlify/functions/user-achievements` - 获取用户成就
- `/.netlify/functions/user-notifications` - 获取用户通知
- `/.netlify/functions/notification-read` - 标记通知为已读
- `/.netlify/functions/achievement-mint` - 铸造成就

## 区块链集成

CastChain Narratives使用Monad区块链存储用户成就NFT/SBT。我们提供了专门的合约部署目录，方便您快速部署智能合约。

### 合约部署方法

由于Next.js项目使用ESM模块系统，而Hardhat使用CommonJS，我们提供了一个独立的部署目录：

```bash
cd contracts-deploy
yarn install  # 或 npm install
```

然后按照`contracts-deploy/README.md`中的说明进行操作：

1. 创建`.env`文件，添加您的钱包私钥和RPC URL
2. 编译合约：`yarn compile`
3. 部署合约：`yarn deploy:testnet`

部署成功后，合约地址将保存在`contract-address.json`文件中，您需要手动将地址更新到`lib/constants.ts`文件中：

```typescript
// lib/constants.ts
export const ACHIEVEMENT_CONTRACT_ADDRESS = "0x..."; // 更新为您部署的合约地址
```

### 合约功能说明

CastChainAchievement合约支持以下成就类型：
- **分支开创者SBT**：创建受欢迎的故事分支（不可转让）
- **章节完成NFT**：参与完成叙事章节（可收藏和交易）
- **织梦者徽章**：优质创作贡献（不可转让）

## 在Farcaster中使用

本项目使用Farcaster的Frames机制实现，这意味着**无需**在Warpcast开发者平台注册或审核，可以直接部署并使用。

### 部署到Farcaster生态系统

1. **部署应用**
   - 将应用部署到Netlify后获得公开URL
   - 确保已设置环境变量，特别是`NEXT_PUBLIC_URL`

2. **验证Frame配置**
   ```bash
   # 测试Frame配置是否正确
   curl -X GET https://你的域名/.well-known/farcaster.json
   
   # 使用Frame预览工具（可选）
   npx @farcaster/frame-preview https://你的域名
   ```

3. **分享你的应用**
   - 直接在Warpcast中发布一个包含你的应用URL的Cast
   - Warpcast会自动识别URL中的Frame元数据并渲染交互界面

### 在Warpcast中使用

1. **访问应用**
   - 用户只需点击你的应用链接
   - Warpcast会自动将URL渲染为交互式Frame

2. **交互方式**
   - 用户可以通过Frame的按钮与应用交互
   - 点击按钮会触发对应的操作（如浏览故事、创建叙事等）
   - 所有交互都在Warpcast内部完成，无需离开应用

### 常见问题

- **应用未渲染为Frame**: 确认`app/.well-known/farcaster.json/route.ts`和`app/page.tsx`中的Frame元数据配置正确
- **按钮不工作**: 检查按钮配置是否符合Frame规范，确保action类型正确
- **图片不显示**: 确保图片URL是公开可访问的，并正确设置了NEXT_PUBLIC_URL

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 许可证

MIT
