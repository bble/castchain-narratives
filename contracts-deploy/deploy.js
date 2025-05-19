const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// 合约编译与部署函数
async function main() {
  console.log("开始部署CastChain Achievement合约...");
  
  // 检查私钥是否存在
  if (!process.env.PRIVATE_KEY) {
    console.error("错误: 请在.env文件中设置PRIVATE_KEY环境变量");
    process.exit(1);
  }

  // 检查RPC URL是否存在
  const networkName = process.env.HARDHAT_NETWORK || "monadTestnet";
  const rpcUrlKey = networkName === "monad" ? "MONAD_RPC_URL" : "MONAD_TESTNET_RPC_URL";
  const rpcUrl = process.env[rpcUrlKey];
  
  if (!rpcUrl) {
    console.error(`错误: 请在.env文件中设置${rpcUrlKey}环境变量`);
    process.exit(1);
  }

  try {
    console.log(`使用网络: ${networkName}`);
    console.log(`RPC URL: ${rpcUrl}`);
    
    // 连接到Monad网络
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const signer = wallet.connect(provider);

    // 获取合约工厂
    const contractPath = path.join(__dirname, "artifacts/contracts/Achievement.sol/CastChainAchievement.json");
    if (!fs.existsSync(contractPath)) {
      console.error("错误: 合约编译文件不存在。请先运行 `yarn compile`");
      process.exit(1);
    }

    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const contractFactory = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      signer
    );

    // 部署合约
    console.log("正在部署合约...");
    const deployedContract = await contractFactory.deploy();
    await deployedContract.deployed();

    console.log(`合约部署成功！合约地址: ${deployedContract.address}`);
    
    // 保存合约地址到文件
    fs.writeFileSync(
      path.join(__dirname, "contract-address.json"),
      JSON.stringify({ address: deployedContract.address }, null, 2)
    );
    console.log("合约地址已保存到 contract-address.json 文件");
    
    return deployedContract.address;
  } catch (error) {
    console.error("部署过程中发生错误:", error);
    process.exit(1);
  }
}

// 执行主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 