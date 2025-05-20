// 批量更新数据库错误处理脚本
const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, '../netlify/functions');

// 需要排除的文件
const excludeFiles = ['utils', 'placeholder.js', 'package.json'];

// 获取所有TypeScript函数文件
const getTypeScriptFiles = (dir) => {
  const files = fs.readdirSync(dir);
  return files
    .filter(file => 
      !excludeFiles.includes(file) && 
      file.endsWith('.ts')
    )
    .map(file => path.join(dir, file));
};

// 更新文件内容，替换数据库初始化部分
const updateDbInitialization = (filePath) => {
  console.log(`正在处理: ${path.basename(filePath)}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换简单的catch处理为try-catch块
  const oldPattern = /await db\.setupDatabase\(\)\.catch\(\(err\) => console\.error\('DB setup error:', err\)\);/;
  const newContent = `try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(\`数据库初始化失败: \${err.message || JSON.stringify(err)}\`);
  }`;
  
  // 检查文件是否需要更新
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`已更新: ${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`无需更新: ${path.basename(filePath)}`);
    return false;
  }
};

// 主函数
const main = () => {
  const files = getTypeScriptFiles(functionsDir);
  let updatedCount = 0;
  
  for (const file of files) {
    if (updateDbInitialization(file)) {
      updatedCount++;
    }
  }
  
  console.log(`完成更新 ${updatedCount}/${files.length} 个文件`);
};

main(); 