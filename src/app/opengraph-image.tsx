import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — Catat Keuangan Jadi Mudah`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 55%, #5b21b6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "rgba(255,255,255,0.16)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 7a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v1h-4a3 3 0 0 0 0 6h4v1a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V7Z"
                fill="white"
              />
              <path
                d="M15 11h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a2 2 0 0 1 0-4Z"
                fill="#4338ca"
              />
            </svg>
          </div>
          <div style={{ display: "flex", color: "white", fontSize: 76, fontWeight: 700 }}>
            {SITE_NAME}
          </div>
        </div>
        <div style={{ display: "flex", color: "#e0e7ff", fontSize: 34, fontWeight: 500 }}>
          Catat keuangan secepat mengetik
        </div>
      </div>
    ),
    { ...size }
  );
}
