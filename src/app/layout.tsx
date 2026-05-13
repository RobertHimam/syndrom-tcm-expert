import type { Metadata } from "next";
import { Figtree, Noto_Sans } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-heading",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

import Providers from "./providers";

export const metadata: Metadata = {
  title: "TCM Syndrome Expert",
  description: "Traditional Chinese Medicine Diagnosis System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
