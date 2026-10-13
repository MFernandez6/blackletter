import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cinzel } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { themeInitScript } from "@/lib/theme-script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLACKLETTER™ — Blackline Public Adjusters LLC",
  description: "Contract and document generation — Blackline Public Adjusters LLC",
  applicationName: "BLACKLETTER",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BLACKLETTER",
  },
};

export const viewport: Viewport = {
  themeColor: "#F1EDE4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${cinzel.variable} bg-brand-navy text-brand-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
