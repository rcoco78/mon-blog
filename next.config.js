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
      'images.unsplash.com'
    ],
  }
}

module.exports = nextConfig 