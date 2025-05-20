// 函数构建脚本 - 支持TypeScript函数和FaunaDB
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保函数目录存在
const functionsDir = path.join(__dirname, '../netlify/functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log('创建functions目录');
}

// 安装函数所需依赖
console.log('为函数安装依赖...');
try {
  // 如果functions目录下有package.json，安装依赖
  if (fs.existsSync(path.join(functionsDir, 'package.json'))) {
    execSync('cd netlify/functions && npm install --production', { stdio: 'inherit' });
    console.log('函数依赖安装完成');
  }
} catch (error) {
  console.error('安装函数依赖时出错:', error);
  process.exit(1);
}

// 确保Edge Functions目录存在
const edgeFunctionsDir = path.join(__dirname, '../netlify/edge-functions');
if (!fs.existsSync(edgeFunctionsDir)) {
  fs.mkdirSync(edgeFunctionsDir, { recursive: true });
  console.log('创建Edge Functions目录');
}

console.log('构建优化完成'); 