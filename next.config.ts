import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The TVS dashboard is now the site root. Handled here rather than with
      // permanentRedirect() in a page: as a page it was prerendered and served
      // not-found content under a 200 instead of redirecting.
      { source: "/tvs", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
