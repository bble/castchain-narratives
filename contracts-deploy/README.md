# CastChain Achievement 合约部署

本目录是一个完全独立的合约部署工具，可以编译和部署CastChain Achievement智能合约。

## 部署准备

1. 安装依赖
   ```bash
   cd contracts-deploy
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

## 说明

此合约部署目录使用CommonJS模块系统，与主项目的ESM模块系统完全分离，避免了兼容性问题。它是一个完全独立的项目，可以单独运行，不受父项目配置的影响。 