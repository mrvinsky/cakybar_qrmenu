import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarOS – upravljanje kafićem",
  description: "SaaS za kafiće i barove",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}
