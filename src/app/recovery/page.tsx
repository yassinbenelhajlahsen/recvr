import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calculateRecovery } from "@/lib/recovery";
import { RecoveryView } from "@/components/recovery/RecoveryView";

export default async function RecoveryPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();

  if (error || !claims) redirect("/auth/signin");

  const userId = claims.claims.sub as string;
  const recovery = await calculateRecovery(userId);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl text-primary tracking-tight mb-2">
          Recovery
        </h1>
        <p className="text-secondary">
          Your muscle recovery status based on recent workout history.
        </p>
      </div>
      <RecoveryView recovery={recovery} />
    </div>
  );
}
