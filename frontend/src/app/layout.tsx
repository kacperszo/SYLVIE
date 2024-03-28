import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SYLVIE",
  description:
    "SYLVIE, your new virtual companion! SYLVIE (Synthetic Virtual Intelligence Entity) is here to assist you in various tasks and provide companionship whenever you need it. Whether you're looking for information, seeking assistance, or simply want someone to chat with, SYLVIE is always here to help.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
