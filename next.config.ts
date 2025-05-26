import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverComponentsExternalPackages: ['@prisma/client'],
    },
  };
  
  module.exports = nextConfig;
  
export default nextConfig;
