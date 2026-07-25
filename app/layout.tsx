import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AndivaL Mafia Host",
  description: "Professional Real-Time Mafia Host Platform",
  applicationName: "AndivaL Mafia Host",
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