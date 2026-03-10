import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useDeleteAccount(open: boolean) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset on drawer close
  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
    }
  }, [open]);

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/signin");
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return { confirmDelete, setConfirmDelete, deleting, handleDeleteAccount };
}
