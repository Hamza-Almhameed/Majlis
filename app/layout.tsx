import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import OfflineAlert from "@/components/ui/OfflineAlert";
import PresenceTracker from "@/components/ui/PresenceTracker";
import MobileShell from "@/components/navigation/MobileShell";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "مجلس",
    template: "%s | مجلس",
  },
  description:
    "مجلس منصة تواصل اجتماعي عربية للحوارات والمجتمعات (المجالس) مع تجربة حديثة تركّز على الخصوصية.",
  applicationName: "Majlis",
  keywords: [
    "مجلس",
    "Majlis",
    "منصة عربية",
    "تواصل اجتماعي",
    "مجتمعات",
    "منتدى عربي",
    "مجالس",
  ],
  authors: [{ name: "Majlis Team" }],
  creator: "Majlis",
  publisher: "Majlis",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: siteUrl,
    siteName: "مجلس",
    title: "مجلس",
    description:
      "منصة تواصل اجتماعي عربية للحوارات والمجتمعات (المجالس) مع تجربة حديثة تركز على الخصوصية.",
    images: [
      {
        url: "/majlis.png",
        width: 1200,
        height: 1200,
        alt: "شعار مجلس",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مجلس",
    description:
      "منصة تواصل اجتماعي عربية للحوارات والمجتمعات (المجالس) مع تجربة حديثة تركز على الخصوصية.",
    images: ["/majlis.png"],
  },
  icons: {
    icon: [{ url: "/majlis.png", type: "image/png" }],
    shortcut: [{ url: "/majlis.png", type: "image/png" }],
    apple: [{ url: "/majlis.png", type: "image/png" }],
  },
  category: "social networking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ashkal.variable} ${tajawal.variable}`}>
        <MobileShell>{children}</MobileShell>
        <OfflineAlert />
        <PresenceTracker />
      </body>
    </html>
  );
}