import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "UFC Elo Lab - Performance-weighted fighter ratings";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "50px",
        }}
      >
        {/* Logo/Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            E
          </div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "0.05em",
            }}
          >
            UFC ELO LAB
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            marginBottom: "40px",
          }}
        >
          Performance-weighted ratings that reward dominant finishes
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {["Traditional Elo", "Performance Elo", "Compare Fighters"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  fontSize: "16px",
                  color: "#e2e8f0",
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            fontSize: "20px",
            color: "#64748b",
            letterSpacing: "0.1em",
          }}
        >
          ufcelolab.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
