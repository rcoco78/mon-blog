/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'www.notion.so',
      'prod-files-secure.s3.us-west-2.amazonaws.com',
      'cdn.freelogovectors.net',
      'encrypted-tbn0.gstatic.com',
      'images.seeklogo.com',
      'yt3.googleusercontent.com',
      'static.vecteezy.com',
      'cdn-icons-png.freepik.com',
      'images.unsplash.com',
      'i.scdn.co' // CDN Spotify pour les images d'albums
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