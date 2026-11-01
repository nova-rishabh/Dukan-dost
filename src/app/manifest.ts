import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Dukaan Dost", short_name: "Dukaan Dost", description: "Review and confirm your shop ledger.",
    start_url: "/shop", scope: "/", display: "standalone", background_color: "#FFC400", theme_color: "#FFC400",
    icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}
