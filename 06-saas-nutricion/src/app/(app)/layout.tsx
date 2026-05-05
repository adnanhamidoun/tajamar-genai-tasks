import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/navigation/MobileNav";
import AdminConsole from "@/components/admin/AdminConsole";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto min-h-screen border-x border-border/40 relative pb-20 shadow-2xl shadow-red-500/5">
        {children}
        <MobileNav />
        <AdminConsole />
      </div>
    </div>
  );
}
