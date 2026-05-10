import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F1E3D",
};

export const metadata: Metadata = {
  title: "Jersey Archive — Every Kit. Every Story.",
  description:
    "The definitive archive of football and cricket jerseys. Explore 400+ IPL, T20, ODI, and UCL kits with history, ratings, and design stories.",
  keywords: ["jersey archive", "cricket jerseys", "football kits", "IPL jerseys", "UCL jerseys"],
  openGraph: {
    title: "Jersey Archive",
    description: "The definitive jersey archive for football and cricket fans.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
