"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OnboardingModal } from "@/components/layout/onboarding-modal";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  hasTenant: boolean;
  children: React.ReactNode;
};

export function DashboardShell({ userId, hasTenant, children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") router.push("/login");
      },
    );
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64">{children}</main>

      {!hasTenant && (
        <OnboardingModal
          open
          userId={userId}
          onComplete={() => window.location.reload()}
        />
      )}
    </div>
  );
}
