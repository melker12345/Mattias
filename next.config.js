/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Course/lesson images are author-provided URLs from arbitrary hosts, so a
    // fixed allowlist isn't practical. Allow any remote host — image URLs are
    // entered by trusted admins/authors, not end users.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

}

module.exports = nextConfig
