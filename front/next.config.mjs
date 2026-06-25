import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: { root: __dirname },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `http://media-service:3007/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
