import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invicem",
    short_name: "Invicem",
    description: "Un jeu de cartes pour se découvrir, à tour de rôle.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#130f1a",
    theme_color: "#130f1a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
