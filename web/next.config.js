/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['argon2', 'better-sqlite3', 'playwright'],
  },
}

module.exports = nextConfig
