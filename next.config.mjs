/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; object-src 'self'; base-uri 'self';",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) return config;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    //config.output = { ...config.output, globalObject: "self" }; // This line causes issues with standalone output
    return config;
  },
  output: "standalone", // Required for Docker deployment
};

export default nextConfig;
