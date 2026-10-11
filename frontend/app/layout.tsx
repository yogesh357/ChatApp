import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthContextProvider from "./context/authProvider";
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
  title: "Minimalist Chat | Go & Next.js",
  description: "Real-time chat powered by Go WebSockets and Next.js",
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800">
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
}
