/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['argon2', 'better-sqlite3', 'playwright'],
}

module.exports = nextConfig
