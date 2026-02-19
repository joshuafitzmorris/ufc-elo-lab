import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UFC Elo Lab",
    short_name: "UFC Elo",
    description:
      "Performance-weighted UFC fighter ratings that reward dominant finishes. Compare classic Elo vs performance-based rankings.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ef4444",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["sports", "entertainment"],
  };
}
