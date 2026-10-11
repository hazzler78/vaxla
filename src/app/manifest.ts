import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Växla",
    short_name: "Växla",
    description:
      "En marknad där arbetskraft är betalmedel. Sponsorer betalar varan, du betalar tillbaka med timmar.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8ecef",
    theme_color: "#ff4d1a",
    lang: "sv",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
