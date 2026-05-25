import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bake the build timestamp into the bundle so the version stamp in
  // the corner is stable per deploy (not changing on every render).
  // Evaluated once when next.config is loaded → at `next build` time.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
