import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",          // use https if your site has SSL
        hostname: "khawawish.mahirou.online",
        port: "",                   // leave empty for standard https port 443
        pathname: "/api/static/images/**", // optional: match specific path
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8153",
        pathname: "/api/static/images/**",
      },
      {
        protocol: "https",
        hostname: "khawawish.53d8c10827953d6d9760ef1e07f44e09.r2.cloudflarestorage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-4784be8cadb7409582d68a6d2e43a447.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
