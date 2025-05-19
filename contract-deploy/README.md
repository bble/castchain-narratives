# CastChain Achievement 独立合约部署工具

本目录是一个完全独立的部署工具，用于编译和部署CastChain Achievement智能合约到Monad区块链。

## 重要说明

**请先将此目录复制到项目外的任何位置，然后在那里执行操作，以避免ESM/CommonJS模块兼容性问题。**

```bash
# 例如，复制到您的主目录
cp -r contract-deploy ~/castchain-contract-deploy
cd ~/castchain-contract-deploy
```

## 部署准备

1. 安装依赖
   ```bash
   npm install
   # 或
   yarn install
   ```

2. 创建`.env`文件，添加以下内容
   ```
   # 区块链配置
   PRIVATE_KEY=your_wallet_private_key_here  # 部署合约的钱包私钥
   MONAD_RPC_URL=https://rpc.monad.xyz/monad  # Monad主网RPC
   MONAD_TESTNET_RPC_URL=https://rpc.monad.xyz/testnet  # Monad测试网RPC
   ```

## 合约编译与部署

1. 编译合约
   ```bash
   npm run compile
   # 或
   yarn compile
   ```

2. 部署到测试网
   ```bash
   npm run deploy:testnet
   # 或
   yarn deploy:testnet
   ```

部署成功后，合约地址会保存在`contract-address.json`文件中。

## 将合约地址更新到主应用

请将`contract-address.json`中的合约地址复制到主应用的`lib/constants.ts`文件中：

```typescript
// lib/constants.ts
export const ACHIEVEMENT_CONTRACT_ADDRESS = "0x..."; // 替换为您部署的合约地址
```

## 故障排除

如果遇到模块系统相关的错误，请尝试以下步骤：

1. 确保在完全独立的目录中运行本工具
2. 检查`package.json`中是否包含`"type": "commonjs"`
3. 确保使用`--config hardhat.config.cjs`参数 