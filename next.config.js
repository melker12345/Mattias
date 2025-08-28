/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.apvutbildarna.se',
      },
      {
        protocol: 'https',
        hostname: 'kravkompetens.com',
      },
      {
        protocol: 'https',
        hostname: 'entreprenadutbildning.se',
      },
    ],
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
