/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // 确保与Netlify兼容
  trailingSlash: false,
  distDir: '.next'
};

export default nextConfig;
