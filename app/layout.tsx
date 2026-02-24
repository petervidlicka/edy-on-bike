import type { Metadata, Viewport } from "next";
import { Nunito, Space_Mono, Fredoka } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: "600",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Edy on Bike",
  description: "A BMX side-scroller game",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Edy on Bike",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${spaceMono.variable} ${fredoka.variable} antialiased bg-zinc-900 text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
