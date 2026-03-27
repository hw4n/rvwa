import type { NextConfig } from "next";

const posterBaseUrl = process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL?.trim() || process.env.R2_PUBLIC_BASE_URL?.trim();

const remotePatterns = (() => {
  if (!posterBaseUrl) {
    return [];
  }

  try {
    const url = new URL(posterBaseUrl);
    const pathname = url.pathname.replace(/\/+$/, "");

    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: pathname ? `${pathname}/**` : "/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
