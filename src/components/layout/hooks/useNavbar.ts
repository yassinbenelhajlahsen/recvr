"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import useSWR from "swr";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/user";

interface UseNavbarReturn {
  user: User | null;
  profile: UserProfile | null;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  handleSignOut: () => Promise<void>;
}

export function useNavbar(): UseNavbarReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auth state: initial load + subscription
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Profile: SWR caches it so settings drawer opens instantly on subsequent opens
  const { data: profile } = useSWR<UserProfile>(
    user ? "/api/user/profile" : null,
    { dedupingInterval: 30_000 }
  );

  // Close dropdown on route change
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
    router.refresh();
  }

  return {
    user,
    profile: profile ?? null,
    menuOpen,
    setMenuOpen,
    settingsOpen,
    setSettingsOpen,
    handleSignOut,
  };
}
