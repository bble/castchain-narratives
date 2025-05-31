#!/bin/bash

# CastChain Narratives 统一部署脚本
# 确保手动部署和自动部署使用相同的配置

echo "🚀 开始部署 CastChain Narratives..."

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf .next

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功！"

# 部署到生产环境
echo "🌐 部署到生产环境..."
netlify deploy --prod --dir=.next --functions=netlify/functions

# 检查部署是否成功
if [ $? -eq 0 ]; then
    echo "🎉 部署成功！"
    echo "🔗 网站地址: https://castchain-narratives.netlify.app"
else
    echo "❌ 部署失败！"
    exit 1
fi
