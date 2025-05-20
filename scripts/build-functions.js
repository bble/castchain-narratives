// 函数构建脚本 - 用于减小Netlify函数大小
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 函数目录
const functionsDir = path.join(__dirname, '../netlify/functions');

// 单独安装函数依赖
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

console.log('函数构建完成'); 