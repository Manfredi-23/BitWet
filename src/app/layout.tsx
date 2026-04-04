import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BitWet",
  description: "Swiss climbing weather forecast app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
