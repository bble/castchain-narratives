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

- Next.js 14
- TypeScript
- TailwindCSS
- Farcaster Frame SDK
- Monad & Farcaster集成

## 安装指南

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
NEXT_PUBLIC_API_URL=https://你的API服务地址或http://localhost:8000
NEXT_PUBLIC_MONAD_RPC_URL=https://rpc.monad.xyz/monad
```

4. 启动开发服务器

```bash
yarn dev
# 或
npm run dev
```

5. 在浏览器中访问 `http://localhost:3000`

## 部署指南

### Vercel部署（推荐）

1. Fork或克隆本仓库到你的GitHub账户

2. 在Vercel中导入项目
   - 登录Vercel并选择"New Project"
   - 选择你的GitHub仓库
   - 配置部署设置

3. 配置环境变量
   在Vercel项目设置中添加以下环境变量：
   ```
   NEXT_PUBLIC_URL=https://你的域名
   NEXT_PUBLIC_API_URL=https://你的API服务地址
   NEXT_PUBLIC_MONAD_RPC_URL=https://rpc.monad.xyz/monad
   ```

4. 部署
   点击"Deploy"按钮

### 自托管部署

1. 构建项目

```bash
yarn build
# 或
npm run build
```

2. 启动生产服务器

```bash
yarn start
# 或
npm start
```

## 后端API服务

本项目前端与后端API进行交互。你需要：

1. 部署后端API服务（参考项目中的API接口定义）
2. 在`.env.local`或部署环境中设置`NEXT_PUBLIC_API_URL`指向你的API服务

或者，你可以修改`lib/api.ts`，使用模拟数据进行测试和演示。

## 区块链集成

要完整使用链上成就功能，你需要：

1. 部署成就合约到Monad网络（参考文档中的智能合约定义）
2. 更新`lib/constants.ts`中的`ACHIEVEMENT_CONTRACT_ADDRESS`常量

## 在Farcaster中使用

要在Warpcast或其他Farcaster客户端中使用本MiniApp：

1. 部署应用到公开可访问的URL
2. 确保`.well-known/farcaster.json`正确配置
3. 在Warpcast中添加你的应用

## 使用方法

### 创建新叙事

1. 登录Farcaster账号
2. 点击"创建叙事"按钮
3. 填写标题、开篇内容、标签等信息
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

## 配置选项

以下是主要的配置选项和它们的位置：

- **环境变量**：`.env.local`文件（本地开发）或部署平台的环境变量设置
- **API地址**：`lib/constants.ts`中的`API_BASE_URL`
- **Monad网络设置**：`lib/constants.ts`中的相关常量
- **智能合约地址**：`lib/constants.ts`中的`ACHIEVEMENT_CONTRACT_ADDRESS`
- **Farcaster配置**：`app/.well-known/farcaster.json/route.ts`

## 示例实现与参考代码

以下是一些关键功能的参考实现代码，可以帮助您理解如何扩展或定制项目功能。

### Frame配置测试

您可以使用以下命令测试您的Frame配置：

```bash
# 使用curl测试frame配置
curl -X GET https://你的域名/.well-known/farcaster.json

# 预览Frame在Feed中的显示
npx @farcaster/frame-preview https://你的域名
```

### 智能合约部署

您需要设置Hardhat环境来部署智能合约：

```bash
# 安装Hardhat
npm install --save-dev hardhat

# 初始化Hardhat项目
npx hardhat init

# 部署到Monad网络
npx hardhat run scripts/deploy.js --network monad
```

### SBT查询功能实现示例

以下是查询用户SBT的示例代码：

```typescript
// 查询用户拥有的所有SBT
const getUserSBTs = async (contractAddress: string, userAddress: string) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, SBT_ABI, provider);
  
  // 获取用户SBT数量
  const balance = await contract.balanceOf(userAddress);
  
  // 获取用户所有SBT的tokenId
  const sbtIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
    sbtIds.push(tokenId.toString());
  }
  
  // 获取每个SBT的元数据URI
  const sbtDetails = await Promise.all(
    sbtIds.map(async (tokenId) => {
      const uri = await contract.tokenURI(tokenId);
      // 处理ipfs://开头的URI
      const metadataUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      
      // 获取元数据内容
      const response = await fetch(metadataUrl);
      const metadata = await response.json();
      
      return {
        tokenId,
        metadata,
        uri
      };
    })
  );
  
  return sbtDetails;
};
```

### Frame元数据生成示例

以下是生成Frame元数据的示例：

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    image: `${APP_URL}/images/feed.png`,
    title: "CastChain Narratives",
    buttons: [
      {
        label: "浏览故事",
        action: "post_redirect"
      },
      {
        label: "创建故事",
        action: "post"
      }
    ],
  };

  return {
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    openGraph: {
      title: "CastChain Narratives",
      description: "协作式故事创作平台，记录在链上",
      images: [`${APP_URL}/images/og.png`],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}
```

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 许可证

MIT
