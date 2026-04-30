import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
  eslint: {
    dirs: ['app', 'components', 'features', 'lib', 'prisma', 'types'],
  },
};

export default nextConfig;
