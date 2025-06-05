# CastChain Narratives

一个基于Farcaster的协作叙事创作平台，让用户能够共同创建、扩展和分支故事情节。

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
- ✅ 自动成就检测（首次创建分支等）

### 社交互动功能
- ✅ 点赞故事贡献（实时更新点赞数）
- ✅ 分享叙事到Farcaster
- ✅ 关注/取消关注叙事
- ✅ 检查关注状态和关注者统计
- ✅ 完整通知系统（新贡献、点赞、成就、关注）
- ✅ 批量通知管理（标记已读）

### 用户体验
- ✅ 新用户引导流程
- ✅ 个人中心（创作、关注、成就统计）
- ✅ 暗色主题界面
- ✅ 移动端优化适配

## 技术架构

### 前端
- **Next.js 14**：React框架，支持SSR和静态生成
- **TypeScript**：类型安全的开发体验
- **Tailwind CSS**：现代化的样式框架
- **Farcaster SDK**：与Farcaster平台的深度集成

### 后端
- **Netlify Functions**：无服务器API端点
- **Supabase**：现代化的PostgreSQL数据库服务
- **TypeScript**：统一的开发语言

### 区块链
- **Monad区块链**：高性能EVM兼容链，低成本高效率
- **NFT合约**：ERC-721标准的成就徽章
- **智能合约**：去中心化的成就验证

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
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

4. 启动开发服务器

```bash
yarn dev
# 或
npm run dev
```

5. 在浏览器中访问 `http://localhost:3000`

## 部署指南

### 前置条件

1. 创建[Netlify](https://netlify.com)和[Supabase](https://supabase.com)账户
2. 在Supabase中创建一个新项目并获取密钥：
   - 登录Supabase控制台
   - 创建新项目
   - 前往"Settings" > "API"，复制项目URL和anon key

3. 初始化Supabase数据库结构：
   - 登录Supabase控制台并选择你创建的项目
   - 点击"SQL Editor"标签页
   - 打开项目中的`supabase-database-setup.sql`文件
   - 将脚本内容复制到SQL编辑器中执行
   - 确认所有表、索引和触发器都成功创建

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
     - `SUPABASE_URL`: 你的Supabase项目URL
     - `SUPABASE_ANON_KEY`: 你的Supabase匿名密钥
     - `NEXT_PUBLIC_URL`: 你的Netlify应用URL(例如：https://castchain-narratives.netlify.app)

3. 重新部署应用：
   - 前往"Deploys"标签
   - 点击"Trigger deploy" > "Deploy site"

### 验证部署

部署完成后，你可以验证：

1. **前端**：访问你的Netlify域名(如`https://your-site.netlify.app`)
2. **后端API**：尝试访问API端点(如`https://your-site.netlify.app/.netlify/functions/narratives`)
3. **数据库**：检查Supabase控制台中是否有数据写入

### 常见部署问题

- **类型错误**：确保类型声明文件放在`types/`目录中，不要放在`netlify/functions/`中
- **依赖问题**：检查`package.json`确保包含所有前后端依赖，如`@supabase/supabase-js`
- **环境变量**：验证环境变量是否正确设置，尤其是`SUPABASE_URL`和`SUPABASE_ANON_KEY`
- **数据库初始化错误**：确保已正确执行`supabase-database-setup.sql`脚本，并且所有表和索引都已成功创建。如果API返回502或400错误，很可能是数据库结构未正确初始化。

## API端点

项目包含以下API端点，所有端点均通过Netlify Functions提供：

### 叙事相关
- `GET/POST /api/narratives` - 获取叙事列表和创建新叙事
- `GET /api/narratives/:id` - 获取单个叙事详情
- `GET/POST /api/narratives/:id/contributions` - 获取叙事贡献和添加新贡献
- `GET /api/narratives/:id/branches` - 获取叙事分支
- `POST/GET/DELETE /api/narratives/:id/follow` - 关注/取消关注/检查关注状态

### 分支相关
- `POST /api/branches/create` - 创建新分支

### 互动相关
- `POST /api/contributions/:narrativeId/:contributionId/like` - 点赞贡献

### 用户相关
- `GET /api/users/:id/achievements` - 获取用户成就
- `GET /api/users/:id/notifications` - 获取用户通知
- `POST /api/users/:id/notifications/read-all` - 批量标记通知为已读

### 通知相关
- `POST /api/notifications/:id/read` - 标记单个通知为已读

### 成就相关
- `POST /.netlify/functions/achievement-mint` - 铸造成就NFT

## 区块链集成

CastChain Narratives使用Monad区块链存储用户成就NFT/SBT。我们提供了自动化的合约部署脚本，一键完成所有部署步骤。

### 合约部署方法

#### 前置条件

1. **设置私钥环境变量**：
   ```bash
   export PRIVATE_KEY=your_private_key_here
   ```

   或创建 `.env` 文件：
   ```
   PRIVATE_KEY=your_private_key_here
   ```

2. **可选：自定义网络配置**（不设置将使用默认值）：
   ```bash
   export MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   export MONAD_CHAIN_ID=10143
   export MONAD_EXPLORER_URL=https://testnet.monadexplorer.com
   export MONAD_CURRENCY_SYMBOL=MON
   ```

3. **确保钱包有足够的 MON 代币**用于支付 gas 费用

#### 一键部署

运行自动化部署脚本：

```bash
./scripts/deploy-contract.sh
```

**脚本会自动执行以下操作**：
- 创建临时部署目录
- 复制合约代码到独立环境
- 安装 Hardhat 和依赖
- 编译合约
- 部署到 Monad 测试网
- 验证部署并显示合约地址

#### 更新前端配置

部署成功后，复制输出的合约地址并更新前端配置：

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

本项目是一个Farcaster Mini App，可以直接在Farcaster客户端中运行，提供原生的Web应用体验。

### 部署到Farcaster生态系统

1. **部署应用**
   - 将应用部署到Netlify后获得公开URL
   - 确保已设置环境变量，特别是`NEXT_PUBLIC_URL`

2. **配置Mini App**
   - 在Farcaster客户端中添加Mini App
   - 输入你的应用URL（如：https://castchain-narratives.netlify.app）
   - Farcaster会将其识别为Mini App并提供原生体验

### 在Farcaster中使用

1. **Mini App访问**
   - 用户可以在Farcaster客户端的Mini Apps部分找到应用
   - 点击即可在内嵌浏览器中打开完整的Web应用

2. **用户交互**
   - 用户可以使用完整的Web应用功能
   - 支持所有叙事创作、分支、点赞、关注等功能
   - 无需离开Farcaster客户端

### 常见问题

- **应用无法加载**: 确认应用URL可以公开访问，并正确设置了NEXT_PUBLIC_URL
- **功能不工作**: 检查网络连接和环境变量配置
- **样式问题**: 确保应用在移动端和桌面端都有良好的响应式设计

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 许可证

MIT
