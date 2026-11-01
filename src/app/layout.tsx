import type { Metadata } from "next";
import "./globals.css";
import { ParticleSplashScreen } from "@/components/ParticleSplashScreen";

export const metadata: Metadata = {
  title: "BarOS – upravljanje kafićem",
  description: "SaaS za kafiće i barove",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarOS",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body>
        <ParticleSplashScreen />
        {children}
      </body>
    </html>
  );
}
