#!/bin/bash

# CastChain Narratives 智能合约部署脚本
# 该脚本会自动创建临时部署目录，复制合约代码，安装依赖，编译并部署合约

set -e  # 遇到错误立即退出

echo "🚀 开始部署 CastChain Narratives 智能合约..."

# 获取当前项目根目录
PROJECT_ROOT=$(pwd)
echo "📁 项目根目录: $PROJECT_ROOT"

# 设置默认配置（优先从环境变量读取）
MONAD_RPC_URL=${MONAD_RPC_URL:-"https://testnet-rpc.monad.xyz"}
MONAD_CHAIN_ID=${MONAD_CHAIN_ID:-10143}
MONAD_EXPLORER_URL=${MONAD_EXPLORER_URL:-"https://testnet.monadexplorer.com"}
MONAD_CURRENCY_SYMBOL=${MONAD_CURRENCY_SYMBOL:-"MON"}

echo "🌐 网络配置:"
echo "   RPC URL: $MONAD_RPC_URL"
echo "   Chain ID: $MONAD_CHAIN_ID"
echo "   Explorer: $MONAD_EXPLORER_URL"
echo "   Currency: $MONAD_CURRENCY_SYMBOL"

# 创建临时部署目录
DEPLOY_DIR="$HOME/castchain-contract-deploy-$(date +%Y%m%d-%H%M%S)"
echo "📁 创建临时部署目录: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 复制合约代码到部署目录
echo "📋 复制合约代码..."
mkdir -p "$DEPLOY_DIR/contracts"
cp -r "$PROJECT_ROOT/contracts/"* "$DEPLOY_DIR/contracts/"

# 创建 package.json
echo "📦 创建 package.json..."
cat > "$DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "castchain-contracts",
  "version": "1.0.0",
  "description": "CastChain Narratives Smart Contracts",
  "scripts": {
    "compile": "npx hardhat compile --config hardhat.config.cjs",
    "deploy:testnet": "npx hardhat run scripts/deploy.js --network monadTestnet --config hardhat.config.cjs"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^4.9.3",
    "dotenv": "^16.3.1",
    "ethers": "^5.7.2"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^1.0.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "@nomicfoundation/hardhat-toolbox": "^2.0.0",
    "@nomiclabs/hardhat-ethers": "^2.2.3",
    "@nomiclabs/hardhat-etherscan": "^3.1.7",
    "chai": "^4.2.0",
    "hardhat": "^2.17.1",
    "hardhat-gas-reporter": "^1.0.8",
    "solidity-coverage": "^0.8.1"
  }
}
EOF

# 创建 Hardhat 配置文件
echo "⚙️ 创建 Hardhat 配置..."
cat > "$DEPLOY_DIR/hardhat.config.cjs" << EOF
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    monadTestnet: {
      url: "${MONAD_RPC_URL}",
      chainId: ${MONAD_CHAIN_ID},
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      monadTestnet: "dummy" // Monad testnet doesn't require API key
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: ${MONAD_CHAIN_ID},
        urls: {
          apiURL: "${MONAD_EXPLORER_URL}/api",
          browserURL: "${MONAD_EXPLORER_URL}"
        }
      }
    ]
  }
};
EOF

# 创建部署脚本
echo "📝 创建部署脚本..."
mkdir -p "$DEPLOY_DIR/scripts"
cat > "$DEPLOY_DIR/scripts/deploy.js" << EOF
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始部署 CastChain Achievement 合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署者地址:", deployer.address);

  // 获取账户余额
  const balance = await deployer.getBalance();
  console.log("💰 部署者余额:", ethers.utils.formatEther(balance), "${MONAD_CURRENCY_SYMBOL}");

  // 部署合约
  const CastChainAchievement = await ethers.getContractFactory("CastChainAchievement");
  console.log("🔨 正在部署合约...");

  const achievement = await CastChainAchievement.deploy();
  await achievement.deployed();

  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", achievement.address);
  console.log("🔗 区块链浏览器:", \`${MONAD_EXPLORER_URL}/address/\\\${achievement.address}\`);

  // 验证部署
  console.log("🔍 验证合约部署...");
  const name = await achievement.name();
  const symbol = await achievement.symbol();
  console.log("📛 合约名称:", name);
  console.log("🏷️ 合约符号:", symbol);

  console.log("\\n🎉 部署完成!");
  console.log("📋 请将以下合约地址更新到前端 constants.ts 文件中:");
  console.log(\`export const ACHIEVEMENT_CONTRACT_ADDRESS = "\\\${achievement.address}";\`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
EOF

# 复制环境变量文件（如果存在）
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "🔐 复制环境变量文件..."
    cp "$PROJECT_ROOT/.env" "$DEPLOY_DIR/"
fi

# 切换到部署目录
cd "$DEPLOY_DIR"
echo "📂 切换到部署目录: $(pwd)"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 编译合约
echo "🔨 编译合约..."
npm run compile

# 检查私钥是否设置
if [ -z "$PRIVATE_KEY" ] && [ ! -f ".env" ]; then
    echo "⚠️ 警告: 未找到 PRIVATE_KEY 环境变量或 .env 文件"
    echo "请设置 PRIVATE_KEY 环境变量或创建 .env 文件"
    echo "示例: export PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# 部署合约
echo "🚀 部署合约到 Monad 网络..."
echo "   网络: $MONAD_RPC_URL"
echo "   Chain ID: $MONAD_CHAIN_ID"
npm run deploy:testnet

echo "🎉 合约部署流程完成!"
echo "📁 部署目录: $DEPLOY_DIR"
echo "🔗 区块链浏览器: $MONAD_EXPLORER_URL"
echo "💡 提示: 部署目录将保留，您可以稍后手动删除"
