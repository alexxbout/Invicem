import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const body = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invicem",
  description: "Un jeu de cartes pour se découvrir, à tour de rôle.",
};

export const viewport: Viewport = {
  themeColor: "#130f1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
