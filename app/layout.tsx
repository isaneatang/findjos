import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "FindJos | Find what you need in Jos",
  description: "A local marketplace for businesses, products, and services in Jos.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f5f7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
