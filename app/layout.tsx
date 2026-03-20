import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VidyaVerse",
    template: "%s | VidyaVerse",
  },
  description:
    "VidyaVerse is a modern platform for students to discover notes, solve doubts, and connect with mentors — all in one unified knowledge ecosystem.",
  keywords: [
    "VidyaVerse",
    "college resources",
    "student platform",
    "notes sharing",
    "mentorship",
    "doubt solving",
  ],
  authors: [{ name: "VidyaVerse Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        {children}
      </body>
    </html>
  );
}