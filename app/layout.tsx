import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Re:Learn — Understand your algebra",
  description:
    "Explore the thinking behind algebra mistakes, learn visually, and check your understanding.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
