/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加.well-known路径处理
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/.well-known/:path*',
      },
    ];
  }
};

export default nextConfig;
