import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

export default function config(phase) {
  const development = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: development ? undefined : "export",
    trailingSlash: true,
    images: { unoptimized: true },
    ...(development
      ? {
          async rewrites() {
            return [
              { source: "/api/:path*", destination: "http://127.0.0.1:8017/api/:path*" },
              { source: "/health/:path*", destination: "http://127.0.0.1:8017/health/:path*" },
            ];
          },
        }
      : {}),
  };
}
