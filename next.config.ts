import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob — user wardrobe uploads
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // ShopStyle product images
      { protocol: "https", hostname: "img.shopstyle-cdn.com" },
      // Placeholder images for demo seed
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
