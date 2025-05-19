require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    monad: {
      url: process.env.MONAD_RPC_URL || "https://rpc.monad.xyz/monad",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1024,
    },
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC_URL || "https://rpc.monad.xyz/testnet",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1024,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
}; 