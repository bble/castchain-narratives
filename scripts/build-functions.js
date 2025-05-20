// 函数构建脚本 - 支持Edge Functions的简化版
const fs = require('fs');
const path = require('path');

// 确保边缘函数目录存在
const edgeFunctionsDir = path.join(__dirname, '../netlify/edge-functions');
if (!fs.existsSync(edgeFunctionsDir)) {
  fs.mkdirSync(edgeFunctionsDir, { recursive: true });
  console.log('创建Edge Functions目录');
}

// 移除不需要的旧函数文件
const functionsDir = path.join(__dirname, '../netlify/functions');
if (fs.existsSync(functionsDir)) {
  try {
    // 仅保留关键的frame函数
    const filesToKeep = ['frame.js'];
    const files = fs.readdirSync(functionsDir);
    
    for (const file of files) {
      if (!filesToKeep.includes(file) && file !== 'package.json') {
        const filePath = path.join(functionsDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          // 如果是目录，不处理
          continue;
        }
        try {
          fs.unlinkSync(filePath);
          console.log(`移除不需要的函数文件: ${file}`);
        } catch (err) {
          console.error(`无法删除文件 ${file}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('处理函数目录时出错:', error);
  }
}

console.log('构建优化完成'); 