import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar"; // Relative path yang aman

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IndoLingua AI",
  description: "Belajar Bahasa Inggris Kontekstual dengan AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 flex flex-col lg:flex-row min-h-screen`}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="h-16 lg:h-0 flex-shrink-0" />
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-5xl mx-auto pb-10">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}