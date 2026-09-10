import { AppShell } from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";

// Sengaja sinkron (bukan async): email profil diambil client-side oleh AppShell.
// Layout server yang `await getUser()` menahan boundary `loading.tsx` (skeleton)
// sebelum page client ke-mount — watchdog recovery tidak ikut render di fase itu,
// dan kalau auth lambat/hang, skeleton tampil tanpa jalan keluar ("infinite").
// Middleware tetap jadi penjaga route; halaman + watchdog yang handle recovery.
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppShell email={null}>{children}</AppShell>
    </QueryProvider>
  );
}
