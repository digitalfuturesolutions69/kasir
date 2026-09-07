import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which a full-resolution camera photo blows past
      // instantly. The receipt-photo feature enforces its own 5MB cap
      // (see MAX_RECEIPT_SIZE_BYTES) — this just needs to be a bit above
      // that to leave room for multipart/form-data overhead.
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No legitimate reason for Duitku to be framed by another
          // site — blocks clickjacking on the login/register forms.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera is deliberately left alone: the receipt-photo capture
          // input (capture="environment") opens the OS camera picker, a
          // separate mechanism from the getUserMedia API this policy
          // actually governs — but there's no upside to testing that
          // distinction against a live camera right before launch.
          { key: "Permissions-Policy", value: "microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
