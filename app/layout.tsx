import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://duitku.app"),
  title: {
    default: "DuitKu — Catat Duit, Jelas Hidup",
    template: "%s · DuitKu",
  },
  description: "Website manajemen uang: catat pemasukan & pengeluaran, multi-dompet, budgeting, dan tujuan tabungan. Dibuat dengan Next.js + Supabase.",
  keywords: ["duitku", "manajemen uang", "keuangan", "budget", "nextjs", "dompet", "anggaran"],
  authors: [{ name: "DuitKu" }],
  creator: "DuitKu",
  openGraph: {
    title: "DuitKu — Catat Duit, Jelas Hidup",
    description: "Catat pemasukan & pengeluaran biar jelas. Multi-dompet, budgeting, grafik.",
    type: "website",
    locale: "id_ID",
    siteName: "DuitKu",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "DuitKu — Catat Duit, Jelas Hidup",
    description: "Catat pemasukan & pengeluaran biar jelas. Multi-dompet, budgeting, grafik.",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const themeScript = `try{if(localStorage.theme==='dark'||(!('theme'in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${instrument.variable} ${mono.variable} font-sans bg-paper text-ink antialiased`}>
        <ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider>
      </body>
    </html>
  );
}
