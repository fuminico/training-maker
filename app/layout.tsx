import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Maker - 研修動画自動生成ツール",
  description: "PowerPointから研修動画を自動生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
