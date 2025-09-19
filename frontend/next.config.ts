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
    ],
  },
};

export default nextConfig;
