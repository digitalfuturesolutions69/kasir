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
};

export default nextConfig;
