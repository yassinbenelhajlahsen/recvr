import type { User } from "@supabase/supabase-js";

export async function ensureUserInDb(user: User) {
  await fetch("/api/user/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? null,
    }),
  });
}
