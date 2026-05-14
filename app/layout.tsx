import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppFrame from "@/app/ui/appFrame";
import type { ReactElement, ReactNode } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transxact Projects",
  description:
    "A project management tool built with Next.js, Drizzle ORM, and SQLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <body className="app-body">
        <AppFrame>{children}</AppFrame>
        <Toaster
          richColors
          position="top-center"
        />
      </body>
    </html>
  );
}
