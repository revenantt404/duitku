import type { Metadata, Viewport } from "next";
import { Instrument_Sans, EB_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const display = EB_Garamond({ subsets: ["latin"], variable: "--font-display", display: "swap" });
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
  title: "DuitKu — Catat Duit, Jelas Hidup",
  description: "Website manajemen uang: catat pemasukan & pengeluaran, multi-dompet, budgeting, dan tujuan tabungan. Dibuat dengan Next.js + Supabase.",
  keywords: ["duitku", "manajemen uang", "keuangan", "budget", "nextjs"],
  openGraph: {
    title: "DuitKu — Catat Duit, Jelas Hidup",
    description: "Catat pemasukan & pengeluaran biar jelas. Multi-dompet, budgeting, grafik.",
    type: "website",
  },
};

const themeScript = `try{if(localStorage.theme==='dark'||(!('theme'in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${instrument.variable} ${display.variable} ${mono.variable} font-sans bg-paper text-ink antialiased`}>
        <ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider>
      </body>
    </html>
  );
}
