/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so', pathname: '/**' },
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.freelogovectors.net', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.seeklogo.com', pathname: '/**' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'static.vecteezy.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn-icons-png.freepik.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.scdn.co', pathname: '/**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/donnees-publiques',
        destination: '/objectifs',
        permanent: true, // 308 redirect pour préserver le SEO
      },
    ]
  },
}

module.exports = nextConfig 