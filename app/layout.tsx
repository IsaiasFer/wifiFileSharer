import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wifi File Sharer",
  description: "Share files securely on local WiFi",
  icons: {
    icon: "/icon.png",
  },
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
