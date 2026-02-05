/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['argon2', 'better-sqlite3', 'playwright'],
}

module.exports = nextConfig
