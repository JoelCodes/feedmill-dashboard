import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export const metadata: Metadata = {
  title: "FeedMill Pro - Dashboard",
  description: "Feed mill production management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ClerkProvider afterSignOutUrl="/sign-in">
          <ThemeProvider><NuqsAdapter>{children}</NuqsAdapter></ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
