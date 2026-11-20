import type { Metadata } from "next";
import { StudioShell } from "@/components/studio/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Mirror Magic Beauty Palour | Rath",
    template: "%s | Mirror Magic",
  },
  description:
    "Explore hair, skin, makeup and nail services at Sangeeta Devi’s Mirror Magic Beauty Palour on Kurra Road, Rath, and book a studio visit.",
  manifest: "/app.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mirror Magic",
    statusBarStyle: "default",
  },
  icons: { icon: "/favicon.svg", apple: "/app-icon-192.png" },
};
export const viewport = {
  themeColor: "#69283e",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <head>
        <link
          rel="preload"
          href="/fonts/instrument-serif-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/instrument-serif-latin-400-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}
