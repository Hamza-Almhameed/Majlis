import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import OfflineAlert from "@/components/ui/OfflineAlert";

const ashkal = localFont({
  src: [
    {
      path: "./fonts/ashkal.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-ashkal",
});

const tajawal = localFont({
  src: [
    {
      path: "./fonts/Tajawal-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Tajawal-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "مجلس",
  description: "منصة تواصل اجتماعي عربية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ashkal.variable} ${tajawal.variable}`}>
        {children}
        <OfflineAlert />
      </body>
    </html>
  );
}