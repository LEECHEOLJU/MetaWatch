/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JIRA_DOMAIN: process.env.NEXT_PUBLIC_JIRA_DOMAIN,
  },
  images: {
    domains: ['mcsoc.atlassian.net'],
  },
}

module.exports = nextConfig