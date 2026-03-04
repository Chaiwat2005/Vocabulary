import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // นำเข้า Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vocabulary Flashcards",
  description: "Learn new words every day",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar จะแสดงอยู่ด้านบนสุดของทุกหน้า */}
        <Navbar />
        
        {/* ส่วนแสดงเนื้อหาของแต่ละหน้า */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}