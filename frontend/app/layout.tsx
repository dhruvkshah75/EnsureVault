import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import Chatbot from "../components/Chatbot";
import { ToastProvider } from "../components/Toast";
import Navbar from "../components/Navbar";
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
  title: "EnsureVault",
  description: "Insurance Policy & Claims Processing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
              {children}
            </main>
            <Chatbot />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
