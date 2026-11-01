import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BarOS — Pametni operativni sistem za kafiće i barove",
    short_name: "BarOS",
    description:
      "Multi-tenant SaaS za kafiće i restorane: QR meni, narudžbe uživo, inventar, popis i nabavka.",
    start_url: "/login",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f59e0b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
