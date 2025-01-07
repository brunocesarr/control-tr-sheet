import type { NextConfig } from 'next';
const { JWT_SECRET } = process.env;

const nextConfig: NextConfig = {
  env: {
    JWT_SECRET,
  },
};

export default nextConfig;
