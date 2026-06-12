/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "thepeptidepedia.com" }
    ]
  },
  async redirects() {
    return [
      { source: "/peptides", destination: "/coaching", permanent: true },
      { source: "/peptides/:slug", destination: "/coaching", permanent: true },
      { source: "/protocols", destination: "/coaching", permanent: true },
    ]
  }
}
module.exports = nextConfig
