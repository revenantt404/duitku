import { AppShell } from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholder = !url || url.includes("placeholder") || url.includes("localhost");
    if (!isPlaceholder) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? null;
    }
  } catch {}
  return (
    <QueryProvider>
      <AppShell email={email}>{children}</AppShell>
    </QueryProvider>
  );
}
