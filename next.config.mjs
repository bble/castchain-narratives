/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // 确保与Netlify兼容
  trailingSlash: false,
  distDir: '.next',
  // 确保静态资源正确处理
  assetPrefix: ''
};

export default nextConfig;
