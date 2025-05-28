#!/bin/bash

# 构建和部署脚本
echo "🚀 开始构建 CastChain Narratives Mini App..."

# 设置环境变量并构建
echo "📦 构建应用..."
NEXT_PUBLIC_URL=https://castchain-narratives.netlify.app npm run build

# 复制生成的 index.html 到 public 目录
echo "📋 复制静态文件..."
cp .next/server/app/index.html public/

# 部署到 Netlify
echo "🌐 部署到 Netlify..."
netlify deploy --prod

echo "✅ 部署完成！"
echo "🔗 访问: https://castchain-narratives.netlify.app/"
echo "📱 Mini App 已准备就绪！"
