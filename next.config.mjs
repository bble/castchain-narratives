/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // 添加.well-known路径处理
  async rewrites() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "/api/.well-known/farcaster.json",
      },
    ];
  },
};

export default nextConfig;
