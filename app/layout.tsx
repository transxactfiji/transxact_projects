import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const THEME_SCRIPT = `
  (function() {
    try {
      var theme = localStorage.getItem('transxact-theme');
      if (theme === 'dark') {
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch(e) {}
  })();
`.replace(/\s+/g, " ");

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <TooltipProvider delayDuration={300}>
          <AppFrame>{children}</AppFrame>
        </TooltipProvider>
        <Toaster
          richColors
          position="top-center"
        />
      </body>
    </html>
  );
}
